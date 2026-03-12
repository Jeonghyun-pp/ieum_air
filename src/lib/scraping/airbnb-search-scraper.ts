// ============================================
// Airbnb Search Scraper — 비교군 탐색 + 가격 수집
// ============================================

import * as cheerio from 'cheerio';
import type { SearchResultListing, ScrapeResult } from '@/types/scraping';
import { getBrowserHeaders, fetchWithRetry, randomDelay } from './ua-rotator';

interface SearchOptions {
  lat: number;
  lng: number;
  checkin?: string;  // YYYY-MM-DD
  checkout?: string; // YYYY-MM-DD
  adults?: number;
  roomType?: string; // 'Entire home/apt' | 'Private room' etc.
  priceMin?: number;
  priceMax?: number;
  maxPages?: number;
}

/**
 * Airbnb 검색 결과를 스크래핑합니다.
 * 좌표 기반 검색으로 비교군 후보를 찾고, 가격 정보를 수집합니다.
 */
export async function scrapeSearchResults(
  options: SearchOptions
): Promise<ScrapeResult<SearchResultListing[]>> {
  const startTime = Date.now();
  const maxPages = options.maxPages ?? 3;
  const allListings: SearchResultListing[] = [];
  const seenIds = new Set<string>();

  try {
    for (let page = 0; page < maxPages; page++) {
      if (page > 0) {
        await randomDelay(3000, 6000);
      }

      const url = buildSearchUrl(options, page);
      const { response, retryCount } = await fetchWithRetry(url, {
        headers: getBrowserHeaders(),
      });

      if (!response.ok) {
        if (page === 0) {
          return {
            success: false,
            error: {
              code: response.status === 403 || response.status === 429 ? 'BLOCKED' : 'UNKNOWN',
              message: `HTTP ${response.status} on page ${page + 1}`,
              httpStatus: response.status,
            },
            duration: Date.now() - startTime,
            retryCount,
          };
        }
        break; // 이후 페이지 실패시 기존 결과 반환
      }

      const html = await response.text();
      const listings = parseSearchResults(html);

      if (listings.length === 0) break; // 더 이상 결과 없음

      for (const listing of listings) {
        if (!seenIds.has(listing.listingId)) {
          seenIds.add(listing.listingId);
          allListings.push(listing);
        }
      }
    }

    return {
      success: true,
      data: allListings,
      duration: Date.now() - startTime,
      retryCount: 0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      data: allListings.length > 0 ? allListings : undefined,
      error: {
        code: message.includes('timeout') ? 'TIMEOUT' : 'UNKNOWN',
        message,
      },
      duration: Date.now() - startTime,
      retryCount: 0,
    };
  }
}

function buildSearchUrl(options: SearchOptions, page: number): string {
  const params = new URLSearchParams();

  // 좌표 기반 검색
  params.set('search_mode', 'regular_search');
  params.set('lat', options.lat.toFixed(6));
  params.set('lng', options.lng.toFixed(6));
  params.set('zoom', '14'); // ~3km radius

  if (options.checkin) params.set('checkin', options.checkin);
  if (options.checkout) params.set('checkout', options.checkout);
  if (options.adults) params.set('adults', String(options.adults));
  if (options.priceMin) params.set('price_min', String(options.priceMin));
  if (options.priceMax) params.set('price_max', String(options.priceMax));

  // Room type filter
  if (options.roomType === 'Entire home/apt') {
    params.set('room_types[]', 'Entire home/apt');
  } else if (options.roomType === 'Private room') {
    params.set('room_types[]', 'Private room');
  }

  // Pagination
  if (page > 0) {
    params.set('items_offset', String(page * 18)); // Airbnb 페이지당 18개
  }

  params.set('currency', 'KRW');

  return `https://www.airbnb.co.kr/s/homes?${params.toString()}`;
}

function parseSearchResults(html: string): SearchResultListing[] {
  const $ = cheerio.load(html);
  const listings: SearchResultListing[] = [];

  // data-deferred-state에서 검색 결과 추출
  const deferredScript = $('#data-deferred-state-0').html();
  if (deferredScript) {
    try {
      const data = JSON.parse(deferredScript);
      const searchResults = extractSearchListings(data);
      if (searchResults.length > 0) return searchResults;
    } catch {
      // fallback to HTML parsing
    }
  }

  // Fallback: JSON-LD structured data
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '');
      if (json['@type'] === 'ItemList' && json.itemListElement) {
        for (const item of json.itemListElement) {
          if (item.url) {
            const idMatch = item.url.match(/\/rooms\/(\d+)/);
            if (idMatch) {
              listings.push({
                listingId: idMatch[1],
                title: item.name ?? '',
                price: 0,
                currency: 'KRW',
                photos: item.image ? [item.image] : [],
              });
            }
          }
        }
      }
    } catch {
      // ignore
    }
  });

  return listings;
}

