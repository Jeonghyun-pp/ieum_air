import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { updatePropertySubdoc, deletePropertySubdoc } from '@/lib/firebase/firestore';

// PATCH /api/admin/properties/[id]/results/[resultId] — Update result fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resultId: string }> }
) {
  try {
    const authCheck = await requireRole(['admin'])(request);
    if (authCheck) return authCheck;

    const { id, resultId } = await params;
    const body = await request.json();
    const allowed = ['month', 'highlights', 'metrics', 'reportUrl', 'publishedToPortal', 'nationalityComparison', 'channelComparison', 'pricingEventEffects'];
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

    await updatePropertySubdoc(id, 'results', resultId, updateData);

    return NextResponse.json({ success: true, data: { id: resultId, ...body } });
  } catch (error: any) {
    console.error('PATCH /api/admin/properties/[id]/results/[resultId] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'RESULT_UPDATE_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/properties/[id]/results/[resultId] — Delete a result
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resultId: string }> }
) {
  try {
    const authCheck = await requireRole(['admin'])(request);
    if (authCheck) return authCheck;

    const { id, resultId } = await params;

    await deletePropertySubdoc(id, 'results', resultId);

    return NextResponse.json({ success: true, data: { id: resultId, deleted: true } });
  } catch (error: any) {
    console.error('DELETE /api/admin/properties/[id]/results/[resultId] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'RESULT_DELETE_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}
