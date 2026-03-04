import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { scrapeAirbnbListing } from '@/lib/scraping/airbnb';

// POST /api/cron/scrape-airbnb — 주 1회 에어비앤비 재스크래핑
export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }

  const db = getAdminFirestore();
  let scraped = 0;
  let failed = 0;

  try {
    const propertiesSnap = await db.collection('properties')
      .where('status', 'in', ['active', 'onboarding'])
      .get();

    for (const propDoc of propertiesSnap.docs) {
      const data = propDoc.data();
      if (!data.listingUrl) continue;

      // 최근 7일 이내 스크래핑한 경우 건너뛰기
      const lastScraped = data.listingData?.scrapedAt;
      if (lastScraped) {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (lastScraped.toMillis() > weekAgo) continue;
      }

      try {
        const scrapedData = await scrapeAirbnbListing(data.listingUrl);

        await propDoc.ref.update({
          listingData: {
            ...scrapedData,
            scrapedAt: Timestamp.now(),
          },
          updatedAt: Timestamp.now(),
        });

        scraped++;
      } catch (err) {
        console.error(`Airbnb scrape failed for ${propDoc.id}:`, err);
        failed++;
      }

      // Rate limiting: 각 요청 사이 2초 대기
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return NextResponse.json({
      success: true,
      data: { scraped, failed },
    });
  } catch (error) {
    console.error('Airbnb cron error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Cron job failed' } },
      { status: 500 }
    );
  }
}
