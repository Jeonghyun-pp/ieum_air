// ============================================
// Review Analyzer — 리뷰 감성/토픽 분석
// ============================================

import type { ScrapedReview, ReviewDiagnosis } from '@/types/diagnosis';
import { analyzeReviewsWithFallback } from '@/lib/ai/fallback-chain';

/**
 * 스크래핑된 리뷰를 AI로 분석합니다.
 * Groq (무료) → DeepSeek → GPT-4o-mini fallback 체인.
 */
export async function analyzeReviews(
  reviews: ScrapedReview[]
): Promise<ReviewDiagnosis> {
  if (reviews.length === 0) {
    return {
      sentiment: 'neutral',
      score: 50,
      topics: [],
      topPraises: [],
      topComplaints: [],
      reviewCount: 0,
      analyzedAt: new Date().toISOString(),
    };
  }

  const reviewTexts = reviews
    .map((r) => r.text)
    .filter((t) => t.length > 5);

  return analyzeReviewsWithFallback(reviewTexts);
}
