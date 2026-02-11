'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// ============================================
// Types
// ============================================

interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface SidebarSection {
  id: string;
  items: SidebarItem[];
}

// ============================================
// Sidebar Component
// ============================================

interface SidebarProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export function Sidebar({ 
  isCollapsed: externalCollapsed, 
  setIsCollapsed: externalSetCollapsed 
}: SidebarProps = {}) {
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const setIsCollapsed = externalSetCollapsed || setInternalCollapsed;

  // 워크스페이스 섹션
  const workspaceSection: SidebarSection = {
    id: 'workspace',
    items: [
      {
        id: 'home',
        label: '홈',
        href: '/main',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
    ],
  };

  // 주요 작업 영역 섹션
  const mainSections: SidebarSection[] = [
    {
      id: 'main',
      items: [
        {
          id: 'workspace',
          label: '워크스페이스',
          href: '/portal',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          ),
        },
        {
          id: 'pages',
          label: '페이지',
          href: '/main',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
      ],
    },
  ];

  // 보조 항목 섹션
  const secondarySection: SidebarSection = {
    id: 'secondary',
    items: [
      {
        id: 'settings',
        label: '설정',
        href: '/main',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
    ],
  };

  const isActive = (href: string) => {
    if (href === '/main') {
      return pathname === '/main' || pathname === '/';
    }
    return pathname === href || pathname?.startsWith(href);
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 bottom-0 z-40
        bg-[#f7f7f7] border-r border-border
        transition-all duration-150 ease-out
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* 워크스페이스 섹션 */}
        <div className="px-3 py-3 border-b border-border">
          {workspaceSection.items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`
                  flex items-center gap-3 px-2 py-2 rounded
                  text-sm transition-colors duration-100 ease-out
                  ${active
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }
                `}
              >
                {item.icon && (
                  <span className="flex-shrink-0">
                    {item.icon}
                  </span>
                )}
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* 주요 작업 영역 */}
        <div className="flex-1 overflow-y-auto py-2">
          {mainSections.map((section) => (
            <div key={section.id} className="px-3 mb-4">
              {!isCollapsed && (
                <div className="px-2 py-1 mb-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {section.id === 'main' ? '작업 영역' : section.id}
                  </span>
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-2 py-2 rounded
                        text-sm transition-colors duration-100 ease-out
                        ${active
                          ? 'bg-accent text-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                        }
                      `}
                    >
                      {item.icon && (
                        <span className="flex-shrink-0">
                          {item.icon}
                        </span>
                      )}
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 보조 항목 섹션 */}
        <div className="px-3 py-2 border-t border-border space-y-0.5">
          {secondarySection.items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`
                  flex items-center gap-3 px-2 py-2 rounded
                  text-sm transition-colors duration-100 ease-out
                  ${active
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }
                `}
              >
                {item.icon && (
                  <span className="flex-shrink-0">
                    {item.icon}
                  </span>
                )}
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
          
          {/* 접기/펼치기 토글 */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="
              w-full flex items-center gap-3 px-2 py-2 rounded
              text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50
              transition-colors duration-100 ease-out
            "
            aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
          >
            <svg
              className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 ease-out ${isCollapsed ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {!isCollapsed && (
              <span className="truncate">접기</span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
