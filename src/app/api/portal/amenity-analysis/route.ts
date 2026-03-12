import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveProperty } from '@/lib/portal/helpers';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { MarketIntel } from '@/types/market-intel';

// GET /api/portal/amenity-analysis — 편의시설 분석 데이터
export async function GET(request: NextRequest) {
  const { uid, property } = await resolveActiveProperty(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  if (!property) {
    return NextResponse.json({ success: true, data: null });
  }

  try {
    const db = getAdminFirestore();
    const intelDoc = await db
      .collection('properties')
      .doc(property.id)
      .collection('market-intel')
      .doc('current')
      .get();

    if (!intelDoc.exists) {
      return NextResponse.json({ success: true, data: null });
    }

    const intel = intelDoc.data() as MarketIntel;
    return NextResponse.json({ success: true, data: intel.amenityAnalysis });
  } catch (error) {
    console.error('[amenity-analysis] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch amenity analysis' } },
      { status: 500 }
    );
  }
}
