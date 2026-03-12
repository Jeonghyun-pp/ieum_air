// ============================================
// Airbnb Detail Scraper — HTTP + Cheerio
// data-deferred-state-0 JSON 파싱 방식
// ============================================

import * as cheerio from 'cheerio';
import type { ScrapedListing, ScrapedPhoto, ReviewScores, ScrapeResult } from '@/types/scraping';
import { getBrowserHeaders, fetchWithRetry } from './ua-rotator';

/**
 * Airbnb 리스팅 상세 정보를 스크래핑합니다.
 * data-deferred-state-0 JSON blob에서 GraphQL 타입 기반 데이터 추출.
 */
export async function scrapeListingDetail(
  listingId: string
): Promise<ScrapeResult<ScrapedListing>> {
  const startTime = Date.now();
  const url = `https://www.airbnb.co.kr/rooms/${listingId}`;

  try {
    const { response, retryCount } = await fetchWithRetry(url, {
      headers: getBrowserHeaders(),
    });

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: response.status === 404 ? 'NOT_FOUND' : 'BLOCKED',
          message: `HTTP ${response.status}`,
          httpStatus: response.status,
        },
        duration: Date.now() - startTime,
        retryCount,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1순위: data-deferred-state JSON
    const deferredScript = $('#data-deferred-state-0').html();
    if (deferredScript) {
      try {
        const data = JSON.parse(deferredScript);
        const listing = parseDeferredState(data, listingId);
        return {
          success: true,
          data: listing,
          duration: Date.now() - startTime,
          retryCount,
        };
      } catch (parseErr) {
        console.error('[scraper] deferred state parse error:', parseErr);
      }
    }

    // 2순위: 기존 CSS 셀렉터 + JSON-LD fallback
    const listing = parseFallback($, listingId);
    return {
      success: true,
      data: listing,
      duration: Date.now() - startTime,
      retryCount,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: message.includes('timeout') ? 'TIMEOUT' : 'UNKNOWN',
        message,
      },
      duration: Date.now() - startTime,
      retryCount: 0,
    };
  }
}

// ─── Deferred State Parsing ──────────────────────────────────────────────────

function parseDeferredState(data: unknown, listingId: string): ScrapedListing {
  // title, description
  const title = deepFind<string>(data, 'title', isNonEmptyString) ?? '';
  const htmlDescription = deepFind<{ htmlText?: string }>(data, 'htmlDescription');
  const description = htmlDescription?.htmlText ?? '';

  // location
  const lat = deepFind<number>(data, 'lat', isNumber) ?? 0;
  const lng = deepFind<number>(data, 'lng', isNumber) ?? 0;

  // photos
  const photoTourData = deepFindByTypename(data, 'PhotoTour');
  const mediaItems = deepFindAll<string>(
    photoTourData ?? data,
    'baseUrl'
  );
  const photos: ScrapedPhoto[] = [];
  const seenUrls = new Set<string>();
  for (const item of mediaItems) {
    if (typeof item === 'string' && item.startsWith('http') && !seenUrls.has(item)) {
      seenUrls.add(item);
      photos.push({ url: item });
    }
  }
  // Also try extracting from parent objects
  const photoObjects = deepFindAllByKey<{ baseUrl?: string; caption?: string }>(data, 'baseUrl');
  for (const po of photoObjects) {
    if (po.baseUrl && !seenUrls.has(po.baseUrl)) {
      seenUrls.add(po.baseUrl);
      photos.push({ url: po.baseUrl, caption: po.caption ?? undefined });
    }
  }

  // amenities — look for AmenitiesGroup or seeAllAmenityGroups
  const amenityGroups = deepFindAll<{ title?: string }[]>(data, 'amenities');
  const amenities: string[] = [];
  const seenAmenities = new Set<string>();
  for (const group of amenityGroups) {
    if (Array.isArray(group)) {
      for (const item of group) {
        const name = typeof item === 'string' ? item : item?.title;
        if (name && !seenAmenities.has(name)) {
          seenAmenities.add(name);
          amenities.push(name);
        }
      }
    }
  }

  // rating & reviewCount
  const rating = deepFind<number>(data, 'overallRating', isNumber) ?? 0;
  const reviewCount = deepFind<number>(data, 'reviewCount', isNumber)
    ?? deepFind<number>(data, 'visibleReviewCount', isNumber)
    ?? 0;

  // reviewScores — CategoryRating objects
  const reviewScores = extractReviewScores(data);

  // beds/bedrooms/bathrooms — overviewItems
  const { accommodates, bedrooms, beds, bathrooms, propertyType, roomType } =
    extractOverviewInfo(data);

  // host info
  const isSuperhost = deepFind<boolean>(data, 'isSuperhost') === true;
  const hostResponseRate = extractHostResponseRate(data);

  // booking info
  const instantBookable = deepFind<boolean>(data, 'instantBookable') === true;
  const minimumNights = deepFind<number>(data, 'minimumNights', isNumber) ?? 1;

  return {
    listingId,
    title,
    description,
    propertyType: propertyType ?? '',
    roomType: roomType ?? '',
    accommodates,
    bedrooms,
    beds,
    bathrooms,
    location: { lat, lng, neighborhood: '' },
    pricePerNight: 0, // 가격은 검색 결과에서 가져옴
    currency: 'KRW',
    amenities,
    photos,
    rating,
    reviewCount,
    reviewScores,
    isSuperhost,
    hostResponseRate,
    instantBookable,
    minimumNights,
    calendar: [], // 별도 API 호출로 수집
    scrapedAt: new Date().toISOString(),
    listingUrl: `https://www.airbnb.co.kr/rooms/${listingId}`,
  };
}

