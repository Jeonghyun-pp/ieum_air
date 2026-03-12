// ============================================
// Inngest Function: 월간 전략 생성 (Phase 3)
// 진단 완료 후 자동 트리거 또는 수동 실행
// ============================================

import { inngest } from '../client';
import { generateStrategy } from '@/lib/ai/strategy-generator';
import { generateContentSuggestions } from '@/lib/ai/content-optimizer';
import { generatePricingRecommendation } from '@/lib/analysis/pricing-engine';
import { aggregateActions } from '@/lib/analysis/action-aggregator';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { ScrapedListing, CalendarDay } from '@/types/scraping';
import type { CompSetMember } from '@/types/comp-set';
import type { MarketIntel } from '@/types/market-intel';
import type { DiagnosisResult } from '@/types/diagnosis';
import type { CalendarEventDocument } from '@/lib/portal/types';

export const generateStrategyFn = inngest.createFunction(
  {
    id: 'generate-strategy',
    retries: 1,
  },
  { event: 'property/strategy.generate' },
  async ({ event, step }) => {
    const { propertyId, month } = event.data as { propertyId: string; month: string };

    // Step 1: 데이터 로드
    const data = await step.run('load-data', async () => {
      const db = getAdminFirestore();
      const propDoc = await db.collection('properties').doc(propertyId).get();
      const propData = propDoc.data();
      if (!propData?.scrapedData?.listingId) throw new Error('Property data not found');

      const ownListing = propData.scrapedData as ScrapedListing;

      // 진단 결과
      const diagDoc = await db.collection('properties').doc(propertyId)
        .collection('diagnosis').doc('current').get();
      const diagnosis = diagDoc.exists ? diagDoc.data() as DiagnosisResult : null;
      if (!diagnosis) throw new Error('Diagnosis not found. Run diagnosis first.');

      // 시장 인텔리전스
      const intelDoc = await db.collection('properties').doc(propertyId)
        .collection('market-intel').doc('current').get();
      const marketIntel = intelDoc.exists ? intelDoc.data() as MarketIntel : null;

      // 비교군 멤버
      const membersSnap = await db.collection('properties').doc(propertyId)
        .collection('comp-set-members').get();
      const members = membersSnap.docs
        .map(d => d.data())
        .filter((d): d is CompSetMember => !!d.listingId);

      // 이벤트
      const eventsSnap = await db.collection('calendar-events')
        .where('date', '>=', `${month}-01`)
        .where('date', '<=', `${month}-31`)
        .get();
      const events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as CalendarEventDocument[];

      return { ownListing, diagnosis, marketIntel, members, events };
    });

    // Step 2: AI 월간 전략 생성
    const strategy = await step.run('generate-strategy', async () => {
      return generateStrategy(propertyId, month, data.diagnosis, data.marketIntel);
    });

    // Step 3: 가격 추천 생성
    const pricing = await step.run('generate-pricing', () => {
      const priceBenchmark = data.marketIntel?.priceBenchmark;
      if (!priceBenchmark) return null;

      return generatePricingRecommendation(
        propertyId,
        month,
        data.ownListing.pricePerNight,
        data.ownListing.currency,
        priceBenchmark,
        data.ownListing.calendar,
        data.members,
        data.events
      );
    });

    // Step 4: AI 콘텐츠 제안 생성
    const contentSuggestions = await step.run('generate-content-suggestions', async () => {
      return generateContentSuggestions(
        propertyId,
        data.ownListing,
        data.diagnosis.contentDiagnosis
      );
    });

    // Step 5: 액션 아이템 통합
    const actions = await step.run('aggregate-actions', () => {
      return aggregateActions(propertyId, data.diagnosis, strategy, pricing, contentSuggestions);
    });

    // Step 6: Firestore 저장
    await step.run('save-results', async () => {
      const db = getAdminFirestore();
      const propRef = db.collection('properties').doc(propertyId);

      await Promise.all([
        // 전략 저장
        propRef.collection('strategies').doc(month).set(strategy),
        // 가격 추천 저장
        pricing
          ? propRef.collection('pricing-recommendations').doc(month).set(pricing)
          : Promise.resolve(),
        // 콘텐츠 제안 저장
        propRef.collection('content-suggestions').doc(month).set(contentSuggestions),
        // 액션 아이템 배치 저장
        saveActions(db, propertyId, actions),
      ]);

      // Plan 문서 업데이트 (대시보드용)
      await propRef.collection('plans').doc(month).set({
        month,
        status: 'AWAITING_APPROVAL',
        strategySummary: strategy.summary,
        reasons: strategy.keyInsights,
        targetCountries: [],
        platforms: [],
        messageFocus: strategy.priorities.map(p => p.title),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      // 속성 문서 업데이트
      await propRef.update({
        strategyStatus: 'ready',
        lastStrategyMonth: month,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return {
      propertyId,
      month,
      strategyPriorities: strategy.priorities.length,
      pricingAdjustedDays: pricing?.summary.adjustedDays ?? 0,
      contentSuggestions: contentSuggestions.titleSuggestions.length,
      actionItems: actions.length,
    };
  }
);

async function saveActions(
  db: FirebaseFirestore.Firestore,
  propertyId: string,
  actions: ReturnType<typeof aggregateActions>
) {
  const batch = db.batch();
  const actionsRef = db.collection('properties').doc(propertyId).collection('actions');

  // 기존 pending 액션 삭제
  const existingSnap = await actionsRef.where('status', '==', 'pending').get();
  existingSnap.docs.forEach(doc => batch.delete(doc.ref));

  // 새 액션 추가
  for (const action of actions) {
    batch.set(actionsRef.doc(action.id), action);
  }

  await batch.commit();
}
