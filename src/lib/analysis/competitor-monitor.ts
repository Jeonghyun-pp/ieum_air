// ============================================
// Competitor Monitor — 비교군 변동 감지
// iCal 캘린더 기반 가격/점유율 모니터링
// ============================================

import { scrapeCalendar, calculateOccupancyRate } from '@/lib/scraping/airbnb-calendar';
import type { CompSetMember } from '@/types/comp-set';
import type { CompetitorSnapshot, CompetitorPrice, CompetitorAlert } from '@/types/monitoring';

/**
 * 비교군 일별 스냅샷을 생성합니다.
 * iCal 피드만 사용하므로 차단 위험 없음.
 */
export async function captureSnapshot(
  propertyId: string,
  ownPrice: number,
  members: CompSetMember[]
): Promise<CompetitorSnapshot> {
  const today = new Date().toISOString().slice(0, 10);
  const memberPrices: CompetitorPrice[] = [];

  for (const member of members.slice(0, 30)) {
    // iCal로 점유 상태만 확인 (가격은 기존 데이터 사용)
    const calResult = await scrapeCalendar(member.listingId, 1);
    const todayCal = calResult.data?.find(d => d.date === today);

    memberPrices.push({
      listingId: member.listingId,
      price: member.pricePerNight,
      available: todayCal?.available ?? true,
    });

    // iCal 요청 간 딜레이 (500ms)
    await new Promise(r => setTimeout(r, 500));
  }

  const prices = memberPrices.map(m => m.price).filter(p => p > 0).sort((a, b) => a - b);
  const median = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0;
  const occupiedCount = memberPrices.filter(m => !m.available).length;
  const avgOccupancy = memberPrices.length > 0 ? occupiedCount / memberPrices.length : 0;

  return {
    propertyId,
    date: today,
    members: memberPrices,
    ownPrice,
    compSetMedian: median,
    compSetMin: prices[0] ?? 0,
    compSetMax: prices[prices.length - 1] ?? 0,
    avgOccupancy,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 오늘 스냅샷과 이전 스냅샷을 비교하여 알림을 생성합니다.
 */
export function detectAlerts(
  propertyId: string,
  current: CompetitorSnapshot,
  previous: CompetitorSnapshot | null
): CompetitorAlert[] {
  const alerts: CompetitorAlert[] = [];
  const now = new Date().toISOString();

  if (!previous) return alerts;

  // 1) 비교군 중앙가 급변 (±15%)
  if (previous.compSetMedian > 0) {
    const priceChange = (current.compSetMedian - previous.compSetMedian) / previous.compSetMedian;
    if (priceChange >= 0.15) {
      alerts.push({
        id: `alert-${propertyId}-price-surge-${current.date}`,
        propertyId,
        type: 'price_surge',
        severity: 'warning',
        title: '경쟁 숙소 가격 급등',
        description: `비교군 중앙가가 ${Math.round(priceChange * 100)}% 상승했습니다. 가격 인상을 고려하세요.`,
        data: {
          previousMedian: previous.compSetMedian,
          currentMedian: current.compSetMedian,
          change: priceChange,
        },
        read: false,
        createdAt: now,
      });
    } else if (priceChange <= -0.15) {
      alerts.push({
        id: `alert-${propertyId}-price-drop-${current.date}`,
        propertyId,
        type: 'price_drop',
        severity: 'warning',
        title: '경쟁 숙소 가격 급락',
        description: `비교군 중앙가가 ${Math.round(Math.abs(priceChange) * 100)}% 하락했습니다. 가격 경쟁력을 확인하세요.`,
        data: {
          previousMedian: previous.compSetMedian,
          currentMedian: current.compSetMedian,
          change: priceChange,
        },
        read: false,
        createdAt: now,
      });
    }
  }

  // 2) 점유율 급등 (수요 증가 신호)
  if (current.avgOccupancy >= 0.85 && previous.avgOccupancy < 0.7) {
    alerts.push({
      id: `alert-${propertyId}-occ-spike-${current.date}`,
      propertyId,
      type: 'occupancy_spike',
      severity: 'info',
      title: '비교군 점유율 급등',
      description: `비교군 평균 점유율이 ${Math.round(current.avgOccupancy * 100)}%로 상승했습니다. 수요 증가 신호입니다.`,
      data: {
        previousOccupancy: previous.avgOccupancy,
        currentOccupancy: current.avgOccupancy,
      },
      read: false,
      createdAt: now,
    });
  }

  // 3) 새 경쟁자 감지
  const prevIds = new Set(previous.members.map(m => m.listingId));
  const newCompetitors = current.members.filter(m => !prevIds.has(m.listingId));
  if (newCompetitors.length > 0) {
    alerts.push({
      id: `alert-${propertyId}-new-comp-${current.date}`,
      propertyId,
      type: 'new_competitor',
      severity: 'info',
      title: `새 경쟁 숙소 ${newCompetitors.length}개 감지`,
      description: '비교군에 새로운 숙소가 등록되었습니다.',
      data: { newListingIds: newCompetitors.map(c => c.listingId) },
      read: false,
      createdAt: now,
    });
  }

  return alerts;
}
