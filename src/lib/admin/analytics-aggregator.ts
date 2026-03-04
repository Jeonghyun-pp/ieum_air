import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { getPreviousMonth } from './utils';

/** Country → recommended marketing channels mapping */
const COUNTRY_CHANNEL_MAP: Record<string, { channels: string[]; primary: string; flag: string }> = {
  'Japan': { channels: ['Instagram', 'X (Twitter)', '일본어 블로그'], primary: 'Instagram', flag: '🇯🇵' },
  'Taiwan': { channels: ['Instagram', 'Facebook', '小紅書'], primary: 'Instagram', flag: '🇹🇼' },
  'United States': { channels: ['TikTok', 'Instagram', 'Google Ads'], primary: 'TikTok', flag: '🇺🇸' },
  'China': { channels: ['小紅書', 'WeChat', 'Ctrip'], primary: '小紅書', flag: '🇨🇳' },
  'South Korea': { channels: ['네이버 블로그', 'Instagram', '당근마켓'], primary: '네이버 블로그', flag: '🇰🇷' },
  'Hong Kong': { channels: ['Instagram', 'Facebook', '小紅書'], primary: 'Instagram', flag: '🇭🇰' },
  'Thailand': { channels: ['Facebook', 'Instagram', 'LINE'], primary: 'Facebook', flag: '🇹🇭' },
  'Singapore': { channels: ['Instagram', 'TikTok', 'Google Ads'], primary: 'Instagram', flag: '🇸🇬' },
};

/**
 * Aggregate monthly analytics for a property by combining raw GA4 + Instagram data
 */
export async function aggregateMonthlyAnalytics(propertyId: string, month: string) {
  const db = getAdminFirestore();
  const propRef = db.collection('properties').doc(propertyId);

  // Fetch all raw analytics docs for the given month
  const analyticsSnap = await propRef.collection('analytics')
    .where('month', '==', month)
    .get();

  const rawDocs = analyticsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Separate GA4 and Instagram data
  const ga4Docs = rawDocs.filter((d: any) => d.platform === 'ga4');
  const igDocs = rawDocs.filter((d: any) => d.platform === 'instagram');

  // Aggregate GA4 metrics
  const ga4Summary = {
    totalUsers: 0,
    sessions: 0,
    pageViews: 0,
    avgSessionDuration: 0,
  };
  const nationalityMap = new Map<string, number>();
  const channelMap = new Map<string, number>();

  for (const doc of ga4Docs as any[]) {
    if (doc.summary) {
      ga4Summary.totalUsers += doc.summary.totalUsers || 0;
      ga4Summary.sessions += doc.summary.sessions || 0;
      ga4Summary.pageViews += doc.summary.pageViews || 0;
      ga4Summary.avgSessionDuration += doc.summary.avgSessionDuration || 0;
    }
    if (doc.nationalityBreakdown) {
      for (const entry of doc.nationalityBreakdown) {
        nationalityMap.set(entry.name, (nationalityMap.get(entry.name) || 0) + entry.value);
      }
    }
    if (doc.channelData) {
      for (const entry of doc.channelData) {
        channelMap.set(entry.channel, (channelMap.get(entry.channel) || 0) + entry.visitors);
      }
    }
  }

  if (ga4Docs.length > 0) {
    ga4Summary.avgSessionDuration /= ga4Docs.length;
  }

  // Aggregate Instagram metrics
  const igSummary = {
    followers: 0,
    impressions: 0,
    reach: 0,
    profileViews: 0,
  };

  for (const doc of igDocs as any[]) {
    igSummary.followers = Math.max(igSummary.followers, doc.followers || 0); // latest is max
    igSummary.impressions += doc.impressions || 0;
    igSummary.reach += doc.reach || 0;
    igSummary.profileViews += doc.profileViews || 0;
  }

  // Build nationality breakdown with colors
  const colorMap: Record<string, string> = {
    'Japan': '#DC2626', 'Taiwan': '#22C55E', 'United States': '#3B82F6',
    'South Korea': '#8B5CF6', 'China': '#F59E0B', 'Hong Kong': '#10B981',
    'Thailand': '#EC4899', 'Singapore': '#06B6D4',
  };

  const totalVisitors = Array.from(nationalityMap.values()).reduce((a, b) => a + b, 0);
  const nationalityBreakdown = Array.from(nationalityMap.entries())
    .map(([name, value]) => ({
      name,
      value,
      percentage: totalVisitors > 0 ? Math.round((value / totalVisitors) * 100) : 0,
      color: colorMap[name] || '#6A6A6A',
    }))
    .sort((a, b) => b.value - a.value);

  // Channel recommendations based on nationality
  const channelRecommendations = nationalityBreakdown
    .slice(0, 5)
    .map(n => {
      const mapping = COUNTRY_CHANNEL_MAP[n.name];
      return {
        country: n.name,
        flag: mapping?.flag || '🌍',
        channels: mapping?.channels || ['Instagram', 'Google Ads'],
        primary: mapping?.primary || 'Instagram',
        percentage: n.percentage,
      };
    });

  const channelData = Array.from(channelMap.entries())
    .map(([channel, visitors]) => ({ channel, visitors }))
    .sort((a, b) => b.visitors - a.visitors);

  // Fetch previous 6 months of booking trends from analytics
  const bookingTrend = await getBookingTrend(propertyId, month, 6);

  return {
    month,
    ga4: ga4Summary,
    instagram: igSummary,
    nationalityBreakdown,
    channelData,
    channelRecommendations,
    bookingTrend,
    rawDocCount: rawDocs.length,
    aggregatedAt: Timestamp.now(),
  };
}

/**
 * Get booking trend data for the last N months
 */
async function getBookingTrend(propertyId: string, currentMonth: string, months: number) {
  const db = getAdminFirestore();
  const trend: { month: string; bookings: number; views: number }[] = [];

  let month = currentMonth;
  for (let i = 0; i < months; i++) {
    const snap = await db.collection('properties').doc(propertyId)
      .collection('analytics')
      .where('month', '==', month)
      .where('platform', '==', 'ga4')
      .get();

    let views = 0;
    let bookings = 0;
    for (const doc of snap.docs) {
      const data = doc.data();
      views += data.summary?.totalUsers || 0;
      bookings += data.summary?.sessions || 0;
    }

    trend.unshift({ month, bookings, views });
    month = getPreviousMonth(month);
  }

  return trend;
}

/**
 * Save aggregated analytics to the analytics subcollection
 */
export async function saveAggregatedAnalytics(
  propertyId: string,
  month: string,
  data: Awaited<ReturnType<typeof aggregateMonthlyAnalytics>>
) {
  const db = getAdminFirestore();
  const docRef = db.collection('properties').doc(propertyId)
    .collection('analytics').doc(`aggregated-${month}`);

  await docRef.set({
    ...data,
    type: 'aggregated',
    platform: 'aggregated',
    month,
    updatedAt: Timestamp.now(),
  }, { merge: true });

  return docRef.id;
}
