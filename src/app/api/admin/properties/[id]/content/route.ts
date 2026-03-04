import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import {
  getPropertySubcollection,
  addToPropertySubcollection,
} from '@/lib/firebase/firestore';

interface ContentDocument {
  id?: string;
  title: string;
  type: 'instagram' | 'tiktok' | 'blog';
  status: 'backlog' | 'completed' | 'in_progress' | 'review';
  date: string;
  thumbnail?: string;
  fileUrl?: string;
  month: string;
  createdAt?: any;
  updatedAt?: any;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const status = searchParams.get('status');

    let items = await getPropertySubcollection<ContentDocument>(id, 'content', {
      orderBy: 'createdAt',
    });

    if (month) {
      items = items.filter((item) => item.month === month);
    }

    if (status) {
      items = items.filter((item) => item.status === status);
    }

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_FAILED', message: error.message } },
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

    const { title, type, status, month, thumbnail, fileUrl, date } = body;

    if (!title || !type || !status || !month) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'title, type, status, and month are required' },
        },
        { status: 400 }
      );
    }

    const validTypes = ['instagram', 'tiktok', 'blog'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_TYPE', message: `type must be one of: ${validTypes.join(', ')}` },
        },
        { status: 400 }
      );
    }

    const validStatuses = ['backlog', 'completed', 'in_progress', 'review'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_STATUS', message: `status must be one of: ${validStatuses.join(', ')}` },
        },
        { status: 400 }
      );
    }

    const contentData: Omit<ContentDocument, 'id'> = {
      title,
      type,
      status,
      month,
      date: date || new Date().toISOString().split('T')[0],
      ...(thumbnail && { thumbnail }),
      ...(fileUrl && { fileUrl }),
    };

    const docId = await addToPropertySubcollection(id, 'content', contentData);

    return NextResponse.json(
      { success: true, data: { id: docId, ...contentData } },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'CREATE_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}
