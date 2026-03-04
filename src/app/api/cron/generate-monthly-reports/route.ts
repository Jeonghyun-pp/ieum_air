import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { generateMonthlyReport, saveReportDraft } from '@/lib/admin/report-generator';

/**
 * Monthly report generation cron
 * Runs on the 2nd of each month at 8:00 AM (after analytics aggregation on the 1st)
 * Auto-generates draft reports for all active properties — does NOT auto-publish
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

    // Calculate previous month (report is for last month)
    const now = new Date();
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const month = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    // Get all active properties
    const propsSnap = await db.collection('properties')
      .where('status', '==', 'active')
      .get();

    const results: { propertyId: string; resultId: string; highlightCount: number }[] = [];
    const errors: { propertyId: string; error: string }[] = [];

    for (const propDoc of propsSnap.docs) {
      try {
        const report = await generateMonthlyReport(propDoc.id, month);
        const resultId = await saveReportDraft(propDoc.id, report);
        results.push({
          propertyId: propDoc.id,
          resultId,
          highlightCount: report.highlights.length,
        });
      } catch (err: any) {
        errors.push({ propertyId: propDoc.id, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        month,
        generated: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error: any) {
    console.error('Cron generate-monthly-reports error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
