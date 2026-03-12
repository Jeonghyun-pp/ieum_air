// ============================================
// Inngest Function: 자사 리스팅 스크래핑
// Step 1 of 4 in the comp-set pipeline
// ============================================

import { inngest } from '../client';
import { scrapeListingDetail } from '@/lib/scraping/airbnb-detail-scraper';
import { scrapeCalendar } from '@/lib/scraping/airbnb-calendar';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const scrapeOwnListing = inngest.createFunction(
  {
    id: 'scrape-own-listing',
    retries: 2,
  },
  { event: 'property/comp-set.build' },
  async ({ event, step }) => {
    const { propertyId, listingId } = event.data as {
      propertyId: string;
      listingId: string;
    };

    // Step 1: 리스팅 상세 스크래핑
    const listingResult = await step.run('scrape-listing-detail', async () => {
      const result = await scrapeListingDetail(listingId);
      if (!result.success || !result.data) {
        throw new Error(`Scraping failed: ${result.error?.message}`);
      }
      return result.data;
    });

    // Step 2: 캘린더 스크래핑
    const calendarResult = await step.run('scrape-calendar', async () => {
      const result = await scrapeCalendar(listingId, 3);
      return result.success ? result.data ?? [] : [];
    });

    // Step 3: Firestore에 저장
    await step.run('save-own-listing', async () => {
      const listing = { ...listingResult, calendar: calendarResult };
      const db = getAdminFirestore();

      await db
        .collection('properties')
        .doc(propertyId)
        .update({
          'scrapedData': listing,
          'scrapedData.scrapedAt': listing.scrapedAt,
          'compSetStatus': 'scraping_own',
          updatedAt: FieldValue.serverTimestamp(),
        });

      return { listingId, fieldsFound: Object.keys(listing).length };
    });

    // Step 4: 다음 단계 트리거 (비교군 구성)
    await step.sendEvent('trigger-build-comp-set', {
      name: 'property/comp-set.build-members',
      data: {
        propertyId,
        ownListing: { ...listingResult, calendar: calendarResult },
      },
    });

    return { propertyId, listingId, status: 'own_listing_scraped' };
  }
);
