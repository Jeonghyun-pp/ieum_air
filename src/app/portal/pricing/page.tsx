'use client';

import { useState } from 'react';
import { Music, PartyPopper, Sun, Calendar, Check } from 'lucide-react';
import { usePortal } from '@/contexts/PortalContext';
import { usePortalData } from '@/hooks/usePortalData';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';

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
  concert: { icon: Music, color: 'text-pink-400', bg: 'bg-pink-500/10', label: '콘서트' },
  festival: { icon: PartyPopper, color: 'text-orange-400', bg: 'bg-orange-500/10', label: '축제' },
  holiday: { icon: Sun, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: '연휴' },
  normal: { icon: Calendar, color: 'text-[#6A6A6A]', bg: 'bg-dark-highlight', label: '일반' },
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

  const [selectedDate, setSelectedDate] = useState<number | null>(15);

  if (isLoading) {
    return <PortalSkeleton />;
  }

  const events = data?.events || [];
  const calendarDays = generateCalendarDays(currentMonth);
  const selectedEvent = events.find((e) => e.date === selectedDate);

  const getEventForDate = (date: number) => events.find((e) => e.date === date);

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    return `${year}년 ${parseInt(monthNum)}월`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">가격 캘린더</h1>
        <p className="text-[#B3B3B3]">{formatMonth(currentMonth)} — 이벤트 기반 가격 추천</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-dark-elevated">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map((day) => (
              <div key={day} className="text-center text-xs text-[#6A6A6A] py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, i) => {
              if (date === null) return <div key={`empty-${i}`} />;
              const event = getEventForDate(date);
              const isSelected = date === selectedDate;
              const hasEvent = event && event.type !== 'normal';
              const adjustColor =
                !event || event.adjustment === '유지'
                  ? 'text-[#6A6A6A]'
                  : 'text-emerald-400';

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`relative p-2 rounded-xl text-center transition-all duration-150 min-h-[72px] flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-dark-surface ring-1 ring-purple-500/50'
                      : 'hover:bg-dark-highlight'
                  }`}
                >
                  <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>{date}</span>
                  {event && (
                    <span className={`text-[10px] font-bold ${adjustColor}`}>
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
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-dark-highlight">
            {Object.entries(typeConfig).filter(([k]) => k !== 'normal').map(([key, config]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${
                  key === 'concert' ? 'bg-pink-400' :
                  key === 'festival' ? 'bg-orange-400' :
                  'bg-emerald-400'
                }`} />
                <span className="text-xs text-[#6A6A6A]">{config.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="space-y-4">
          {selectedEvent && selectedEvent.event ? (
            <div className={`p-6 rounded-2xl bg-dark-elevated border ${
              selectedEvent.type === 'concert' ? 'border-pink-500/20' :
              selectedEvent.type === 'festival' ? 'border-orange-500/20' :
              selectedEvent.type === 'holiday' ? 'border-emerald-500/20' :
              'border-dark-highlight'
            }`}>
              {(() => {
                const config = typeConfig[selectedEvent.type];
                const Icon = config.icon;
                return (
                  <>
                    <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div className="text-xs text-[#6A6A6A] mb-1">{parseInt(currentMonth.split('-')[1])}월 {selectedEvent.date}일</div>
                    <h3 className="text-xl font-bold mb-4">{selectedEvent.event}</h3>
                    <div className="p-4 rounded-xl bg-dark-highlight mb-3">
                      <div className="text-xs text-[#6A6A6A] mb-1">추천 가격 조정</div>
                      <div className="text-2xl font-bold text-emerald-400">
                        {selectedEvent.adjustment}
                      </div>
                    </div>
                    <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-accent-gradient text-white font-medium text-sm hover:opacity-90 transition-opacity">
                      <Check className="w-4 h-4" />
                      적용했어요
                    </button>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-dark-elevated text-center">
              <Calendar className="w-8 h-8 text-[#6A6A6A] mx-auto mb-3" />
              <p className="text-sm text-[#6A6A6A]">
                {selectedDate ? `${parseInt(currentMonth.split('-')[1])}월 ${selectedDate}일 — 특별 이벤트 없음` : '날짜를 선택하세요'}
              </p>
            </div>
          )}

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
                      className="w-full flex items-center gap-3 text-left hover:bg-dark-highlight rounded-lg p-2 -mx-2 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{e.event}</div>
                        <div className="text-xs text-[#6A6A6A]">{parseInt(currentMonth.split('-')[1])}/{e.date}</div>
                      </div>
                      <span className="text-sm font-bold text-emerald-400">{e.adjustment}</span>
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
