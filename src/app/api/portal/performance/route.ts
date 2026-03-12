import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveProperty } from '@/lib/portal/helpers';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { PerformanceSnapshot } from '@/types/monitoring';

// GET /api/portal/performance — 성과 추이
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
      .collection('performance')
      .orderBy('month', 'desc')
      .limit(6)
      .get();

    const snapshots = snapshot.docs
      .map(doc => doc.data() as PerformanceSnapshot)
      .reverse(); // 오래된 것부터

    return NextResponse.json({ success: true, data: snapshots });
  } catch (error) {
    console.error('[performance] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch performance' } },
      { status: 500 }
    );
  }
}
