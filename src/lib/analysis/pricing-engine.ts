// ============================================
// Pricing Engine — 동적 가격 추천 (알고리즘 기반)
// 비교군 + 점유율 + 요일/시즌 → 날짜별 추천가
// ============================================

import type { PricingRecommendation, DailyPrice, PriceFactor } from '@/types/strategy';
import type { PriceBenchmark } from '@/types/market-intel';
import type { CompSetMember } from '@/types/comp-set';
import type { CalendarDay } from '@/types/scraping';
import type { CalendarEventDocument } from '@/lib/portal/types';

/** 시즌 가중치 (한국 기준) */
const SEASON_MULTIPLIERS: Record<number, { label: string; mult: number }> = {
  1: { label: '비수기', mult: -0.10 },
  2: { label: '비수기', mult: -0.08 },
  3: { label: '봄시즌', mult: 0.00 },
  4: { label: '벚꽃시즌', mult: 0.10 },
  5: { label: '가정의달', mult: 0.08 },
  6: { label: '초여름', mult: 0.05 },
  7: { label: '성수기', mult: 0.20 },
  8: { label: '성수기', mult: 0.20 },
  9: { label: '추석시즌', mult: 0.05 },
  10: { label: '가을시즌', mult: 0.08 },
  11: { label: '비수기', mult: -0.05 },
  12: { label: '겨울시즌', mult: 0.05 },
};

/**
 * 월간 가격 추천을 생성합니다.
 *
 * 입력: 자사 가격, 비교군 벤치마크, 자사 캘린더, 비교군 캘린더, 지역 이벤트
 * 출력: 날짜별 추천 가격 + 근거
 */
export function generatePricingRecommendation(
  propertyId: string,
  month: string,
  ownPrice: number,
  currency: string,
  priceBenchmark: PriceBenchmark,
  ownCalendar: CalendarDay[],
  compSetMembers: CompSetMember[],
  events: CalendarEventDocument[] = []
): PricingRecommendation {
  const [year, monthNum] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  // 비교군 요일별 평균가
  const compWeekdayPrices = getCompSetDayOfWeekPrices(compSetMembers);
  // 비교군 점유율 패턴
  const compOccupancyByDay = getCompSetOccupancyPattern(compSetMembers, year, monthNum);
  // 이벤트 맵
  const eventMap = buildEventMap(events);
  // 시즌 가중치
  const season = SEASON_MULTIPLIERS[monthNum] ?? { label: '일반', mult: 0 };

  const dailyPrices: DailyPrice[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(year, monthNum - 1, day);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // 금, 토

    // 자사 해당 날짜 가격 (캘린더 데이터 있으면 사용)
    const ownDayData = ownCalendar.find(c => c.date === dateStr);
    const currentPrice = ownDayData?.price ?? ownPrice;

    // 추천가 계산
    const factors: PriceFactor[] = [];
    let baseRecommended = priceBenchmark.compSetStats.median;

    // 1) 요일 보정
    if (isWeekend) {
      const weekendPremium = priceBenchmark.weekendAvg && priceBenchmark.weekdayAvg
        ? (priceBenchmark.weekendAvg / priceBenchmark.weekdayAvg - 1)
        : 0.15;
      const impact = Math.round(weekendPremium * 100);
      baseRecommended *= (1 + weekendPremium);
      factors.push({ type: 'weekend', label: '주말 프리미엄', impact });
    } else {
      const compDayAvg = compWeekdayPrices[dayOfWeek];
      if (compDayAvg > 0) {
        const dayImpact = Math.round((compDayAvg / priceBenchmark.compSetStats.median - 1) * 100);
        if (Math.abs(dayImpact) >= 3) {
          factors.push({ type: 'weekday', label: `${getDayLabel(dayOfWeek)} 패턴`, impact: dayImpact });
          baseRecommended = compDayAvg;
        }
      }
    }

    // 2) 시즌 보정
    if (Math.abs(season.mult) >= 0.03) {
      const impact = Math.round(season.mult * 100);
      baseRecommended *= (1 + season.mult);
      factors.push({
        type: season.mult > 0 ? 'season_high' : 'season_low',
        label: season.label,
        impact,
      });
    }

    // 3) 이벤트 보정
    const dayEvents = eventMap.get(dateStr) || [];
    for (const evt of dayEvents) {
      const eventImpact = parseImpact(evt.impact);
      baseRecommended *= (1 + eventImpact / 100);
      factors.push({ type: 'event', label: evt.name, impact: eventImpact });
    }

    // 4) 점유율 기반 보정
    const compOcc = compOccupancyByDay[day - 1];
    if (compOcc !== undefined && compOcc > 0.85) {
      const occImpact = Math.round((compOcc - 0.7) * 30);
      baseRecommended *= (1 + occImpact / 100);
      factors.push({ type: 'occupancy', label: `높은 수요 (${Math.round(compOcc * 100)}%)`, impact: occImpact });
    }

    const recommendedPrice = Math.round(baseRecommended / 1000) * 1000; // 1000원 단위
    const priceDiff = recommendedPrice - currentPrice;
    const reason = generateReason(priceDiff, factors, currentPrice, currency);
    const confidence = factors.length >= 2 ? 'high' : factors.length === 1 ? 'medium' : 'low';

    dailyPrices.push({
      date: dateStr,
      dayOfWeek,
      currentPrice,
      recommendedPrice,
      reason,
      factors,
      confidence,
    });
  }

  // 요약 통계
  const adjustedDays = dailyPrices.filter(d => d.recommendedPrice !== d.currentPrice).length;
  const avgRecommended = Math.round(
    dailyPrices.reduce((sum, d) => sum + d.recommendedPrice, 0) / dailyPrices.length
  );
  const avgCurrent = dailyPrices.reduce((sum, d) => sum + d.currentPrice, 0) / dailyPrices.length;
  const potentialRevenueLift = avgCurrent > 0
    ? Math.round((avgRecommended / avgCurrent - 1) * 100)
    : 0;

  return {
    propertyId,
    month,
    basePrice: ownPrice,
    currency,
    dailyPrices,
    summary: {
      avgRecommended,
      potentialRevenueLift,
      adjustedDays,
    },
    generatedAt: new Date().toISOString(),
  };
}