function extractReviewScores(data: unknown): ReviewScores {
  const scores: ReviewScores = {};
  const categoryRatings = deepFindAllByTypename<{
    category?: string;
    localizedName?: string;
    value?: number;
  }>(data, 'CategoryRating');

  const categoryMap: Record<string, keyof ReviewScores> = {
    accuracy: 'accuracy',
    '정확성': 'accuracy',
    checkin: 'checkin',
    'check-in': 'checkin',
    '체크인': 'checkin',
    cleanliness: 'cleanliness',
    '청결도': 'cleanliness',
    communication: 'communication',
    '의사소통': 'communication',
    location: 'location',
    '위치': 'location',
    value: 'value',
    '가격 대비 만족도': 'value',
  };

  for (const cr of categoryRatings) {
    const key = (cr.category ?? cr.localizedName ?? '').toLowerCase();
    const mapped = categoryMap[key];
    if (mapped && typeof cr.value === 'number') {
      scores[mapped] = cr.value;
    }
  }

  return scores;
}

function extractOverviewInfo(data: unknown): {
  accommodates: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  propertyType?: string;
  roomType?: string;
} {
  const result = { accommodates: 0, bedrooms: 0, beds: 0, bathrooms: 0 } as {
    accommodates: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    propertyType?: string;
    roomType?: string;
  };

  // overviewItems 텍스트 파싱 (e.g., "침실 2개", "침대 3개", "욕실 1개", "최대 인원 4명")
  const overviewItems = deepFindAll<string>(data, 'title');
  for (const item of overviewItems) {
    if (typeof item !== 'string') continue;
    const normalized = item.toLowerCase();

    const bedroomMatch = normalized.match(/(?:침실|bedroom)\s*(\d+)/);
    if (bedroomMatch) result.bedrooms = parseInt(bedroomMatch[1]);

    const bedMatch = normalized.match(/(?:침대|bed)\s*(\d+)/);
    if (bedMatch) result.beds = parseInt(bedMatch[1]);

    const bathMatch = normalized.match(/(?:욕실|bathroom|bath)\s*(\d+)/);
    if (bathMatch) result.bathrooms = parseInt(bathMatch[1]);

    const guestMatch = normalized.match(/(?:최대\s*인원|guest|accommodate)\s*(\d+)/);
    if (guestMatch) result.accommodates = parseInt(guestMatch[1]);
  }

  // propertyType, roomType
  result.propertyType = deepFind<string>(data, 'propertyType', isNonEmptyString) ?? undefined;
  result.roomType = deepFind<string>(data, 'roomType', isNonEmptyString) ?? undefined;

  return result;
}

function extractHostResponseRate(data: unknown): string | undefined {
  // 응답률: "응답률: 100%" 형태의 문자열 검색
  const allStrings = deepFindAll<string>(data, 'subtitle');
  for (const s of allStrings) {
    if (typeof s === 'string' && (s.includes('응답률') || s.includes('response rate'))) {
      return s;
    }
  }
  return undefined;
}

// ─── Fallback Parsing (기존 방식) ────────────────────────────────────────────

