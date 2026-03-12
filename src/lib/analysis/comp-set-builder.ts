// ============================================
// Comp-Set Builder — 비교군 자동 구성
// ============================================

import type { ScrapedListing, InsideAirbnbRecord } from '@/types/scraping';
import type { CompSetCriteria, CompSetMember, CompSet } from '@/types/comp-set';

/**
 * 자사 숙소 정보를 기반으로 비교군 검색 기준을 생성합니다.
 */
export function buildCriteria(ownListing: ScrapedListing): CompSetCriteria {
  return {
    centerLat: ownListing.location.lat,
    centerLng: ownListing.location.lng,
    radiusKm: 3,
    roomType: ownListing.roomType || 'Entire home/apt',
    accommodates: ownListing.accommodates,
    bedrooms: ownListing.bedrooms,
    propertyType: ownListing.propertyType || undefined,
    targetSize: 75,
  };
}

/**
 * InsideAirbnb CSV 레코드에서 비교군 후보를 필터링합니다.
 */
export function filterCandidatesFromCSV(
  records: InsideAirbnbRecord[],
  criteria: CompSetCriteria
): (InsideAirbnbRecord & { distanceKm: number })[] {
  return records
    .filter((r) => {
      // 숙소 유형 필터
      if (r.room_type !== criteria.roomType) return false;
      // 규모 필터 (±2명, ±1실)
      if (Math.abs(r.accommodates - criteria.accommodates) > 2) return false;
      if (Math.abs(r.bedrooms - criteria.bedrooms) > 1) return false;
      // 활성 숙소만
      if (r.number_of_reviews <= 0) return false;
      return true;
    })
    .map((r) => ({
      ...r,
      distanceKm: haversineKm(criteria.centerLat, criteria.centerLng, r.latitude, r.longitude),
    }))
    .filter((r) => r.distanceKm <= criteria.radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, criteria.targetSize);
}

/**
 * ScrapedListing을 CompSetMember로 변환합니다.
 */
export function toCompSetMember(
  listing: ScrapedListing,
  distanceKm: number,
  dataSource: 'scrape' | 'csv' | 'hybrid' = 'scrape'
): CompSetMember {
  return {
    listingId: listing.listingId,
    title: listing.title,
    distanceKm,
    propertyType: listing.propertyType,
    roomType: listing.roomType,
    accommodates: listing.accommodates,
    bedrooms: listing.bedrooms,
    beds: listing.beds,
    bathrooms: listing.bathrooms,
    pricePerNight: listing.pricePerNight,
    currency: listing.currency,
    rating: listing.rating,
    reviewCount: listing.reviewCount,
    reviewScores: listing.reviewScores,
    amenities: listing.amenities,
    photoCount: listing.photos.length,
    isSuperhost: listing.isSuperhost,
    instantBookable: listing.instantBookable,
    minimumNights: listing.minimumNights,
    hostResponseRate: listing.hostResponseRate,
    calendar: listing.calendar.map((d) => ({
      date: d.date,
      available: d.available,
      price: d.price,
    })),
    listingUrl: listing.listingUrl,
    dataSource,
    scrapedAt: listing.scrapedAt,
  };
}

/**
 * CSV 레코드를 CompSetMember로 변환합니다 (실시간 스크래핑 전 임시 데이터).
 */
export function csvToCompSetMember(
  record: InsideAirbnbRecord & { distanceKm: number }
): CompSetMember {
  return {
    listingId: record.id,
    title: record.name,
    distanceKm: record.distanceKm,
    propertyType: record.property_type,
    roomType: record.room_type,
    accommodates: record.accommodates,
    bedrooms: record.bedrooms,
    beds: record.beds,
    bathrooms: record.bathrooms,
    pricePerNight: record.price,
    currency: 'KRW',
    rating: record.review_scores_rating,
    reviewCount: record.number_of_reviews,
    reviewScores: {},
    amenities: record.amenities,
    photoCount: 0,
    isSuperhost: record.host_is_superhost,
    instantBookable: record.instant_bookable,
    minimumNights: 1,
    calendar: [],
    listingUrl: `https://www.airbnb.co.kr/rooms/${record.id}`,
    dataSource: 'csv',
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * CompSet 객체를 초기화합니다.
 */
export function createCompSet(
  propertyId: string,
  criteria: CompSetCriteria,
  members: CompSetMember[]
): CompSet {
  const now = new Date().toISOString();
  const nextRefresh = new Date();
  nextRefresh.setDate(nextRefresh.getDate() + 7); // 7일 후 갱신

  return {
    propertyId,
    criteria,
    members,
    status: 'ready',
    createdAt: now,
    updatedAt: now,
    nextRefreshAt: nextRefresh.toISOString(),
  };
}

// ─── Haversine Distance ──────────────────────────────────────────────────────

/**
 * 두 좌표 간 거리를 km 단위로 계산합니다 (Haversine 공식).
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // 소수점 2자리
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
