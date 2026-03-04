import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Metric } from '@/lib/portal/types';
import { getPreviousMonth } from './utils';

/**
 * Calculate delta percentage between current and previous values
 */
function calcDelta(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const delta = Math.round(((current - previous) / previous) * 100);
  return delta >= 0 ? `+${delta}%` : `${delta}%`;
}

/**
 * Generate a monthly report for a property by comparing current vs previous month analytics
 */
export async function generateMonthlyReport(propertyId: string, month: string) {
  const db = getAdminFirestore();
  const prevMonth = getPreviousMonth(month);

  // Fetch aggregated analytics for current & previous month
  const [currentDoc, previousDoc] = await Promise.all([
    db.collection('properties').doc(propertyId)
      .collection('analytics').doc(`aggregated-${month}`).get(),
    db.collection('properties').doc(propertyId)
      .collection('analytics').doc(`aggregated-${prevMonth}`).get(),
  ]);

  const current = currentDoc.exists ? currentDoc.data()! : null;
  const previous = previousDoc.exists ? previousDoc.data()! : null;

  // Core metrics with deltas
  const metrics: Metric[] = [];

  if (current?.ga4) {
    const prevGa4 = previous?.ga4 || { totalUsers: 0, sessions: 0, pageViews: 0 };
    metrics.push(
      { label: '웹 방문자', value: String(current.ga4.totalUsers), delta: calcDelta(current.ga4.totalUsers, prevGa4.totalUsers) },
      { label: '세션', value: String(current.ga4.sessions), delta: calcDelta(current.ga4.sessions, prevGa4.sessions) },
      { label: '페이지뷰', value: String(current.ga4.pageViews), delta: calcDelta(current.ga4.pageViews, prevGa4.pageViews) },
    );
  }

  if (current?.instagram) {
    const prevIg = previous?.instagram || { followers: 0, reach: 0, impressions: 0 };
    metrics.push(
      { label: 'IG 팔로워', value: String(current.instagram.followers), delta: calcDelta(current.instagram.followers, prevIg.followers) },
      { label: 'IG 도달', value: String(current.instagram.reach), delta: calcDelta(current.instagram.reach, prevIg.reach) },
      { label: 'IG 노출', value: String(current.instagram.impressions), delta: calcDelta(current.instagram.impressions, prevIg.impressions) },
    );
  }

  // Auto-generate highlights
  const highlights: string[] = [];

  // Find best growing metric
  const numericMetrics = metrics.map(m => ({
    label: m.label,
    deltaNum: parseInt(m.delta.replace('%', '').replace('+', '')) || 0,
  }));
  const bestMetric = numericMetrics.sort((a, b) => b.deltaNum - a.deltaNum)[0];
  if (bestMetric && bestMetric.deltaNum > 0) {
    highlights.push(`${bestMetric.label} 전월 대비 ${bestMetric.deltaNum}% 성장`);
  }

  // Top nationality
  if (current?.nationalityBreakdown?.length > 0) {
    const top = current.nationalityBreakdown[0];
    highlights.push(`최다 유입 국가: ${top.name} (${top.percentage}%)`);
  }

  // Top channel
  if (current?.channelData?.length > 0) {
    const topChannel = current.channelData[0];
    highlights.push(`최다 유입 채널: ${topChannel.channel} (${topChannel.visitors}명)`);
  }

  if (highlights.length === 0) {
    highlights.push('이번 달 분석 데이터가 부족합니다.');
  }

  // Nationality comparison (current vs previous)
  const nationalityComparison = (current?.nationalityBreakdown || []).map((n: any) => {
    const prevEntry = (previous?.nationalityBreakdown || []).find((p: any) => p.name === n.name);
    return {
      name: n.name,
      current: n.value,
      previous: prevEntry?.value || 0,
    };
  });

  // Channel comparison
  const channelComparison = (current?.channelData || []).map((c: any) => {
    const prevEntry = (previous?.channelData || []).find((p: any) => p.channel === c.channel);
    return {
      channel: c.channel,
      current: c.visitors,
      previous: prevEntry?.visitors || 0,
    };
  });

  // Pricing event effects
  const pricingEventsSnap = await db.collection('properties').doc(propertyId)
    .collection('pricing-events')
    .where('month', '==', month)
    .get();

  const pricingEventEffects = pricingEventsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      event: data.event || '일반 조정',
      adjustment: data.adjustment,
      result: data.applied ? '적용 완료' : '미적용',
    };
  });

  return {
    month,
    highlights,
    metrics,
    nationalityComparison,
    channelComparison,
    pricingEventEffects,
    publishedToPortal: false,
  };
}

/**
 * Save a generated report as a draft to the results subcollection.
 * Uses deterministic doc ID (report-{month}) to prevent duplicates per month.
 */
export async function saveReportDraft(
  propertyId: string,
  report: Awaited<ReturnType<typeof generateMonthlyReport>>
): Promise<string> {
  const db = getAdminFirestore();
  const now = Timestamp.now();
  const docId = `report-${report.month}`;

  const docRef = db.collection('properties').doc(propertyId)
    .collection('results').doc(docId);

  const existing = await docRef.get();
  if (existing.exists) {
    // Update existing draft (preserve createdAt, don't overwrite if already published)
    const existingData = existing.data()!;
    if (existingData.publishedToPortal) {
      // Already published — create a new version instead
      const ref = await db.collection('properties').doc(propertyId)
        .collection('results').add({
          ...report,
          createdAt: now,
          updatedAt: now,
        });
      return ref.id;
    }
    await docRef.update({ ...report, updatedAt: now });
  } else {
    await docRef.set({ ...report, createdAt: now, updatedAt: now });
  }

  return docId;
}
