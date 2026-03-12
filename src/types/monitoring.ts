// ============================================
// Monitoring Types — Phase 4
// ============================================

/** 경쟁 가격 스냅샷 (일별) */
export interface CompetitorSnapshot {
  propertyId: string;
  date: string; // "2026-03-15"
  members: CompetitorPrice[];
  ownPrice: number;
  compSetMedian: number;
  compSetMin: number;
  compSetMax: number;
  avgOccupancy: number; // 0-1
  createdAt: string;
}

export interface CompetitorPrice {
  listingId: string;
  price: number;
  available: boolean;
}

/** 경쟁 변동 알림 */
export interface CompetitorAlert {
  id: string;
  propertyId: string;
  type: 'price_drop' | 'price_surge' | 'new_competitor' | 'rating_change' | 'occupancy_spike';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

/** 성과 스냅샷 (월별) */
export interface PerformanceSnapshot {
  propertyId: string;
  month: string; // "2026-03"
  healthScore: number;
  healthGrade: string;
  rank: number;
  totalInCompSet: number;
  categoryScores: Record<string, number>;
  occupancyRate: number;
  avgPrice: number;
  actionsCompleted: number;
  actionsPending: number;
  createdAt: string;
}

/** 성과 추이 (여러 월) */
export interface PerformanceTrend {
  propertyId: string;
  snapshots: PerformanceSnapshot[];
}

/** 인앱 알림 */
export interface NotificationItem {
  id: string;
  userId: string;
  propertyId?: string;
  type: 'strategy_ready' | 'action_urgent' | 'report_ready' | 'competitor_alert' | 'score_change';
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
}
