import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';

/**
 * GET /api/properties/[id]/comp-set/status
 * 비교군 구성 진행 상태를 조회합니다.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const { id: propertyId } = await params;
  const db = getAdminFirestore();

  const propertyDoc = await db.collection('properties').doc(propertyId).get();
  if (!propertyDoc.exists) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } },
      { status: 404 }
    );
  }

  const property = propertyDoc.data();
  if (property?.ownerId !== auth.uid && auth.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Not authorized' } },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      status: property?.compSetStatus ?? 'not_started',
      progress: property?.compSetProgress ?? null,
      healthScore: property?.healthScore ?? null,
      healthGrade: property?.healthGrade ?? null,
    },
  });
}
