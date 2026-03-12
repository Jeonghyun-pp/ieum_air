import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { inngest } from '@/inngest/client';
import type { DiagnosisResult } from '@/types/diagnosis';

// GET /api/properties/[id]/diagnosis — 진단 데이터 조회
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

  const currentDoc = await db
    .collection('properties')
    .doc(propertyId)
    .collection('diagnosis')
    .doc('current')
    .get();

  return NextResponse.json({
    success: true,
    data: currentDoc.exists ? (currentDoc.data() as DiagnosisResult) : null,
  });
}

// POST /api/properties/[id]/diagnosis — 진단 수동 실행
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

  // Inngest 이벤트 트리거
  await inngest.send({
    name: 'property/diagnosis.run',
    data: { propertyId },
  });

  return NextResponse.json({
    success: true,
    data: { propertyId, status: 'running', message: 'Diagnosis started' },
  });
}
