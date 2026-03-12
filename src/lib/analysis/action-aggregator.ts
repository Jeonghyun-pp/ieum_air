// ============================================
// Action Aggregator — 진단/전략/가격/콘텐츠 추천을 통합
// ============================================

import type { ActionItem } from '@/types/strategy';
import type { DiagnosisResult } from '@/types/diagnosis';
import type { MonthlyStrategy } from '@/types/strategy';
import type { PricingRecommendation } from '@/types/strategy';
import type { ContentSuggestions } from '@/types/strategy';

/**
 * 모든 Phase 1~3 결과를 우선순위별 액션 아이템으로 통합합니다.
 */
export function aggregateActions(
  propertyId: string,
  diagnosis: DiagnosisResult,
  strategy?: MonthlyStrategy | null,
  pricing?: PricingRecommendation | null,
  contentSuggestions?: ContentSuggestions | null
): ActionItem[] {
  const actions: ActionItem[] = [];
  const now = new Date().toISOString();

  // 1) 진단 기반 액션
  actions.push(...buildDiagnosisActions(propertyId, diagnosis, now));

  // 2) 전략 기반 액션
  if (strategy) {
    actions.push(...buildStrategyActions(propertyId, strategy, now));
  }

  // 3) 가격 기반 액션
  if (pricing && pricing.summary.adjustedDays > 0) {
    actions.push({
      id: `pricing-${propertyId}-adjust`,
      propertyId,
      category: 'pricing',
      title: `${pricing.summary.adjustedDays}일 가격 조정 추천`,
      description: pricing.summary.potentialRevenueLift > 0
        ? `가격 조정 시 예상 매출 ${pricing.summary.potentialRevenueLift}% 향상`
        : `비교군 대비 최적 가격으로 조정하세요.`,
      priority: pricing.summary.potentialRevenueLift >= 10 ? 'high' : 'medium',
      effort: 'low',
      status: 'pending',
      source: 'pricing',
      createdAt: now,
      updatedAt: now,
    });
  }

  // 4) 콘텐츠 제안 기반 액션
  if (contentSuggestions) {
    if (contentSuggestions.titleSuggestions.length > 0) {
      actions.push({
        id: `content-${propertyId}-title`,
        propertyId,
        category: 'content',
        title: '리스팅 제목 개선',
        description: `${contentSuggestions.titleSuggestions.length}개 대안 제목이 준비되었습니다.`,
        priority: 'medium',
        effort: 'low',
        status: 'pending',
        source: 'content',
        createdAt: now,
        updatedAt: now,
      });
    }
    if (contentSuggestions.descriptionImprovements.length > 0) {
      actions.push({
        id: `content-${propertyId}-desc`,
        propertyId,
        category: 'content',
        title: '리스팅 설명 보강',
        description: `${contentSuggestions.descriptionImprovements.length}개 토픽 추가를 권장합니다.`,
        priority: 'medium',
        effort: 'medium',
        status: 'pending',
        source: 'content',
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // 우선순위 정렬: critical > high > medium > low
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return actions;
}

function buildDiagnosisActions(
  propertyId: string,
  diagnosis: DiagnosisResult,
  now: string
): ActionItem[] {
  const actions: ActionItem[] = [];
  const { reviewDiagnosis, photoDiagnosis, contentDiagnosis, enhancedScorecard } = diagnosis;

  // 사진 관련
  if (photoDiagnosis.resolutionIssues.length > 0) {
    actions.push({
      id: `diag-${propertyId}-photo-res`,
      propertyId,
      category: 'photos',
      title: `저해상도 사진 ${photoDiagnosis.resolutionIssues.length}장 교체`,
      description: 'Full HD(1920x1080) 이하 사진이 감지되었습니다. 고해상도로 교체하세요.',
      priority: 'high',
      effort: 'medium',
      status: 'pending',
      source: 'diagnosis',
      createdAt: now,
      updatedAt: now,
    });
  }

  if (photoDiagnosis.missingSpaces.length > 0) {
    actions.push({
      id: `diag-${propertyId}-photo-space`,
      propertyId,
      category: 'photos',
      title: `누락 공간 사진 추가 (${photoDiagnosis.missingSpaces.join(', ')})`,
      description: '비교군 상위 숙소가 보여주는 공간 사진이 누락되어 있습니다.',
      priority: 'medium',
      effort: 'medium',
      status: 'pending',
      source: 'diagnosis',
      createdAt: now,
      updatedAt: now,
    });
  }

  // 리뷰 관련
  if (reviewDiagnosis.sentiment === 'negative') {
    actions.push({
      id: `diag-${propertyId}-review-neg`,
      propertyId,
      category: 'reviews',
      title: '부정 리뷰 대응 필요',
      description: `주요 불만: ${reviewDiagnosis.topComplaints.slice(0, 2).join(', ') || '확인 필요'}`,
      priority: 'critical',
      effort: 'high',
      status: 'pending',
      source: 'diagnosis',
      createdAt: now,
      updatedAt: now,
    });
  }

  // 콘텐츠 관련
  if (contentDiagnosis.title.score < 50) {
    actions.push({
      id: `diag-${propertyId}-title`,
      propertyId,
      category: 'content',
      title: '리스팅 제목 최적화 필요',
      description: `현재 제목 점수 ${contentDiagnosis.title.score}점. 누락 키워드: ${contentDiagnosis.title.missingKeywords.slice(0, 3).join(', ')}`,
      priority: 'high',
      effort: 'low',
      status: 'pending',
      source: 'diagnosis',
      createdAt: now,
      updatedAt: now,
    });
  }

  if (contentDiagnosis.description.topicsMissing.length >= 3) {
    actions.push({
      id: `diag-${propertyId}-desc`,
      propertyId,
      category: 'content',
      title: `설명에 ${contentDiagnosis.description.topicsMissing.length}개 토픽 누락`,
      description: `누락 토픽: ${contentDiagnosis.description.topicsMissing.join(', ')}`,
      priority: 'medium',
      effort: 'medium',
      status: 'pending',
      source: 'diagnosis',
      createdAt: now,
      updatedAt: now,
    });
  }

  // 약한 카테고리
  const catMap: Record<string, ActionItem['category']> = {
    price: 'pricing', pricing: 'pricing', content: 'content', photos: 'photos',
    amenities: 'amenities', reviews: 'reviews', response: 'response',
  };
  for (const cat of enhancedScorecard.categories) {
    const mappedCat = catMap[cat.category] ?? 'content';
    if (cat.score < 30 && !actions.some(a => a.category === mappedCat)) {
      actions.push({
        id: `diag-${propertyId}-weak-${cat.category}`,
        propertyId,
        category: mappedCat,
        title: `${cat.label} 긴급 개선 (${cat.score}점)`,
        description: cat.details,
        priority: 'critical',
        effort: 'high',
        status: 'pending',
        source: 'diagnosis',
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return actions;
}

function buildStrategyActions(
  propertyId: string,
  strategy: MonthlyStrategy,
  now: string
): ActionItem[] {
  const categoryMap: Record<string, ActionItem['category']> = {
    price: 'pricing', pricing: 'pricing', content: 'content', photos: 'photos',
    amenities: 'amenities', reviews: 'reviews', response: 'response',
  };

  return strategy.priorities.map(p => ({
    id: `strat-${propertyId}-${p.rank}`,
    propertyId,
    category: categoryMap[p.category] ?? 'content',
    title: p.title,
    description: p.description,
    priority: p.impact === 'high' ? 'high' as const : p.impact === 'medium' ? 'medium' as const : 'low' as const,
    effort: p.effort,
    status: 'pending' as const,
    source: 'strategy' as const,
    createdAt: now,
    updatedAt: now,
  }));
}
