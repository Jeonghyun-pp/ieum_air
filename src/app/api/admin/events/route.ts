import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const db = getAdminFirestore();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const region = searchParams.get('region');

    let query: any = db.collection('events-calendar').orderBy('date', 'asc');
    const snapshot = await query.get();

    let events = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (month) {
      events = events.filter((e: any) => e.date?.startsWith(month));
    }
    if (region) {
      events = events.filter((e: any) => e.region === region);
    }

    return NextResponse.json({ success: true, data: events });
  } catch (error: any) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { name, date, type, region, impact, description, endDate } = body;

    if (!name || !date || !type || !region || !impact) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'name, date, type, region, impact are required' } },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const now = Timestamp.now();
    const ref = await db.collection('events-calendar').add({
      name,
      date,
      endDate: endDate || null,
      type,
      region,
      impact,
      description: description || '',
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      { success: true, data: { id: ref.id, name, date, type, region, impact } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
