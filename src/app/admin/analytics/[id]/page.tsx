'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { useAdminApi, useAdminMutation } from '@/hooks/useAdminApi';

const tooltipStyle = {
  contentStyle: { backgroundColor: '#282828', border: 'none', borderRadius: '8px', fontSize: '12px' },
  labelStyle: { color: '#B3B3B3' },
  itemStyle: { color: '#FFFFFF' },
};

export default function ClientAnalyticsPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError, refetch } = useAdminApi<any>({ endpoint: `properties/${id}/analytics` });
  const { data: propertyData, isLoading: propertyLoading } = useAdminApi<any>({ endpoint: `properties/${id}` });
  const { mutate } = useAdminMutation();

  const [publishStatus, setPublishStatus] = useState<string | null>(null);
  const [aggregateStatus, setAggregateStatus] = useState<string | null>(null);

  const isLoading = analyticsLoading || propertyLoading;
  const clientName = propertyData?.name || '불러오는 중...';
  const aggregated = analyticsData?.aggregated || null;
  const month = analyticsData?.month || new Date().toISOString().slice(0, 7);
  const pricingRecommendations = analyticsData?.pricingRecommendations?.recommendations || [];

  // Summary cards from GA4 aggregated data
  const summaryCards = [
    {
      label: '총 사용자',
      value: aggregated?.ga4?.totalUsers != null ? `${aggregated.ga4.totalUsers.toLocaleString()}명` : '—',
      delta: aggregated ? '' : '데이터 없음',
    },
    {
      label: '세션 수',
      value: aggregated?.ga4?.sessions != null ? `${aggregated.ga4.sessions.toLocaleString()}` : '—',
      delta: aggregated ? '' : '데이터 없음',
    },
    {
      label: '페이지뷰',
      value: aggregated?.ga4?.pageViews != null ? `${aggregated.ga4.pageViews.toLocaleString()}` : '—',
      delta: aggregated ? '' : '데이터 없음',
    },
    {
      label: 'Instagram 팔로워',
      value: aggregated?.instagram?.followers != null ? `${aggregated.instagram.followers.toLocaleString()}` : '—',
      delta: aggregated ? '' : '데이터 없음',
    },
  ];

  const bookingTrend = aggregated?.bookingTrend || [];
  const nationalityData = aggregated?.nationalityBreakdown || [];
  const channelData = aggregated?.channelData || [];

  const handlePublish = async () => {
    setPublishStatus('발행 중...');
    const result = await mutate(`properties/${id}/results/generate`, 'POST', { month });
    if (result.success) {
      setPublishStatus('포털에 발행되었습니다!');
    } else {
      setPublishStatus(`오류: ${result.error}`);
    }
    setTimeout(() => setPublishStatus(null), 3000);
  };

  const handleAggregate = async () => {
    setAggregateStatus('집계 실행 중...');
    const result = await mutate(`properties/${id}/analytics`, 'POST', { month });
    if (result.success) {
      setAggregateStatus('집계 완료!');
      refetch();
    } else {
      setAggregateStatus(`오류: ${result.error}`);
    }
    setTimeout(() => setAggregateStatus(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link href="/admin/analytics" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          전체 분석으로
        </Link>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">데이터를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (analyticsError) {
    return (
      <div className="space-y-6">
        <Link href="/admin/analytics" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          전체 분석으로
        </Link>
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-red-400">오류: {analyticsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/analytics" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        전체 분석으로
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{clientName}</h1>
          <p className="text-sm text-muted-foreground mt-1">고객별 상세 분석 리포트 · {month}</p>
        </div>
        <button
          onClick={handleAggregate}
          disabled={!!aggregateStatus}
          className="px-4 py-2 rounded-full bg-dark-highlight text-sm font-medium hover:bg-dark-highlight/80 transition-colors disabled:opacity-50"
        >
          {aggregateStatus || '집계 실행'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((m) => (
          <div key={m.label} className="p-5 rounded-2xl bg-dark-elevated">
            <div className="text-2xl font-bold">{m.value}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">{m.label}</span>
              {m.delta && <span className="text-xs text-muted-foreground">{m.delta}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Booking Trend */}
      <div className="p-6 rounded-2xl bg-dark-elevated">
        <h2 className="text-sm font-semibold mb-4">예약 추이 (서비스 적용 전/후)</h2>
        {bookingTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={bookingTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
              <XAxis dataKey="month" stroke="#6A6A6A" fontSize={12} />
              <YAxis stroke="#6A6A6A" fontSize={12} />
              <Tooltip {...tooltipStyle} />
              <Legend
                formatter={(value: string) => (
                  <span style={{ color: '#B3B3B3', fontSize: '12px' }}>
                    {value === 'bookings' ? '예약' : '조회'}
                  </span>
                )}
              />
              <Line type="monotone" dataKey="bookings" stroke="#6A6A6A" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="views" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
            집계된 예약 데이터가 없습니다
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nationality Distribution */}
        <div className="p-6 rounded-2xl bg-dark-elevated">
          <h2 className="text-sm font-semibold mb-4">게스트 국적 비율</h2>
          {nationalityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={nationalityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {nationalityData.map((entry: any) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value: string) => <span style={{ color: '#B3B3B3', fontSize: '12px' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
              집계된 국적 데이터가 없습니다
            </div>
          )}
        </div>

        {/* Channel Performance */}
        <div className="p-6 rounded-2xl bg-dark-elevated">
          <h2 className="text-sm font-semibold mb-4">채널별 성과</h2>
          {channelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
                <XAxis dataKey="channel" stroke="#6A6A6A" fontSize={10} />
                <YAxis stroke="#6A6A6A" fontSize={12} />
                <Tooltip {...tooltipStyle} />
                <Legend
                  formatter={(value: string) => (
                    <span style={{ color: '#B3B3B3', fontSize: '12px' }}>
                      {value === 'visitors' ? '방문자' : value}
                    </span>
                  )}
                />
                <Bar dataKey="visitors" fill="#6366F1" radius={[4, 4, 0, 0]} name="visitors" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
              집계된 채널 데이터가 없습니다
            </div>
          )}
        </div>
      </div>

      {/* Pricing Recommendations */}
      <div className="p-6 rounded-2xl bg-dark-elevated">
        <h2 className="text-sm font-semibold mb-4">가격 조정 추천</h2>
        {pricingRecommendations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-3 font-medium">이벤트</th>
                  <th className="text-left py-3 font-medium">추천 조정</th>
                  <th className="text-left py-3 font-medium">사유</th>
                </tr>
              </thead>
              <tbody>
                {pricingRecommendations.map((row: any, idx: number) => (
                  <tr key={`${row.eventName}-${idx}`} className="border-b border-border/50">
                    <td className="py-3 font-medium">{row.eventName}</td>
                    <td className="py-3 text-orange-400 font-bold">{row.recommendedAdjustment}</td>
                    <td className="py-3 text-muted-foreground">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">가격 조정 추천이 없습니다</div>
        )}
      </div>

      {/* Generate Report Button */}
      <div className="p-6 rounded-2xl bg-dark-surface border border-purple-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">리포트 생성</h3>
            <p className="text-sm text-muted-foreground">이 분석 데이터를 고객 포털에 발행하거나 PDF로 내보냅니다.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-full bg-dark-highlight text-sm font-medium hover:bg-dark-highlight/80 transition-colors">
              PDF 내보내기
            </button>
            <button
              onClick={handlePublish}
              disabled={!!publishStatus}
              className="px-4 py-2 rounded-full bg-accent-gradient text-white text-sm font-medium disabled:opacity-50"
            >
              {publishStatus || '포털에 발행'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
