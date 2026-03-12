import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';

/**
 * GET /api/properties/[id]/comp-set
 * 비교군 데이터를 조회합니다.
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

  // 숙소 소유 확인
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

  // comp-set 문서 조회
  const compSetDoc = await db
    .collection('properties')
    .doc(propertyId)
    .collection('comp-set')
    .doc('current')
    .get();

  if (!compSetDoc.exists) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Comp-set not built yet' } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: compSetDoc.data(),
  });
}
