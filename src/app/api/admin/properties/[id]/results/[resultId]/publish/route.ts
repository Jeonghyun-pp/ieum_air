import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/auth/middleware';
import { updatePropertySubdoc, getPropertySubcollection } from '@/lib/firebase/firestore';
import { logActivity } from '@/lib/admin/activity';
import { getAdminFirestore } from '@/lib/firebase/admin';

/**
 * POST — Publish a report to the customer portal
 * Sets publishedToPortal: true and transitions the month's plan to REPORT_READY
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resultId: string }> }
) {
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const { id, resultId } = await params;
    const db = getAdminFirestore();

    // 1. Get the result to find the month
    const resultDoc = await db.collection('properties').doc(id)
      .collection('results').doc(resultId).get();

    if (!resultDoc.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Report not found' } },
        { status: 404 }
      );
    }

    const resultData = resultDoc.data()!;

    // 2. Publish to portal
    await updatePropertySubdoc(id, 'results', resultId, {
      publishedToPortal: true,
    });

    // 3. Transition the plan for this month to REPORT_READY
    const plans = await getPropertySubcollection<any>(id, 'plans');
    const monthPlan = plans.find((p: any) => p.month === resultData.month);
    if (monthPlan) {
      await updatePropertySubdoc(id, 'plans', monthPlan.id, {
        status: 'REPORT_READY',
      });
    }

    // 4. Log activity
    const user = (request as AuthenticatedRequest).user!;
    await logActivity({
      propertyId: id,
      actorId: user.uid,
      action: 'published',
      target: 'report',
      detail: `${resultData.month} 월간 리포트 포털에 발행`,
    });

    return NextResponse.json({
      success: true,
      data: { resultId, publishedToPortal: true, month: resultData.month },
    });
  } catch (error: any) {
    console.error('Publish report error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
