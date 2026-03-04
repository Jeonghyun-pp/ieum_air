import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getPropertySubcollection, addToPropertySubcollection } from '@/lib/firebase/firestore';
import { MemoDocument } from '@/lib/portal/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const { id } = await params;
    const memos = await getPropertySubcollection<MemoDocument>(id, 'memos', {
      orderBy: 'createdAt',
      direction: 'desc',
    });

    return NextResponse.json({ success: true, data: memos });
  } catch (error: any) {
    console.error('Get memos error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'content is required' } },
        { status: 400 }
      );
    }

    const user = (request as AuthenticatedRequest).user!;
    const docId = await addToPropertySubcollection(id, 'memos', {
      propertyId: id,
      authorId: user.uid,
      authorName: user.email || 'Admin',
      content,
    });

    return NextResponse.json(
      { success: true, data: { id: docId, propertyId: id, content } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create memo error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
