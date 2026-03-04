'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  Users,
  Palette,
  CalendarDays,
  BarChart3,
  Settings,
} from 'lucide-react';

const navItems = [
  { label: '대시보드', href: '/admin', icon: LayoutDashboard },
  { label: '고객 관리', href: '/admin/clients', icon: Users },
  { label: '콘텐츠', href: '/admin/content', icon: Palette },
  { label: '이벤트', href: '/admin/events', icon: CalendarDays },
  { label: '분석', href: '/admin/analytics', icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="dark min-h-screen bg-dark-base text-white flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-black p-4 shrink-0">
        <Link href="/admin" className="px-3 py-4 mb-4">
          <span className="text-lg font-bold text-gradient">이:음 Admin</span>
        </Link>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200',
                  isActive ? 'text-white bg-dark-highlight' : 'text-[#B3B3B3] hover:text-white'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-dark-highlight pt-4 mt-4">
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-[#B3B3B3] hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>설정</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="sticky top-0 z-30 h-16 flex items-center px-6 bg-dark-base/80 backdrop-blur-lg border-b border-dark-highlight">
          <h1 className="text-sm font-medium text-[#B3B3B3]">관리자 대시보드</h1>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
