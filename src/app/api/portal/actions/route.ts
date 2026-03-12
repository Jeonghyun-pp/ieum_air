import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveProperty } from '@/lib/portal/helpers';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { ActionItem } from '@/types/strategy';

// GET /api/portal/actions — 액션 아이템 조회
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending' | 'completed' etc.

    let query = db
      .collection('properties')
      .doc(property.id)
      .collection('actions')
      .orderBy('createdAt', 'desc')
      .limit(50);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const actions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ActionItem[];

    return NextResponse.json({ success: true, data: actions });
  } catch (error) {
    console.error('[actions] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch actions' } },
      { status: 500 }
    );
  }
}

// PATCH /api/portal/actions — 액션 상태 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const { uid, property } = await resolveActiveProperty(request);
    if (!uid) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (!property) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } },
        { status: 404 }
      );
    }

    const body = await request.json() as {
      actionId: string;
      status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    };

    if (!body.actionId || !body.status) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'actionId and status required' } },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const actionRef = db
      .collection('properties')
      .doc(property.id)
      .collection('actions')
      .doc(body.actionId);

    const updateData: Record<string, unknown> = {
      status: body.status,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (body.status === 'completed') {
      updateData.completedAt = FieldValue.serverTimestamp();
    }

    await actionRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[actions] PATCH Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update action' } },
      { status: 500 }
    );
  }
}