function parseFallback($: cheerio.CheerioAPI, listingId: string): ScrapedListing {
  let title = '';
  for (const sel of ['h1[data-testid="listing-title"]', 'h1', 'title']) {
    const text = $(sel).first().text().trim();
    if (text && text.length < 200) {
      title = text.replace(/ - Airbnb$/, '').replace(/ · .*$/, '');
      break;
    }
  }

  const ogImage = $('meta[property="og:image"]').attr('content');
  const photos: ScrapedPhoto[] = ogImage ? [{ url: ogImage }] : [];

  let pricePerNight = 0;
  let currency = 'KRW';
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '');
      if (json['@type'] === 'Product' && json.offers) {
        pricePerNight = parseFloat(json.offers.price) || 0;
        currency = json.offers.priceCurrency || 'KRW';
      }
    } catch {
      // ignore
    }
  });

  return {
    listingId,
    title,
    description: '',
    propertyType: '',
    roomType: '',
    accommodates: 0,
    bedrooms: 0,
    beds: 0,
    bathrooms: 0,
    location: { lat: 0, lng: 0, neighborhood: '' },
    pricePerNight,
    currency,
    amenities: [],
    photos,
    rating: 0,
    reviewCount: 0,
    reviewScores: {},
    isSuperhost: false,
    instantBookable: false,
    minimumNights: 1,
    calendar: [],
    scrapedAt: new Date().toISOString(),
    listingUrl: `https://www.airbnb.co.kr/rooms/${listingId}`,
  };
}

// ─── Deep Search Utilities ───────────────────────────────────────────────────

type Predicate<T> = (value: unknown) => value is T;

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && !isNaN(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0 && v.length < 500;
}

/** 깊은 탐색으로 첫 번째 일치하는 값을 찾습니다 */
function deepFind<T>(
  obj: unknown,
  targetKey: string,
  predicate?: Predicate<T>,
  maxDepth = 15,
  depth = 0
): T | undefined {
  if (depth >= maxDepth || obj == null || typeof obj !== 'object') return undefined;

  if (!Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    if (targetKey in record) {
      const val = record[targetKey];
      if (!predicate || predicate(val)) return val as T;
    }
    for (const key of Object.keys(record)) {
      const found = deepFind<T>(record[key], targetKey, predicate, maxDepth, depth + 1);
      if (found !== undefined) return found;
    }
  } else {
    for (const item of obj) {
      const found = deepFind<T>(item, targetKey, predicate, maxDepth, depth + 1);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/** 깊은 탐색으로 모든 일치하는 값을 찾습니다 */
function deepFindAll<T>(
  obj: unknown,
  targetKey: string,
  maxDepth = 15,
  depth = 0
): T[] {
  const results: T[] = [];
  if (depth >= maxDepth || obj == null || typeof obj !== 'object') return results;

  if (!Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    if (targetKey in record) results.push(record[targetKey] as T);
    for (const key of Object.keys(record)) {
      results.push(...deepFindAll<T>(record[key], targetKey, maxDepth, depth + 1));
    }
  } else {
    for (const item of obj) {
      results.push(...deepFindAll<T>(item, targetKey, maxDepth, depth + 1));
    }
  }
  return results;
}

/** __typename 기반으로 객체 찾기 */
function deepFindByTypename(obj: unknown, typename: string, maxDepth = 15, depth = 0): unknown {
  if (depth >= maxDepth || obj == null || typeof obj !== 'object') return undefined;

  if (!Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    if (record.__typename === typename) return record;
    for (const key of Object.keys(record)) {
      const found = deepFindByTypename(record[key], typename, maxDepth, depth + 1);
      if (found !== undefined) return found;
    }
  } else {
    for (const item of obj) {
      const found = deepFindByTypename(item, typename, maxDepth, depth + 1);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/** __typename 기반으로 모든 객체 찾기 */
function deepFindAllByTypename<T>(obj: unknown, typename: string, maxDepth = 15, depth = 0): T[] {
  const results: T[] = [];
  if (depth >= maxDepth || obj == null || typeof obj !== 'object') return results;

  if (!Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    if (record.__typename === typename) results.push(record as T);
    for (const key of Object.keys(record)) {
      results.push(...deepFindAllByTypename<T>(record[key], typename, maxDepth, depth + 1));
    }
  } else {
    for (const item of obj) {
      results.push(...deepFindAllByTypename<T>(item, typename, maxDepth, depth + 1));
    }
  }
  return results;
}

/** 특정 키를 포함하는 부모 객체들을 모두 찾기 */
function deepFindAllByKey<T>(obj: unknown, key: string, maxDepth = 15, depth = 0): T[] {
  const results: T[] = [];
  if (depth >= maxDepth || obj == null || typeof obj !== 'object') return results;

  if (!Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    if (key in record) results.push(record as T);
    for (const k of Object.keys(record)) {
      results.push(...deepFindAllByKey<T>(record[k], key, maxDepth, depth + 1));
    }
  } else {
    for (const item of obj) {
      results.push(...deepFindAllByKey<T>(item, key, maxDepth, depth + 1));
    }
  }
  return results;
}
