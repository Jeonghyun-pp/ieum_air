'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePortal } from '@/contexts/PortalContext';
import { PortalTopNav } from '@/components/portal/PortalTopNav';
import { PortalSidebar } from '@/components/portal/PortalSidebar';
import { PortalProvider } from '@/contexts/PortalContext';
import { Loader2 } from 'lucide-react';

function PortalLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { firebaseUser, isLoading } = useAuth();
  const { properties, isLoading: portalLoading } = usePortal();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !firebaseUser) {
      router.replace('/');
    }
  }, [isLoading, firebaseUser, router]);

  // Properties 로드 완료 후 숙소가 없으면 온보딩으로 리디렉트
  useEffect(() => {
    if (!isLoading && firebaseUser && !portalLoading && properties.length === 0) {
      router.replace('/onboarding');
    }
  }, [isLoading, firebaseUser, portalLoading, properties, router]);

  if (isLoading) {
    return (
      <div className="dark min-h-screen bg-dark-base text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!firebaseUser) {
    return null;
  }

  return (
    <div className="dark min-h-screen bg-dark-base text-foreground flex">
      {/* Sidebar */}
      <PortalSidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <PortalTopNav />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalProvider>
      <PortalLayoutContent>{children}</PortalLayoutContent>
    </PortalProvider>
  );
}
