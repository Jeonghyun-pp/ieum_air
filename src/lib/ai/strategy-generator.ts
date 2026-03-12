// ============================================
// AI Strategy Generator — Groq Fallback Chain
// 진단 + 시장 데이터 기반 월간 전략 생성
// ============================================

import type { MonthlyStrategy, StrategyPriority } from '@/types/strategy';
import type { DiagnosisResult } from '@/types/diagnosis';
import type { MarketIntel } from '@/types/market-intel';

const STRATEGY_PROMPT = `You are a professional Airbnb listing optimization consultant.
Based on the listing diagnosis and market intelligence data provided, generate a monthly optimization strategy in Korean.

Return ONLY valid JSON with this structure:
{
  "summary": "2-3 sentence strategy overview in Korean",
  "keyInsights": ["insight1", "insight2", ...] (3-5 items),
  "priorities": [
    {
      "rank": 1,
      "category": "pricing|content|photos|amenities|reviews|response",
      "title": "short action title in Korean",
      "description": "1-2 sentence description in Korean",
      "impact": "high|medium|low",
      "effort": "high|medium|low"
    }
  ] (3-6 items, sorted by impact desc),
  "pricingStrategy": "one-line pricing strategy in Korean",
  "contentStrategy": "one-line content strategy in Korean",
  "seasonalFactors": ["factor1", "factor2", ...] (1-3 items)
}`;

export async function generateStrategy(
  propertyId: string,
  month: string,
  diagnosis: DiagnosisResult,
  marketIntel: MarketIntel | null
): Promise<MonthlyStrategy> {
  const context = buildContext(diagnosis, marketIntel, month);

  // Groq → DeepSeek → OpenAI 폴백
  const providers = [
    { name: 'groq', baseURL: 'https://api.groq.com/openai/v1', key: process.env.GROQ_API_KEY, model: 'llama-3.3-70b-versatile' },
    { name: 'deepseek', baseURL: 'https://api.deepseek.com', key: process.env.DEEPSEEK_API_KEY, model: 'deepseek-chat' },
    { name: 'openai', baseURL: 'https://api.openai.com/v1', key: process.env.OPENAI_API_KEY, model: 'gpt-4o-mini' },
  ];

  let lastError: Error | null = null;

  for (const provider of providers) {
    if (!provider.key) continue;
    try {
      const result = await callProvider(provider, context);
      return toMonthlyStrategy(propertyId, month, result);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[strategy] ${provider.name} failed:`, lastError.message);
    }
  }

  // 모든 AI 실패 시 규칙 기반 폴백
  console.warn('[strategy] All AI providers failed, using rule-based fallback');
  return generateRuleBasedStrategy(propertyId, month, diagnosis, marketIntel);
}

function buildContext(
  diagnosis: DiagnosisResult,
  marketIntel: MarketIntel | null,
  month: string
): string {
  const { enhancedScorecard, reviewDiagnosis, photoDiagnosis, contentDiagnosis } = diagnosis;
  const lines: string[] = [
    `Month: ${month}`,
    `Overall Health Score: ${enhancedScorecard.overallScore}/100 (Grade: ${enhancedScorecard.overallGrade})`,
    `Rank: ${enhancedScorecard.rank}/${enhancedScorecard.totalInCompSet}`,
    '',
    'Category Scores:',
    ...enhancedScorecard.categories.map(c => `  ${c.label}: ${c.score}/100 (${c.grade}) - ${c.details}`),
    '',
    `Reviews: ${reviewDiagnosis.sentiment} sentiment, ${reviewDiagnosis.score}/100, ${reviewDiagnosis.reviewCount} reviews`,
    `Top Praises: ${reviewDiagnosis.topPraises.join(', ') || 'N/A'}`,
    `Top Complaints: ${reviewDiagnosis.topComplaints.join(', ') || 'None'}`,
    '',
    `Photos: ${photoDiagnosis.photoCount} photos, score ${photoDiagnosis.overallScore}/100`,
    `Missing spaces: ${photoDiagnosis.missingSpaces.join(', ') || 'None'}`,
    `Quality issues: ${photoDiagnosis.resolutionIssues.length} resolution, ${photoDiagnosis.brightnessIssues.length} brightness`,
    '',
    `Content: title ${contentDiagnosis.title.score}/100, description ${contentDiagnosis.description.score}/100`,
    `Missing keywords: ${contentDiagnosis.title.missingKeywords.join(', ') || 'None'}`,
    `Missing topics: ${contentDiagnosis.description.topicsMissing.join(', ') || 'None'}`,
  ];

  if (marketIntel) {
    const pb = marketIntel.priceBenchmark;
    lines.push(
      '',
      `Price: ${pb.ownPrice} ${pb.currency} (percentile: ${pb.percentile}, median: ${pb.compSetStats.median})`,
      `Top amenity gaps: ${marketIntel.amenityAnalysis.gaps.slice(0, 3).map(g => g.name).join(', ') || 'None'}`,
    );
  }

  return lines.join('\n');
}

async function callProvider(
  provider: { name: string; baseURL: string; key: string | undefined; model: string },
  context: string
): Promise<StrategyResponse> {
  const response = await fetch(`${provider.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.key}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: 'system', content: STRATEGY_PROMPT },
        { role: 'user', content: context },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`${provider.name} API error: ${response.status}`);
  }

  const data = await response.json() as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Empty response from ${provider.name}`);

  let parsed: StrategyResponse;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Invalid JSON from ${provider.name}`);
  }

  return parsed;
}

