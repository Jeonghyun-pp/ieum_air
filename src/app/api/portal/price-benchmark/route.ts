import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveProperty } from '@/lib/portal/helpers';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { MarketIntel } from '@/types/market-intel';

// GET /api/portal/price-benchmark — 가격 벤치마킹 데이터
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
    return NextResponse.json({ success: true, data: intel.priceBenchmark });
  } catch (error) {
    console.error('[price-benchmark] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch price benchmark' } },
      { status: 500 }
    );
  }
}
