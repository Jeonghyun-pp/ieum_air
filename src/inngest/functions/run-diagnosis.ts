// ============================================
// Inngest Function: 리스팅 진단 (Phase 2)
// 리뷰 분석 + 사진 진단 + 콘텐츠 진단 + 확장 스코어카드
// ============================================

import { inngest } from '../client';
import { scrapeReviews } from '@/lib/scraping/airbnb-reviews-scraper';
import { analyzeReviews } from '@/lib/analysis/review-analyzer';
import { analyzePhotos } from '@/lib/analysis/photo-analyzer';
import { analyzeContent } from '@/lib/analysis/content-analyzer';
import { generateEnhancedScorecard } from '@/lib/analysis/scorecard-generator';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { ScrapedListing } from '@/types/scraping';
import type { CompSetMember } from '@/types/comp-set';
import type { Scorecard } from '@/types/market-intel';
import type { DiagnosisResult } from '@/types/diagnosis';

export const runDiagnosis = inngest.createFunction(
  {
    id: 'run-diagnosis',
    retries: 1,
  },
  { event: 'property/diagnosis.run' },
  async ({ event, step }) => {
    const { propertyId } = event.data as { propertyId: string };

    // Step 1: 데이터 로드
    const { ownListing, members, baseScorecard } = await step.run('load-data', async () => {
      const db = getAdminFirestore();

      const propertyDoc = await db.collection('properties').doc(propertyId).get();
      const propertyData = propertyDoc.data();
      if (!propertyData?.scrapedData?.listingId) throw new Error('Own listing data not found');
      const ownListing = propertyData.scrapedData as ScrapedListing;

      const membersSnapshot = await db
        .collection('properties')
        .doc(propertyId)
        .collection('comp-set-members')
        .get();
      const members = membersSnapshot.docs
        .map((doc) => doc.data())
        .filter((d): d is CompSetMember => !!d.listingId);

      const intelDoc = await db
        .collection('properties')
        .doc(propertyId)
        .collection('market-intel')
        .doc('current')
        .get();
      const intelData = intelDoc.data();
      const baseScorecard = intelData?.scorecard as Scorecard | undefined;

      return { ownListing, members, baseScorecard };
    });

    // Step 2: 리뷰 스크래핑 + 분석
    const reviewDiagnosis = await step.run('analyze-reviews', async () => {
      const listingId = ownListing.listingId;
      const reviewResult = await scrapeReviews(listingId);
      const reviews = reviewResult.success ? reviewResult.data ?? [] : [];
      return analyzeReviews(reviews);
    });

    // Step 3: 사진 진단
    const photoDiagnosis = await step.run('analyze-photos', async () => {
      return analyzePhotos(ownListing.photos, members);
    });

    // Step 4: 콘텐츠 진단
    const contentDiagnosis = await step.run('analyze-content', () => {
      return analyzeContent(ownListing, members);
    });

    // Step 5: 확장 스코어카드 생성
    const enhancedScorecard = await step.run('generate-enhanced-scorecard', () => {
      const fallbackScorecard: Scorecard = baseScorecard ?? {
        overallScore: 50,
        overallGrade: 'C',
        categories: [
          { category: 'price', label: '가격 경쟁력', ownValue: 0, compSetMedian: 0, compSetP75: 0, percentile: 50, grade: 'C', weight: 0.20 },
          { category: 'amenities', label: '편의시설', ownValue: 0, compSetMedian: 0, compSetP75: 0, percentile: 50, grade: 'C', weight: 0.15 },
          { category: 'photos', label: '사진', ownValue: 0, compSetMedian: 0, compSetP75: 0, percentile: 50, grade: 'C', weight: 0.10 },
          { category: 'response', label: '응답률', ownValue: 0, compSetMedian: 0, compSetP75: 0, percentile: 50, grade: 'C', weight: 0.10 },
        ],
        rank: 1,
        totalInCompSet: members.length,
        analyzedAt: new Date().toISOString(),
      };

      return generateEnhancedScorecard(
        fallbackScorecard,
        reviewDiagnosis,
        photoDiagnosis,
        contentDiagnosis
      );
    });

    // Step 6: Firestore에 저장
    await step.run('save-diagnosis', async () => {
      const db = getAdminFirestore();
      const diagnosisRef = db
        .collection('properties')
        .doc(propertyId)
        .collection('diagnosis');

      // 각 카테고리별 저장
      await Promise.all([
        diagnosisRef.doc('reviews').set(reviewDiagnosis),
        diagnosisRef.doc('photos').set(photoDiagnosis),
        diagnosisRef.doc('content').set(contentDiagnosis),
        diagnosisRef.doc('scorecard').set(enhancedScorecard),
      ]);

      // 종합 진단 결과 저장
      const result: DiagnosisResult = {
        propertyId,
        reviewDiagnosis,
        photoDiagnosis,
        contentDiagnosis,
        enhancedScorecard,
        status: 'ready',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await diagnosisRef.doc('current').set(result);

      // 속성 문서 업데이트 (진단 완료 시 status를 active로 전환)
      await db.collection('properties').doc(propertyId).update({
        healthScore: enhancedScorecard.overallScore,
        healthGrade: enhancedScorecard.overallGrade,
        diagnosisStatus: 'ready',
        status: 'active',
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    // Step 7: 전략 생성 파이프라인 트리거
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await step.sendEvent('trigger-strategy', {
      name: 'property/strategy.generate',
      data: { propertyId, month: currentMonth },
    });

    return {
      propertyId,
      healthScore: enhancedScorecard.overallScore,
      healthGrade: enhancedScorecard.overallGrade,
      reviewSentiment: reviewDiagnosis.sentiment,
      photoScore: photoDiagnosis.overallScore,
      contentScore: contentDiagnosis.overallScore,
    };
  }
);
