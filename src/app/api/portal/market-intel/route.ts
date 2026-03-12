import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveProperty } from '@/lib/portal/helpers';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { MarketIntel, MarketIntelSummary } from '@/types/market-intel';

// GET /api/portal/market-intel — 시장 인텔리전스 종합 데이터
export async function GET(request: NextRequest) {
  const { uid, property } = await resolveActiveProperty(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  if (!property) {
    return NextResponse.json({ success: true, data: null });
  }

  try {
    const db = getAdminFirestore();
    const intelDoc = await db
      .collection('properties')
      .doc(property.id)
      .collection('market-intel')
      .doc('current')
      .get();

    if (!intelDoc.exists) {
      return NextResponse.json({ success: true, data: null });
    }

    const intel = intelDoc.data() as MarketIntel;

    // 요약 데이터 생성
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    if (format === 'summary') {
      const summary: MarketIntelSummary = {
        healthScore: intel.scorecard.overallScore,
        healthGrade: intel.scorecard.overallGrade,
        rank: intel.scorecard.rank,
        totalCompetitors: intel.scorecard.totalInCompSet,
        pricePercentile: intel.priceBenchmark.percentile,
        topAmenityGaps: intel.amenityAnalysis.gaps.slice(0, 3),
        highlights: generateHighlights(intel),
      };
      return NextResponse.json({ success: true, data: summary });
    }

    return NextResponse.json({ success: true, data: intel });
  } catch (error) {
    console.error('[market-intel] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch market intel' } },
      { status: 500 }
    );
  }
}

function generateHighlights(intel: MarketIntel) {
  const highlights: MarketIntelSummary['highlights'] = [];
  const { scorecard, priceBenchmark, amenityAnalysis } = intel;

  // 가격 하이라이트
  if (priceBenchmark.percentile > 70) {
    highlights.push({
      type: 'negative',
      icon: '💰',
      text: `가격이 비교군 상위 ${100 - priceBenchmark.percentile}%로 높은 편입니다`,
    });
  } else if (priceBenchmark.percentile < 30) {
    highlights.push({
      type: 'positive',
      icon: '💰',
      text: `가격 경쟁력이 우수합니다 (하위 ${priceBenchmark.percentile}%)`,
    });
  }

  // 평점 하이라이트
  const ratingCat = scorecard.categories.find((c) => c.category === 'rating');
  if (ratingCat && ratingCat.percentile >= 75) {
    highlights.push({
      type: 'positive',
      icon: '⭐',
      text: `평점 ${ratingCat.ownValue}점으로 상위 ${100 - ratingCat.percentile}%`,
    });
  }

  // 편의시설 하이라이트
  if (amenityAnalysis.gaps.length > 0) {
    const topGap = amenityAnalysis.gaps[0];
    highlights.push({
      type: 'negative',
      icon: '🏠',
      text: `비교군 ${topGap.percentage}%가 보유한 "${topGap.name}" 추가를 권장합니다`,
    });
  }

  // 순위 하이라이트
  highlights.push({
    type: scorecard.rank <= Math.ceil(scorecard.totalInCompSet * 0.3) ? 'positive' : 'neutral',
    icon: '📊',
    text: `${scorecard.totalInCompSet}개 경쟁 숙소 중 ${scorecard.rank}위`,
  });

  return highlights;
}
