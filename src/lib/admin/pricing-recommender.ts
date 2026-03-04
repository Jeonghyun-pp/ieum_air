import { getAdminFirestore } from '@/lib/firebase/admin';

/** Event type → default price adjustment */
const EVENT_ADJUSTMENT_MAP: Record<string, number> = {
  concert: 50,
  festival: 30,
  holiday: 20,
  sport: 25,
  local: 15,
};

/**
 * Calculate foreign guest ratio adjustment multiplier
 * 60%+ foreign → ×1.3, 40%+ → ×1.15, else ×1.0
 */
function getForeignRatioMultiplier(foreignPercentage: number): number {
  if (foreignPercentage >= 60) return 1.3;
  if (foreignPercentage >= 40) return 1.15;
  return 1.0;
}

/**
 * Generate pricing recommendations for a property based on:
 * 1. Global calendar events matching the property's region
 * 2. Foreign guest ratio from analytics
 */
export async function generatePricingRecommendations(
  propertyId: string,
  month: string
) {
  const db = getAdminFirestore();

  // 1. Get property info (region)
  const propDoc = await db.collection('properties').doc(propertyId).get();
  if (!propDoc.exists) return { recommendations: [], foreignRatio: 0 };

  const property = propDoc.data()!;
  const region = property.region || '';

  // 2. Get global events for this month & region
  const eventsSnap = await db.collection('events-calendar')
    .where('region', '==', region)
    .get();

  const monthEvents = eventsSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter((e: any) => e.date?.startsWith(month)) as any[];

  // 3. Get aggregated analytics to determine foreign guest ratio
  const aggDoc = await db.collection('properties').doc(propertyId)
    .collection('analytics').doc(`aggregated-${month}`).get();

  let foreignPercentage = 0;
  if (aggDoc.exists) {
    const aggData = aggDoc.data()!;
    const nationalityBreakdown = aggData.nationalityBreakdown || [];
    const totalVisitors = nationalityBreakdown.reduce((sum: number, n: any) => sum + n.value, 0);
    const koreanVisitors = nationalityBreakdown.find((n: any) => n.name === 'South Korea')?.value || 0;
    foreignPercentage = totalVisitors > 0
      ? Math.round(((totalVisitors - koreanVisitors) / totalVisitors) * 100)
      : 0;
  }

  const foreignMultiplier = getForeignRatioMultiplier(foreignPercentage);

  // 4. Generate recommendations
  const recommendations = monthEvents.map((event: any) => {
    const baseAdjustment = EVENT_ADJUSTMENT_MAP[event.type] || 15;
    const adjustedValue = Math.round(baseAdjustment * foreignMultiplier);

    return {
      eventId: event.id,
      eventName: event.name,
      date: event.date,
      type: event.type,
      baseAdjustment: `+${baseAdjustment}%`,
      foreignMultiplier,
      recommendedAdjustment: `+${adjustedValue}%`,
      reason: foreignPercentage >= 40
        ? `외국인 비율 ${foreignPercentage}% → 가격 상향 조정 (×${foreignMultiplier})`
        : `기본 이벤트 가격 조정`,
    };
  });

  return {
    propertyId,
    month,
    region,
    foreignPercentage,
    foreignMultiplier,
    recommendations,
  };
}
