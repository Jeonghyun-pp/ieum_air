import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { inngest } from '@/inngest/client';

// POST /api/cron/weekly-refresh — 주간 전체 파이프라인 재실행
// Vercel Cron: 매주 월요일 오전 3시 (KST)
// Phase 1~3 전체 재실행: 스크래핑 → 분석 → 진단 → 전략
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
      .get();

    let dispatched = 0;

    for (const propDoc of propertiesSnap.docs) {
      const data = propDoc.data();
      if (!data.scrapedData?.listingId) continue;

      // Phase 1 시작점: 자사 리스팅 재스크래핑
      // 이후 체인: scrape → build comp-set → scrape details → analyze → diagnose → strategy
      await inngest.send({
        name: 'property/scrape.own',
        data: {
          propertyId: propDoc.id,
          listingId: data.scrapedData.listingId,
        },
      });
      dispatched++;
    }

    return NextResponse.json({
      success: true,
      data: { dispatched },
    });
  } catch (error) {
    console.error('[cron/weekly-refresh] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Cron job failed' } },
      { status: 500 }
    );
  }
}
