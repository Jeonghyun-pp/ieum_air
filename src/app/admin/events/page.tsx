'use client';

import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Music, PartyPopper, Plane, Star, MapPin, Loader2 } from 'lucide-react';
import { useAdminApi, useAdminMutation } from '@/hooks/useAdminApi';

type CalendarEvent = {
  id: string;
  name: string;
  date: string;
  type: 'concert' | 'festival' | 'holiday' | 'sport' | 'local';
  region: string;
  impact: '+20%' | '+30%' | '+50%' | '+80%';
  description?: string;
  endDate?: string;
};

const typeIcons: Record<string, typeof Music> = {
  concert: Music,
  festival: PartyPopper,
  holiday: Plane,
  sport: Star,
  local: MapPin,
};

const typeLabels: Record<string, string> = {
  concert: '콘서트',
  festival: '축제',
  holiday: '연휴',
  sport: '스포츠',
  local: '지역행사',
};

const typeColors: Record<string, string> = {
  concert: 'bg-pink-500/10 text-pink-400',
  festival: 'bg-amber-500/10 text-amber-400',
  holiday: 'bg-blue-500/10 text-blue-400',
  sport: 'bg-green-500/10 text-green-400',
  local: 'bg-purple-500/10 text-purple-400',
};

const impactColors: Record<string, string> = {
  '+20%': 'text-emerald-400',
  '+30%': 'text-emerald-400',
  '+50%': 'text-orange-400',
  '+80%': 'text-red-400',
};

export default function AdminEventsPage() {
  const [year, setYear] = useState(2026);
  const [monthIdx, setMonthIdx] = useState(2); // March = 2 (0-indexed)
  const monthStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;

  const { data: events, isLoading, error } = useAdminApi<CalendarEvent[]>({
    endpoint: 'events',
    params: { month: monthStr },
  });

  const { mutate } = useAdminMutation();

  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const firstDay = new Date(year, monthIdx, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const getEventsForDay = (day: number) => {
    if (!events) return [];
    const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => {
      if (e.date === dateStr) return true;
      // Support multi-day events (startDate <= day <= endDate)
      if (e.endDate && e.date <= dateStr && e.endDate >= dateStr) return true;
      return false;
    });
  };

  const handlePrevMonth = () => {
    if (monthIdx === 0) {
      setYear((y) => y - 1);
      setMonthIdx(11);
    } else {
      setMonthIdx((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (monthIdx === 11) {
      setYear((y) => y + 1);
      setMonthIdx(0);
    } else {
      setMonthIdx((m) => m + 1);
    }
  };

  const handlePublish = async (evt: CalendarEvent) => {
    alert('발행할 숙소를 선택하세요');
  };

  const handleEdit = (evt: CalendarEvent) => {
    alert('수정 기능은 준비 중입니다');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">이벤트 관리</h1>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-gradient text-white text-sm font-medium">
          <Plus className="w-4 h-4" />
          이벤트 추가
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-lg hover:bg-dark-highlight transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">{year}년 {monthIdx + 1}월</h2>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-lg hover:bg-dark-highlight transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#6A6A6A]" />
          <span className="ml-2 text-sm text-[#6A6A6A]">이벤트를 불러오는 중...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-12 text-red-400 text-sm">{error}</div>
      )}

      {/* Calendar Grid */}
      {!isLoading && !error && (
        <div className="rounded-2xl bg-dark-elevated p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
              <div key={d} className="text-center text-xs text-[#6A6A6A] py-2 font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {blanks.map((b) => (
              <div key={`blank-${b}`} className="h-20 rounded-lg" />
            ))}
            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={day}
                  className={`h-20 rounded-lg p-1.5 text-xs transition-colors ${
                    dayEvents.length > 0 ? 'bg-dark-highlight' : 'hover:bg-dark-highlight/50'
                  }`}
                >
                  <div className="text-[#B3B3B3] mb-1">{day}</div>
                  {dayEvents.slice(0, 2).map((evt) => {
                    const Icon = typeIcons[evt.type] || MapPin;
                    return (
                      <div key={evt.id} className="flex items-center gap-1 truncate">
                        <Icon className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate text-[10px]">{evt.name}</span>
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-[#6A6A6A]">+{dayEvents.length - 2}개</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Event List */}
      {!isLoading && !error && (
        <div className="p-6 rounded-2xl bg-dark-elevated">
          <h2 className="text-sm font-semibold mb-4">이벤트 목록</h2>
          {events && events.length === 0 && (
            <div className="text-center py-8 text-sm text-[#6A6A6A]">이 달에 등록된 이벤트가 없습니다.</div>
          )}
          <div className="space-y-2">
            {events?.map((evt) => {
              const Icon = typeIcons[evt.type] || MapPin;
              return (
                <div key={evt.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-dark-highlight transition-colors">
                  <div className={`w-10 h-10 rounded-lg ${typeColors[evt.type]} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{evt.name}</div>
                    <div className="text-xs text-[#6A6A6A]">{evt.date} · {evt.region}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[evt.type]}`}>
                    {typeLabels[evt.type]}
                  </span>
                  <span className={`text-sm font-bold ${impactColors[evt.impact]}`}>
                    {evt.impact}
                  </span>
                  <button
                    onClick={() => handleEdit(evt)}
                    className="text-xs px-3 py-1 rounded-full font-medium transition-colors bg-dark-highlight text-[#B3B3B3] hover:text-white"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handlePublish(evt)}
                    className="text-xs px-3 py-1 rounded-full font-medium transition-colors bg-accent-gradient text-white"
                  >
                    발행
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
