'use client';

import { useEffect, useState } from 'react';
import {
  Music,
  PartyPopper,
  Sun,
  Calendar,
  Check,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
} from 'lucide-react';
import { usePortal } from '@/contexts/PortalContext';
import { usePortalData } from '@/hooks/usePortalData';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import type { PricingRecommendation, DailyPrice } from '@/types/strategy';

interface PricingEvent {
  date: number;
  event?: string;
  adjustment: string;
  type: 'concert' | 'festival' | 'holiday' | 'normal';
  applied?: boolean;
}

interface PricingData {
  events: PricingEvent[];
}

const typeConfig = {
  concert: { icon: Music, color: 'text-pink-500', bg: 'bg-pink-500/10', label: '콘서트' },
  festival: { icon: PartyPopper, color: 'text-orange-500', bg: 'bg-orange-500/10', label: '축제' },
  holiday: { icon: Sun, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: '연휴' },
  normal: { icon: Calendar, color: 'text-muted-foreground', bg: 'bg-dark-highlight', label: '일반' },
};

const days = ['일', '월', '화', '수', '목', '금', '토'];

function generateCalendarDays(month: string) {
  const [year, monthNum] = month.split('-').map(Number);
  const firstDay = new Date(year, monthNum - 1, 1).getDay();
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const grid: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

export default function PricingCalendarPage() {
  const { activeProperty, currentMonth } = usePortal();
  const { data, isLoading } = usePortalData<PricingData>({
    endpoint: 'pricing',
    propertyId: activeProperty?.id,
    month: currentMonth,
  });

  const [recommendation, setRecommendation] = useState<PricingRecommendation | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(15);

  // Phase 3 가격 추천 데이터 fetch
  useEffect(() => {
    async function fetchPricing() {
      try {
        const params = new URLSearchParams({ month: currentMonth });
        const res = await fetch(`/api/portal/pricing-calendar?${params}`);
        const json = await res.json();
        if (json.success && json.data) {
          setRecommendation(json.data as PricingRecommendation);
        }
      } catch {
        // ignore
      }
    }
    if (activeProperty) fetchPricing();
  }, [activeProperty, currentMonth]);

  if (isLoading) {
    return <PortalSkeleton />;
  }

  const events = data?.events || [];
  const calendarDays = generateCalendarDays(currentMonth);

  const getEventForDate = (date: number) => events.find((e) => e.date === date);
  const getRecommendationForDate = (date: number): DailyPrice | undefined => {
    if (!recommendation) return undefined;
    const dateStr = `${currentMonth}-${String(date).padStart(2, '0')}`;
    return recommendation.dailyPrices.find(d => d.date === dateStr);
  };

  const selectedEvent = events.find((e) => e.date === selectedDate);
  const selectedRec = selectedDate ? getRecommendationForDate(selectedDate) : undefined;

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    return `${year}년 ${parseInt(monthNum)}월`;
  };

  const formatPrice = (price: number) => price.toLocaleString() + '원';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">가격 캘린더</h1>
        <p className="text-muted-foreground">{formatMonth(currentMonth)} — 이벤트 + AI 가격 추천</p>
      </div>

      {/* Summary banner */}
      {recommendation && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-dark-elevated">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="text-xs text-muted-foreground">평균 추천가</div>
              <div className="text-sm font-bold">{formatPrice(recommendation.summary.avgRecommended)}</div>
            </div>
          </div>
          <div className="w-px h-8 bg-dark-highlight" />
          <div>
            <div className="text-xs text-muted-foreground">예상 매출 변화</div>
            <div className={`text-sm font-bold ${recommendation.summary.potentialRevenueLift >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {recommendation.summary.potentialRevenueLift >= 0 ? '+' : ''}{recommendation.summary.potentialRevenueLift}%
            </div>
          </div>
          <div className="w-px h-8 bg-dark-highlight" />
          <div>
            <div className="text-xs text-muted-foreground">조정 추천 일수</div>
            <div className="text-sm font-bold">{recommendation.summary.adjustedDays}일</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-dark-elevated">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground py-2">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, i) => {
              if (date === null) return <div key={`empty-${i}`} />;
              const event = getEventForDate(date);
              const rec = getRecommendationForDate(date);
              const isSelected = date === selectedDate;
              const hasEvent = event && event.type !== 'normal';

              // 가격 변동 표시
              const priceDiff = rec ? rec.recommendedPrice - rec.currentPrice : 0;
              const priceColor = priceDiff > 0
                ? 'text-emerald-500'
                : priceDiff < 0
                  ? 'text-red-500'
                  : 'text-muted-foreground';

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`relative p-2 rounded-xl text-center transition-all duration-150 min-h-[72px] flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? 'bg-dark-surface ring-1 ring-purple-500/50'
                      : 'hover:bg-dark-highlight/50'
                  }`}
                >
                  <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>{date}</span>
                  {rec && priceDiff !== 0 && (
                    <span className={`text-[10px] font-bold ${priceColor}`}>
                      {priceDiff > 0 ? '+' : ''}{Math.round(priceDiff / 1000)}k
                    </span>
                  )}
                  {!rec && event && (
                    <span className={`text-[10px] font-bold ${
                      event.adjustment === '유지' ? 'text-muted-foreground' : 'text-emerald-500'
                    }`}>
                      {event.adjustment}
                    </span>
                  )}
                  {hasEvent && (
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      event.type === 'concert' ? 'bg-pink-400' :
                      event.type === 'festival' ? 'bg-orange-400' :
                      'bg-emerald-400'
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
            {Object.entries(typeConfig).filter(([k]) => k !== 'normal').map(([key, config]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${
                  key === 'concert' ? 'bg-pink-400' :
                  key === 'festival' ? 'bg-orange-400' :
                  'bg-emerald-400'
                }`} />
                <span className="text-xs text-muted-foreground">{config.label}</span>
              </div>
            ))}
            {recommendation && (
              <>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">인상 추천</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-muted-foreground">인하 추천</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="space-y-4">
          {/* AI 가격 추천 상세 */}
          {selectedRec && (
            <div className="p-6 rounded-2xl bg-dark-elevated border border-purple-500/10">
              <div className="text-xs text-muted-foreground mb-1">
                {parseInt(currentMonth.split('-')[1])}월 {selectedDate}일 ({days[selectedRec.dayOfWeek]})
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div>
                  <div className="text-xs text-muted-foreground">현재가</div>
                  <div className="text-lg font-bold">{formatPrice(selectedRec.currentPrice)}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">추천가</div>
                  <div className={`text-lg font-bold ${
                    selectedRec.recommendedPrice > selectedRec.currentPrice ? 'text-emerald-500' :
                    selectedRec.recommendedPrice < selectedRec.currentPrice ? 'text-red-500' : ''
                  }`}>
                    {formatPrice(selectedRec.recommendedPrice)}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{selectedRec.reason}</p>
              {selectedRec.factors.length > 0 && (
                <div className="space-y-1.5">
                  {selectedRec.factors.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{f.label}</span>
                      <span className={f.impact >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                        {f.impact >= 0 ? '+' : ''}{f.impact}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-border">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedRec.confidence === 'high' ? 'bg-emerald-500/10 text-emerald-500' :
                  selectedRec.confidence === 'medium' ? 'bg-blue-500/10 text-blue-500' :
                  'bg-dark-highlight text-muted-foreground'
                }`}>
                  신뢰도: {selectedRec.confidence === 'high' ? '높음' : selectedRec.confidence === 'medium' ? '보통' : '낮음'}
                </span>
              </div>
              <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-accent-gradient text-white font-medium text-sm hover:opacity-90 transition-opacity mt-4">
                <Check className="w-4 h-4" />
                적용했어요
              </button>
            </div>
          )}

          {/* 이벤트 상세 (추천 데이터 없을 때) */}
          {!selectedRec && selectedEvent && selectedEvent.event ? (
            <div className={`p-6 rounded-2xl bg-dark-elevated border ${
              selectedEvent.type === 'concert' ? 'border-pink-500/20' :
              selectedEvent.type === 'festival' ? 'border-orange-500/20' :
              selectedEvent.type === 'holiday' ? 'border-emerald-500/20' :
              'border-border'
            }`}>
              {(() => {
                const config = typeConfig[selectedEvent.type];
                const Icon = config.icon;
                return (
                  <>
                    <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{parseInt(currentMonth.split('-')[1])}월 {selectedEvent.date}일</div>
                    <h3 className="text-xl font-bold mb-4">{selectedEvent.event}</h3>
                    <div className="p-4 rounded-xl bg-dark-highlight mb-3">
                      <div className="text-xs text-muted-foreground mb-1">추천 가격 조정</div>
                      <div className="text-2xl font-bold text-emerald-500">{selectedEvent.adjustment}</div>
                    </div>
                    <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-accent-gradient text-white font-medium text-sm hover:opacity-90 transition-opacity">
                      <Check className="w-4 h-4" />
                      적용했어요
                    </button>
                  </>
                );
              })()}
            </div>
          ) : !selectedRec && (
            <div className="p-6 rounded-2xl bg-dark-elevated text-center">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {selectedDate ? `${parseInt(currentMonth.split('-')[1])}월 ${selectedDate}일 — 특별 이벤트 없음` : '날짜를 선택하세요'}
              </p>
            </div>
          )}

          {/* 다가오는 이벤트 */}
          <div className="p-6 rounded-2xl bg-dark-elevated">
            <h3 className="text-sm font-semibold mb-3">다가오는 이벤트</h3>
            <div className="space-y-3">
              {events
                .filter((e) => e.event && e.type !== 'normal')
                .map((e) => {
                  const config = typeConfig[e.type];
                  const Icon = config.icon;
                  return (
                    <button
                      key={e.date}
                      onClick={() => setSelectedDate(e.date)}
                      className="w-full flex items-center gap-3 text-left hover:bg-dark-highlight/50 rounded-lg p-2 -mx-2 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{e.event}</div>
                        <div className="text-xs text-muted-foreground">{parseInt(currentMonth.split('-')[1])}/{e.date}</div>
                      </div>
                      <span className="text-sm font-bold text-emerald-500">{e.adjustment}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
