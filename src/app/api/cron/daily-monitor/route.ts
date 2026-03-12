import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { inngest } from '@/inngest/client';

// POST /api/cron/daily-monitor — 일간 경쟁 모니터링
// Vercel Cron: 매일 오전 6시 (KST)
export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }

  try {
    const db = getAdminFirestore();
    const propertiesSnap = await db.collection('properties')
      .where('status', 'in', ['active', 'onboarding'])
      .where('diagnosisStatus', '==', 'ready')
      .get();

    let dispatched = 0;

    for (const propDoc of propertiesSnap.docs) {
      await inngest.send({
        name: 'property/monitor.daily',
        data: { propertyId: propDoc.id },
      });
      dispatched++;
    }

    return NextResponse.json({
      success: true,
      data: { dispatched },
    });
  } catch (error) {
    console.error('[cron/daily-monitor] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Cron job failed' } },
      { status: 500 }
    );
  }
}
