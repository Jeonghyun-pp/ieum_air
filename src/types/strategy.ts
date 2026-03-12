// ============================================
// Strategy Types — Phase 3
// ============================================

/** AI 생성 월간 전략 */
export interface MonthlyStrategy {
  propertyId: string;
  month: string; // "2026-03"
  summary: string;
  keyInsights: string[];
  priorities: StrategyPriority[];
  pricingStrategy: string;
  contentStrategy: string;
  seasonalFactors: string[];
  generatedAt: string;
}

export interface StrategyPriority {
  rank: number;
  category: 'pricing' | 'content' | 'photos' | 'amenities' | 'reviews' | 'response';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
}

/** 일별 가격 추천 */
export interface PricingRecommendation {
  propertyId: string;
  month: string;
  basePrice: number;
  currency: string;
  dailyPrices: DailyPrice[];
  summary: {
    avgRecommended: number;
    potentialRevenueLift: number; // %
    adjustedDays: number;
  };
  generatedAt: string;
}

export interface DailyPrice {
  date: string; // "2026-03-15"
  dayOfWeek: number; // 0=Sun
  currentPrice: number;
  recommendedPrice: number;
  reason: string;
  factors: PriceFactor[];
  confidence: 'high' | 'medium' | 'low';
}

export interface PriceFactor {
  type: 'weekday' | 'weekend' | 'season_high' | 'season_low' | 'event' | 'occupancy' | 'comp_set';
  label: string;
  impact: number; // %
}

/** AI 생성 콘텐츠 개선 제안 */
export interface ContentSuggestions {
  propertyId: string;
  titleSuggestions: TitleSuggestion[];
  descriptionImprovements: DescriptionImprovement[];
  generatedAt: string;
}

export interface TitleSuggestion {
  suggested: string;
  reason: string;
  score: number;
}

export interface DescriptionImprovement {
  topic: string;
  currentCoverage: boolean;
  suggestedText: string;
  reason: string;
}

/** 액션 아이템 */
export interface ActionItem {
  id: string;
  propertyId: string;
  category: 'pricing' | 'content' | 'photos' | 'amenities' | 'reviews' | 'response';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  source: 'diagnosis' | 'strategy' | 'pricing' | 'content';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
