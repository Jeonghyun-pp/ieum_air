import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { updatePropertySubdoc, deletePropertySubdoc } from '@/lib/firebase/firestore';

// PATCH /api/admin/properties/[id]/pricing-events/[eventId] — Update pricing event fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const authCheck = await requireRole(['admin'])(request);
    if (authCheck) return authCheck;

    const { id, eventId } = await params;
    const body = await request.json();
    const allowed = ['month', 'date', 'event', 'adjustment', 'type', 'applied'];
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

    await updatePropertySubdoc(id, 'pricing-events', eventId, updateData);

    return NextResponse.json({ success: true, data: { id: eventId, ...body } });
  } catch (error: any) {
    console.error('PATCH /api/admin/properties/[id]/pricing-events/[eventId] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'PRICING_EVENT_UPDATE_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/properties/[id]/pricing-events/[eventId] — Delete a pricing event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const authCheck = await requireRole(['admin'])(request);
    if (authCheck) return authCheck;

    const { id, eventId } = await params;

    await deletePropertySubdoc(id, 'pricing-events', eventId);

    return NextResponse.json({ success: true, data: { id: eventId, deleted: true } });
  } catch (error: any) {
    console.error('DELETE /api/admin/properties/[id]/pricing-events/[eventId] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'PRICING_EVENT_DELETE_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}
