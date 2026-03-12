'use client';

import { useEffect, useState, useRef } from 'react';
import { Bell, Sparkles, AlertTriangle, FileText, TrendingUp, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { NotificationItem } from '@/types/monitoring';

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  strategy_ready: { icon: Sparkles, color: 'text-purple-400' },
  action_urgent: { icon: AlertTriangle, color: 'text-orange-400' },
  report_ready: { icon: FileText, color: 'text-blue-400' },
  competitor_alert: { icon: TrendingUp, color: 'text-emerald-400' },
  score_change: { icon: TrendingUp, color: 'text-pink-400' },
};

export function NotificationBell() {
  const { firebaseUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchNotifications() {
      if (!firebaseUser) return;
      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch('/api/portal/notifications', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          setNotifications(json.data.notifications);
          setUnreadCount(json.data.unreadCount);
        }
      } catch {
        // ignore
      }
    }
    fetchNotifications();

    // 30초마다 폴링
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [firebaseUser]);

  // 외부 클릭 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const markAllRead = async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      await fetch('/api/portal/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-dark-highlight transition-colors"
      >
        <Bell className="w-5 h-5 text-[#B3B3B3]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent-purple text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 rounded-xl bg-dark-elevated border border-dark-highlight shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-highlight">
            <span className="text-sm font-semibold">알림</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  모두 읽음
                </button>
              )}
              <button onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4 text-[#6A6A6A]" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#6A6A6A]">
                알림이 없습니다
              </div>
            ) : (
              notifications.map((n) => {
                const config = typeConfig[n.type] || typeConfig.competitor_alert;
                const Icon = config.icon;
                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 hover:bg-dark-highlight transition-colors cursor-pointer ${
                      !n.read ? 'bg-dark-highlight/30' : ''
                    }`}
                    onClick={() => {
                      if (n.href) window.location.href = n.href;
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{n.title}</div>
                        <div className="text-xs text-[#6A6A6A] mt-0.5 line-clamp-2">{n.body}</div>
                        <div className="text-[10px] text-[#6A6A6A] mt-1">{timeAgo(n.createdAt)}</div>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
