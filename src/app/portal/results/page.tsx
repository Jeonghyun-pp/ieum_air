'use client';

import { usePortal } from '@/contexts/PortalContext';
import { usePortalData } from '@/hooks/usePortalData';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, Minus, FileText } from 'lucide-react';

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

  if (isLoading) {
    return <PortalSkeleton />;
  }

  const isAccessible = status === 'REPORT_READY' || status === 'ARCHIVED';

  if (!isAccessible) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">성과</h1>
          <p className="text-[#B3B3B3]">월간 성과 리포트</p>
        </div>
        <div className="p-12 rounded-2xl bg-dark-elevated text-center">
          <FileText className="w-12 h-12 text-[#6A6A6A] mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">리포트가 아직 준비되지 않았습니다</p>
          <p className="text-sm text-[#6A6A6A]">집행이 완료되면 성과를 확인할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  const results = data || { highlights: [], metrics: [] };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    return `${year}년 ${parseInt(monthNum)}월`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">성과</h1>
        <p className="text-[#B3B3B3]">{formatMonth(currentMonth)} 성과 리포트</p>
      </div>

      {/* Highlights */}
      <div className="p-6 rounded-2xl bg-dark-elevated">
        <h3 className="text-sm font-semibold mb-4">핵심 성과</h3>
        <div className="space-y-3">
          {results.highlights.map((highlight, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-sm text-[#B3B3B3]">{highlight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {results.metrics.map((metric, i) => {
          const isPositive = metric.delta.startsWith('+') || metric.delta.includes('증가');
          const isNegative = metric.delta.startsWith('-') || metric.delta.includes('감소');
          return (
            <div key={i} className="p-6 rounded-2xl bg-dark-elevated">
              <div className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">
                {metric.label}
              </div>
              <div className="text-3xl font-bold mb-2">{metric.value}</div>
              <div className={`flex items-center gap-1 text-sm ${
                isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-[#6A6A6A]'
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

      {/* Download */}
      <div className="p-6 rounded-2xl bg-dark-surface border border-purple-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">리포트 다운로드</h3>
            <p className="text-sm text-[#B3B3B3]">상세 성과 리포트를 PDF로 다운로드합니다.</p>
          </div>
          <Button variant="gradient" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            PDF 다운로드
          </Button>
        </div>
      </div>
    </div>
  );
}
