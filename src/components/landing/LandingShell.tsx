'use client';

import { ReactNode, createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AuthModal, AuthModalMode } from '@/components/ui/auth-modal';

// ============================================
// AuthModal Context (scoped to landing)
// ============================================

interface AuthModalContextType {
  openAuthModal: (mode: AuthModalMode) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within LandingShell');
  return ctx;
}

// ============================================
// LandingShell
// ============================================

interface LandingShellProps {
  children: ReactNode;
}

export function LandingShell({ children }: LandingShellProps) {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<AuthModalMode>('login');

  const openAuthModal = (mode: AuthModalMode) => {
    setModalMode(mode);
    setModalOpen(true);
  };

  const handlePortalClick = (e: React.MouseEvent) => {
    if (firebaseUser) {
      router.push('/portal');
    } else {
      e.preventDefault();
      openAuthModal('login');
    }
  };

  return (
    <AuthModalContext.Provider value={{ openAuthModal }}>
      <div className="min-h-screen bg-white flex flex-col">
        {/* Nav */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
          <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
            <Link href="/" className="text-xl font-bold text-gradient">
              StayTrend
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                요금제
              </a>
              <button onClick={handlePortalClick} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                포털
              </button>
            </nav>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600"
                onClick={() => openAuthModal('login')}
              >
                로그인
              </Button>
              <Button
                variant="gradient"
                size="sm"
                rounded="full"
                onClick={() => openAuthModal('signup')}
              >
                무료 진단
              </Button>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 pt-16">{children}</main>

        {/* Footer */}
        <footer className="border-t border-gray-100 py-12 px-4 bg-gray-50/50">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              © 2026 StayTrend. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                이용약관
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                개인정보처리방침
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                문의하기
              </a>
            </div>
          </div>
        </footer>

        {/* Auth Modal */}
        <AuthModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          initialMode={modalMode}
        />
      </div>
    </AuthModalContext.Provider>
  );
}
