import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveProperty } from '@/lib/portal/helpers';
import { getPropertySubcollection, addToPropertySubcollection, updatePropertySubdoc } from '@/lib/firebase/firestore';
import { mockPortalData } from '@/lib/portal/mock';
import type { PlanDocument } from '@/lib/portal/types';

// GET /api/portal/plan — 현재 월 전략 조회
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
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || getCurrentMonth();

    const plans = await getPropertySubcollection<PlanDocument>(
      property.id, 'plans', { orderBy: 'createdAt', direction: 'desc', limit: 10 }
    );
    const currentPlan = plans.find(p => p.month === month);

    if (currentPlan) {
      return NextResponse.json({
        success: true,
        data: {
          id: currentPlan.id,
          month: currentPlan.month,
          status: currentPlan.status,
          strategySummary: currentPlan.strategySummary,
          reasons: currentPlan.reasons,
          plan: {
            targetCountries: currentPlan.targetCountries,
            platforms: currentPlan.platforms,
            messageFocus: currentPlan.messageFocus,
          },
        },
      });
    }

    // 실제 데이터가 없으면 mock 반환
    return NextResponse.json({
      success: true,
      data: {
        id: null,
        month,
        status: mockPortalData.status,
        strategySummary: mockPortalData.strategySummary,
        reasons: mockPortalData.reasons,
        plan: mockPortalData.plan,
      },
    });
  } catch (error) {
    console.error('Plan API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load plan' } },
      { status: 500 }
    );
  }
}

// PATCH /api/portal/plan — 전략 상태 변경 (승인/수정 요청 등)
export async function PATCH(request: NextRequest) {
  const { uid, property } = await resolveActiveProperty(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  if (!property) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'No property found' } },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { planId, status } = body;

    if (planId) {
      await updatePropertySubdoc(property.id, 'plans', planId, { status });
    } else {
      // planId가 없으면 새로 생성
      const month = body.month || getCurrentMonth();
      await addToPropertySubcollection(property.id, 'plans', {
        month,
        status: status || 'DRAFT',
        strategySummary: body.strategySummary || '',
        reasons: body.reasons || [],
        targetCountries: body.targetCountries || [],
        platforms: body.platforms || [],
        messageFocus: body.messageFocus || [],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Plan update error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update plan' } },
      { status: 500 }
    );
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