function extractSearchListings(data: unknown): SearchResultListing[] {
  const listings: SearchResultListing[] = [];

  // Airbnb 검색 결과는 data-deferred-state 내 searchResults 배열에 있음
  const searchResults = deepFindAll(data, 'listing');

  for (const result of searchResults) {
    if (!result || typeof result !== 'object') continue;
    const r = result as Record<string, unknown>;

    const listingId = String(r.id ?? r.listingId ?? '');
    if (!listingId || listingId === 'undefined') continue;

    // 가격 추출 — 여러 경로 시도
    let price = 0;
    const priceObj = r.price ?? r.structuredStayDisplayPrice ?? r.pricingQuote;
    if (priceObj && typeof priceObj === 'object') {
      const po = priceObj as Record<string, unknown>;
      price = extractPrice(po);
    }

    listings.push({
      listingId,
      title: String(r.name ?? r.title ?? ''),
      propertyType: r.roomTypeCategory as string | undefined,
      price,
      currency: 'KRW',
      rating: typeof r.avgRating === 'number' ? r.avgRating : undefined,
      reviewCount: typeof r.reviewsCount === 'number' ? r.reviewsCount : undefined,
      photos: extractPhotos(r),
      lat: typeof r.lat === 'number' ? r.lat : undefined,
      lng: typeof r.lng === 'number' ? r.lng : undefined,
      isSuperhost: r.isSuperhost === true ? true : undefined,
    });
  }

  return listings;
}

function extractPrice(priceObj: Record<string, unknown>): number {
  // 다양한 가격 구조 처리
  if (typeof priceObj.amount === 'number') return priceObj.amount;

  // structuredStayDisplayPrice.primaryLine.price
  const primaryLine = priceObj.primaryLine as Record<string, unknown> | undefined;
  if (primaryLine) {
    const priceStr = String(primaryLine.price ?? primaryLine.discountedPrice ?? '');
    const numMatch = priceStr.replace(/[^0-9]/g, '');
    if (numMatch) return parseInt(numMatch);
  }

  // Nested price object
  const nestedPrice = priceObj.price as Record<string, unknown> | undefined;
  if (nestedPrice && typeof nestedPrice.amount === 'number') {
    return nestedPrice.amount;
  }

  // Total price string "₩85,000"
  const total = String(priceObj.total ?? priceObj.priceString ?? '');
  const totalMatch = total.replace(/[^0-9]/g, '');
  if (totalMatch) return parseInt(totalMatch);

  return 0;
}

function extractPhotos(listing: Record<string, unknown>): string[] {
  const photos: string[] = [];

  // contextualPictures or pictures array
  const pics = (listing.contextualPictures ?? listing.pictures ?? listing.photos) as unknown[];
  if (Array.isArray(pics)) {
    for (const pic of pics.slice(0, 5)) {
      if (typeof pic === 'string') {
        photos.push(pic);
      } else if (pic && typeof pic === 'object') {
        const p = pic as Record<string, unknown>;
        const url = String(p.picture ?? p.url ?? p.baseUrl ?? '');
        if (url.startsWith('http')) photos.push(url);
      }
    }
  }

  // thumbnail
  if (typeof listing.thumbnail === 'string' && photos.length === 0) {
    photos.push(listing.thumbnail);
  }

  return photos;
}

/** 깊은 탐색으로 모든 일치하는 값을 찾습니다 */
function deepFindAll(
  obj: unknown,
  targetKey: string,
  maxDepth = 12,
  depth = 0
): unknown[] {
  const results: unknown[] = [];
  if (depth >= maxDepth || obj == null || typeof obj !== 'object') return results;

  if (!Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    if (targetKey in record) results.push(record[targetKey]);
    for (const key of Object.keys(record)) {
      results.push(...deepFindAll(record[key], targetKey, maxDepth, depth + 1));
    }
  } else {
    for (const item of obj) {
      results.push(...deepFindAll(item, targetKey, maxDepth, depth + 1));
    }
  }
  return results;
}
