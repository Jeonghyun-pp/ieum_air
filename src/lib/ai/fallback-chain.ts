// ============================================
// AI Fallback Chain — Groq → DeepSeek → OpenAI
// ============================================

import type { ReviewDiagnosis } from '@/types/diagnosis';
import { analyzeReviewsWithGroq } from './groq-client';

/**
 * AI Fallback 체인으로 리뷰를 분석합니다.
 *
 * 1순위: Groq 무료 (Llama 3.3 70B)
 * 2순위: DeepSeek V3 ($0.28/1M tokens)
 * 3순위: GPT-4o-mini ($0.15/1M tokens)
 */
export async function analyzeReviewsWithFallback(
  reviews: string[]
): Promise<ReviewDiagnosis> {
  // 1순위: Groq 무료
  try {
    return await analyzeReviewsWithGroq(reviews);
  } catch (err) {
    console.warn('[ai-fallback] Groq failed, trying DeepSeek:', err instanceof Error ? err.message : err);
  }

  // 2순위: DeepSeek (극저가)
  try {
    return await analyzeWithOpenAICompatible(reviews, {
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: 'deepseek-chat',
      provider: 'deepseek',
    });
  } catch (err) {
    console.warn('[ai-fallback] DeepSeek failed, trying GPT-4o-mini:', err instanceof Error ? err.message : err);
  }

  // 3순위: GPT-4o-mini (최후 수단)
  return await analyzeWithOpenAICompatible(reviews, {
    baseURL: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
    provider: 'openai',
  });
}

const REVIEW_ANALYSIS_PROMPT = `You are a hospitality review analyst. Analyze the following Airbnb guest reviews and return a JSON object with:
- sentiment: "positive", "neutral", or "negative" (overall)
- score: 0-100 (overall satisfaction score)
- topics: array of main topics mentioned
- topPraises: top 5 most frequently praised aspects (in Korean if reviews are Korean)
- topComplaints: top 5 most frequently complained aspects (in Korean, empty array if none)

Return ONLY valid JSON.`;

async function analyzeWithOpenAICompatible(
  reviews: string[],
  config: { baseURL: string; apiKey?: string; model: string; provider: string }
): Promise<ReviewDiagnosis> {
  if (!config.apiKey) {
    throw new Error(`${config.provider} API key not set`);
  }

  const reviewText = reviews
    .slice(0, 50)
    .map((r, i) => `[Review ${i + 1}]: ${r}`)
    .join('\n\n');

  const response = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: REVIEW_ANALYSIS_PROMPT },
        { role: 'user', content: reviewText },
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`${config.provider} API error: ${response.status}`);
  }

  const data = await response.json() as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Empty response from ${config.provider}`);

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
    throw new Error(`Invalid JSON response from ${config.provider}`);
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