/** 비교군 요일별 평균 가격 */
function getCompSetDayOfWeekPrices(members: CompSetMember[]): number[] {
  const dayPrices: number[][] = [[], [], [], [], [], [], []]; // Sun-Sat

  for (const m of members) {
    for (const cal of m.calendar) {
      if (!cal.price || cal.price <= 0) continue;
      const d = new Date(cal.date);
      dayPrices[d.getDay()].push(cal.price);
    }
  }

  return dayPrices.map(prices => {
    if (prices.length === 0) return 0;
    prices.sort((a, b) => a - b);
    return prices[Math.floor(prices.length / 2)]; // median
  });
}

/** 비교군 날짜별 점유율 패턴 */
function getCompSetOccupancyPattern(
  members: CompSetMember[],
  year: number,
  month: number
): number[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const occupancy: number[] = new Array(daysInMonth).fill(0);
  const counts: number[] = new Array(daysInMonth).fill(0);

  for (const m of members) {
    for (const cal of m.calendar) {
      const d = new Date(cal.date);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        const day = d.getDate() - 1;
        counts[day]++;
        if (!cal.available) occupancy[day]++;
      }
    }
  }

  return occupancy.map((occ, i) => counts[i] > 0 ? occ / counts[i] : 0);
}

function buildEventMap(events: CalendarEventDocument[]): Map<string, CalendarEventDocument[]> {
  const map = new Map<string, CalendarEventDocument[]>();
  for (const evt of events) {
    const existing = map.get(evt.date) || [];
    existing.push(evt);
    map.set(evt.date, existing);
  }
  return map;
}

function parseImpact(impact: string): number {
  const match = impact.match(/([+-]?\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function getDayLabel(dow: number): string {
  return ['일', '월', '화', '수', '목', '금', '토'][dow];
}

function generateReason(
  diff: number,
  factors: PriceFactor[],
  currentPrice: number,
  currency: string
): string {
  if (Math.abs(diff) < 1000) return '현재 가격 유지 적정';

  const direction = diff > 0 ? '인상' : '인하';
  const amount = Math.abs(diff).toLocaleString();
  const topFactor = factors.length > 0 ? factors[0].label : '';

  return topFactor
    ? `${topFactor} 기반 ${amount}${currency === 'KRW' ? '원' : currency} ${direction} 추천`
    : `비교군 대비 ${amount}${currency === 'KRW' ? '원' : currency} ${direction} 추천`;
}
