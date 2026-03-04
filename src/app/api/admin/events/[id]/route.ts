import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { addToPropertySubcollection } from '@/lib/firebase/firestore';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const { id } = await params;
    const body = await request.json();
    const allowed = ['name', 'date', 'endDate', 'type', 'region', 'impact', 'description'];
    const updateData: Record<string, any> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'EMPTY_BODY', message: 'No valid fields to update' } },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    await db.collection('events-calendar').doc(id).update({
      ...updateData,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ success: true, data: { id, updated: updateData } });
  } catch (error: any) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const { id } = await params;
    const db = getAdminFirestore();
    await db.collection('events-calendar').doc(id).delete();

    return NextResponse.json({ success: true, data: { id, deleted: true } });
  } catch (error: any) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/events/[id] — Publish event to selected properties as pricing-events
 * Body: { propertyIds: string[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const { id } = await params;
    const body = await request.json();
    const { propertyIds } = body;

    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'propertyIds array is required' } },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const eventDoc = await db.collection('events-calendar').doc(id).get();
    if (!eventDoc.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } },
        { status: 404 }
      );
    }

    const event = eventDoc.data()!;
    const dateObj = new Date(event.date);
    const month = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

    const results = await Promise.all(
      propertyIds.map(async (propertyId: string) => {
        const docId = await addToPropertySubcollection(propertyId, 'pricing-events', {
          month,
          date: dateObj.getDate(),
          event: event.name,
          adjustment: event.impact,
          type: event.type,
          applied: false,
          sourceEventId: id,
        });
        return { propertyId, pricingEventId: docId };
      })
    );

    return NextResponse.json({ success: true, data: { published: results } });
  } catch (error: any) {
    console.error('Publish event error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
