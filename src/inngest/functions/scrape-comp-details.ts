// ============================================
// Inngest Function: 비교군 상세 스크래핑 (배치)
// Step 3 of 4 in the comp-set pipeline
// ============================================

import { inngest } from '../client';
import { scrapeListingDetail } from '@/lib/scraping/airbnb-detail-scraper';
import { scrapeCalendar } from '@/lib/scraping/airbnb-calendar';
import { toCompSetMember, haversineKm } from '@/lib/analysis/comp-set-builder';
import { randomDelay } from '@/lib/scraping/ua-rotator';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { CompSetCriteria } from '@/types/comp-set';

export const scrapeCompDetails = inngest.createFunction(
  {
    id: 'scrape-comp-details',
    retries: 1,
    concurrency: [{ limit: 3 }], // 동시 3개 배치까지
  },
  { event: 'property/comp-set.scrape-batch' },
  async ({ event, step }) => {
    const { propertyId, listingIds, batchIndex, totalBatches, criteria } = event.data as {
      propertyId: string;
      listingIds: string[];
      batchIndex: number;
      totalBatches: number;
      criteria: CompSetCriteria;
    };

    const results: { listingId: string; success: boolean }[] = [];

    // 배치 내 리스팅을 순차 스크래핑 (요청 간 딜레이)
    for (let i = 0; i < listingIds.length; i++) {
      const listingId = listingIds[i];

      const result = await step.run(`scrape-${listingId}`, async () => {
        // 요청 간 딜레이
        if (i > 0) await randomDelay(3000, 6000);

        // 상세 스크래핑
        const detailResult = await scrapeListingDetail(listingId);
        if (!detailResult.success || !detailResult.data) {
          return { listingId, success: false, error: detailResult.error?.message };
        }

        // 캘린더 스크래핑
        const calendarResult = await scrapeCalendar(listingId, 3);
        const listing = {
          ...detailResult.data,
          calendar: calendarResult.data ?? [],
        };

        // 거리 계산
        const distanceKm = haversineKm(
          criteria.centerLat,
          criteria.centerLng,
          listing.location.lat,
          listing.location.lng
        );

        // CompSetMember로 변환
        const member = toCompSetMember(listing, distanceKm, 'scrape');

        // Firestore에 저장
        const db = getAdminFirestore();
        await db
          .collection('properties')
          .doc(propertyId)
          .collection('comp-set-members')
          .doc(listingId)
          .set(member);

        return { listingId, success: true };
      });

      results.push(result);
    }

    // 진행 상태 업데이트
    await step.run('update-batch-progress', async () => {
      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;
      const db = getAdminFirestore();

      await db
        .collection('properties')
        .doc(propertyId)
        .update({
          'compSetProgress.scrapedMembers': FieldValue.increment(successCount),
          'compSetProgress.failedMembers': FieldValue.increment(failedCount),
          updatedAt: FieldValue.serverTimestamp(),
        });

    });

    // 마지막 배치 완료 시 분석 파이프라인 트리거
    if (batchIndex === totalBatches - 1) {
      await step.sendEvent('trigger-analyze', {
        name: 'property/comp-set.analyze',
        data: { propertyId, criteria },
      });
    }

    return {
      propertyId,
      batchIndex,
      totalBatches,
      results,
    };
  }
);
