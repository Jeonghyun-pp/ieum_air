'use client';

import { PortalTopNav } from '@/components/portal/PortalTopNav';
import { PortalSidebar } from '@/components/portal/PortalSidebar';
import { StatusBanner } from '@/components/portal/StatusBanner';
import { PortalProvider, usePortal } from '@/contexts/PortalContext';
import {
  mockPortalData,
  statusBannerConfigs,
} from '@/lib/portal/mock';

function PortalLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = usePortal();
  const bannerConfig = statusBannerConfigs[status];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PortalTopNav
        currentProperty={mockPortalData.currentProperty}
        currentMonth={mockPortalData.currentMonth}
      />
      <div className="flex flex-1 overflow-hidden">
        <PortalSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <StatusBanner config={bannerConfig} />
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
    <PortalProvider initialStatus={mockPortalData.status}>
      <PortalLayoutContent>{children}</PortalLayoutContent>
    </PortalProvider>
  );
}
