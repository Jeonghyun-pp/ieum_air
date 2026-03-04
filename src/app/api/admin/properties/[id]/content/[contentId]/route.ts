import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import {
  updatePropertySubdoc,
  deletePropertySubdoc,
} from '@/lib/firebase/firestore';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const { id, contentId } = await params;
    const body = await request.json();

    const allowedFields = ['title', 'type', 'status', 'date', 'thumbnail', 'fileUrl', 'month'];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NO_FIELDS', message: 'No valid fields provided for update' },
        },
        { status: 400 }
      );
    }

    if (updateData.type) {
      const validTypes = ['instagram', 'tiktok', 'blog'];
      if (!validTypes.includes(updateData.type)) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'INVALID_TYPE', message: `type must be one of: ${validTypes.join(', ')}` },
          },
          { status: 400 }
        );
      }
    }

    if (updateData.status) {
      const validStatuses = ['backlog', 'completed', 'in_progress', 'review'];
      if (!validStatuses.includes(updateData.status)) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'INVALID_STATUS', message: `status must be one of: ${validStatuses.join(', ')}` },
          },
          { status: 400 }
        );
      }
    }

    await updatePropertySubdoc(id, 'content', contentId, updateData);

    return NextResponse.json({
      success: true,
      data: { id: contentId, ...updateData },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const { id, contentId } = await params;

    await deletePropertySubdoc(id, 'content', contentId);

    return NextResponse.json({
      success: true,
      data: { id: contentId, deleted: true },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'DELETE_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}
