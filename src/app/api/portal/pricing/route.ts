import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveProperty } from '@/lib/portal/helpers';
import { getPropertySubcollection } from '@/lib/firebase/firestore';
import type { PricingEventDocument } from '@/lib/portal/types';

// Mock fallback data
const defaultPricingEvents: Omit<PricingEventDocument, 'createdAt' | 'updatedAt'>[] = [
  { month: '2026-03', date: 1, adjustment: '유지', type: 'normal' },
  { month: '2026-03', date: 7, adjustment: '+15%', type: 'festival', event: '삼일절 연휴' },
  { month: '2026-03', date: 8, adjustment: '+20%', type: 'festival', event: '벚꽃축제 시작' },
  { month: '2026-03', date: 9, adjustment: '+20%', type: 'festival', event: '벚꽃축제' },
  { month: '2026-03', date: 14, adjustment: '+10%', type: 'normal', event: '화이트데이' },
  { month: '2026-03', date: 15, adjustment: '+50%', type: 'concert', event: 'BTS 콘서트 (잠실)' },
  { month: '2026-03', date: 16, adjustment: '+40%', type: 'concert', event: 'BTS 콘서트 2일차' },
  { month: '2026-03', date: 29, adjustment: '+30%', type: 'holiday', event: '봄 연휴 시작' },
  { month: '2026-03', date: 30, adjustment: '+30%', type: 'holiday', event: '봄 연휴' },
];

// GET /api/portal/pricing — 가격 캘린더 데이터
export async function GET(request: NextRequest) {
  const { uid, property } = await resolveActiveProperty(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  if (!property) {
    return NextResponse.json({ success: true, data: { events: defaultPricingEvents } });
  }

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || getCurrentMonth();

    const events = await getPropertySubcollection<PricingEventDocument>(
      property.id, 'pricing-events', { orderBy: 'date', direction: 'asc', limit: 50 }
    );
    const monthEvents = events.filter(e => e.month === month);

    return NextResponse.json({
      success: true,
      data: {
        events: monthEvents.length > 0 ? monthEvents : defaultPricingEvents,
        propertyId: property.id,
        month,
      },
    });
  } catch (error) {
    console.error('Pricing API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load pricing' } },
      { status: 500 }
    );
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
