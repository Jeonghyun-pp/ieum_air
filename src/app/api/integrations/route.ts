import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveProperty } from '@/lib/portal/helpers';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// GET /api/integrations — 연동 목록 조회
export async function GET(request: NextRequest) {
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

  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection('properties').doc(property.id)
      .collection('integrations').get();

    const integrations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        platform: data.platform,
        status: data.status,
        accountId: data.accountId,
        accountName: data.accountName,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    });

    return NextResponse.json({ success: true, data: integrations });
  } catch (error) {
    console.error('Get integrations error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get integrations' } },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations — 연동 해제
export async function DELETE(request: NextRequest) {
  const { uid, property } = await resolveActiveProperty(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  if (!property) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'No property found' } },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { platform } = body;

    if (!platform || !['instagram', 'ga4'].includes(platform)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid platform' } },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const docRef = db.collection('properties').doc(property.id)
      .collection('integrations').doc(platform);

    const doc = await docRef.get();
    if (doc.exists) {
      await docRef.update({
        status: 'revoked',
        accessToken: '',
        refreshToken: '',
        updatedAt: Timestamp.now(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete integration error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete integration' } },
      { status: 500 }
    );
  }
}
