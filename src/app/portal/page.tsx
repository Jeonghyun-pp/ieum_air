'use client';

import Link from 'next/link';
import {
  CalendarDays,
  Image,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { usePortal } from '@/contexts/PortalContext';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';

const quickActions = [
  {
    icon: CalendarDays,
    label: '가격 캘린더',
    desc: '3건 새 추천',
    href: '/portal/pricing',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Image,
    label: '콘텐츠',
    desc: '2개 제작완료',
    href: '/portal/content',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
  {
    icon: BarChart3,
    label: '분석 리포트',
    desc: '이번 달 업데이트',
    href: '/portal/analytics',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
];

const highlights = [
  { text: '가격 조정 3건 추천 (벚꽃축제, BTS 콘서트)', color: 'bg-emerald-400' },
  { text: '인스타 릴스 2개 제작 완료', color: 'bg-pink-400' },
  { text: '네이버 블로그 1건 발행 예정', color: 'bg-blue-400' },
];

export default function PortalHomePage() {
  const { activeProperty, strategySummary, reasons, todos, isLoading } = usePortal();

  if (isLoading) {
    return <PortalSkeleton />;
  }

  const propertyName = activeProperty?.name || '게스트';

  return (
    <div className="space-y-8">
      {/* Greeting + Strategy summary */}
      <div>
        <h1 className="text-2xl font-bold mb-2">
          안녕하세요, {propertyName}
        </h1>
        <p className="text-[#B3B3B3] text-lg">{strategySummary || '곧 이번 달 전략이 준비됩니다.'}</p>
        {reasons.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {reasons.map((reason) => (
              <span
                key={reason}
                className="px-3 py-1 text-xs rounded-full bg-dark-highlight text-[#B3B3B3]"
              >
                {reason}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-4 p-4 rounded-xl bg-dark-elevated hover:bg-dark-highlight transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-6 h-6 ${action.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{action.label}</div>
                <div className="text-xs text-[#6A6A6A]">{action.desc}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#6A6A6A] opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          );
        })}
      </div>

      {/* Highlights */}
      <div>
        <h2 className="text-lg font-semibold mb-4">이번 달 하이라이트</h2>
        <div className="space-y-3">
          {highlights.map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-3 p-4 rounded-xl bg-dark-elevated"
            >
              <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
              <span className="text-sm text-[#B3B3B3]">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Todo list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">할 일</h2>
          <Link
            href="/portal/assets"
            className="text-sm text-accent-purple hover:underline"
          >
            전체 보기
          </Link>
        </div>
        <div className="space-y-2">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 p-4 rounded-xl bg-dark-elevated"
            >
              {todo.status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-[#6A6A6A] shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${
                  todo.status === 'completed' ? 'text-[#6A6A6A] line-through' : 'text-white'
                }`}>
                  {todo.title}
                </span>
              </div>
              {todo.required && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">
                  필수
                </span>
              )}
              <span className="text-xs text-[#6A6A6A]">
                {todo.due}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
