'use client';

import { Button } from '@/components/ui/button';
import { usePortal } from '@/contexts/PortalContext';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { Target, Megaphone, MessageSquare, CheckCircle2 } from 'lucide-react';

const statusLabels: Record<string, string> = {
  DRAFT: '초안',
  AWAITING_APPROVAL: '승인 대기',
  APPROVED: '승인 완료',
  RUNNING: '집행 중',
  REPORT_READY: '리포트 준비',
  ARCHIVED: '보관됨',
};

export default function PlanPage() {
  const { status, setStatus, plan, currentMonth, isLoading } = usePortal();

  if (isLoading) {
    return <PortalSkeleton />;
  }

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    return `${year}년 ${parseInt(monthNum)}월`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">이번 달 전략</h1>
        <p className="text-[#B3B3B3]">{formatMonth(currentMonth)} 전략 브리프</p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3">
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

      {/* Strategy cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-dark-elevated">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
            <Target className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">타겟 국가</h3>
          <div className="flex flex-wrap gap-2">
            {plan.targetCountries.map((country) => (
              <span key={country} className="px-3 py-1 rounded-full text-sm bg-dark-highlight">
                {country}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-dark-elevated">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
            <Megaphone className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">채널</h3>
          <div className="flex flex-wrap gap-2">
            {plan.platforms.map((platform) => (
              <span key={platform} className="px-3 py-1 rounded-full text-sm bg-dark-highlight">
                {platform}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-dark-elevated">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
            <MessageSquare className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">메시지 포커스</h3>
          <div className="flex flex-wrap gap-2">
            {plan.messageFocus.map((focus) => (
              <span key={focus} className="px-3 py-1 rounded-full text-sm bg-dark-highlight">
                {focus}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Approval */}
      {status === 'AWAITING_APPROVAL' && (
        <div className="p-6 rounded-2xl bg-dark-surface border border-purple-500/20">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold">플랜 승인이 필요합니다</h3>
          </div>
          <p className="text-sm text-[#B3B3B3] mb-6">
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
