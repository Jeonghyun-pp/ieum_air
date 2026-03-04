'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Calendar, CreditCard,
  CheckCircle2, Clock, Circle, MessageSquare,
  Globe, Camera, FileText, BarChart3, CalendarDays, Palette,
  Instagram, Youtube, Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAdminApi, useAdminMutation } from '@/hooks/useAdminApi';

const planColors: Record<string, string> = {
  '베이직': 'bg-gray-500/10 text-gray-400',
  '스탠다드': 'bg-purple-500/10 text-purple-400',
  '프리미엄': 'bg-emerald-500/10 text-emerald-400',
};

const platformIconMap: Record<string, { icon: typeof Globe; color: string; bg: string }> = {
  airbnb: { icon: Globe, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  instagram: { icon: Instagram, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  ga4: { icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  youtube: { icon: Youtube, color: 'text-red-400', bg: 'bg-red-500/10' },
  blog: { icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  naver: { icon: FileText, color: 'text-green-400', bg: 'bg-green-500/10' },
  calendar: { icon: CalendarDays, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  content: { icon: Camera, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  design: { icon: Palette, color: 'text-orange-400', bg: 'bg-orange-500/10' },
};

const statusColorMap: Record<string, string> = {
  connected: 'text-emerald-400',
  active: 'text-emerald-400',
  pending: 'text-orange-400',
  disconnected: 'text-[#6A6A6A]',
  error: 'text-red-400',
};

function formatDate(raw: any): string {
  if (!raw) return '-';
  if (typeof raw === 'string') return raw;
  if (raw._seconds) return new Date(raw._seconds * 1000).toLocaleDateString('ko-KR');
  if (raw.seconds) return new Date(raw.seconds * 1000).toLocaleDateString('ko-KR');
  return String(raw);
}

export default function ClientDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading: propertyLoading, error: propertyError } = useAdminApi<any>({
    endpoint: `properties/${id}`,
  });

  const { data: memos, isLoading: memosLoading, refetch: refetchMemos } = useAdminApi<any[]>({
    endpoint: `properties/${id}/memos`,
  });

  const { data: activity, isLoading: activityLoading } = useAdminApi<any[]>({
    endpoint: `properties/${id}/activity`,
  });

  const { mutate } = useAdminMutation();

  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync latest memo content when memos load
  useEffect(() => {
    if (memos && memos.length > 0) {
      setMemo(memos[0].content || '');
    }
  }, [memos]);

  const handleSaveMemo = async () => {
    setSaving(true);
    try {
      await mutate(`properties/${id}/memos`, 'POST', { content: memo });
      await refetchMemos();
    } finally {
      setSaving(false);
    }
  };

  const isLoading = propertyLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link href="/admin/clients" className="flex items-center gap-2 text-sm text-[#B3B3B3] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          고객 목록으로
        </Link>
        <div className="p-12 rounded-2xl bg-dark-elevated text-center flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#6A6A6A]" />
          <p className="text-sm text-[#6A6A6A]">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Link href="/admin/clients" className="flex items-center gap-2 text-sm text-[#B3B3B3] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          고객 목록으로
        </Link>
        <div className="p-12 rounded-2xl bg-dark-elevated text-center">
          {propertyError ? (
            <p className="text-sm text-red-400">오류: {propertyError}</p>
          ) : (
            <p className="text-lg font-medium">고객 정보를 찾을 수 없습니다</p>
          )}
        </div>
      </div>
    );
  }

  const integrations: { platform: string; status: string }[] = data.integrations || [];

  return (
    <div className="space-y-6">
      <Link href="/admin/clients" className="flex items-center gap-2 text-sm text-[#B3B3B3] hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        고객 목록으로
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{data.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-[#6A6A6A]">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{data.region || '-'}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(data.createdAt)}</span>
            <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" />{data.propertyType || '-'}</span>
          </div>
        </div>
        {data.selectedPlan && (
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${planColors[data.selectedPlan] || 'bg-gray-500/10 text-gray-400'}`}>
            {data.selectedPlan}
          </span>
        )}
      </div>

      {/* Diagnosis Data */}
      <div className="p-6 rounded-2xl bg-dark-elevated">
        <h2 className="text-sm font-semibold mb-4">온보딩 진단 데이터</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '월 평균 예약', value: data.monthlyBookings || '-' },
            { label: '주요 국적', value: data.guestNationality || '-' },
            { label: '기존 홍보', value: data.currentActivity || '-' },
            { label: '어려운 점', value: data.painPoint || '-' },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-xl bg-dark-highlight">
              <div className="text-xs text-[#6A6A6A] mb-1">{item.label}</div>
              <div className="text-sm font-medium">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Status */}
      <div className="p-6 rounded-2xl bg-dark-elevated">
        <h2 className="text-sm font-semibold mb-4">서비스 현황</h2>
        {integrations.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {integrations.map((integration) => {
              const mapped = platformIconMap[integration.platform] || { icon: Globe, color: 'text-[#6A6A6A]', bg: 'bg-[#6A6A6A]/10' };
              const Icon = mapped.icon;
              const statusColor = statusColorMap[integration.status] || 'text-[#6A6A6A]';
              return (
                <div key={integration.platform} className="p-4 rounded-xl bg-dark-highlight flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${mapped.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${mapped.color}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{integration.platform}</div>
                    <div className={`text-xs ${statusColor}`}>{integration.status}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[#6A6A6A]">연동된 서비스가 없습니다.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="p-6 rounded-2xl bg-dark-elevated">
          <h2 className="text-sm font-semibold mb-4">작업 타임라인</h2>
          {activityLoading ? (
            <div className="flex items-center gap-2 text-sm text-[#6A6A6A]">
              <Loader2 className="w-4 h-4 animate-spin" />
              로딩 중...
            </div>
          ) : activity && activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm">
                      {item.action}{item.target ? ` - ${item.target}` : ''}{item.detail ? `: ${item.detail}` : ''}
                    </div>
                    <div className="text-xs text-[#6A6A6A]">{formatDate(item.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6A6A6A]">활동 내역이 없습니다.</p>
          )}
        </div>

        {/* Memo */}
        <div className="p-6 rounded-2xl bg-dark-elevated">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-[#6A6A6A]" />
            <h2 className="text-sm font-semibold">내부 메모</h2>
          </div>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={8}
            className="w-full p-4 rounded-xl bg-dark-highlight border-0 text-sm placeholder:text-[#6A6A6A] focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            placeholder="메모를 입력하세요..."
          />
          <button
            onClick={handleSaveMemo}
            disabled={saving}
            className="mt-3 px-4 py-2 rounded-full bg-accent-gradient text-white text-sm font-medium disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
