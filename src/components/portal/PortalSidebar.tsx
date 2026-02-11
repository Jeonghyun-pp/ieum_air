'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/portal' },
  { label: 'This Month Plan', href: '/portal/plan' },
  { label: 'To-Do & Assets', href: '/portal/assets' },
  { label: 'Progress', href: '/portal/progress' },
  { label: 'Results', href: '/portal/results' },
];

export function PortalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-background p-6">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block px-3 py-2 text-sm rounded-md transition-colors duration-100 ease-out',
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
