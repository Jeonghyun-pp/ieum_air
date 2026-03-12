// ============================================
// AI Content Optimizer — 제목/설명 개선 제안
// ============================================

import type { ContentSuggestions, TitleSuggestion, DescriptionImprovement } from '@/types/strategy';
import type { ContentDiagnosis } from '@/types/diagnosis';
import type { ScrapedListing } from '@/types/scraping';

const CONTENT_PROMPT = `You are an Airbnb listing optimization expert.
Based on the current listing title, description, and diagnosis data, suggest improvements in Korean.

Return ONLY valid JSON:
{
  "titleSuggestions": [
    { "suggested": "improved title", "reason": "why this is better (Korean)", "score": 85 }
  ] (2-3 alternatives),
  "descriptionImprovements": [
    { "topic": "topic name", "currentCoverage": false, "suggestedText": "Korean paragraph to add", "reason": "Korean explanation" }
  ] (for missing topics only, max 4)
}`;

export async function generateContentSuggestions(
  propertyId: string,
  listing: ScrapedListing,
  diagnosis: ContentDiagnosis
): Promise<ContentSuggestions> {
  const context = buildContentContext(listing, diagnosis);

  const providers = [
    { name: 'groq', baseURL: 'https://api.groq.com/openai/v1', key: process.env.GROQ_API_KEY, model: 'llama-3.3-70b-versatile' },
    { name: 'deepseek', baseURL: 'https://api.deepseek.com', key: process.env.DEEPSEEK_API_KEY, model: 'deepseek-chat' },
    { name: 'openai', baseURL: 'https://api.openai.com/v1', key: process.env.OPENAI_API_KEY, model: 'gpt-4o-mini' },
  ];

  for (const provider of providers) {
    if (!provider.key) continue;
    try {
      const response = await fetch(`${provider.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.key}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: CONTENT_PROMPT },
            { role: 'user', content: context },
          ],
          temperature: 0.4,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) throw new Error(`${provider.name}: ${response.status}`);

      const data = await response.json() as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error(`Empty response from ${provider.name}`);

      let parsed: {
        titleSuggestions?: TitleSuggestion[];
        descriptionImprovements?: DescriptionImprovement[];
      };
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new Error(`Invalid JSON from ${provider.name}`);
      }

      return {
        propertyId,
        titleSuggestions: (parsed.titleSuggestions ?? []).slice(0, 3).map(s => ({
          suggested: s.suggested || '',
          reason: s.reason || '',
          score: Math.max(0, Math.min(100, s.score ?? 50)),
        })),
        descriptionImprovements: (parsed.descriptionImprovements ?? []).slice(0, 4).map(d => ({
          topic: d.topic || '',
          currentCoverage: d.currentCoverage ?? false,
          suggestedText: d.suggestedText || '',
          reason: d.reason || '',
        })),
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn(`[content-optimizer] ${provider.name} failed:`, err instanceof Error ? err.message : err);
    }
  }

  // AI 전부 실패 시 빈 결과
  return {
    propertyId,
    titleSuggestions: [],
    descriptionImprovements: diagnosis.description.topicsMissing.map(topic => ({
      topic,
      currentCoverage: false,
      suggestedText: '',
      reason: `"${topic}" 관련 정보가 설명에 누락되어 있습니다.`,
    })),
    generatedAt: new Date().toISOString(),
  };
}

function buildContentContext(listing: ScrapedListing, diagnosis: ContentDiagnosis): string {
  return [
    `Current Title: "${listing.title}"`,
    `Title Length: ${diagnosis.title.length} (optimal: ${diagnosis.title.optimalRange[0]}-${diagnosis.title.optimalRange[1]})`,
    `Title Score: ${diagnosis.title.score}/100`,
    `Missing Keywords: ${diagnosis.title.missingKeywords.join(', ') || 'None'}`,
    `Existing Keywords: ${diagnosis.title.keywords.join(', ') || 'None'}`,
    '',
    `Description Length: ${diagnosis.description.length}`,
    `Description Score: ${diagnosis.description.score}/100`,
    `Topics Covered: ${diagnosis.description.topicsCovered.join(', ')}`,
    `Topics Missing: ${diagnosis.description.topicsMissing.join(', ') || 'None'}`,
    '',
    `Property: ${listing.propertyType}, ${listing.accommodates} guests, ${listing.bedrooms} bedrooms`,
    `Location: ${listing.location.neighborhood}`,
    `Amenities: ${listing.amenities.slice(0, 15).join(', ')}`,
  ].join('\n');
}
