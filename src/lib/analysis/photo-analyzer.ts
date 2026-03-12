// ============================================
// Photo Analyzer — 사진 진단 (Sharp 기반)
// ============================================

import type { ScrapedPhoto } from '@/types/scraping';
import type { CompSetMember } from '@/types/comp-set';
import type { PhotoDiagnosis, PhotoIssue } from '@/types/diagnosis';

/** 공간 유형 분류를 위한 키워드 맵 */
const SPACE_KEYWORDS: Record<string, string[]> = {
  bedroom: ['bedroom', 'bed', 'sleep', '침실', '침대', '방'],
  bathroom: ['bathroom', 'bath', 'shower', 'toilet', '욕실', '화장실', '샤워'],
  kitchen: ['kitchen', 'cook', 'dining', '주방', '부엌', '요리'],
  living: ['living', 'lounge', 'sofa', 'couch', '거실', '소파'],
  exterior: ['exterior', 'building', 'entrance', 'facade', '외관', '건물', '입구'],
  view: ['view', 'scenery', 'ocean', 'mountain', 'sunset', '전망', '바다', '산', '야경'],
  amenity: ['pool', 'gym', 'parking', 'laundry', 'bbq', '수영장', '주차', '세탁'],
  neighborhood: ['restaurant', 'cafe', 'shop', 'street', 'nearby', '주변', '맛집', '카페'],
};

const MIN_RESOLUTION = 1920 * 1080; // Full HD
const MIN_BRIGHTNESS = 40;
const MAX_BRIGHTNESS = 220;

/**
 * 사진 진단을 수행합니다.
 * Sharp로 해상도/밝기를 체크하고, 캡션 기반으로 공간 유형을 분류합니다.
 */
export async function analyzePhotos(
  ownPhotos: ScrapedPhoto[],
  compSetMembers: CompSetMember[]
): Promise<PhotoDiagnosis> {
  // 비교군 사진 수 통계
  const photoCounts = compSetMembers
    .map((m) => m.photoCount)
    .filter((c) => c > 0)
    .sort((a, b) => a - b);
  const compSetMedianPhotos = photoCounts.length > 0
    ? photoCounts[Math.floor(photoCounts.length / 2)]
    : 0;

  // 사진 품질 체크 (Sharp)
  const resolutionIssues: PhotoIssue[] = [];
  const brightnessIssues: PhotoIssue[] = [];

  for (const photo of ownPhotos.slice(0, 20)) {
    try {
      const issues = await checkPhotoQuality(photo.url);
      resolutionIssues.push(...issues.filter((i) => i.issue === 'low_resolution'));
      brightnessIssues.push(...issues.filter((i) => i.issue === 'too_dark' || i.issue === 'too_bright'));
    } catch {
      // 개별 사진 분석 실패 무시
    }
  }

  // 공간 유형 분류 (캡션 기반)
  const spacesCovered = classifySpaces(ownPhotos);

  // 비교군 상위 25% 공간 커버리지
  const topPerformers = compSetMembers
    .filter((m) => m.reviewCount > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, Math.max(1, Math.ceil(compSetMembers.length * 0.25)));

  // 비교군 상위가 많이 보여주는 공간 (50% 이상)
  const spacesRecommended = getRecommendedSpaces(topPerformers);
  const missingSpaces = spacesRecommended.filter((s) => !spacesCovered.includes(s));

  // 종합 점수 계산
  const countScore = Math.min(100, (ownPhotos.length / Math.max(compSetMedianPhotos, 1)) * 100);
  const qualityScore = ownPhotos.length > 0
    ? Math.min(100, Math.max(0, 100 - (resolutionIssues.length + brightnessIssues.length) / ownPhotos.slice(0, 20).length * 100))
    : 0;
  const coverageScore = spacesRecommended.length > 0
    ? (1 - missingSpaces.length / spacesRecommended.length) * 100
    : 50;

  const overallScore = Math.round(countScore * 0.4 + qualityScore * 0.3 + coverageScore * 0.3);

  return {
    photoCount: ownPhotos.length,
    compSetMedianPhotos,
    resolutionIssues,
    brightnessIssues,
    spacesCovered,
    spacesRecommended,
    missingSpaces,
    overallScore,
    analyzedAt: new Date().toISOString(),
  };
}

async function checkPhotoQuality(photoUrl: string): Promise<PhotoIssue[]> {
  const issues: PhotoIssue[] = [];

  try {
    // Dynamic import (Sharp는 서버사이드에서만 사용)
    const sharp = (await import('sharp')).default;

    const response = await fetch(photoUrl, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return issues;

    const buffer = Buffer.from(await response.arrayBuffer());
    const image = sharp(buffer);

    // 해상도 체크
    const metadata = await image.metadata();
    const resolution = (metadata.width ?? 0) * (metadata.height ?? 0);
    if (resolution > 0 && resolution < MIN_RESOLUTION) {
      issues.push({
        photoUrl,
        issue: 'low_resolution',
        value: resolution,
        threshold: MIN_RESOLUTION,
      });
    }

    // 밝기 체크
    const stats = await image.stats();
    const meanBrightness = stats.channels.reduce((sum, ch) => sum + ch.mean, 0) / stats.channels.length;
    if (meanBrightness < MIN_BRIGHTNESS) {
      issues.push({
        photoUrl,
        issue: 'too_dark',
        value: Math.round(meanBrightness),
        threshold: MIN_BRIGHTNESS,
      });
    } else if (meanBrightness > MAX_BRIGHTNESS) {
      issues.push({
        photoUrl,
        issue: 'too_bright',
        value: Math.round(meanBrightness),
        threshold: MAX_BRIGHTNESS,
      });
    }
  } catch {
    // Sharp 실패 시 무시 (이미지 접근 불가 등)
  }

  return issues;
}

function classifySpaces(photos: ScrapedPhoto[]): string[] {
  const spaces = new Set<string>();

  for (const photo of photos) {
    const text = (photo.caption ?? '').toLowerCase();
    if (!text) continue;

    for (const [space, keywords] of Object.entries(SPACE_KEYWORDS)) {
      if (keywords.some((kw) => text.includes(kw))) {
        spaces.add(space);
      }
    }
  }

  return Array.from(spaces);
}

function getRecommendedSpaces(topPerformers: CompSetMember[]): string[] {
  // 비교군 상위 성과자들이 사진 수가 많은 공간 추천
  // 현재는 기본 필수 공간 목록 반환 (캡션 데이터 없을 수 있음)
  return ['bedroom', 'bathroom', 'kitchen', 'living', 'exterior', 'view'];
}
