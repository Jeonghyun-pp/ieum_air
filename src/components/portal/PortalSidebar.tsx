'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import {
  Home,
  Lightbulb,
  CalendarDays,
  Image,
  BarChart3,
  FolderOpen,
  Trophy,
  Settings,
  ExternalLink,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: '홈', href: '/portal', icon: Home },
  { label: '전략', href: '/portal/plan', icon: Lightbulb },
  { label: '가격 캘린더', href: '/portal/pricing', icon: CalendarDays },
  { label: '콘텐츠', href: '/portal/content', icon: Image },
  { label: '분석', href: '/portal/analytics', icon: BarChart3 },
  { label: '자료', href: '/portal/assets', icon: FolderOpen },
  { label: '성과', href: '/portal/results', icon: Trophy },
];

export function PortalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 bg-black p-4 shrink-0">
      {/* Logo */}
      <Link href="/portal" className="px-3 py-4 mb-4">
        <span className="text-lg font-bold text-gradient">StayTrend</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/portal'
              ? pathname === '/portal'
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200',
                isActive
                  ? 'text-white bg-dark-highlight'
                  : 'text-[#B3B3B3] hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-dark-highlight pt-4 mt-4">
        <Link
          href="/portal/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-[#B3B3B3] hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>설정</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-[#B3B3B3] hover:text-white transition-colors"
        >
          <ExternalLink className="w-5 h-5" />
          <span>홈페이지</span>
        </Link>
      </div>
    </aside>
  );
}
