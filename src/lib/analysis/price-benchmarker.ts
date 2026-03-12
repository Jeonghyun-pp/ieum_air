// ============================================
// Price Benchmarker — 가격 벤치마킹
// ============================================

import type { CompSetMember } from '@/types/comp-set';
import type { PriceBenchmark } from '@/types/market-intel';

/**
 * 자사 숙소의 가격을 비교군과 벤치마킹합니다.
 *
 * 결과:
 * - 비교군 가격 통계 (min, max, median, p25, p75, mean)
 * - 자사 가격 백분위
 * - 제안 가격 범위
 */
export function benchmarkPrice(
  ownPrice: number,
  compSetMembers: CompSetMember[],
  currency: string = 'KRW'
): PriceBenchmark {
  const prices = compSetMembers
    .map((m) => m.pricePerNight)
    .filter((p) => p > 0)
    .sort((a, b) => a - b);

  if (prices.length === 0) {
    return {
      ownPrice,
      currency,
      compSetStats: { min: 0, max: 0, median: 0, p25: 0, p75: 0, mean: 0 },
      percentile: 50,
      suggestedRange: { low: ownPrice, high: ownPrice },
      analyzedAt: new Date().toISOString(),
    };
  }

  const stats = {
    min: prices[0],
    max: prices[prices.length - 1],
    median: percentile(prices, 50),
    p25: percentile(prices, 25),
    p75: percentile(prices, 75),
    mean: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
  };

  // 자사 가격 백분위 계산
  const below = prices.filter((p) => p < ownPrice).length;
  const equal = prices.filter((p) => p === ownPrice).length;
  const ownPercentile = Math.round(((below + equal * 0.5) / prices.length) * 100);

  // 제안 가격 범위: p40 ~ p70 (경쟁력 있는 가격대)
  const suggestedRange = {
    low: percentile(prices, 40),
    high: percentile(prices, 70),
  };

  // 요일별 평균 (캘린더 데이터 있는 경우)
  const weekdayPrices: number[] = [];
  const weekendPrices: number[] = [];
  for (const member of compSetMembers) {
    for (const day of member.calendar) {
      if (!day.price || day.price <= 0) continue;
      const date = new Date(day.date);
      const dow = date.getDay();
      if (dow === 0 || dow === 5 || dow === 6) {
        weekendPrices.push(day.price);
      } else {
        weekdayPrices.push(day.price);
      }
    }
  }

  return {
    ownPrice,
    currency,
    compSetStats: stats,
    percentile: ownPercentile,
    suggestedRange,
    weekdayAvg: weekdayPrices.length > 0
      ? Math.round(weekdayPrices.reduce((a, b) => a + b, 0) / weekdayPrices.length)
      : undefined,
    weekendAvg: weekendPrices.length > 0
      ? Math.round(weekendPrices.reduce((a, b) => a + b, 0) / weekendPrices.length)
      : undefined,
    analyzedAt: new Date().toISOString(),
  };
}

/** 정렬된 배열에서 백분위 값을 계산합니다 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;

  if (lower === upper) return sorted[lower];
  return Math.round(sorted[lower] + fraction * (sorted[upper] - sorted[lower]));
}
