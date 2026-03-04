import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getPropertySubcollection } from '@/lib/firebase/firestore';
import { ActivityDocument } from '@/lib/portal/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const activities = await getPropertySubcollection<ActivityDocument>(id, 'activity', {
      orderBy: 'createdAt',
      direction: 'desc',
      limit,
    });

    return NextResponse.json({ success: true, data: activities });
  } catch (error: any) {
    console.error('Get activity error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
