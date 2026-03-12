// ============================================
// Comp-Set (비교군) Types — Phase 1
// ============================================

import type { ReviewScores, CalendarDay } from './scraping';

/** 비교군 검색 기준 */
export interface CompSetCriteria {
  centerLat: number;
  centerLng: number;
  radiusKm: number;        // 기본 3km, 최대 6km
  roomType: string;         // 'Entire home/apt' | 'Private room' etc.
  accommodates: number;
  bedrooms: number;
  propertyType?: string;    // 'Apartment' | 'House' etc.
  targetSize: number;       // 기본 75
}

/** 비교군 멤버 (개별 경쟁 숙소) */
export interface CompSetMember {
  listingId: string;
  title: string;
  distanceKm: number;
  propertyType: string;
  roomType: string;
  accommodates: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  pricePerNight: number;
  currency: string;
  rating: number;
  reviewCount: number;
  reviewScores: ReviewScores;
  amenities: string[];
  photoCount: number;
  isSuperhost: boolean;
  instantBookable: boolean;
  minimumNights: number;
  hostResponseRate?: string;
  calendar: CalendarDay[];
  listingUrl: string;
  dataSource: 'scrape' | 'csv' | 'hybrid';
  scrapedAt: string;
}

/** 비교군 전체 */
export interface CompSet {
  propertyId: string;        // 자사 숙소 ID
  criteria: CompSetCriteria;
  members: CompSetMember[];
  status: CompSetStatus;
  createdAt: string;
  updatedAt: string;
  nextRefreshAt: string;     // 다음 갱신 예정일
}

export type CompSetStatus =
  | 'building'               // 비교군 구성 중
  | 'scraping'               // 상세 스크래핑 중
  | 'analyzing'              // 분석 중
  | 'ready'                  // 완료
  | 'error'                  // 에러
  | 'stale';                 // 갱신 필요

/** 비교군 구성 진행 상황 */
export interface CompSetProgress {
  propertyId: string;
  status: CompSetStatus;
  totalMembers: number;
  scrapedMembers: number;
  failedMembers: number;
  startedAt: string;
  estimatedCompletionAt?: string;
  error?: string;
}
