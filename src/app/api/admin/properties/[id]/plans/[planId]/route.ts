import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { updatePropertySubdoc, deletePropertySubdoc } from '@/lib/firebase/firestore';

// PATCH /api/admin/properties/[id]/plans/[planId] — Update plan fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; planId: string }> }
) {
  try {
    const authCheck = await requireRole(['admin'])(request);
    if (authCheck) return authCheck;

    const { id, planId } = await params;
    const body = await request.json();
    const allowed = ['month', 'status', 'strategySummary', 'reasons', 'targetCountries', 'platforms', 'messageFocus'];
    const updateData: Record<string, any> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'EMPTY_BODY', message: 'Request body must contain at least one valid field to update' },
        },
        { status: 400 }
      );
    }

    await updatePropertySubdoc(id, 'plans', planId, updateData);

    return NextResponse.json({ success: true, data: { id: planId, ...body } });
  } catch (error: any) {
    console.error('PATCH /api/admin/properties/[id]/plans/[planId] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'PLAN_UPDATE_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/properties/[id]/plans/[planId] — Delete a plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; planId: string }> }
) {
  try {
    const authCheck = await requireRole(['admin'])(request);
    if (authCheck) return authCheck;

    const { id, planId } = await params;

    await deletePropertySubdoc(id, 'plans', planId);

    return NextResponse.json({ success: true, data: { id: planId, deleted: true } });
  } catch (error: any) {
    console.error('DELETE /api/admin/properties/[id]/plans/[planId] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'PLAN_DELETE_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}
