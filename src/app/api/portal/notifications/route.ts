import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { NotificationItem } from '@/types/monitoring';

// GET /api/portal/notifications — 인앱 알림
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth?.uid) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const db = getAdminFirestore();
    const snapshot = await db
      .collection('users')
      .doc(auth.uid)
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as NotificationItem[];

    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({
      success: true,
      data: { notifications, unreadCount },
    });
  } catch (error) {
    console.error('[notifications] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch notifications' } },
      { status: 500 }
    );
  }
}

// PATCH /api/portal/notifications — 읽음 처리
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth?.uid) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } },
        { status: 401 }
      );
    }

    const body = await request.json() as { notificationId?: string; markAllRead?: boolean };
    const db = getAdminFirestore();

    if (body.markAllRead) {
      const unread = await db.collection('users').doc(auth.uid)
        .collection('notifications')
        .where('read', '==', false)
        .get();
      const batch = db.batch();
      unread.docs.forEach(doc => batch.update(doc.ref, { read: true }));
      await batch.commit();
    } else if (body.notificationId) {
      await db.collection('users').doc(auth.uid)
        .collection('notifications').doc(body.notificationId)
        .update({ read: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[notifications] PATCH Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update' } },
      { status: 500 }
    );
  }
}
