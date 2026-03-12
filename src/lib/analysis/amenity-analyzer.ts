// ============================================
// Amenity Analyzer — 편의시설 격차 분석
// ============================================

import type { CompSetMember } from '@/types/comp-set';
import type { AmenityAnalysis, AmenityFrequency, AmenityGap } from '@/types/market-intel';

/**
 * 자사 숙소의 편의시설을 비교군과 비교 분석합니다.
 *
 * 결과:
 * - frequency: 비교군 내 편의시설 보유율 순위
 * - gaps: 자사에 없지만 비교군이 많이 보유한 편의시설
 * - unique: 자사만 보유한 차별 편의시설
 */
export function analyzeAmenities(
  ownAmenities: string[],
  compSetMembers: CompSetMember[]
): AmenityAnalysis {
  const totalMembers = compSetMembers.length;
  if (totalMembers === 0) {
    return { frequency: [], gaps: [], unique: [], analyzedAt: new Date().toISOString() };
  }

  const ownSet = new Set(ownAmenities.map(normalize));

  // 편의시설 빈도 카운트
  const countMap = new Map<string, { original: string; count: number }>();
  for (const member of compSetMembers) {
    const seen = new Set<string>(); // 중복 방지 (같은 숙소 내)
    for (const amenity of member.amenities) {
      const key = normalize(amenity);
      if (seen.has(key)) continue;
      seen.add(key);

      const existing = countMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        countMap.set(key, { original: amenity, count: 1 });
      }
    }
  }

  // 빈도 순 정렬
  const frequency: AmenityFrequency[] = Array.from(countMap.entries())
    .map(([key, { original, count }]) => ({
      name: original,
      count,
      percentage: Math.round((count / totalMembers) * 100),
      hasOwn: ownSet.has(key),
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // 격차 분석: 자사에 없고 비교군 20% 이상이 보유
  const gaps: AmenityGap[] = frequency
    .filter((f) => !f.hasOwn && f.percentage >= 20)
    .map((f) => ({
      name: f.name,
      percentage: f.percentage,
      priority: f.percentage >= 70 ? 'high' : f.percentage >= 45 ? 'medium' : 'low',
    }));

  // 자사만 보유한 편의시설
  const compSetAllKeys = new Set(countMap.keys());
  const unique = ownAmenities.filter((a) => !compSetAllKeys.has(normalize(a)));

  return {
    frequency,
    gaps,
    unique,
    analyzedAt: new Date().toISOString(),
  };
}

/** 편의시설 이름을 정규화합니다 (대소문자, 공백 무시) */
function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}
