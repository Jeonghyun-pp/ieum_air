import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { getPropertySubcollection } from '@/lib/firebase/firestore';

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

interface ContentWithProperty extends ContentDocument {
  propertyId: string;
  propertyName: string;
}

export async function GET(request: NextRequest) {
  const authCheck = await requireRole(['admin'])(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    const db = getAdminFirestore();
    const propertiesSnapshot = await db
      .collection('properties')
      .where('status', '==', 'active')
      .get();

    const grouped: {
      backlog: ContentWithProperty[];
      in_progress: ContentWithProperty[];
      review: ContentWithProperty[];
      completed: ContentWithProperty[];
    } = {
      backlog: [],
      in_progress: [],
      review: [],
      completed: [],
    };

    const contentPromises = propertiesSnapshot.docs.map(async (propertyDoc) => {
      const propertyId = propertyDoc.id;
      const propertyData = propertyDoc.data();
      const propertyName = propertyData.name || propertyData.title || propertyId;

      let items = await getPropertySubcollection<ContentDocument>(
        propertyId,
        'content',
        { orderBy: 'createdAt' }
      );

      if (month) {
        items = items.filter((item) => item.month === month);
      }

      for (const item of items) {
        const enriched: ContentWithProperty = {
          ...item,
          propertyId,
          propertyName,
        };

        if (item.status in grouped) {
          grouped[item.status as keyof typeof grouped].push(enriched);
        }
      }
    });

    await Promise.all(contentPromises);

    return NextResponse.json({ success: true, data: grouped });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'AGGREGATION_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}
