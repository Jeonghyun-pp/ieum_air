'use client';

import { useState } from 'react';
import { Bell, ChevronDown, Menu } from 'lucide-react';
import { usePortal } from '@/contexts/PortalContext';

export function PortalTopNav() {
  const { properties, activeProperty, setActivePropertyId, currentMonth, setCurrentMonth } = usePortal();
  const [isPropertyOpen, setIsPropertyOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    return `${year}년 ${parseInt(monthNum)}월`;
  };

  // 최근 3개월 목록 생성
  const getMonthOptions = () => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
  };

  const propertyName = activeProperty?.name || '숙소 없음';

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 bg-dark-base/80 backdrop-blur-lg border-b border-dark-highlight">
      {/* Left: Mobile menu + Property/Month */}
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button className="md:hidden p-2 rounded-lg hover:bg-dark-highlight text-[#B3B3B3]">
          <Menu className="w-5 h-5" />
        </button>

        {/* Property selector */}
        <div className="relative">
          <button
            onClick={() => { setIsPropertyOpen(!isPropertyOpen); setIsMonthOpen(false); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-elevated hover:bg-dark-highlight transition-colors text-sm"
          >
            <span className="font-medium">{propertyName}</span>
            {properties.length > 1 && <ChevronDown className="w-4 h-4 text-[#6A6A6A]" />}
          </button>
          {isPropertyOpen && properties.length > 1 && (
            <div className="absolute top-full left-0 mt-2 w-64 rounded-xl bg-dark-elevated border border-dark-highlight shadow-2xl z-50 overflow-hidden">
              {properties.map((prop) => (
                <button
                  key={prop.id}
                  onClick={() => { setActivePropertyId(prop.id); setIsPropertyOpen(false); }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-dark-highlight transition-colors"
                >
                  <div className="font-medium">{prop.name}</div>
                  <div className="text-xs text-[#6A6A6A]">{prop.region}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Month selector */}
        <div className="relative">
          <button
            onClick={() => { setIsMonthOpen(!isMonthOpen); setIsPropertyOpen(false); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-elevated hover:bg-dark-highlight transition-colors text-sm text-[#B3B3B3]"
          >
            <span>{formatMonth(currentMonth)}</span>
            <ChevronDown className="w-4 h-4 text-[#6A6A6A]" />
          </button>
          {isMonthOpen && (
            <div className="absolute top-full left-0 mt-2 w-44 rounded-xl bg-dark-elevated border border-dark-highlight shadow-2xl z-50 overflow-hidden">
              {getMonthOptions().map((month) => (
                <button
                  key={month}
                  onClick={() => { setCurrentMonth(month); setIsMonthOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-dark-highlight transition-colors"
                >
                  {formatMonth(month)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Notification */}
      <button className="relative p-2 rounded-full hover:bg-dark-highlight transition-colors">
        <Bell className="w-5 h-5 text-[#B3B3B3]" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-purple" />
      </button>
    </header>
  );
}
