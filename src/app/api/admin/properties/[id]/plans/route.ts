import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getPropertySubcollection, addToPropertySubcollection } from '@/lib/firebase/firestore';

interface PlanDocument {
  id?: string;
  month: string;
  status: PlanStatus;
  strategySummary: string;
  reasons: string[];
  targetCountries: string[];
  platforms: string[];
  messageFocus: string[];
  createdAt?: any;
  updatedAt?: any;
}

type PlanStatus = 'DRAFT' | 'AWAITING_APPROVAL' | 'APPROVED' | 'RUNNING' | 'REPORT_READY' | 'ARCHIVED';

// GET /api/admin/properties/[id]/plans — List plans, optional ?month= filter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(['admin'])(request);
    if (authCheck) return authCheck;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    let plans = await getPropertySubcollection<PlanDocument>(id, 'plans', {
      orderBy: 'month',
    });

    if (month) {
      plans = plans.filter((plan) => plan.month === month);
    }

    return NextResponse.json({ success: true, data: plans });
  } catch (error: any) {
    console.error('GET /api/admin/properties/[id]/plans error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'PLANS_FETCH_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}

// POST /api/admin/properties/[id]/plans — Create a new plan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireRole(['admin'])(request);
    if (authCheck) return authCheck;

    const { id } = await params;
    const body = await request.json();

    const { month, strategySummary, targetCountries, platforms, messageFocus } = body;

    if (!month || !strategySummary || !targetCountries || !platforms || !messageFocus) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'Required fields: month, strategySummary, targetCountries, platforms, messageFocus',
          },
        },
        { status: 400 }
      );
    }

    const planData: Omit<PlanDocument, 'id'> = {
      month,
      status: 'DRAFT',
      strategySummary,
      reasons: [],
      targetCountries,
      platforms,
      messageFocus,
    };

    const docId = await addToPropertySubcollection(id, 'plans', planData);

    return NextResponse.json(
      { success: true, data: { id: docId, ...planData } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/admin/properties/[id]/plans error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'PLAN_CREATE_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}
