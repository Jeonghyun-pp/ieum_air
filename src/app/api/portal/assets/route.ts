import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveProperty } from '@/lib/portal/helpers';
import { getPropertySubcollection, addToPropertySubcollection } from '@/lib/firebase/firestore';
import { mockPortalData } from '@/lib/portal/mock';
import type { AssetDocument } from '@/lib/portal/types';

// GET /api/portal/assets — 자료 (할 일, 파일, 문의)
export async function GET(request: NextRequest) {
  const { uid, property } = await resolveActiveProperty(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  if (!property) {
    return NextResponse.json({
      success: true,
      data: {
        todos: mockPortalData.todos,
        files: [],
        messages: [],
      },
    });
  }

  try {
    const assets = await getPropertySubcollection<AssetDocument>(
      property.id, 'assets', { orderBy: 'createdAt', direction: 'desc', limit: 100 }
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

    const files = assets
      .filter(a => a.type === 'file')
      .map(a => ({
        id: a.id,
        fileName: a.fileName || '',
        fileUrl: a.fileUrl || '',
        fileSize: a.fileSize || 0,
        createdAt: a.createdAt,
      }));

    const messages = assets
      .filter(a => a.type === 'message')
      .map(a => ({
        id: a.id,
        subject: a.subject || '',
        body: a.body || '',
        createdAt: a.createdAt,
      }));

    return NextResponse.json({
      success: true,
      data: {
        todos: todos.length > 0 ? todos : mockPortalData.todos,
        files,
        messages,
      },
    });
  } catch (error) {
    console.error('Assets API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load assets' } },
      { status: 500 }
    );
  }
}

// POST /api/portal/assets — 자료 추가 (파일 메타데이터, 문의)
export async function POST(request: NextRequest) {
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
    const { type } = body;

    if (!type || !['todo', 'file', 'message'].includes(type)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid asset type' } },
        { status: 400 }
      );
    }

    const assetData: Record<string, any> = { type };

    if (type === 'file') {
      assetData.fileName = body.fileName;
      assetData.fileUrl = body.fileUrl;
      assetData.fileSize = body.fileSize;
    } else if (type === 'message') {
      assetData.subject = body.subject;
      assetData.body = body.body;
    } else if (type === 'todo') {
      assetData.title = body.title;
      assetData.due = body.due;
      assetData.required = body.required || false;
      assetData.todoStatus = 'pending';
    }

    const assetId = await addToPropertySubcollection(property.id, 'assets', assetData);

    return NextResponse.json({ success: true, data: { id: assetId } }, { status: 201 });
  } catch (error) {
    console.error('Asset create error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create asset' } },
      { status: 500 }
    );
  }
}
