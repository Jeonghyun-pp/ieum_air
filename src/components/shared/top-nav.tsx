'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { navMenuItems, NavMenuItem, NavLink, getBreadcrumbLabels } from './nav-data';
import { cn } from '@/lib/utils/cn';

// ============================================
// Active State Calculation
// ============================================

function isLinkActive(pathname: string, link: NavLink): boolean {
  if (!link.href) return false;
  
  const match = link.match || 'exact';
  
  if (match === 'exact') {
    return pathname === link.href;
  } else {
    // prefix match
    return pathname === link.href || pathname.startsWith(link.href + '/');
  }
}

function isMenuItemActive(pathname: string, item: NavMenuItem): 'exact' | 'prefix' | false {
  // 단순 링크인 경우
  if (item.href) {
    const match = item.match || 'exact';
    if (match === 'exact') {
      return pathname === item.href ? 'exact' : false;
    } else {
      return pathname === item.href || pathname.startsWith(item.href + '/') ? 'prefix' : false;
    }
  }
  
  // 드롭다운인 경우 - 섹션 내 링크 중 하나가 active인지 확인
  if (item.sections) {
    for (const section of item.sections) {
      for (const link of section.items) {
        if (isLinkActive(pathname, link)) {
          return 'prefix'; // 섹션 레벨이므로 prefix로 표시
        }
      }
    }
  }
  
  return false;
}

// ============================================
// Breadcrumb Component
// ============================================

interface BreadcrumbProps {
  pathname: string;
}

function Breadcrumb({ pathname }: BreadcrumbProps) {
  const labels = getBreadcrumbLabels(pathname);
  
  if (labels.length <= 1) {
    return null; // Main만 있으면 표시하지 않음
  }

  return (
    <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
      {labels.map((label, index) => (
        <span key={index} className="flex items-center gap-1.5">
          {index > 0 && (
            <span className="text-muted-foreground/50">/</span>
          )}
          <span className={cn(
            index === labels.length - 1 && 'text-foreground/70'
          )}>
            {label}
          </span>
        </span>
      ))}
    </div>
  );
}

// ============================================
// Desktop Dropdown Menu Component
// ============================================

interface DesktopDropdownProps {
  item: NavMenuItem;
  pathname: string;
}

