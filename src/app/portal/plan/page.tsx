'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePortal } from '@/contexts/PortalContext';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
} from 'lucide-react';
import type { MonthlyStrategy } from '@/types/strategy';

const statusLabels: Record<string, string> = {
  DRAFT: '초안',
  AWAITING_APPROVAL: '승인 대기',
  APPROVED: '승인 완료',
  RUNNING: '집행 중',
  REPORT_READY: '리포트 준비',
  ARCHIVED: '보관됨',
};

const impactConfig = {
  high: { icon: ArrowUpRight, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: '높음' },
  medium: { icon: Minus, color: 'text-blue-400', bg: 'bg-blue-500/10', label: '보통' },
  low: { icon: ArrowDownRight, color: 'text-[#6A6A6A]', bg: 'bg-dark-highlight', label: '낮음' },
};

const effortLabels = { high: '많음', medium: '보통', low: '적음' };

const categoryColors: Record<string, string> = {
  pricing: 'bg-emerald-500/10 text-emerald-400',
  content: 'bg-purple-500/10 text-purple-400',
  photos: 'bg-pink-500/10 text-pink-400',
  amenities: 'bg-blue-500/10 text-blue-400',
  reviews: 'bg-orange-500/10 text-orange-400',
  response: 'bg-cyan-500/10 text-cyan-400',
};

export default function PlanPage() {
  const { status, setStatus, plan, currentMonth, activeProperty, isLoading } = usePortal();
  const [strategy, setStrategy] = useState<MonthlyStrategy | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    async function fetchStrategy() {
      try {
        const params = new URLSearchParams({ month: currentMonth });
        const res = await fetch(`/api/portal/strategy?${params}`);
        const json = await res.json();
        if (json.success && json.data) {
          setStrategy(json.data as MonthlyStrategy);
        }
      } catch {
        // ignore
      } finally {
        setFetchLoading(false);
      }
    }
    if (!isLoading && activeProperty) {
      fetchStrategy();
    } else if (!isLoading) {
      setFetchLoading(false);
    }
  }, [isLoading, activeProperty, currentMonth]);

  if (isLoading || fetchLoading) {
    return <PortalSkeleton />;
  }

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    return `${year}년 ${parseInt(monthNum)}월`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">이번 달 전략</h1>
          <p className="text-[#B3B3B3]">{formatMonth(currentMonth)} 전략 브리프</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          status === 'APPROVED' || status === 'RUNNING'
            ? 'bg-emerald-500/10 text-emerald-400'
            : status === 'AWAITING_APPROVAL'
            ? 'bg-orange-500/10 text-orange-400'
            : 'bg-dark-highlight text-[#B3B3B3]'
        }`}>
          {statusLabels[status] || status}
        </span>
      </div>

      {/* AI 전략 요약 */}
      {strategy ? (
        <>
          {/* Summary */}
          <div className="p-6 rounded-2xl bg-dark-elevated border border-purple-500/10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-400 font-medium">AI 전략 분석</span>
            </div>
            <p className="text-[#B3B3B3] leading-relaxed">{strategy.summary}</p>
          </div>

          {/* Key Insights */}
          <div className="p-6 rounded-2xl bg-dark-elevated">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              핵심 인사이트
            </h3>
            <div className="space-y-2">
              {strategy.keyInsights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-purple-400 font-bold shrink-0">{i + 1}.</span>
                  <span className="text-[#B3B3B3]">{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priorities */}
          <div>
            <h3 className="text-sm font-semibold mb-4">우선순위 액션</h3>
            <div className="space-y-3">
              {strategy.priorities.map((p) => {
                const impact = impactConfig[p.impact];
                const ImpactIcon = impact.icon;
                const catColor = categoryColors[p.category] || 'bg-dark-highlight text-[#B3B3B3]';

                return (
                  <div key={p.rank} className="p-4 rounded-xl bg-dark-elevated flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${impact.bg} flex items-center justify-center shrink-0`}>
                      <span className="text-lg font-bold text-white">{p.rank}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{p.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${catColor}`}>
                          {p.category}
                        </span>
                      </div>
                      <p className="text-sm text-[#B3B3B3]">{p.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs">
                          <ImpactIcon className={`w-3 h-3 ${impact.color}`} />
                          <span className={impact.color}>영향: {impact.label}</span>
                        </div>
                        <span className="text-xs text-[#6A6A6A]">노력: {effortLabels[p.effort]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strategy summaries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategy.pricingStrategy && (
              <div className="p-5 rounded-2xl bg-dark-elevated">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs text-[#6A6A6A] uppercase tracking-wider">가격 전략</h4>
                </div>
                <p className="text-sm text-[#B3B3B3]">{strategy.pricingStrategy}</p>
              </div>
            )}
            {strategy.contentStrategy && (
              <div className="p-5 rounded-2xl bg-dark-elevated">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs text-[#6A6A6A] uppercase tracking-wider">콘텐츠 전략</h4>
                </div>
                <p className="text-sm text-[#B3B3B3]">{strategy.contentStrategy}</p>
              </div>
            )}
          </div>

          {/* Seasonal factors */}
          {strategy.seasonalFactors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {strategy.seasonalFactors.map((factor) => (
                <span key={factor} className="px-3 py-1 text-xs rounded-full bg-dark-highlight text-[#B3B3B3]">
                  {factor}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Fallback: 기존 plan 데이터 표시 */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-dark-elevated">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
              <Target className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">타겟 국가</h3>
            <div className="flex flex-wrap gap-2">
              {plan.targetCountries.map((country) => (
                <span key={country} className="px-3 py-1 rounded-full text-sm bg-dark-highlight">{country}</span>
              ))}
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-dark-elevated">
            <h3 className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">채널</h3>
            <div className="flex flex-wrap gap-2">
              {plan.platforms.map((p) => (
                <span key={p} className="px-3 py-1 rounded-full text-sm bg-dark-highlight">{p}</span>
              ))}
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-dark-elevated">
            <h3 className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">메시지 포커스</h3>
            <div className="flex flex-wrap gap-2">
              {plan.messageFocus.map((f) => (
                <span key={f} className="px-3 py-1 rounded-full text-sm bg-dark-highlight">{f}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Approval */}
      {status === 'AWAITING_APPROVAL' && (
        <div className="p-6 rounded-2xl bg-dark-surface border border-purple-500/20">
          <h3 className="font-semibold mb-2">플랜 승인이 필요합니다</h3>
          <p className="text-sm text-[#B3B3B3] mb-4">
            전략을 검토하신 후 승인하거나 수정을 요청해주세요.
          </p>
          <div className="flex gap-3">
            <Button variant="gradient" onClick={() => setStatus('APPROVED')}>
              승인하기
            </Button>
            <Button variant="outline" onClick={() => setStatus('DRAFT')} className="border-dark-highlight text-[#B3B3B3] hover:text-white hover:bg-dark-highlight">
              수정 요청
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
