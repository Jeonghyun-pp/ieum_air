// ============================================
// Performance Tracker — 성과 추적 & 스냅샷
// ============================================

import type { PerformanceSnapshot } from '@/types/monitoring';
import type { EnhancedScorecard } from '@/types/diagnosis';
import type { ActionItem } from '@/types/strategy';

/**
 * 현재 시점의 성과 스냅샷을 생성합니다.
 * 월 1회 저장하여 추이를 추적합니다.
 */
export function createPerformanceSnapshot(
  propertyId: string,
  month: string,
  scorecard: EnhancedScorecard | null,
  occupancyRate: number,
  avgPrice: number,
  actions: ActionItem[]
): PerformanceSnapshot {
  const categoryScores: Record<string, number> = {};
  if (scorecard) {
    for (const cat of scorecard.categories) {
      categoryScores[cat.category] = cat.score;
    }
  }

  return {
    propertyId,
    month,
    healthScore: scorecard?.overallScore ?? 0,
    healthGrade: scorecard?.overallGrade ?? 'F',
    rank: scorecard?.rank ?? 0,
    totalInCompSet: scorecard?.totalInCompSet ?? 0,
    categoryScores,
    occupancyRate,
    avgPrice,
    actionsCompleted: actions.filter(a => a.status === 'completed').length,
    actionsPending: actions.filter(a => a.status === 'pending').length,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 두 스냅샷을 비교하여 변화 요약을 생성합니다.
 */
export function compareSnapshots(
  current: PerformanceSnapshot,
  previous: PerformanceSnapshot | null
): PerformanceComparison {
  if (!previous) {
    return {
      healthScoreDelta: 0,
      rankDelta: 0,
      occupancyDelta: 0,
      avgPriceDelta: 0,
      categoryDeltas: {},
      highlights: ['첫 성과 기록입니다.'],
    };
  }

  const healthScoreDelta = current.healthScore - previous.healthScore;
  const rankDelta = previous.rank - current.rank; // 양수 = 순위 상승
  const occupancyDelta = current.occupancyRate - previous.occupancyRate;
  const avgPriceDelta = previous.avgPrice > 0
    ? Math.round((current.avgPrice / previous.avgPrice - 1) * 100)
    : 0;

  const categoryDeltas: Record<string, number> = {};
  for (const [key, score] of Object.entries(current.categoryScores)) {
    const prevScore = previous.categoryScores[key] ?? score;
    categoryDeltas[key] = score - prevScore;
  }

  const highlights: string[] = [];

  if (healthScoreDelta > 0) {
    highlights.push(`종합 점수 ${healthScoreDelta}점 상승 (${previous.healthScore} → ${current.healthScore})`);
  } else if (healthScoreDelta < 0) {
    highlights.push(`종합 점수 ${Math.abs(healthScoreDelta)}점 하락 (${previous.healthScore} → ${current.healthScore})`);
  }

  if (rankDelta > 0) {
    highlights.push(`순위 ${rankDelta}단계 상승 (${previous.rank}위 → ${current.rank}위)`);
  }

  if (current.actionsCompleted > 0) {
    highlights.push(`${current.actionsCompleted}개 액션 완료`);
  }

  // 가장 많이 개선된 카테고리
  const bestImproved = Object.entries(categoryDeltas)
    .filter(([, d]) => d > 0)
    .sort((a, b) => b[1] - a[1])[0];
  if (bestImproved) {
    highlights.push(`${bestImproved[0]} 분야 ${bestImproved[1]}점 향상`);
  }

  return {
    healthScoreDelta,
    rankDelta,
    occupancyDelta,
    avgPriceDelta,
    categoryDeltas,
    highlights: highlights.length > 0 ? highlights : ['변화 없음'],
  };
}

export interface PerformanceComparison {
  healthScoreDelta: number;
  rankDelta: number; // 양수 = 순위 상승
  occupancyDelta: number;
  avgPriceDelta: number; // %
  categoryDeltas: Record<string, number>;
  highlights: string[];
}
