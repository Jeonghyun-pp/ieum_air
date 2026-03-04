import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { aggregateMonthlyAnalytics, saveAggregatedAnalytics } from '@/lib/admin/analytics-aggregator';

/**
 * Monthly analytics aggregation cron
 * Runs on the 1st of each month at 6:00 AM
 * Aggregates previous month's GA4 + Instagram data for all active properties
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }

  try {
    const db = getAdminFirestore();

    // Calculate previous month
    const now = new Date();
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const month = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    // Get all active properties
    const propsSnap = await db.collection('properties')
      .where('status', '==', 'active')
      .get();

    const results: { propertyId: string; docId: string; rawDocCount: number }[] = [];
    const errors: { propertyId: string; error: string }[] = [];

    for (const propDoc of propsSnap.docs) {
      try {
        const aggregated = await aggregateMonthlyAnalytics(propDoc.id, month);
        const docId = await saveAggregatedAnalytics(propDoc.id, month, aggregated);
        results.push({ propertyId: propDoc.id, docId, rawDocCount: aggregated.rawDocCount });
      } catch (err: any) {
        errors.push({ propertyId: propDoc.id, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        month,
        processed: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error: any) {
    console.error('Cron aggregate-analytics error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
