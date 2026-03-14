'use client';

import { Users, CreditCard, ListTodo, Clock } from 'lucide-react';
import Link from 'next/link';
import { useAdminApi } from '@/hooks/useAdminApi';

function mapPlanStatus(currentPlanStatus: string | null, status: string): { label: string; color: string } {
  if (currentPlanStatus) {
    switch (currentPlanStatus) {
      case 'DRAFT':
        return { label: '전략 수립', color: 'text-orange-400' };
      case 'RUNNING':
        return { label: '운영중', color: 'text-blue-400' };
      case 'AWAITING_APPROVAL':
        return { label: '승인 대기', color: 'text-yellow-400' };
      case 'REPORT_READY':
        return { label: '리포트', color: 'text-emerald-400' };
      case 'COMPLETED':
        return { label: '완료', color: 'text-emerald-400' };
      default:
        return { label: currentPlanStatus, color: 'text-muted-foreground' };
    }
  }

  switch (status) {
    case 'active':
      return { label: '운영중', color: 'text-blue-400' };
    case 'onboarding':
      return { label: '온보딩', color: 'text-orange-400' };
    case 'paused':
      return { label: '일시정지', color: 'text-muted-foreground' };
    default:
      return { label: status, color: 'text-muted-foreground' };
  }
}

export default function AdminDashboard() {
  const { data: properties, isLoading, error } = useAdminApi<any[]>({ endpoint: 'properties' });

  const activeCount = properties?.filter((p) => p.status === 'active').length ?? 0;
  const totalContentCount = properties?.reduce((sum, p) => sum + (p.contentCount ?? 0), 0) ?? 0;

  const metrics = [
    { label: '활성 고객', value: String(activeCount), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: '이번 달 매출', value: '—', icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: '대기 작업', value: String(totalContentCount), icon: ListTodo, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: '오늘 마감', value: '—', icon: Clock, color: 'text-red-400', bg: 'bg-red-500/10' },
  ];

  const clients = (properties ?? []).map((p) => {
    const { label, color } = mapPlanStatus(p.currentPlanStatus, p.status);
    return {
      id: p.id,
      name: p.name,
      plan: p.selectedPlan ?? '—',
      progress: `${p.contentCount ?? 0}건`,
      status: label,
      statusColor: color,
    };
  });

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <div className="p-12 rounded-2xl bg-dark-elevated text-center">
          <p className="text-sm text-red-400">데이터를 불러오지 못했습니다: {error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-dark-elevated animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-dark-highlight mb-3" />
              <div className="h-7 w-12 bg-dark-highlight rounded mb-2" />
              <div className="h-3 w-16 bg-dark-highlight rounded" />
            </div>
          ))}
        </div>
        <div className="p-6 rounded-2xl bg-dark-elevated animate-pulse">
          <div className="h-4 w-20 bg-dark-highlight rounded mb-4" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-dark-highlight rounded mb-2" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="p-5 rounded-2xl bg-dark-elevated">
              <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <div className="text-2xl font-bold">{m.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
            </div>
          );
        })}
      </div>

      {/* Client status table */}
      <div className="p-6 rounded-2xl bg-dark-elevated">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">고객 현황</h2>
          <Link href="/admin/clients" className="text-sm text-accent-purple hover:underline">
            전체 보기
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-3 font-medium">숙소</th>
                <th className="text-left py-3 font-medium">플랜</th>
                <th className="text-left py-3 font-medium">진행률</th>
                <th className="text-left py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    등록된 숙소가 없습니다
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-dark-highlight/30 transition-colors">
                    <td className="py-3 font-medium">{c.name}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-dark-highlight">{c.plan}</span>
                    </td>
                    <td className="py-3 text-muted-foreground">{c.progress}</td>
                    <td className={`py-3 ${c.statusColor}`}>{c.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task list */}
      <div className="p-6 rounded-2xl bg-dark-elevated">
        <h2 className="text-sm font-semibold mb-4">이번 주 할 일</h2>
        <div className="flex items-center justify-center py-6">
          <p className="text-sm text-muted-foreground">
            작업 목록은 콘텐츠에서 확인하세요 →{' '}
            <Link href="/admin/content" className="text-accent-purple hover:underline">
              콘텐츠 관리
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
