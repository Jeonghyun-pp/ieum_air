// ============================================
// Market Intelligence Types — Phase 1
// ============================================

/** 편의시설 분석 결과 */
export interface AmenityAnalysis {
  /** 비교군 내 편의시설 빈도 순위 */
  frequency: AmenityFrequency[];
  /** 자사 숙소에 없는 상위 편의시설 */
  gaps: AmenityGap[];
  /** 자사 숙소만 보유한 차별 편의시설 */
  unique: string[];
  analyzedAt: string;
}

export interface AmenityFrequency {
  name: string;
  count: number;
  percentage: number; // 비교군 중 보유 비율 (0~100)
  hasOwn: boolean;    // 자사 숙소 보유 여부
}

export interface AmenityGap {
  name: string;
  percentage: number; // 비교군 보유 비율
  priority: 'high' | 'medium' | 'low';
}

/** 가격 벤치마킹 결과 */
export interface PriceBenchmark {
  ownPrice: number;
  currency: string;
  compSetStats: {
    min: number;
    max: number;
    median: number;
    p25: number;
    p75: number;
    mean: number;
  };
  percentile: number;        // 자사 숙소 가격 백분위 (0~100)
  suggestedRange: {
    low: number;
    high: number;
  };
  /** 요일별 가격 분석 */
  weekdayAvg?: number;
  weekendAvg?: number;
  analyzedAt: string;
}

/** 스코어카드 카테고리 */
export interface ScorecardCategory {
  category: string;
  label: string;
  ownValue: number;
  compSetMedian: number;
  compSetP75: number;
  percentile: number;       // 비교군 내 백분위
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  weight: number;           // 종합 점수에서의 가중치
}

/** 경쟁력 스코어카드 */
export interface Scorecard {
  overallScore: number;     // 0~100
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  categories: ScorecardCategory[];
  rank: number;             // 비교군 내 순위
  totalInCompSet: number;
  analyzedAt: string;
}

/** 시장 인텔리전스 종합 */
export interface MarketIntel {
  propertyId: string;
  scorecard: Scorecard;
  priceBenchmark: PriceBenchmark;
  amenityAnalysis: AmenityAnalysis;
  compSetSize: number;
  status: 'ready' | 'partial' | 'stale';
  createdAt: string;
  updatedAt: string;
}

/** 포털 대시보드에 표시할 요약 데이터 */
export interface MarketIntelSummary {
  healthScore: number;          // 0~100 (= scorecard.overallScore)
  healthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  rank: number;
  totalCompetitors: number;
  pricePercentile: number;
  topAmenityGaps: AmenityGap[]; // 상위 3개
  highlights: MarketHighlight[];
}

export interface MarketHighlight {
  type: 'positive' | 'negative' | 'neutral';
  icon: string;
  text: string;
}
