// ============================================
// Inngest Function: 시장 인텔리전스 분석
// Step 4 of 4 in the comp-set pipeline
// ============================================

import { inngest } from '../client';
import { analyzeAmenities } from '@/lib/analysis/amenity-analyzer';
import { benchmarkPrice } from '@/lib/analysis/price-benchmarker';
import { generateScorecard } from '@/lib/analysis/scorecard-generator';
import { createCompSet } from '@/lib/analysis/comp-set-builder';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { ScrapedListing } from '@/types/scraping';
import type { CompSetCriteria, CompSetMember } from '@/types/comp-set';
import type { MarketIntel } from '@/types/market-intel';

export const analyzeMarketIntel = inngest.createFunction(
  {
    id: 'analyze-market-intel',
    retries: 1,
  },
  { event: 'property/comp-set.analyze' },
  async ({ event, step }) => {
    const { propertyId, criteria } = event.data as {
      propertyId: string;
      criteria: CompSetCriteria;
    };

    // Step 1: 데이터 로드
    const { ownListing, members } = await step.run('load-data', async () => {
      const db = getAdminFirestore();
      // 자사 리스팅 데이터 로드
      const propertyDoc = await db.collection('properties').doc(propertyId).get();
      const ownListing = propertyDoc.data()?.scrapedData as ScrapedListing;
      if (!ownListing) throw new Error('Own listing data not found');

      // 비교군 멤버 로드
      const membersSnapshot = await db
        .collection('properties')
        .doc(propertyId)
        .collection('comp-set-members')
        .get();

      const members = membersSnapshot.docs.map((doc) => doc.data() as CompSetMember);

      return { ownListing, members };
    });

    // Step 2: 편의시설 분석
    const amenityAnalysis = await step.run('analyze-amenities', () => {
      return analyzeAmenities(ownListing.amenities, members);
    });

    // Step 3: 가격 벤치마킹
    const priceBenchmark = await step.run('benchmark-price', () => {
      return benchmarkPrice(ownListing.pricePerNight, members, ownListing.currency);
    });

    // Step 4: 스코어카드 생성
    const scorecard = await step.run('generate-scorecard', () => {
      return generateScorecard(ownListing, members);
    });

    // Step 5: CompSet 저장
    await step.run('save-comp-set', async () => {
      const db = getAdminFirestore();
      const compSet = createCompSet(propertyId, criteria, members);

      await db
        .collection('properties')
        .doc(propertyId)
        .collection('comp-set')
        .doc('current')
        .set(compSet);
    });

    // Step 6: MarketIntel 종합 저장
    const marketIntel: MarketIntel = {
      propertyId,
      scorecard,
      priceBenchmark,
      amenityAnalysis,
      compSetSize: members.length,
      status: 'ready',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await step.run('save-market-intel', async () => {
      const db = getAdminFirestore();
      await db
        .collection('properties')
        .doc(propertyId)
        .collection('market-intel')
        .doc('current')
        .set(marketIntel);

      // 속성 문서 상태 업데이트
      await db
        .collection('properties')
        .doc(propertyId)
        .update({
          compSetStatus: 'ready',
          'compSetProgress.completedAt': new Date().toISOString(),
          healthScore: scorecard.overallScore,
          healthGrade: scorecard.overallGrade,
          updatedAt: FieldValue.serverTimestamp(),
        });
    });

    // Step 7: 진단 파이프라인 트리거 (Phase 2)
    await step.sendEvent('trigger-diagnosis', {
      name: 'property/diagnosis.run',
      data: { propertyId },
    });

    return {
      propertyId,
      compSetSize: members.length,
      healthScore: scorecard.overallScore,
      healthGrade: scorecard.overallGrade,
      topAmenityGaps: amenityAnalysis.gaps.slice(0, 3).map((g) => g.name),
      pricePercentile: priceBenchmark.percentile,
    };
  }
);
