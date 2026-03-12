// ============================================
// Airbnb Reviews Scraper — 리뷰 텍스트 추출
// data-deferred-state-0에서 리뷰 텍스트 파싱
// ============================================

import * as cheerio from 'cheerio';
import type { ScrapedReview } from '@/types/diagnosis';
import type { ScrapeResult } from '@/types/scraping';
import { getBrowserHeaders, fetchWithRetry } from './ua-rotator';

/**
 * Airbnb 리스팅의 리뷰 텍스트를 스크래핑합니다.
 * data-deferred-state-0 JSON에서 리뷰 객체를 추출합니다.
 */
export async function scrapeReviews(
  listingId: string
): Promise<ScrapeResult<ScrapedReview[]>> {
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

    const deferredScript = $('#data-deferred-state-0').html();
    if (!deferredScript) {
      return {
        success: true,
        data: [],
        duration: Date.now() - startTime,
        retryCount,
      };
    }

    const data = JSON.parse(deferredScript);
    const reviews = extractReviews(data);

    return {
      success: true,
      data: reviews,
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

function extractReviews(data: unknown): ScrapedReview[] {
  const reviews: ScrapedReview[] = [];
  const seen = new Set<string>();

  // 리뷰 객체를 깊은 탐색으로 찾기
  // Airbnb의 리뷰는 __typename: "PdpReview" 또는 comments 필드를 가진 객체
  const reviewObjects = deepFindAllByTypename(data, 'PdpReview');
  for (const obj of reviewObjects) {
    const r = obj as Record<string, unknown>;
    const text = String(r.comments ?? r.comment ?? r.reviewText ?? '').trim();
    if (!text || text.length < 5 || seen.has(text)) continue;
    seen.add(text);

    reviews.push({
      text,
      date: r.createdAt as string | undefined ?? r.localizedDate as string | undefined,
      rating: typeof r.rating === 'number' ? r.rating : undefined,
      language: r.language as string | undefined,
      reviewerName: extractReviewerName(r),
    });
  }

  // fallback: comments 키로 직접 검색
  if (reviews.length === 0) {
    const commentValues = deepFindAll(data, 'comments');
    for (const val of commentValues) {
      if (typeof val === 'string' && val.length > 10 && !seen.has(val)) {
        seen.add(val);
        reviews.push({ text: val });
      }
    }
  }

  return reviews;
}

function extractReviewerName(review: Record<string, unknown>): string | undefined {
  const reviewer = review.reviewer ?? review.author;
  if (reviewer && typeof reviewer === 'object') {
    const r = reviewer as Record<string, unknown>;
    return (r.firstName ?? r.name ?? r.smartName) as string | undefined;
  }
  return undefined;
}

// ─── Deep Search Utilities ───────────────────────────────────────────────────

function deepFindAllByTypename(
  obj: unknown,
  typename: string,
  maxDepth = 15,
  depth = 0
): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  if (depth >= maxDepth || obj == null || typeof obj !== 'object') return results;

  if (!Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    if (record.__typename === typename) results.push(record);
    for (const key of Object.keys(record)) {
      results.push(...deepFindAllByTypename(record[key], typename, maxDepth, depth + 1));
    }
  } else {
    for (const item of obj) {
      results.push(...deepFindAllByTypename(item, typename, maxDepth, depth + 1));
    }
  }
  return results;
}

function deepFindAll(
  obj: unknown,
  targetKey: string,
  maxDepth = 15,
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
