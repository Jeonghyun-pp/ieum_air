import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { generateMonthlyReport, saveReportDraft } from '@/lib/admin/report-generator';
import { logActivity } from '@/lib/admin/activity';
import { AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * POST — Auto-generate a monthly report draft
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

    const report = await generateMonthlyReport(id, month);
    const docId = await saveReportDraft(id, report);

    const user = (request as AuthenticatedRequest).user!;
    await logActivity({
      propertyId: id,
      actorId: user.uid,
      action: 'created',
      target: 'report',
      detail: `${month} 월간 리포트 자동 생성 (초안)`,
    });

    return NextResponse.json({
      success: true,
      data: { id: docId, ...report },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Generate report error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
