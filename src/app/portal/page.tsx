'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Image,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Circle,
  Sparkles,
  Zap,
} from 'lucide-react';
import { usePortal } from '@/contexts/PortalContext';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { HealthScoreGauge } from '@/components/portal/HealthScoreGauge';
import { DiagnosisCategoryBars } from '@/components/portal/DiagnosisCategoryBars';
import type { EnhancedScorecard } from '@/types/diagnosis';
import type { ActionItem } from '@/types/strategy';
import type { CompetitorAlert } from '@/types/monitoring';

const quickActions = [
  {
    icon: Sparkles,
    label: '이번 달 전략',
    desc: 'AI 생성 전략 확인',
    href: '/portal/plan',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: CalendarDays,
    label: '가격 캘린더',
    desc: 'AI 가격 추천',
    href: '/portal/pricing',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Zap,
    label: '최적화',
    desc: '리스팅 진단 확인',
    href: '/portal/optimize',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
  },
];

export default function PortalHomePage() {
  const { activeProperty, strategySummary, reasons, todos, isLoading } = usePortal();
  const [scorecard, setScorecard] = useState<EnhancedScorecard | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [alerts, setAlerts] = useState<CompetitorAlert[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { getFirebaseAuth } = await import('@/lib/firebase/auth');
        const auth = getFirebaseAuth();
        const fbUser = auth.currentUser;
        if (!fbUser) return;
        const token = await fbUser.getIdToken();
        const headers = { 'Authorization': `Bearer ${token}` };

        const [diagRes, actionsRes, alertsRes] = await Promise.all([
          fetch('/api/portal/diagnosis?category=scorecard', { headers }),
          fetch('/api/portal/actions?status=pending', { headers }),
          fetch('/api/portal/alerts', { headers }),
        ]);
        const diagJson = await diagRes.json();
        if (diagJson.success && diagJson.data) {
          setScorecard(diagJson.data as EnhancedScorecard);
        }
        const actionsJson = await actionsRes.json();
        if (actionsJson.success && actionsJson.data) {
          setActions(actionsJson.data as ActionItem[]);
        }
        const alertsJson = await alertsRes.json();
        if (alertsJson.success && alertsJson.data) {
          setAlerts((alertsJson.data as CompetitorAlert[]).filter(a => !a.read));
        }
      } catch {
        // ignore
      }
    }
    if (!isLoading && activeProperty) fetchData();
  }, [isLoading, activeProperty]);

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
        <p className="text-muted-foreground text-lg">{strategySummary || '곧 이번 달 전략이 준비됩니다.'}</p>
        {reasons.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {reasons.map((reason) => (
              <span
                key={reason}
                className="px-3 py-1 text-xs rounded-full bg-dark-highlight text-muted-foreground"
              >
                {reason}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Competitor Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                alert.severity === 'critical' ? 'bg-red-500/10 border border-red-500/20' :
                alert.severity === 'warning' ? 'bg-orange-500/10 border border-orange-500/20' :
                'bg-blue-500/10 border border-blue-500/20'
              }`}
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                alert.severity === 'critical' ? 'bg-red-500' :
                alert.severity === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
              }`} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{alert.title}</span>
                <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Health Score (Phase 2) */}
      {scorecard && (
        <Link
          href="/portal/optimize"
          className="block p-6 rounded-2xl bg-dark-elevated hover:bg-dark-highlight/50 transition-all duration-200"
        >
          <div className="flex items-center gap-6">
            <HealthScoreGauge
              score={scorecard.overallScore}
              grade={scorecard.overallGrade}
              size="md"
              label="종합 경쟁력"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-muted-foreground mb-3">
                {scorecard.totalInCompSet}개 경쟁 숙소 중 <span className="text-foreground font-semibold">{scorecard.rank}위</span>
              </div>
              <DiagnosisCategoryBars categories={scorecard.categories} />
            </div>
          </div>
        </Link>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-4 p-4 rounded-xl bg-dark-elevated hover:bg-dark-highlight/50 transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-6 h-6 ${action.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{action.label}</div>
                <div className="text-xs text-muted-foreground">{action.desc}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          );
        })}
      </div>

      {/* Action Items */}
      {actions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">추천 액션</h2>
            <span className="text-xs text-muted-foreground">{actions.length}개</span>
          </div>
          <div className="space-y-3">
            {actions.slice(0, 5).map((action) => (
              <div
                key={action.id}
                className="flex items-center gap-3 p-4 rounded-xl bg-dark-elevated"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  action.priority === 'critical' ? 'bg-red-500' :
                  action.priority === 'high' ? 'bg-orange-500' :
                  action.priority === 'medium' ? 'bg-blue-500' :
                  'bg-muted-foreground/60'
                }`} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-foreground">{action.title}</span>
                  <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                  action.priority === 'critical' ? 'bg-red-500/10 text-red-500' :
                  action.priority === 'high' ? 'bg-orange-500/10 text-orange-500' :
                  'bg-dark-highlight text-muted-foreground'
                }`}>
                  {action.priority === 'critical' ? '긴급' :
                   action.priority === 'high' ? '높음' :
                   action.priority === 'medium' ? '보통' : '낮음'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${
                  todo.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'
                }`}>
                  {todo.title}
                </span>
              </div>
              {todo.required && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500">
                  필수
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {todo.due}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