interface StrategyResponse {
  summary?: string;
  keyInsights?: string[];
  priorities?: StrategyPriority[];
  pricingStrategy?: string;
  contentStrategy?: string;
  seasonalFactors?: string[];
}

function toMonthlyStrategy(
  propertyId: string,
  month: string,
  raw: StrategyResponse
): MonthlyStrategy {
  return {
    propertyId,
    month,
    summary: raw.summary || '이번 달 전략이 생성되었습니다.',
    keyInsights: (raw.keyInsights ?? []).slice(0, 5),
    priorities: (raw.priorities ?? []).slice(0, 6).map((p, i) => ({
      rank: p.rank ?? i + 1,
      category: p.category || 'content',
      title: p.title || '',
      description: p.description || '',
      impact: p.impact || 'medium',
      effort: p.effort || 'medium',
    })),
    pricingStrategy: raw.pricingStrategy || '',
    contentStrategy: raw.contentStrategy || '',
    seasonalFactors: raw.seasonalFactors ?? [],
    generatedAt: new Date().toISOString(),
  };
}

/** AI 전부 실패 시 규칙 기반 전략 생성 */
function generateRuleBasedStrategy(
  propertyId: string,
  month: string,
  diagnosis: DiagnosisResult,
  marketIntel: MarketIntel | null
): MonthlyStrategy {
  const { enhancedScorecard } = diagnosis;
  const validCategories: StrategyPriority['category'][] = ['pricing', 'content', 'photos', 'amenities', 'reviews', 'response'];
  const categoryMap: Record<string, StrategyPriority['category']> = {
    price: 'pricing', pricing: 'pricing', content: 'content', photos: 'photos',
    amenities: 'amenities', reviews: 'reviews', response: 'response',
  };

  const weakCategories = enhancedScorecard.categories
    .filter(c => c.score < 50)
    .sort((a, b) => a.score - b.score);

  const priorities: StrategyPriority[] = weakCategories.slice(0, 4).map((cat, i) => ({
    rank: i + 1,
    category: categoryMap[cat.category] ?? 'content',
    title: `${cat.label} 개선 필요`,
    description: `현재 ${cat.score}점으로 비교군 평균 이하입니다. ${cat.details}`,
    impact: cat.score < 30 ? 'high' as const : 'medium' as const,
    effort: 'medium' as const,
  }));

  const summary = weakCategories.length > 0
    ? `종합 경쟁력 ${enhancedScorecard.overallScore}점(${enhancedScorecard.overallGrade}등급). ${weakCategories[0].label} 분야 집중 개선이 필요합니다.`
    : `종합 경쟁력 ${enhancedScorecard.overallScore}점(${enhancedScorecard.overallGrade}등급). 전반적으로 양호합니다.`;

  return {
    propertyId,
    month,
    summary,
    keyInsights: [
      `비교군 ${enhancedScorecard.totalInCompSet}개 중 ${enhancedScorecard.rank}위`,
      ...weakCategories.slice(0, 2).map(c => `${c.label}: ${c.score}점 (개선 필요)`),
    ],
    priorities,
    pricingStrategy: marketIntel
      ? `현재 가격은 비교군 내 ${marketIntel.priceBenchmark.percentile}번째 백분위입니다.`
      : '비교군 데이터 수집 후 가격 전략이 제공됩니다.',
    contentStrategy: diagnosis.contentDiagnosis.overallScore < 60
      ? '제목과 설명 키워드 보강이 우선입니다.'
      : '콘텐츠 점수가 양호합니다. 지속적인 관리가 필요합니다.',
    seasonalFactors: [],
    generatedAt: new Date().toISOString(),
  };
}
