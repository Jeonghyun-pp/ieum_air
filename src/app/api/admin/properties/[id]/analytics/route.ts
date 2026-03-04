import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getPropertySubcollection } from '@/lib/firebase/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { aggregateMonthlyAnalytics, saveAggregatedAnalytics } from '@/lib/admin/analytics-aggregator';
import { generatePricingRecommendations } from '@/lib/admin/pricing-recommender';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = searchParams.get('month') ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Fetch raw analytics for this month
    const rawAnalytics = await getPropertySubcollection<any>(id, 'analytics', {
      orderBy: 'collectedAt',
      direction: 'desc',
      limit: 100,
    });
    const monthRaw = rawAnalytics.filter((a: any) => a.month === month && a.type !== 'aggregated');

    // Fetch aggregated doc directly by deterministic ID
    const db = getAdminFirestore();
    const aggDoc = await db.collection('properties').doc(id)
      .collection('analytics').doc(`aggregated-${month}`).get();
    const aggregated = aggDoc.exists ? { id: aggDoc.id, ...aggDoc.data() } : null;

    // Get pricing recommendations
    const pricingRecommendations = await generatePricingRecommendations(id, month);

    return NextResponse.json({
      success: true,
      data: {
        month,
        raw: monthRaw,
        aggregated,
        pricingRecommendations,
      },
    });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

/**
 * POST — Manually trigger aggregation for a given month
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const { id } = await params;
    const body = await request.json();
    const now = new Date();
    const month = body.month ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const aggregated = await aggregateMonthlyAnalytics(id, month);
    const docId = await saveAggregatedAnalytics(id, month, aggregated);

    return NextResponse.json({
      success: true,
      data: { docId, ...aggregated },
    });
  } catch (error: any) {
    console.error('Aggregate analytics error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
