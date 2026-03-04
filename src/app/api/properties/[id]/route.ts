import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getPropertyById, updateProperty } from '@/lib/firebase/firestore';

// GET /api/properties/:id — 숙소 단건 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const property = await getPropertyById(id);

    if (!property) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } },
        { status: 404 }
      );
    }

    if (property.ownerId !== user.uid && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Not your property' } },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: property });
  } catch (error) {
    console.error('Get property error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get property' } },
      { status: 500 }
    );
  }
}

// PATCH /api/properties/:id — 숙소 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const property = await getPropertyById(id);

    if (!property) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } },
        { status: 404 }
      );
    }

    if (property.ownerId !== user.uid && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Not your property' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const allowedFields = [
      'name', 'region', 'propertyType', 'listingUrl',
      'monthlyBookings', 'guestNationality', 'currentActivity',
      'painPoint', 'selectedPlan', 'status', 'listingData',
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    await updateProperty(id, updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update property error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update property' } },
      { status: 500 }
    );
  }
}
