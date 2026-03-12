// ============================================
// Inngest Function: 경쟁 모니터링 (Phase 4)
// 일별 비교군 가격/점유율 스냅샷 + 알림 생성
// ============================================

import { inngest } from '../client';
import { captureSnapshot, detectAlerts } from '@/lib/analysis/competitor-monitor';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { CompSetMember } from '@/types/comp-set';
import type { CompetitorSnapshot } from '@/types/monitoring';

export const monitorCompetitors = inngest.createFunction(
  {
    id: 'monitor-competitors',
    retries: 1,
  },
  { event: 'property/monitor.daily' },
  async ({ event, step }) => {
    const { propertyId } = event.data as { propertyId: string };

    // Step 1: 데이터 로드
    const data = await step.run('load-data', async () => {
      const db = getAdminFirestore();
      const propDoc = await db.collection('properties').doc(propertyId).get();
      const propData = propDoc.data();
      if (!propData?.scrapedData?.pricePerNight) throw new Error('Property data not found');

      const membersSnap = await db.collection('properties').doc(propertyId)
        .collection('comp-set-members').get();
      const members = membersSnap.docs
        .map(d => d.data())
        .filter((d): d is CompSetMember => !!d.listingId);

      // 이전 스냅샷 (어제)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      const prevSnap = await db.collection('properties').doc(propertyId)
        .collection('snapshots').doc(yesterdayStr).get();
      const previousSnapshot = prevSnap.exists ? prevSnap.data() as CompetitorSnapshot : null;

      return {
        ownPrice: propData.scrapedData.pricePerNight as number,
        members,
        previousSnapshot,
        ownerId: propData.userId as string | undefined,
      };
    });

    // Step 2: 스냅샷 캡처 (iCal 기반)
    const snapshot = await step.run('capture-snapshot', async () => {
      return captureSnapshot(propertyId, data.ownPrice, data.members);
    });

    // Step 3: 알림 감지
    const alerts = await step.run('detect-alerts', () => {
      return detectAlerts(propertyId, snapshot, data.previousSnapshot);
    });

    // Step 4: 저장
    await step.run('save-results', async () => {
      const db = getAdminFirestore();
      const propRef = db.collection('properties').doc(propertyId);

      // 스냅샷 저장
      await propRef.collection('snapshots').doc(snapshot.date).set(snapshot);

      // 알림 저장
      if (alerts.length > 0) {
        const batch = db.batch();
        for (const alert of alerts) {
          batch.set(propRef.collection('alerts').doc(alert.id), alert);
        }

        // 사용자 인앱 알림 생성
        if (data.ownerId) {
          for (const alert of alerts) {
            const notifRef = db.collection('users').doc(data.ownerId)
              .collection('notifications').doc();
            batch.set(notifRef, {
              userId: data.ownerId,
              propertyId,
              type: 'competitor_alert',
              title: alert.title,
              body: alert.description,
              href: '/portal',
              read: false,
              createdAt: new Date().toISOString(),
            });
          }
        }

        await batch.commit();
      }
    });

    return {
      propertyId,
      date: snapshot.date,
      compSetMedian: snapshot.compSetMedian,
      avgOccupancy: Math.round(snapshot.avgOccupancy * 100),
      alertsGenerated: alerts.length,
    };
  }
);
