// ============================================
// Scraping Types — Phase 1
// ============================================

/** Airbnb 리스팅 상세 스크래핑 결과 */
export interface ScrapedListing {
  listingId: string;
  title: string;
  description: string;
  propertyType: string;
  roomType: string;
  accommodates: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  location: {
    lat: number;
    lng: number;
    neighborhood: string;
  };
  pricePerNight: number;
  currency: string;
  amenities: string[];
  photos: ScrapedPhoto[];
  rating: number;
  reviewCount: number;
  reviewScores: ReviewScores;
  isSuperhost: boolean;
  hostResponseRate?: string;
  instantBookable: boolean;
  minimumNights: number;
  calendar: CalendarDay[];
  scrapedAt: string;
  listingUrl: string;
}

export interface ScrapedPhoto {
  url: string;
  caption?: string;
}

export interface ReviewScores {
  accuracy?: number;
  checkin?: number;
  cleanliness?: number;
  communication?: number;
  location?: number;
  value?: number;
  overall?: number;
}

/** 캘린더 일별 데이터 */
export interface CalendarDay {
  date: string;
  available: boolean;
  price?: number;
}

/** 검색 결과 리스팅 (비교군 탐색용) */
export interface SearchResultListing {
  listingId: string;
  title: string;
  propertyType?: string;
  price: number;
  currency: string;
  rating?: number;
  reviewCount?: number;
  photos: string[];
  lat?: number;
  lng?: number;
  isSuperhost?: boolean;
}

/** 스크래핑 결과 래퍼 */
export interface ScrapeResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: 'BLOCKED' | 'NOT_FOUND' | 'PARSE_ERROR' | 'TIMEOUT' | 'UNKNOWN';
    message: string;
    httpStatus?: number;
  };
  duration: number; // ms
  retryCount: number;
}

/** InsideAirbnb CSV 레코드 */
export interface InsideAirbnbRecord {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  property_type: string;
  room_type: string;
  accommodates: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  price: number;
  review_scores_rating: number;
  number_of_reviews: number;
  host_is_superhost: boolean;
  instant_bookable: boolean;
}
