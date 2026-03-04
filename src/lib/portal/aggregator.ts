import { Timestamp } from 'firebase-admin/firestore';

/**
 * Instagram 수집 데이터를 분석 포맷으로 변환
 */
export function aggregateInstagramData(insights: {
  followers?: number;
  impressions?: number;
  reach?: number;
  profileViews?: number;
}, media: { id: string; mediaType: string; timestamp: string }[]) {
  return {
    platform: 'instagram',
    followers: insights.followers || 0,
    impressions: insights.impressions || 0,
    reach: insights.reach || 0,
    profileViews: insights.profileViews || 0,
    recentPostCount: media.length,
    collectedAt: Timestamp.now(),
  };
}

/**
 * GA4 수집 데이터를 분석 포맷으로 변환
 */
export function aggregateGA4Data(
  summary: { totalUsers: number; sessions: number; pageViews: number; avgSessionDuration: number },
  trafficSources: { source: string; sessions: number }[],
  usersByCountry: { country: string; users: number }[]
) {
  // 국적 데이터를 차트 포맷으로 변환
  const colorMap: Record<string, string> = {
    'Japan': '#DC2626',
    'Taiwan': '#22C55E',
    'United States': '#3B82F6',
    'South Korea': '#8B5CF6',
    'China': '#F59E0B',
    'Hong Kong': '#10B981',
  };

  const nationalityBreakdown = usersByCountry.map(({ country, users }) => ({
    name: country,
    value: users,
    color: colorMap[country] || '#6A6A6A',
  }));

  // 채널 데이터를 차트 포맷으로 변환
  const channelData = trafficSources.map(({ source, sessions }) => ({
    channel: source,
    visitors: sessions,
  }));

  return {
    platform: 'ga4',
    summary,
    nationalityBreakdown,
    channelData,
    collectedAt: Timestamp.now(),
  };
}

/**
 * 현재 월 문자열 생성
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
