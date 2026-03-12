import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveProperty } from '@/lib/portal/helpers';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { ContentSuggestions } from '@/types/strategy';

// GET /api/portal/content-suggestions — AI 콘텐츠 개선 제안
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
      .collection('content-suggestions')
      .doc(month)
      .get();

    return NextResponse.json({
      success: true,
      data: doc.exists ? doc.data() as ContentSuggestions : null,
    });
  } catch (error) {
    console.error('[content-suggestions] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch suggestions' } },
      { status: 500 }
    );
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
