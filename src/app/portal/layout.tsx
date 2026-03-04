'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
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
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !firebaseUser) {
      router.replace('/');
    }
  }, [isLoading, firebaseUser, router]);

  if (isLoading) {
    return (
      <div className="dark min-h-screen bg-dark-base text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!firebaseUser) {
    return null;
  }

  return (
    <div className="dark min-h-screen bg-dark-base text-white flex">
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
