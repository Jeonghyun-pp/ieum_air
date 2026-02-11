'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { PlanStatus } from '@/lib/portal/types';

interface PortalContextType {
  status: PlanStatus;
  setStatus: (status: PlanStatus) => void;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export function PortalProvider({
  children,
  initialStatus,
}: {
  children: ReactNode;
  initialStatus: PlanStatus;
}) {
  const [status, setStatus] = useState<PlanStatus>(initialStatus);

  return (
    <PortalContext.Provider value={{ status, setStatus }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (context === undefined) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
}
