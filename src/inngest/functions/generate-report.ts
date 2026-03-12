// ============================================
// Inngest Function: 월간 성과 리포트 (Phase 4)
// 성과 스냅샷 생성 + 비교 + 리포트 저장
// ============================================

import { inngest } from '../client';
import { createPerformanceSnapshot, compareSnapshots } from '@/lib/analysis/performance-tracker';
import { calculateOccupancyRate } from '@/lib/scraping/airbnb-calendar';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { EnhancedScorecard } from '@/types/diagnosis';
import type { ActionItem } from '@/types/strategy';
import type { CalendarDay } from '@/types/scraping';
import type { PerformanceSnapshot } from '@/types/monitoring';
import type { ResultDocument } from '@/lib/portal/types';

export const generateReport = inngest.createFunction(
  {
    id: 'generate-report',
    retries: 1,
  },
  { event: 'property/report.monthly' },
  async ({ event, step }) => {
    const { propertyId, month } = event.data as { propertyId: string; month: string };

    // Step 1: 데이터 로드
    const data = await step.run('load-data', async () => {
      const db = getAdminFirestore();
      const propDoc = await db.collection('properties').doc(propertyId).get();
      const propData = propDoc.data();
      if (!propData) throw new Error('Property not found');

      // 스코어카드
      const scorecardDoc = await db.collection('properties').doc(propertyId)
        .collection('diagnosis').doc('scorecard').get();
      const scorecard = scorecardDoc.exists ? scorecardDoc.data() as EnhancedScorecard : null;

      // 액션 아이템
      const actionsSnap = await db.collection('properties').doc(propertyId)
        .collection('actions').get();
      const actions = actionsSnap.docs.map(d => d.data() as ActionItem);

      // 캘린더 (점유율 계산용)
      const calendar = (propData.scrapedData?.calendar ?? []) as CalendarDay[];
      const avgPrice = propData.scrapedData?.pricePerNight ?? 0;

      // 이전 월 스냅샷
      const prevMonth = getPreviousMonth(month);
      const prevSnap = await db.collection('properties').doc(propertyId)
        .collection('performance').doc(prevMonth).get();
      const previousSnapshot = prevSnap.exists ? prevSnap.data() as PerformanceSnapshot : null;

      return { scorecard, actions, calendar, avgPrice, previousSnapshot, ownerId: propData.userId as string | undefined };
    });

    // Step 2: 성과 스냅샷 생성
    const snapshot = await step.run('create-snapshot', () => {
      const { occupancyRate } = calculateOccupancyRate(data.calendar);
      return createPerformanceSnapshot(
        propertyId,
        month,
        data.scorecard,
        occupancyRate,
        data.avgPrice,
        data.actions
      );
    });

    // Step 3: 비교 분석
    const comparison = await step.run('compare-performance', () => {
      return compareSnapshots(snapshot, data.previousSnapshot);
    });

    // Step 4: 저장
    await step.run('save-report', async () => {
      const db = getAdminFirestore();
      const propRef = db.collection('properties').doc(propertyId);

      // 성과 스냅샷 저장
      await propRef.collection('performance').doc(month).set(snapshot);

      // 결과 문서 저장 (기존 ResultDocument 형식)
      const resultDoc: Partial<ResultDocument> = {
        month,
        highlights: comparison.highlights,
        metrics: [
          {
            label: '종합 점수',
            value: `${snapshot.healthScore}점`,
            delta: comparison.healthScoreDelta > 0
              ? `+${comparison.healthScoreDelta}점`
              : `${comparison.healthScoreDelta}점`,
          },
          {
            label: '순위',
            value: `${snapshot.rank}/${snapshot.totalInCompSet}`,
            delta: comparison.rankDelta > 0
              ? `${comparison.rankDelta}단계 상승`
              : comparison.rankDelta < 0
                ? `${Math.abs(comparison.rankDelta)}단계 하락`
                : '변동 없음',
          },
          {
            label: '점유율',
            value: `${snapshot.occupancyRate}%`,
            delta: comparison.occupancyDelta > 0
              ? `+${comparison.occupancyDelta}%p`
              : `${comparison.occupancyDelta}%p`,
          },
          {
            label: '액션 완료',
            value: `${snapshot.actionsCompleted}개`,
            delta: `${snapshot.actionsPending}개 남음`,
          },
        ],
        publishedToPortal: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await propRef.collection('results').doc(month).set(resultDoc, { merge: true });

      // Plan 상태를 REPORT_READY로 업데이트
      const planSnap = await propRef.collection('plans')
        .where('month', '==', month).limit(1).get();
      if (!planSnap.empty) {
        await planSnap.docs[0].ref.update({
          status: 'REPORT_READY',
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // 사용자 알림
      if (data.ownerId) {
        await db.collection('users').doc(data.ownerId)
          .collection('notifications').doc().set({
            userId: data.ownerId,
            propertyId,
            type: 'report_ready',
            title: `${month} 월간 성과 리포트`,
            body: comparison.highlights[0] || '성과 리포트가 준비되었습니다.',
            href: '/portal/results',
            read: false,
            createdAt: new Date().toISOString(),
          });
      }
    });

    return {
      propertyId,
      month,
      healthScore: snapshot.healthScore,
      highlights: comparison.highlights,
    };
  }
);

function getPreviousMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  const d = new Date(year, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
