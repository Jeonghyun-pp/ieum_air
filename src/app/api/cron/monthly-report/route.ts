import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { inngest } from '@/inngest/client';

// POST /api/cron/monthly-report — 월간 성과 리포트 생성
// Vercel Cron: 매월 1일 오전 9시 (KST)
export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }

  try {
    const db = getAdminFirestore();
    // 전월 리포트 생성
    const prevMonth = getPreviousMonth();

    const propertiesSnap = await db.collection('properties')
      .where('status', 'in', ['active', 'onboarding'])
      .where('diagnosisStatus', '==', 'ready')
      .get();

    let dispatched = 0;

    for (const propDoc of propertiesSnap.docs) {
      await inngest.send({
        name: 'property/report.monthly',
        data: {
          propertyId: propDoc.id,
          month: prevMonth,
        },
      });
      dispatched++;
    }

    return NextResponse.json({
      success: true,
      data: { dispatched, month: prevMonth },
    });
  } catch (error) {
    console.error('[cron/monthly-report] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Cron job failed' } },
      { status: 500 }
    );
  }
}

function getPreviousMonth(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
