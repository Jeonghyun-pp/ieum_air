import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveProperty } from '@/lib/portal/helpers';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { CompetitorAlert } from '@/types/monitoring';

// GET /api/portal/alerts — 경쟁 변동 알림
export async function GET(request: NextRequest) {
  try {
    const { uid, property } = await resolveActiveProperty(request);
    if (!uid) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (!property) {
      return NextResponse.json({ success: true, data: [] });
    }

    const db = getAdminFirestore();
    const snapshot = await db
      .collection('properties')
      .doc(property.id)
      .collection('alerts')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CompetitorAlert[];

    return NextResponse.json({ success: true, data: alerts });
  } catch (error) {
    console.error('[alerts] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch alerts' } },
      { status: 500 }
    );
  }
}

// PATCH /api/portal/alerts — 알림 읽음 처리
export async function PATCH(request: NextRequest) {
  try {
    const { uid, property } = await resolveActiveProperty(request);
    if (!uid || !property) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } },
        { status: 401 }
      );
    }

    const { alertId } = await request.json() as { alertId: string };
    if (!alertId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'alertId required' } },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    await db.collection('properties').doc(property.id)
      .collection('alerts').doc(alertId).update({ read: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[alerts] PATCH Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update alert' } },
      { status: 500 }
    );
  }
}