function DesktopDropdown({ item, pathname }: DesktopDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeState = isMenuItemActive(pathname, item);
  const isActive = activeState !== false;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // hover 시 드롭다운 열기/닫기 처리
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    // 약간의 딜레이를 주어 드롭다운 컨텐츠로 이동할 시간을 줌
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!item.sections) {
    return (
      <Link
        href={item.href || '/main'}
        className={cn(
          'px-3 py-2 text-sm transition-colors duration-100 ease-out relative',
          'text-foreground hover:text-foreground',
          isActive && 'font-medium',
          isActive && 'after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[1px] after:bg-border'
        )}
        aria-current={activeState === 'exact' ? 'page' : activeState === 'prefix' ? 'true' : undefined}
      >
        {item.label}
      </Link>
    );
  }

  // href가 있으면 직접 링크로, 없으면 드롭다운만
  if (item.href) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          asChild
          className={cn(
            'px-3 py-2 text-sm transition-colors duration-100 ease-out focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 relative',
            'text-foreground hover:text-foreground',
            isActive && 'font-medium',
            isActive && 'after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[1px] after:bg-border',
            isOpen && 'font-medium'
          )}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-current={activeState === 'prefix' ? 'true' : undefined}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Link href={item.href} className="flex items-center">
            {item.label}
            <svg
              className={cn(
                'ml-1 inline-block w-3 h-3 transition-transform duration-150 ease-out',
                isOpen && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Link>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-64 p-0 border-border bg-background"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="py-2">
            {item.sections?.map((section) => (
              <div key={section.id} className="mb-4 last:mb-0">
                <div className="px-4 py-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {section.items.map((link) => {
                    const linkActive = isLinkActive(pathname, link);
                    return (
                      <Link
                        key={link.id}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'flex items-start gap-3 px-4 py-2 transition-colors duration-100 ease-out group',
                          'hover:bg-accent/50',
                          linkActive && 'bg-accent/30'
                        )}
                        aria-current={linkActive ? 'page' : undefined}
                      >
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            'text-sm',
                            linkActive ? 'text-foreground font-medium' : 'text-foreground group-hover:text-foreground'
                          )}>
                            {link.label}
                          </div>
                          {link.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {link.description}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        asChild
        className={cn(
          'px-3 py-2 text-sm transition-colors duration-100 ease-out focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 relative',
          'text-foreground hover:text-foreground',
          isActive && 'font-medium',
          isActive && 'after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[1px] after:bg-border',
          isOpen && 'font-medium'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-current={activeState === 'prefix' ? 'true' : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button type="button">
          {item.label}
          <svg
            className={cn(
              'ml-1 inline-block w-3 h-3 transition-transform duration-150 ease-out',
              isOpen && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-64 p-0 border-border bg-background"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="py-2">
          {item.sections.map((section) => (
            <div key={section.id} className="mb-4 last:mb-0">
              <div className="px-4 py-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </span>
              </div>
              <div className="space-y-0.5">
                {section.items.map((link) => {
                  const linkActive = isLinkActive(pathname, link);
                  return (
                    <Link
                      key={link.id}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-start gap-3 px-4 py-2 transition-colors duration-100 ease-out group',
                        'hover:bg-accent/50',
                        linkActive && 'bg-accent/30'
                      )}
                      aria-current={linkActive ? 'page' : undefined}
                    >
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          'text-sm',
                          linkActive ? 'text-foreground font-medium' : 'text-foreground group-hover:text-foreground'
                        )}>
                          {link.label}
                        </div>
                        {link.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {link.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================
// Mobile Menu Component
// ============================================

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
}

function MobileMenu({ isOpen, onClose, pathname }: MobileMenuProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-0 top-0 bottom-0 z-50 w-80 bg-background border-r border-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-150 ease-out"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <span className="text-sm font-medium text-foreground">메뉴</span>
              <DialogPrimitive.Close asChild>
                <button
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded transition-colors duration-100 ease-out"
                  aria-label="메뉴 닫기"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </DialogPrimitive.Close>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1">
                {navMenuItems.map((item) => {
                  const activeState = isMenuItemActive(pathname, item);
                  const isActive = activeState !== false;
                  
                  if (!item.sections) {
                    return (
                      <Link
                        key={item.id}
                        href={item.href || '/main'}
                        onClick={onClose}
                        className={cn(
                          'block px-4 py-2 text-sm transition-colors duration-100 ease-out',
                          isActive 
                            ? 'text-foreground font-medium bg-accent/30' 
                            : 'text-foreground hover:bg-accent/50'
                        )}
                        aria-current={activeState === 'exact' ? 'page' : undefined}
                      >
                        {item.label}
                      </Link>
                    );
                  }

                  return (
                    <div key={item.id}>
                      <button
                        onClick={() => toggleSection(item.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-2 text-sm transition-colors duration-100 ease-out',
                          isActive
                            ? 'text-foreground font-medium bg-accent/30'
                            : 'text-foreground hover:bg-accent/50'
                        )}
                        aria-expanded={expandedSections.has(item.id)}
                        aria-current={activeState === 'prefix' ? 'true' : undefined}
                      >
                        <span>{item.label}</span>
                        <svg
                          className={cn(
                            'w-4 h-4 transition-transform duration-150 ease-out',
                            expandedSections.has(item.id) && 'rotate-180'
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedSections.has(item.id) && (
                        <div className="pl-4 space-y-0.5">
                          {item.sections.map((section) => (
                            <div key={section.id} className="py-2">
                              <div className="px-4 py-1 mb-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  {section.title}
                                </span>
                              </div>
                              {section.items.map((link) => {
                                const linkActive = isLinkActive(pathname, link);
                                return (
                                  <Link
                                    key={link.id}
                                    href={link.href}
                                    onClick={onClose}
                                    className={cn(
                                      'block px-4 py-2 text-sm transition-colors duration-100 ease-out',
                                      linkActive
                                        ? 'text-foreground font-medium bg-accent/30'
                                        : 'text-foreground hover:bg-accent/50'
                                    )}
                                    aria-current={linkActive ? 'page' : undefined}
                                  >
                                    <div>{link.label}</div>
                                    {link.description && (
                                      <div className="text-xs text-muted-foreground mt-0.5">
                                        {link.description}
                                      </div>
                                    )}
                                  </Link>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ============================================
// TopNav Component
// ============================================

export function TopNav() {
  const pathname = usePathname();
  const { user, isLoggedIn, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <nav
        ref={navRef}
        className={cn(
          'sticky top-0 z-50 bg-background transition-all duration-150 ease-out',
          isScrolled && 'border-b border-border'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* 좌측: 로고 + Breadcrumb + 메뉴 */}
            <div className="flex items-center gap-8">
              {/* 로고 */}
              <Link href="/main" className="text-sm font-medium text-foreground hover:opacity-80 transition-opacity duration-100">
                I:EUM
              </Link>

              {/* Breadcrumb */}
              <Breadcrumb pathname={pathname} />

              {/* 데스크탑 메뉴 */}
              <div className="hidden md:flex items-center gap-1">
                {navMenuItems.map((item) => (
                  <DesktopDropdown key={item.id} item={item} pathname={pathname} />
                ))}
              </div>
            </div>

            {/* 우측: 사용자 액션 */}
            <div className="flex items-center gap-3">
              {isLoggedIn && user ? (
                <>
                  <span className="hidden sm:block text-sm text-muted-foreground">
                    {user.displayName || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded transition-colors duration-100 ease-out"
                  >
                    로그아웃
                  </button>
                </>
              ) : null}

              {/* 모바일 메뉴 버튼 */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded transition-colors duration-100 ease-out"
                aria-label="메뉴 열기"
                aria-expanded={isMobileMenuOpen}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 모바일 메뉴 */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} pathname={pathname} />
    </>
  );
}
