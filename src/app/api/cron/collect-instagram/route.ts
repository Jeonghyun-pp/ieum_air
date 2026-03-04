import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { InstagramClient } from '@/lib/integrations/instagram';
import { aggregateInstagramData, getCurrentMonth } from '@/lib/portal/aggregator';

// POST /api/cron/collect-instagram — 일 1회 Instagram 인사이트 수집
export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }

  const db = getAdminFirestore();
  const month = getCurrentMonth();
  let collected = 0;
  let failed = 0;

  try {
    const propertiesSnap = await db.collection('properties')
      .where('status', 'in', ['active', 'onboarding'])
      .get();

    for (const propDoc of propertiesSnap.docs) {
      const intDoc = await propDoc.ref.collection('integrations').doc('instagram').get();
      if (!intDoc.exists) continue;

      const intData = intDoc.data()!;
      if (intData.status !== 'active' || !intData.accessToken) continue;

      try {
        const client = new InstagramClient(intData.accessToken);

        const [insights, media] = await Promise.all([
          client.getInsights(),
          client.getRecentMedia(20),
        ]);

        const aggregated = aggregateInstagramData(insights, media);

        // analytics 서브컬렉션에 저장
        await propDoc.ref.collection('analytics').add({
          month,
          source: 'instagram',
          ...aggregated,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        collected++;
      } catch (err) {
        console.error(`Instagram collection failed for ${propDoc.id}:`, err);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      data: { collected, failed, month },
    });
  } catch (error) {
    console.error('Instagram cron error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Cron job failed' } },
      { status: 500 }
    );
  }
}
