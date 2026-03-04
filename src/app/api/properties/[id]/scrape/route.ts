import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getPropertyById, updateProperty } from '@/lib/firebase/firestore';
import { scrapeAirbnbListing } from '@/lib/scraping/airbnb';
import { Timestamp } from 'firebase-admin/firestore';

// POST /api/properties/:id/scrape — 에어비앤비 리스팅 스크래핑 트리거
export async function POST(
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

    if (!property.listingUrl) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'No listing URL set' } },
        { status: 400 }
      );
    }

    const scrapedData = await scrapeAirbnbListing(property.listingUrl);

    await updateProperty(id, {
      listingData: {
        ...scrapedData,
        scrapedAt: Timestamp.now(),
      },
    });

    return NextResponse.json({ success: true, data: scrapedData });
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Scraping failed' } },
      { status: 500 }
    );
  }
}
