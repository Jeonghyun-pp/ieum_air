import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { inngest } from '@/inngest/client';

/**
 * POST /api/properties/[id]/comp-set/build
 * 비교군 구성 파이프라인을 시작합니다.
 */
export async function POST(
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

  // 리스팅 URL에서 ID 추출
  const listingUrl = property?.listingUrl;
  if (!listingUrl) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'No listing URL configured' } },
      { status: 400 }
    );
  }

  const listingIdMatch = listingUrl.match(/rooms\/(\d+)/);
  if (!listingIdMatch) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid Airbnb listing URL' } },
      { status: 400 }
    );
  }

  const listingId = listingIdMatch[1];

  // 이미 진행 중인 경우 중복 실행 방지
  if (property?.compSetStatus === 'building' || property?.compSetStatus === 'scraping') {
    return NextResponse.json(
      { success: false, error: { code: 'CONFLICT', message: 'Comp-set build already in progress' } },
      { status: 409 }
    );
  }

  // Inngest 이벤트 트리거
  await inngest.send({
    name: 'property/comp-set.build',
    data: { propertyId, listingId },
  });

  // 상태 업데이트
  await db.collection('properties').doc(propertyId).update({
    compSetStatus: 'building',
    'compSetProgress.startedAt': new Date().toISOString(),
    'compSetProgress.scrapedMembers': 0,
    'compSetProgress.failedMembers': 0,
  });

  return NextResponse.json({
    success: true,
    data: {
      propertyId,
      listingId,
      status: 'building',
      message: 'Comp-set build started. Check status at /api/properties/{id}/comp-set/status',
    },
  });
}
