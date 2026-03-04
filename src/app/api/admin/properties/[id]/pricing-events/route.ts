import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getPropertySubcollection, addToPropertySubcollection } from '@/lib/firebase/firestore';

interface PricingEventDocument {
  id?: string;
  month: string;
  date: number;
  event?: string;
  adjustment: string;
  type: 'concert' | 'festival' | 'holiday' | 'normal';
  applied?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

// GET /api/admin/properties/[id]/pricing-events — List pricing events, optional ?month= filter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(['admin'])(request);
    if (authCheck) return authCheck;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    let events = await getPropertySubcollection<PricingEventDocument>(id, 'pricing-events', {
      orderBy: 'date',
    });

    if (month) {
      events = events.filter((event) => event.month === month);
    }

    return NextResponse.json({ success: true, data: events });
  } catch (error: any) {
    console.error('GET /api/admin/properties/[id]/pricing-events error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'PRICING_EVENTS_FETCH_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}

// POST /api/admin/properties/[id]/pricing-events — Create a new pricing event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(['admin'])(request);
    if (authCheck) return authCheck;

    const { id } = await params;
    const body = await request.json();

    const { month, date, event, adjustment, type } = body;

    if (!month || date === undefined || !adjustment || !type) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'Required fields: month, date, adjustment, type',
          },
        },
        { status: 400 }
      );
    }

    const eventData: Omit<PricingEventDocument, 'id'> = {
      month,
      date,
      event,
      adjustment,
      type,
      applied: false,
    };

    const docId = await addToPropertySubcollection(id, 'pricing-events', eventData);

    return NextResponse.json(
      { success: true, data: { id: docId, ...eventData } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/admin/properties/[id]/pricing-events error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'PRICING_EVENT_CREATE_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}
