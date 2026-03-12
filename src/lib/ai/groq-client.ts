// ============================================
// Groq Client — 무료 티어 (Llama 3.3 70B)
// 리뷰 감성/토픽 분석용
// ============================================

import Groq from 'groq-sdk';
import type { ReviewDiagnosis } from '@/types/diagnosis';

let groqClient: Groq | null = null;

function getGroq(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not set');
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

const REVIEW_ANALYSIS_PROMPT = `You are a hospitality review analyst. Analyze the following Airbnb guest reviews and return a JSON object with:
- sentiment: "positive", "neutral", or "negative" (overall)
- score: 0-100 (overall satisfaction score)
- topics: array of main topics mentioned (e.g., "cleanliness", "location", "amenities", "host", "value")
- topPraises: top 5 most frequently praised aspects (in Korean if reviews are Korean)
- topComplaints: top 5 most frequently complained aspects (in Korean, empty array if none)

Return ONLY valid JSON, no markdown or explanation.`;

/**
 * Groq (Llama 3.3 70B)로 리뷰를 분석합니다.
 * 무료 티어: 30 req/min, 14,400 req/day, 15M tokens/month
 */
export async function analyzeReviewsWithGroq(
  reviews: string[]
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

  const groq = getGroq();
  const reviewText = reviews
    .slice(0, 50) // 최대 50개 배치
    .map((r, i) => `[Review ${i + 1}]: ${r}`)
    .join('\n\n');

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: REVIEW_ANALYSIS_PROMPT },
      { role: 'user', content: reviewText },
    ],
    temperature: 0.1,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from Groq');

  let parsed: {
    sentiment?: string;
    score?: number;
    topics?: string[];
    topPraises?: string[];
    topComplaints?: string[];
  };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON response from Groq');
  }

  return {
    sentiment: (['positive', 'neutral', 'negative'].includes(parsed.sentiment ?? '')
      ? parsed.sentiment as 'positive' | 'neutral' | 'negative'
      : 'neutral'),
    score: Math.max(0, Math.min(100, parsed.score ?? 50)),
    topics: parsed.topics ?? [],
    topPraises: (parsed.topPraises ?? []).slice(0, 5),
    topComplaints: (parsed.topComplaints ?? []).slice(0, 5),
    reviewCount: reviews.length,
    analyzedAt: new Date().toISOString(),
  };
}
