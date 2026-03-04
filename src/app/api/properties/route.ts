import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { createProperty, getPropertiesByOwner } from '@/lib/firebase/firestore';
import type { PropertyDocument } from '@/types/property';

// POST /api/properties — 새 숙소 생성
export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, region, propertyType, listingUrl, monthlyBookings, guestNationality, currentActivity, painPoint, selectedPlan } = body;

    if (!name || !region || !propertyType) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'name, region, propertyType are required' } },
        { status: 400 }
      );
    }

    const propertyData: Omit<PropertyDocument, 'createdAt' | 'updatedAt'> = {
      ownerId: user.uid,
      name,
      region,
      propertyType,
      listingUrl: listingUrl || undefined,
      monthlyBookings: monthlyBookings || '',
      guestNationality: guestNationality || '',
      currentActivity: currentActivity || '',
      painPoint: painPoint || '',
      selectedPlan: selectedPlan || '',
      status: 'onboarding',
    };

    const propertyId = await createProperty(propertyData);

    return NextResponse.json({ success: true, data: { id: propertyId } }, { status: 201 });
  } catch (error) {
    console.error('Create property error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create property' } },
      { status: 500 }
    );
  }
}

// GET /api/properties — 내 숙소 목록
export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const properties = await getPropertiesByOwner(user.uid);
    return NextResponse.json({ success: true, data: properties });
  } catch (error) {
    console.error('Get properties error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get properties' } },
      { status: 500 }
    );
  }
}
