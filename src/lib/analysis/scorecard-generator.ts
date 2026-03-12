// ============================================
// Scorecard Generator — 경쟁력 스코어카드
// ============================================

import type { ScrapedListing } from '@/types/scraping';
import type { CompSetMember } from '@/types/comp-set';
import type { Scorecard, ScorecardCategory } from '@/types/market-intel';
import type {
  ReviewDiagnosis,
  PhotoDiagnosis,
  ContentDiagnosis,
  EnhancedScorecard,
  DiagnosisCategory,
} from '@/types/diagnosis';

/** 스코어카드 카테고리별 가중치 */
const CATEGORY_WEIGHTS: { key: string; label: string; weight: number }[] = [
  { key: 'rating', label: '평점', weight: 0.20 },
  { key: 'reviews', label: '리뷰 수', weight: 0.15 },
  { key: 'price', label: '가격 경쟁력', weight: 0.20 },
  { key: 'amenities', label: '편의시설', weight: 0.15 },
  { key: 'photos', label: '사진', weight: 0.10 },
  { key: 'response', label: '응답률', weight: 0.10 },
  { key: 'superhost', label: '슈퍼호스트', weight: 0.10 },
];

/**
 * 자사 숙소의 경쟁력 스코어카드를 생성합니다.
 *
 * 각 카테고리에서 비교군 대비 백분위를 계산하고,
 * 가중 평균으로 종합 점수를 산출합니다.
 */
export function generateScorecard(
  ownListing: ScrapedListing,
  compSetMembers: CompSetMember[]
): Scorecard {
  if (compSetMembers.length === 0) {
    return {
      overallScore: 50,
      overallGrade: 'C',
      categories: [],
      rank: 1,
      totalInCompSet: 0,
      analyzedAt: new Date().toISOString(),
    };
  }

  const categories: ScorecardCategory[] = [];

  // 1. 평점
  const ratings = compSetMembers.map((m) => m.rating).filter((r) => r > 0);
  categories.push(
    buildCategory('rating', '평점', ownListing.rating, ratings, 0.20)
  );

  // 2. 리뷰 수
  const reviews = compSetMembers.map((m) => m.reviewCount);
  categories.push(
    buildCategory('reviews', '리뷰 수', ownListing.reviewCount, reviews, 0.15)
  );

  // 3. 가격 경쟁력 (낮을수록 좋음 → 역순 백분위)
  const prices = compSetMembers.map((m) => m.pricePerNight).filter((p) => p > 0);
  const priceCategory = buildCategory(
    'price', '가격 경쟁력', ownListing.pricePerNight, prices, 0.20, true
  );
  categories.push(priceCategory);

  // 4. 편의시설 수
  const amenityCounts = compSetMembers.map((m) => m.amenities.length);
  categories.push(
    buildCategory('amenities', '편의시설', ownListing.amenities.length, amenityCounts, 0.15)
  );

  // 5. 사진 수
  const photoCounts = compSetMembers.map((m) => m.photoCount);
  categories.push(
    buildCategory('photos', '사진', ownListing.photos.length, photoCounts, 0.10)
  );

  // 6. 응답률 (문자열에서 숫자 추출)
  const ownResponseRate = parseResponseRate(ownListing.hostResponseRate);
  const responseRates = compSetMembers
    .map((m) => parseResponseRate(m.hostResponseRate))
    .filter((r) => r >= 0);
  categories.push(
    buildCategory('response', '응답률', ownResponseRate, responseRates, 0.10)
  );

  // 7. 슈퍼호스트 (boolean → 0/1)
  const superhostValues = compSetMembers.map((m) => (m.isSuperhost ? 1 : 0));
  categories.push(
    buildCategory('superhost', '슈퍼호스트', ownListing.isSuperhost ? 1 : 0, superhostValues, 0.10)
  );

  // 종합 점수 (가중 평균)
  const overallScore = Math.round(
    categories.reduce((sum, c) => sum + c.percentile * c.weight, 0)
  );
  const overallGrade = percentileToGrade(overallScore);

  // 비교군 내 순위 계산
  const memberScores = compSetMembers.map((m) => calculateMemberScore(m, compSetMembers));
  const ownScore = overallScore;
  const rank = memberScores.filter((s) => s > ownScore).length + 1;

  return {
    overallScore,
    overallGrade,
    categories,
    rank,
    totalInCompSet: compSetMembers.length,
    analyzedAt: new Date().toISOString(),
  };
}

function buildCategory(
  key: string,
  label: string,
  ownValue: number,
  compValues: number[],
  weight: number,
  invertPercentile: boolean = false
): ScorecardCategory {
  if (compValues.length === 0) {
    return {
      category: key,
      label,
      ownValue,
      compSetMedian: 0,
      compSetP75: 0,
      percentile: 50,
      grade: 'C',
      weight,
    };
  }

  const sorted = [...compValues].sort((a, b) => a - b);
  const median = interpolatedPercentile(sorted, 50);
  const p75 = interpolatedPercentile(sorted, 75);

  // 백분위 계산
  const below = sorted.filter((v) => v < ownValue).length;
  const equal = sorted.filter((v) => v === ownValue).length;
  let pctile = Math.round(((below + equal * 0.5) / sorted.length) * 100);

  // 가격은 낮을수록 좋으므로 역순
  if (invertPercentile) {
    pctile = 100 - pctile;
  }

  return {
    category: key,
    label,
    ownValue,
    compSetMedian: median,
    compSetP75: p75,
    percentile: pctile,
    grade: percentileToGrade(pctile),
    weight,
  };
}

