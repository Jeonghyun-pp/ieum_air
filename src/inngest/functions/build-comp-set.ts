// ============================================
// Inngest Function: 비교군 구성
// Step 2 of 4 in the comp-set pipeline
// ============================================

import { inngest } from '../client';
import { scrapeSearchResults } from '@/lib/scraping/airbnb-search-scraper';
import {
  buildCriteria,
  filterCandidatesFromCSV,
  csvToCompSetMember,
} from '@/lib/analysis/comp-set-builder';
import { parseInsideAirbnbCSV } from '@/lib/data/insideairbnb-parser';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { ScrapedListing } from '@/types/scraping';

export const buildCompSet = inngest.createFunction(
  {
    id: 'build-comp-set',
    retries: 1,
  },
  { event: 'property/comp-set.build-members' },
  async ({ event, step }) => {
    const { propertyId, ownListing } = event.data as {
      propertyId: string;
      ownListing: ScrapedListing;
    };

    // Step 1: 비교군 기준 생성
    const criteria = buildCriteria(ownListing);

    // Step 2: CSV 캐시 확인 및 후보 필터링
    const csvCandidates = await step.run('filter-csv-candidates', async () => {
      const db = getAdminFirestore();
      // CSV 캐시 확인
      const csvCacheDoc = await db
        .collection('properties')
        .doc(propertyId)
        .collection('csv-cache')
        .doc('insideairbnb')
        .get();

      if (csvCacheDoc.exists) {
        const cacheData = csvCacheDoc.data();
        const storageUrl = cacheData?.storageUrl;
        if (storageUrl) {
          try {
            const res = await fetch(storageUrl);
            if (!res.ok) throw new Error(`CSV fetch HTTP ${res.status}`);
            const csvText = await res.text();
            const records = parseInsideAirbnbCSV(csvText);
            const candidates = filterCandidatesFromCSV(records, criteria);
            return candidates.map(csvToCompSetMember);
          } catch (err) {
            console.warn('[build-comp-set] CSV fetch failed, falling back to search:', err);
          }
        }
      }
      return []; // CSV 없으면 검색으로 대체
    });

    // Step 3: 검색 결과로 보충 (CSV 후보가 부족한 경우)
    const searchListingIds = await step.run('search-for-comps', async () => {
      const targetCount = criteria.targetSize - csvCandidates.length;
      if (targetCount <= 0) {
        return csvCandidates.map((c) => c.listingId);
      }

      const searchResult = await scrapeSearchResults({
        lat: criteria.centerLat,
        lng: criteria.centerLng,
        roomType: criteria.roomType,
        maxPages: Math.min(5, Math.ceil(targetCount / 18)),
      });

      if (!searchResult.success || !searchResult.data) {
        return csvCandidates.map((c) => c.listingId);
      }

      // CSV 후보와 합치고 중복 제거
      const csvIds = new Set(csvCandidates.map((c) => c.listingId));
      const newIds = searchResult.data
        .map((l) => l.listingId)
        .filter((id) => !csvIds.has(id) && id !== ownListing.listingId);

      return [
        ...csvCandidates.map((c) => c.listingId),
        ...newIds.slice(0, targetCount),
      ];
    });

    // Step 4: 진행 상태 업데이트
    await step.run('update-progress', async () => {
      const db = getAdminFirestore();
      await db
        .collection('properties')
        .doc(propertyId)
        .update({
          compSetStatus: 'scraping',
          'compSetProgress.totalMembers': searchListingIds.length,
          'compSetProgress.scrapedMembers': 0,
          'compSetProgress.startedAt': new Date().toISOString(),
          updatedAt: FieldValue.serverTimestamp(),
        });
    });

    // Step 5: 상세 스크래핑 트리거 (배치 단위)
    const BATCH_SIZE = 10;
    const batches: string[][] = [];
    for (let i = 0; i < searchListingIds.length; i += BATCH_SIZE) {
      batches.push(searchListingIds.slice(i, i + BATCH_SIZE));
    }

    await step.sendEvent(
      'trigger-scrape-comp-details',
      batches.map((batch, i) => ({
        name: 'property/comp-set.scrape-batch' as const,
        data: {
          propertyId,
          listingIds: batch,
          batchIndex: i,
          totalBatches: batches.length,
          criteria,
        },
      }))
    );

    return {
      propertyId,
      totalCandidates: searchListingIds.length,
      csvCount: csvCandidates.length,
      batchCount: batches.length,
    };
  }
);
