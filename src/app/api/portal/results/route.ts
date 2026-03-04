import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveProperty } from '@/lib/portal/helpers';
import { getPropertySubcollection } from '@/lib/firebase/firestore';
import { mockPortalData } from '@/lib/portal/mock';
import type { ResultDocument } from '@/lib/portal/types';

// GET /api/portal/results — 성과 데이터
export async function GET(request: NextRequest) {
  const { uid, property } = await resolveActiveProperty(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  if (!property) {
    return NextResponse.json({ success: true, data: mockPortalData.results });
  }

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || getCurrentMonth();

    const results = await getPropertySubcollection<ResultDocument>(
      property.id, 'results', { orderBy: 'createdAt', direction: 'desc', limit: 12 }
    );
    const current = results.find(r => r.month === month);

    if (current) {
      return NextResponse.json({
        success: true,
        data: {
          highlights: current.highlights,
          metrics: current.metrics,
          reportUrl: current.reportUrl,
        },
      });
    }

    return NextResponse.json({ success: true, data: mockPortalData.results });
  } catch (error) {
    console.error('Results API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load results' } },
      { status: 500 }
    );
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
