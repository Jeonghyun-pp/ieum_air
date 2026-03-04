import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveProperty } from '@/lib/portal/helpers';
import { getPropertySubcollection } from '@/lib/firebase/firestore';
import type { ContentDocument } from '@/lib/portal/types';

const defaultContent: Omit<ContentDocument, 'createdAt' | 'updatedAt'>[] = [
  { id: 'c1', title: '제주 오션뷰 벚꽃 릴스', type: 'instagram', status: 'completed', date: '3/1', thumbnail: '🌸', month: '2026-03' },
  { id: 'c2', title: '봄 시즌 숙소 투어', type: 'tiktok', status: 'completed', date: '3/3', thumbnail: '🏠', month: '2026-03' },
  { id: 'c3', title: '제주 벚꽃 명소 가이드', type: 'blog', status: 'in_progress', date: '3/5', thumbnail: '✍️', month: '2026-03' },
  { id: 'c4', title: '객실 인테리어 하이라이트', type: 'instagram', status: 'review', date: '3/8', thumbnail: '🛏️', month: '2026-03' },
  { id: 'c5', title: '주변 맛집 추천 숏폼', type: 'tiktok', status: 'in_progress', date: '3/10', thumbnail: '🍜', month: '2026-03' },
  { id: 'c6', title: '게스트 후기 카드뉴스', type: 'instagram', status: 'review', date: '3/12', thumbnail: '⭐', month: '2026-03' },
];

// GET /api/portal/content — 콘텐츠 목록
export async function GET(request: NextRequest) {
  const { uid, property } = await resolveActiveProperty(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  if (!property) {
    return NextResponse.json({ success: true, data: { content: defaultContent } });
  }

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || getCurrentMonth();

    const content = await getPropertySubcollection<ContentDocument>(
      property.id, 'content', { orderBy: 'createdAt', direction: 'desc', limit: 50 }
    );
    const monthContent = content.filter(c => c.month === month);

    return NextResponse.json({
      success: true,
      data: {
        content: monthContent.length > 0 ? monthContent : defaultContent,
        propertyId: property.id,
        month,
      },
    });
  } catch (error) {
    console.error('Content API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load content' } },
      { status: 500 }
    );
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
