import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveProperty } from '@/lib/portal/helpers';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { PricingRecommendation } from '@/types/strategy';

// GET /api/portal/pricing-calendar — 가격 추천 캘린더
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
      return NextResponse.json({ success: true, data: null });
    }

    const db = getAdminFirestore();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || getCurrentMonth();

    const doc = await db
      .collection('properties')
      .doc(property.id)
      .collection('pricing-recommendations')
      .doc(month)
      .get();

    return NextResponse.json({
      success: true,
      data: doc.exists ? doc.data() as PricingRecommendation : null,
    });
  } catch (error) {
    console.error('[pricing-calendar] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch pricing' } },
      { status: 500 }
    );
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
