import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getPropertySubcollection, addToPropertySubcollection } from '@/lib/firebase/firestore';

interface Metric {
  label: string;
  value: string;
  delta: string;
}

interface ResultDocument {
  id?: string;
  month: string;
  highlights: string[];
  metrics: Metric[];
  reportUrl?: string;
  publishedToPortal?: boolean;
  nationalityComparison?: { name: string; current: number; previous: number }[];
  channelComparison?: { channel: string; current: number; previous: number }[];
  pricingEventEffects?: { event: string; adjustment: string; result: string }[];
  createdAt?: any;
  updatedAt?: any;
}

// GET /api/admin/properties/[id]/results — List results/reports, optional ?month= filter
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

    let results = await getPropertySubcollection<ResultDocument>(id, 'results', {
      orderBy: 'month',
    });

    if (month) {
      results = results.filter((result) => result.month === month);
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    console.error('GET /api/admin/properties/[id]/results error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'RESULTS_FETCH_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}

// POST /api/admin/properties/[id]/results — Create a new report manually
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(['admin'])(request);
    if (authCheck) return authCheck;

    const { id } = await params;
    const body = await request.json();

    const { month, highlights, metrics } = body;

    if (!month || !highlights || !metrics) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'Required fields: month, highlights, metrics',
          },
        },
        { status: 400 }
      );
    }

    const resultData: Omit<ResultDocument, 'id'> = {
      month,
      highlights,
      metrics,
      publishedToPortal: false,
    };

    const docId = await addToPropertySubcollection(id, 'results', resultData);

    return NextResponse.json(
      { success: true, data: { id: docId, ...resultData } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/admin/properties/[id]/results error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'RESULT_CREATE_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}
