'use client';

import { useEffect, useState } from 'react';
import { usePortal } from '@/contexts/PortalContext';
import { usePortalData } from '@/hooks/usePortalData';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { Button } from '@/components/ui/button';
import {
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  BarChart3,
} from 'lucide-react';
import type { PerformanceSnapshot } from '@/types/monitoring';

interface Metric {
  label: string;
  value: string;
  delta: string;
}

interface ResultsData {
  highlights: string[];
  metrics: Metric[];
  reportUrl?: string;
}

export default function ResultsPage() {
  const { status, activeProperty, currentMonth } = usePortal();
  const { data, isLoading } = usePortalData<ResultsData>({
    endpoint: 'results',
    propertyId: activeProperty?.id,
    month: currentMonth,
  });

  const [trend, setTrend] = useState<PerformanceSnapshot[]>([]);

  useEffect(() => {
    async function fetchTrend() {
      try {
        const res = await fetch('/api/portal/performance');
        const json = await res.json();
        if (json.success && json.data) {
          setTrend(json.data as PerformanceSnapshot[]);
        }
      } catch {
        // ignore
      }
    }
    if (activeProperty) fetchTrend();
  }, [activeProperty]);

  if (isLoading) {
    return <PortalSkeleton />;
  }

  const isAccessible = status === 'REPORT_READY' || status === 'ARCHIVED';
  const results = data || { highlights: [], metrics: [] };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    return `${year}년 ${parseInt(monthNum)}월`;
  };

  const formatShortMonth = (month: string) => {
    const [, monthNum] = month.split('-');
    return `${parseInt(monthNum)}월`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">성과</h1>
        <p className="text-muted-foreground">{formatMonth(currentMonth)} 성과 리포트</p>
      </div>

      {/* Performance Trend */}
      {trend.length >= 2 && (
        <div className="p-6 rounded-2xl bg-dark-elevated">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold">점수 추이</h3>
          </div>
          <div className="flex items-end gap-2 h-40">
            {trend.map((snap) => {
              const height = Math.max(8, (snap.healthScore / 100) * 100);
              return (
                <div key={snap.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-foreground">{snap.healthScore}</span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-purple-400 transition-all duration-500"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{formatShortMonth(snap.month)}</span>
                </div>
              );
            })}
          </div>
          {trend.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
              {Object.entries(trend[trend.length - 1].categoryScores).slice(0, 6).map(([key, score]) => (
                <div key={key} className="text-center">
                  <div className="text-xs text-muted-foreground">{key}</div>
                  <div className="text-sm font-bold">{score}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick stats */}
      {trend.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '종합 점수', value: `${trend[trend.length - 1].healthScore}`, sub: trend[trend.length - 1].healthGrade },
            { label: '순위', value: `${trend[trend.length - 1].rank}/${trend[trend.length - 1].totalInCompSet}`, sub: '' },
            { label: '점유율', value: `${trend[trend.length - 1].occupancyRate}%`, sub: '' },
            { label: '완료 액션', value: `${trend[trend.length - 1].actionsCompleted}개`, sub: '' },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-xl bg-dark-elevated text-center">
              <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-xl font-bold">{stat.value}</div>
              {stat.sub && (
                <span className={`text-xs font-bold ${
                  stat.sub === 'A' ? 'text-emerald-500' :
                  stat.sub === 'B' ? 'text-blue-500' :
                  stat.sub === 'C' ? 'text-yellow-500' : 'text-red-500'
                }`}>{stat.sub}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Report content */}
      {!isAccessible && results.highlights.length === 0 ? (
        <div className="p-12 rounded-2xl bg-dark-elevated text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">리포트가 아직 준비되지 않았습니다</p>
          <p className="text-sm text-muted-foreground">집행이 완료되면 성과를 확인할 수 있습니다.</p>
        </div>
      ) : (
        <>
          {results.highlights.length > 0 && (
            <div className="p-6 rounded-2xl bg-dark-elevated">
              <h3 className="text-sm font-semibold mb-4">핵심 성과</h3>
              <div className="space-y-3">
                {results.highlights.map((highlight, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-sm text-muted-foreground">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.metrics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results.metrics.map((metric, i) => {
                const isPositive = metric.delta.startsWith('+') || metric.delta.includes('증가') || metric.delta.includes('상승');
                const isNegative = metric.delta.startsWith('-') || metric.delta.includes('감소') || metric.delta.includes('하락');
                return (
                  <div key={i} className="p-6 rounded-2xl bg-dark-elevated">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{metric.label}</div>
                    <div className="text-3xl font-bold mb-2">{metric.value}</div>
                    <div className={`flex items-center gap-1 text-sm ${
                      isPositive ? 'text-emerald-500' : isNegative ? 'text-red-500' : 'text-muted-foreground'
                    }`}>
                      {isPositive ? <TrendingUp className="w-4 h-4" /> :
                       isNegative ? <TrendingDown className="w-4 h-4" /> :
                       <Minus className="w-4 h-4" />}
                      <span>{metric.delta}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-6 rounded-2xl bg-dark-surface border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">리포트 다운로드</h3>
                <p className="text-sm text-muted-foreground">상세 성과 리포트를 PDF로 다운로드합니다.</p>
              </div>
              <Button variant="gradient" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                PDF 다운로드
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