/** 정렬된 배열에서 백분위 값을 보간 계산합니다 */
function interpolatedPercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;
  if (lower === upper) return sorted[lower];
  return Math.round(sorted[lower] + fraction * (sorted[upper] - sorted[lower]));
}

function percentileToGrade(p: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (p >= 80) return 'A';
  if (p >= 60) return 'B';
  if (p >= 40) return 'C';
  if (p >= 20) return 'D';
  return 'F';
}

function parseResponseRate(rate?: string): number {
  if (!rate) return -1;
  const match = rate.match(/(\d+)/);
  return match ? parseInt(match[1]) : -1;
}

/** 간이 멤버 점수 (순위 계산용) */
function calculateMemberScore(
  member: CompSetMember,
  allMembers: CompSetMember[]
): number {
  let score = 0;
  const ratings = allMembers.map((m) => m.rating).filter((r) => r > 0).sort((a, b) => a - b);
  const reviews = allMembers.map((m) => m.reviewCount).sort((a, b) => a - b);

  // rating percentile
  if (ratings.length > 0) {
    const rIdx = ratings.filter((r) => r < member.rating).length;
    score += (rIdx / ratings.length) * 20;
  }

  // review percentile
  if (reviews.length > 0) {
    const rvIdx = reviews.filter((r) => r < member.reviewCount).length;
    score += (rvIdx / reviews.length) * 15;
  }

  // superhost bonus
  if (member.isSuperhost) score += 10;

  return Math.round(score);
}

// ─── Enhanced Scorecard (Phase 2) ────────────────────────────────────────────

/**
 * 기존 스코어카드 + 진단 결과를 결합한 확장 스코어카드를 생성합니다.
 *
 * 6개 카테고리:
 * - price (0.20): Phase 1 가격 백분위
 * - amenities (0.15): Phase 1 편의시설 분석
 * - photos (0.15): Phase 2 사진 진단
 * - reviews (0.20): Phase 2 리뷰 분석
 * - response (0.10): Phase 1 응답률
 * - content (0.20): Phase 2 콘텐츠 진단
 */
export function generateEnhancedScorecard(
  baseScorecard: Scorecard,
  reviewDiagnosis: ReviewDiagnosis,
  photoDiagnosis: PhotoDiagnosis,
  contentDiagnosis: ContentDiagnosis
): EnhancedScorecard {
  const baseCats = baseScorecard.categories;

  const categories: DiagnosisCategory[] = [
    {
      category: 'price',
      label: '가격 경쟁력',
      score: findCategoryScore(baseCats, 'price'),
      grade: percentileToGrade(findCategoryScore(baseCats, 'price')),
      weight: 0.20,
      details: `비교군 대비 가격 경쟁력 ${findCategoryScore(baseCats, 'price')}점`,
    },
    {
      category: 'amenities',
      label: '편의시설',
      score: findCategoryScore(baseCats, 'amenities'),
      grade: percentileToGrade(findCategoryScore(baseCats, 'amenities')),
      weight: 0.15,
      details: `비교군 대비 편의시설 경쟁력 ${findCategoryScore(baseCats, 'amenities')}점`,
    },
    {
      category: 'photos',
      label: '사진',
      score: photoDiagnosis.overallScore,
      grade: percentileToGrade(photoDiagnosis.overallScore),
      weight: 0.15,
      details: `${photoDiagnosis.photoCount}장 (비교군 중앙값 ${photoDiagnosis.compSetMedianPhotos}장)`,
    },
    {
      category: 'reviews',
      label: '리뷰',
      score: reviewDiagnosis.score,
      grade: percentileToGrade(reviewDiagnosis.score),
      weight: 0.20,
      details: `${reviewDiagnosis.sentiment === 'positive' ? '긍정적' : reviewDiagnosis.sentiment === 'negative' ? '부정적' : '보통'} (${reviewDiagnosis.reviewCount}개 분석)`,
    },
    {
      category: 'response',
      label: '응답률',
      score: findCategoryScore(baseCats, 'response'),
      grade: percentileToGrade(findCategoryScore(baseCats, 'response')),
      weight: 0.10,
      details: `비교군 대비 응답률 경쟁력 ${findCategoryScore(baseCats, 'response')}점`,
    },
    {
      category: 'content',
      label: '콘텐츠',
      score: contentDiagnosis.overallScore,
      grade: percentileToGrade(contentDiagnosis.overallScore),
      weight: 0.20,
      details: `제목 ${contentDiagnosis.title.score}점, 설명 ${contentDiagnosis.description.score}점`,
    },
  ];

  const overallScore = Math.round(
    categories.reduce((sum, c) => sum + c.score * c.weight, 0)
  );

  return {
    overallScore,
    overallGrade: percentileToGrade(overallScore),
    categories,
    rank: baseScorecard.rank,
    totalInCompSet: baseScorecard.totalInCompSet,
    analyzedAt: new Date().toISOString(),
  };
}

function findCategoryScore(categories: ScorecardCategory[], key: string): number {
  return categories.find((c) => c.category === key)?.percentile ?? 50;
}
