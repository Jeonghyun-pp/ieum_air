'use client';

import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { useAdminApi } from '@/hooks/useAdminApi';

const planColors: Record<string, string> = {
  '베이직': 'bg-gray-500/10 text-gray-400',
  '스탠다드': 'bg-purple-500/10 text-purple-400',
  '프리미엄': 'bg-emerald-500/10 text-emerald-400',
  'basic': 'bg-gray-500/10 text-gray-400',
  'standard': 'bg-purple-500/10 text-purple-400',
  'premium': 'bg-emerald-500/10 text-emerald-400',
};

const planDisplayName: Record<string, string> = {
  'basic': '베이직',
  'standard': '스탠다드',
  'premium': '프리미엄',
};

function formatStatus(status: string): string {
  if (status === 'active') return '활성';
  if (status === 'paused') return '일시정지';
  if (status === 'onboarding') return '온보딩';
  return status;
}

function formatDate(createdAt: any): string {
  if (!createdAt) return '-';
  // Firestore timestamp object with _seconds
  if (createdAt._seconds) {
    const d = new Date(createdAt._seconds * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  // ISO string or other parseable format
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function ClientsPage() {
  const { data: properties, isLoading } = useAdminApi<any[]>({ endpoint: 'properties' });
  const [search, setSearch] = useState('');

  const filtered = (properties || []).filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.region || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">고객 관리</h1>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-gradient text-white text-sm font-medium">
          <Plus className="w-4 h-4" />
          고객 추가
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="숙소명 또는 지역으로 검색"
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-dark-elevated border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-dark-elevated animate-pulse">
              <div className="h-4 bg-dark-highlight rounded w-2/3 mb-3" />
              <div className="space-y-1.5">
                <div className="h-3 bg-dark-highlight rounded w-1/2" />
                <div className="h-3 bg-dark-highlight rounded w-1/3" />
                <div className="h-3 bg-dark-highlight rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const plan = planDisplayName[p.selectedPlan] || p.selectedPlan;
            const status = formatStatus(p.status);
            return (
              <Link
                key={p.id}
                href={`/admin/clients/${p.id}`}
                className="p-5 rounded-2xl bg-dark-elevated hover:bg-dark-highlight transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{p.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${planColors[p.selectedPlan] || 'bg-gray-500/10 text-gray-400'}`}>
                    {plan}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div>{p.region}</div>
                  <div>시작: {formatDate(p.createdAt)}</div>
                  <div>서비스: {p.integrationCount || 0}개 연동</div>
                </div>
                <div className="mt-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    status === '활성' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
                  }`}>
                    {status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
