// ============================================
// Content Analyzer — 제목/설명 콘텐츠 진단
// 순수 Node.js, AI 불필요
// ============================================

import type { ScrapedListing } from '@/types/scraping';
import type { CompSetMember } from '@/types/comp-set';
import type { ContentDiagnosis, TitleAnalysis, DescriptionAnalysis } from '@/types/diagnosis';

/** 설명에서 체크할 토픽 카테고리 */
const DESCRIPTION_TOPICS: Record<string, string[]> = {
  location: ['위치', '도보', '분', '역', '거리', '해변', '공항', 'location', 'walk', 'station', 'beach', 'near'],
  amenities: ['편의', '시설', '와이파이', 'wifi', '주방', '세탁', '주차', '에어컨', 'amenity', 'kitchen', 'parking'],
  transport: ['교통', '버스', '지하철', '택시', '공항', 'transport', 'bus', 'subway', 'taxi', 'airport'],
  attractions: ['관광', '명소', '맛집', '카페', '시장', '해수욕장', 'attraction', 'restaurant', 'cafe', 'market'],
  checkin: ['체크인', '셀프', '비밀번호', '키', '도어락', 'check-in', 'self', 'key', 'door'],
  rules: ['규칙', '금연', '반려', '조용', '소음', 'rule', 'no smoking', 'pet', 'quiet', 'noise'],
  neighborhood: ['동네', '주변', '환경', '안전', '조용', 'neighborhood', 'area', 'safe', 'quiet'],
};

/**
 * 리스팅 제목과 설명을 분석합니다.
 * 비교군 상위 성과자 대비 키워드 커버리지를 평가합니다.
 */
export function analyzeContent(
  ownListing: ScrapedListing,
  compSetMembers: CompSetMember[]
): ContentDiagnosis {
  const titleAnalysis = analyzeTitle(ownListing.title, compSetMembers);
  const descriptionAnalysis = analyzeDescription(ownListing.description, compSetMembers);

  const overallScore = Math.round(titleAnalysis.score * 0.4 + descriptionAnalysis.score * 0.6);

  return {
    title: titleAnalysis,
    description: descriptionAnalysis,
    overallScore,
    analyzedAt: new Date().toISOString(),
  };
}

function analyzeTitle(
  ownTitle: string,
  compSetMembers: CompSetMember[]
): TitleAnalysis {
  // 비교군 상위 25% 제목 길이 분석
  const topPerformers = compSetMembers
    .filter((m) => m.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, Math.max(1, Math.ceil(compSetMembers.length * 0.25)));

  const titles = topPerformers.map((m) => m.title).filter(Boolean);
  const titleLengths = titles.map((t) => t.length).sort((a, b) => a - b);

  const optimalRange: [number, number] = titleLengths.length >= 2
    ? [titleLengths[Math.floor(titleLengths.length * 0.25)], titleLengths[Math.floor(titleLengths.length * 0.75)]]
    : [20, 50];

  // 키워드 추출 (비교군 상위 제목에서 빈도 높은 토큰)
  const keywordFreq = new Map<string, number>();
  for (const title of titles) {
    const tokens = tokenize(title);
    const seen = new Set<string>();
    for (const token of tokens) {
      if (token.length < 2 || seen.has(token)) continue;
      seen.add(token);
      keywordFreq.set(token, (keywordFreq.get(token) ?? 0) + 1);
    }
  }

  // 상위 30% 이상 출현하는 키워드
  const threshold = Math.max(1, titles.length * 0.3);
  const topKeywords = Array.from(keywordFreq.entries())
    .filter(([, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);

  const ownTokens = new Set(tokenize(ownTitle));
  const ownKeywords = topKeywords.filter((kw) => ownTokens.has(kw));
  const missingKeywords = topKeywords.filter((kw) => !ownTokens.has(kw)).slice(0, 5);

  // 점수 계산
  const lengthScore = ownTitle.length >= optimalRange[0] && ownTitle.length <= optimalRange[1]
    ? 100
    : ownTitle.length < optimalRange[0]
      ? (ownTitle.length / optimalRange[0]) * 80
      : Math.max(0, 100 - (ownTitle.length - optimalRange[1]) * 2);

  const keywordScore = topKeywords.length > 0
    ? (ownKeywords.length / topKeywords.length) * 100
    : 50;

  return {
    current: ownTitle,
    length: ownTitle.length,
    optimalRange,
    keywords: ownKeywords,
    missingKeywords,
    score: Math.round(lengthScore * 0.4 + keywordScore * 0.6),
  };
}

function analyzeDescription(
  ownDescription: string,
  compSetMembers: CompSetMember[]
): DescriptionAnalysis {
  const descLower = ownDescription.toLowerCase();

  // 토픽 커버리지 체크
  const topicsCovered: string[] = [];
  const topicsMissing: string[] = [];

  for (const [topic, keywords] of Object.entries(DESCRIPTION_TOPICS)) {
    const covered = keywords.some((kw) => descLower.includes(kw));
    if (covered) {
      topicsCovered.push(topic);
    } else {
      topicsMissing.push(topic);
    }
  }

  const totalTopics = Object.keys(DESCRIPTION_TOPICS).length;
  const coverageRatio = topicsCovered.length / totalTopics;

  // 길이 점수 (적절한 길이: 200~1000자)
  const lengthScore = ownDescription.length >= 200 && ownDescription.length <= 1000
    ? 100
    : ownDescription.length < 200
      ? (ownDescription.length / 200) * 70
      : Math.max(50, 100 - (ownDescription.length - 1000) * 0.02);

  const score = Math.round(coverageRatio * 70 + (lengthScore / 100) * 30);

  return {
    length: ownDescription.length,
    topicsCovered,
    topicsMissing,
    score,
  };
}

/** 텍스트를 토큰으로 분리 (한국어 + 영어) */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}
