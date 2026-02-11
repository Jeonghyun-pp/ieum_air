'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Property } from '@/lib/portal/types';

interface PortalTopNavProps {
  currentProperty: Property;
  currentMonth: string;
}

const mockProperties: Property[] = [
  { id: 'prop-001', name: '제주 오션뷰 리조트', location: '제주시' },
  { id: 'prop-002', name: '서울 강남 호텔', location: '서울시 강남구' },
  { id: 'prop-003', name: '부산 해운대 펜션', location: '부산시 해운대구' },
];

export function PortalTopNav({
  currentProperty,
  currentMonth,
}: PortalTopNavProps) {
  const [selectedProperty, setSelectedProperty] = useState(currentProperty);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [isPropertyOpen, setIsPropertyOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    return `${year}년 ${parseInt(monthNum)}월`;
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="text-lg font-semibold text-foreground">
            Client Portal
          </div>

          {/* 숙소 선택 (목업) */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPropertyOpen(!isPropertyOpen)}
              className="min-w-[200px] justify-between"
            >
              <span className="text-sm">
                {selectedProperty.name} ({selectedProperty.location})
              </span>
              <svg
                className="ml-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Button>
            {isPropertyOpen && (
              <div className="absolute top-full left-0 mt-1 w-full rounded-md border border-border bg-background shadow-lg z-10">
                {mockProperties.map((prop) => (
                  <button
                    key={prop.id}
                    onClick={() => {
                      setSelectedProperty(prop);
                      setIsPropertyOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent/50 transition-colors"
                  >
                    {prop.name} ({prop.location})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 월 선택 (목업) */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMonthOpen(!isMonthOpen)}
              className="min-w-[140px] justify-between"
            >
              <span className="text-sm">{formatMonth(selectedMonth)}</span>
              <svg
                className="ml-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Button>
            {isMonthOpen && (
              <div className="absolute top-full left-0 mt-1 w-full rounded-md border border-border bg-background shadow-lg z-10">
                {['2026-01', '2026-02', '2026-03'].map((month) => (
                  <button
                    key={month}
                    onClick={() => {
                      setSelectedMonth(month);
                      setIsMonthOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent/50 transition-colors"
                  >
                    {formatMonth(month)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 알림 아이콘 (목업) */}
        <Button variant="ghost" size="icon" className="relative">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-600"></span>
        </Button>
      </div>
    </header>
  );
}
