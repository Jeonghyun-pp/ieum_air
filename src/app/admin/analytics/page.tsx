'use client';

import Link from 'next/link';
import {
  BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TrendingUp, Users, CreditCard, Eye, Loader2 } from 'lucide-react';
import { useAdminApi } from '@/hooks/useAdminApi';

const tooltipStyle = {
  contentStyle: { backgroundColor: '#282828', border: 'none', borderRadius: '8px', fontSize: '12px' },
  labelStyle: { color: '#B3B3B3' },
  itemStyle: { color: '#FFFFFF' },
};

export default function AdminAnalyticsPage() {
  const { data: properties, isLoading, error } = useAdminApi<any[]>({ endpoint: 'properties' });

  const overviewMetrics = [
    { label: '총 예약 수', value: '—', delta: '데이터 수집 중', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: '총 매출', value: '—', delta: '데이터 수집 중', icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: '평균 객단가', value: '—', delta: '데이터 수집 중', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: '리스팅 조회', value: '—', delta: '데이터 수집 중', icon: Eye, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ];

  const clientComparison = (properties || []).map((p: any) => ({
    id: p.id,
    name: p.name || p.id,
    contentCount: p.contentCount ?? 0,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#6A6A6A]" />
        <span className="ml-2 text-sm text-[#6A6A6A]">데이터를 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-400">오류: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">전체 분석</h1>
        {properties && (
          <span className="text-sm text-[#B3B3B3]">활성 고객: {properties.length}명</span>
        )}
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewMetrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="p-5 rounded-2xl bg-dark-elevated">
              <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <div className="text-2xl font-bold">{m.value}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-[#6A6A6A]">{m.label}</span>
                <span className="text-xs text-[#6A6A6A]">{m.delta}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly Revenue Chart */}
      <div className="p-6 rounded-2xl bg-dark-elevated">
        <h2 className="text-sm font-semibold mb-4">월별 매출 추이 (만원)</h2>
        <div className="flex items-center justify-center h-[280px] text-sm text-[#6A6A6A]">
          데이터 수집 후 표시됩니다
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Comparison */}
        <div className="p-6 rounded-2xl bg-dark-elevated">
          <h2 className="text-sm font-semibold mb-4">고객별 콘텐츠 수 비교</h2>
          {clientComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={clientComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#282828" horizontal={false} />
                <XAxis type="number" stroke="#6A6A6A" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#6A6A6A" fontSize={11} width={80} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="contentCount" fill="#6366F1" radius={[0, 4, 4, 0]} name="콘텐츠 수" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-sm text-[#6A6A6A]">
              등록된 고객이 없습니다
            </div>
          )}
        </div>

        {/* Nationality Distribution */}
        <div className="p-6 rounded-2xl bg-dark-elevated">
          <h2 className="text-sm font-semibold mb-4">전체 게스트 국적 비율</h2>
          <div className="flex items-center justify-center h-[280px] text-sm text-[#6A6A6A]">
            데이터 수집 후 표시됩니다
          </div>
        </div>
      </div>

      {/* Client Detail Links */}
      <div className="p-6 rounded-2xl bg-dark-elevated">
        <h2 className="text-sm font-semibold mb-4">고객별 상세 분석</h2>
        {clientComparison.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientComparison.map((client: any) => (
              <Link
                key={client.id}
                href={`/admin/analytics/${client.id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-dark-highlight hover:bg-dark-highlight/80 transition-colors group"
              >
                <div>
                  <div className="text-sm font-medium group-hover:text-white transition-colors">{client.name}</div>
                  <div className="text-xs text-[#6A6A6A]">콘텐츠 {client.contentCount}건</div>
                </div>
                <span className="text-xs text-accent-purple group-hover:underline">상세 →</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[#6A6A6A]">등록된 고객이 없습니다</div>
        )}
      </div>
    </div>
  );
}
