import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { getPropertyById, updateProperty, getPropertySubcollection } from '@/lib/firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const property = await getPropertyById(id);

    if (!property) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } },
        { status: 404 }
      );
    }

    // Fetch owner info
    const db = getAdminFirestore();
    let owner: { email?: string; displayName?: string } = {};
    try {
      const ownerDoc = await db.collection('users').doc(property.ownerId).get();
      if (ownerDoc.exists) {
        const ownerData = ownerDoc.data();
        owner = {
          email: ownerData?.email,
          displayName: ownerData?.displayName,
        };
      }
    } catch (err) {
      console.error(`Failed to fetch owner ${property.ownerId}:`, err);
    }

    // Fetch subcollection data in parallel
    const [plans, integrations, content, analytics, assets, results] = await Promise.all([
      getPropertySubcollection<Record<string, unknown>>(id, 'plans', {
        orderBy: 'createdAt',
        direction: 'desc',
      }),
      getPropertySubcollection<Record<string, unknown>>(id, 'integrations'),
      getPropertySubcollection<Record<string, unknown>>(id, 'content', {
        orderBy: 'createdAt',
        direction: 'desc',
      }),
      getPropertySubcollection<Record<string, unknown>>(id, 'analytics', {
        orderBy: 'createdAt',
        direction: 'desc',
      }),
      getPropertySubcollection<Record<string, unknown>>(id, 'assets', {
        orderBy: 'createdAt',
        direction: 'desc',
      }),
      getPropertySubcollection<Record<string, unknown>>(id, 'results', {
        orderBy: 'createdAt',
        direction: 'desc',
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...property,
        owner,
        integrations,
        stats: {
          planCount: plans.length,
          contentCount: content.length,
          analyticsCount: analytics.length,
          assetCount: assets.length,
          resultCount: results.length,
          integrationCount: integrations.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Get admin property detail error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    // Verify property exists
    const property = await getPropertyById(id);

    if (!property) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Whitelist of updatable fields
    const allowedFields = [
      'name', 'region', 'propertyType', 'listingUrl',
      'monthlyBookings', 'guestNationality', 'currentActivity',
      'painPoint', 'selectedPlan', 'status',
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No valid fields to update' } },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (updateData.status && !['onboarding', 'active', 'paused'].includes(updateData.status)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid status value' } },
        { status: 400 }
      );
    }

    await updateProperty(id, updateData);

    return NextResponse.json({
      success: true,
      data: { propertyId: id, updated: updateData },
    });
  } catch (error: any) {
    console.error('Update admin property error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
