import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { getPropertySubcollection } from '@/lib/firebase/firestore';
import { PropertyDocument } from '@/types/property';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const db = getAdminFirestore();

    // Fetch all properties
    const propertiesSnapshot = await db.collection('properties')
      .orderBy('createdAt', 'desc')
      .get();

    // Current month boundaries for content count filter
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const properties = await Promise.all(
      propertiesSnapshot.docs.map(async (doc) => {
        const data = doc.data() as PropertyDocument;
        const propertyId = doc.id;

        // Fetch subcollection data in parallel
        const [plans, integrations, contentAll] = await Promise.all([
          // Latest plan
          getPropertySubcollection<{ status?: string }>(propertyId, 'plans', {
            orderBy: 'createdAt',
            direction: 'desc',
            limit: 1,
          }),
          // All integrations
          getPropertySubcollection<Record<string, unknown>>(propertyId, 'integrations'),
          // All content (filter in-memory by current month)
          getPropertySubcollection<{ createdAt?: Timestamp }>(propertyId, 'content', {
            orderBy: 'createdAt',
            direction: 'desc',
          }),
        ]);

        // Current plan status from latest plan doc
        const currentPlanStatus = plans.length > 0 ? (plans[0].status || null) : null;

        // Integration count
        const integrationCount = integrations.length;

        // Content count for current month
        const contentCount = contentAll.filter((item) => {
          const createdAt = item.createdAt;
          if (!createdAt) return false;
          const date = createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt as any);
          return date >= monthStart && date < monthEnd;
        }).length;

        // Fetch owner info from users collection
        let owner: { email?: string; displayName?: string } = {};
        try {
          const ownerDoc = await db.collection('users').doc(data.ownerId).get();
          if (ownerDoc.exists) {
            const ownerData = ownerDoc.data();
            owner = {
              email: ownerData?.email,
              displayName: ownerData?.displayName,
            };
          }
        } catch (err) {
          console.error(`Failed to fetch owner ${data.ownerId}:`, err);
        }

        return {
          id: propertyId,
          ownerId: data.ownerId,
          name: data.name,
          region: data.region,
          propertyType: data.propertyType,
          listingUrl: data.listingUrl,
          monthlyBookings: data.monthlyBookings,
          guestNationality: data.guestNationality,
          currentActivity: data.currentActivity,
          painPoint: data.painPoint,
          selectedPlan: data.selectedPlan,
          status: data.status,
          listingData: data.listingData || undefined,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          currentPlanStatus,
          integrationCount,
          contentCount,
          owner,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: properties,
    });
  } catch (error: any) {
    console.error('Get admin properties error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
