import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveProperty } from '@/lib/portal/helpers';
import { getPropertySubcollection } from '@/lib/firebase/firestore';
import { mockPortalData } from '@/lib/portal/mock';
import type { PlanDocument, AssetDocument } from '@/lib/portal/types';

// GET /api/portal/dashboard — 대시보드 종합 데이터
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

    // 현재 월의 plan 가져오기
    const plans = await getPropertySubcollection<PlanDocument>(
      property.id, 'plans', { orderBy: 'createdAt', direction: 'desc', limit: 10 }
    );
    const currentPlan = plans.find(p => p.month === month);

    // todos 가져오기
    const assets = await getPropertySubcollection<AssetDocument>(
      property.id, 'assets', { orderBy: 'createdAt', direction: 'desc', limit: 50 }
    );
    const todos = assets
      .filter(a => a.type === 'todo')
      .map(a => ({
        id: a.id,
        title: a.title || '',
        due: a.due || '',
        required: a.required || false,
        status: a.todoStatus || 'pending' as const,
      }));

    // 실제 데이터가 있으면 사용, 없으면 mock에서 가져오기
    const data = {
      currentProperty: {
        id: property.id,
        name: property.name,
        location: property.region,
      },
      currentMonth: month,
      status: currentPlan?.status || mockPortalData.status,
      strategySummary: currentPlan?.strategySummary || mockPortalData.strategySummary,
      reasons: currentPlan?.reasons || mockPortalData.reasons,
      todos: todos.length > 0 ? todos : mockPortalData.todos,
      plan: currentPlan ? {
        targetCountries: currentPlan.targetCountries,
        platforms: currentPlan.platforms,
        messageFocus: currentPlan.messageFocus,
      } : mockPortalData.plan,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load dashboard' } },
      { status: 500 }
    );
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
