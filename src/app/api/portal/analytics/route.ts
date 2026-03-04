import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveProperty } from '@/lib/portal/helpers';
import { getPropertySubcollection } from '@/lib/firebase/firestore';
import type { AnalyticsDocument } from '@/lib/portal/types';

const defaultAnalytics = {
  nationalityBreakdown: [
    { name: '일본', value: 38, color: '#DC2626' },
    { name: '대만', value: 24, color: '#22C55E' },
    { name: '미국', value: 15, color: '#3B82F6' },
    { name: '한국', value: 13, color: '#8B5CF6' },
    { name: '기타', value: 10, color: '#6A6A6A' },
  ],
  bookingTrend: [
    { month: '10월', bookings: 12, views: 340 },
    { month: '11월', bookings: 18, views: 420 },
    { month: '12월', bookings: 24, views: 580 },
    { month: '1월', bookings: 20, views: 510 },
    { month: '2월', bookings: 28, views: 650 },
    { month: '3월', bookings: 32, views: 720 },
  ],
  channelData: [
    { channel: '에어비앤비', visitors: 450 },
    { channel: '인스타그램', visitors: 280 },
    { channel: '네이버', visitors: 190 },
    { channel: 'Google', visitors: 130 },
    { channel: 'TikTok', visitors: 85 },
  ],
  channelRecommendations: [
    { country: '일본', flag: '🇯🇵', channels: ['Instagram', 'X (Twitter)', '일본어 블로그'], primary: 'Instagram' },
    { country: '대만', flag: '🇹🇼', channels: ['Instagram', 'Facebook'], primary: 'Instagram' },
    { country: '미국', flag: '🇺🇸', channels: ['Instagram', 'TikTok'], primary: 'TikTok' },
  ],
};

// GET /api/portal/analytics — 분석 데이터
export async function GET(request: NextRequest) {
  const { uid, property } = await resolveActiveProperty(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  if (!property) {
    return NextResponse.json({ success: true, data: defaultAnalytics });
  }

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || getCurrentMonth();

    const analytics = await getPropertySubcollection<AnalyticsDocument>(
      property.id, 'analytics', { orderBy: 'createdAt', direction: 'desc', limit: 12 }
    );
    const current = analytics.find(a => a.month === month);

    if (current) {
      return NextResponse.json({
        success: true,
        data: {
          nationalityBreakdown: current.nationalityBreakdown,
          bookingTrend: current.bookingTrend,
          channelData: current.channelData,
          channelRecommendations: current.channelRecommendations,
        },
      });
    }

    return NextResponse.json({ success: true, data: defaultAnalytics });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load analytics' } },
      { status: 500 }
    );
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
