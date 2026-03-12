import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveProperty } from '@/lib/portal/helpers';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { DiagnosisResult } from '@/types/diagnosis';

// GET /api/portal/diagnosis — 종합 진단 데이터
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
    const category = searchParams.get('category');

    // 특정 카테고리만 요청
    if (category && ['reviews', 'photos', 'content', 'scorecard'].includes(category)) {
      const doc = await db
        .collection('properties')
        .doc(property.id)
        .collection('diagnosis')
        .doc(category)
        .get();

      return NextResponse.json({
        success: true,
        data: doc.exists ? doc.data() : null,
      });
    }

    // 종합 진단 결과
    const currentDoc = await db
      .collection('properties')
      .doc(property.id)
      .collection('diagnosis')
      .doc('current')
      .get();

    if (!currentDoc.exists) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: currentDoc.data() as DiagnosisResult,
    });
  } catch (error) {
    console.error('[diagnosis] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch diagnosis' } },
      { status: 500 }
    );
  }
}
