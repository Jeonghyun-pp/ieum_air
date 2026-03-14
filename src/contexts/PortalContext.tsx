'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { PlanStatus, PortalData, Todo, Plan } from '@/lib/portal/types';
import type { Property } from '@/types/property';

interface PortalContextType {
  // Property
  properties: Property[];
  activeProperty: Property | null;
  setActivePropertyId: (id: string) => void;

  // Month
  currentMonth: string;
  setCurrentMonth: (month: string) => void;

  // Dashboard data
  status: PlanStatus;
  setStatus: (status: PlanStatus) => void;
  strategySummary: string;
  reasons: string[];
  todos: Todo[];
  plan: Plan;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshDashboard: () => Promise<void>;
  updatePlanStatus: (newStatus: PlanStatus, planId?: string | null) => Promise<void>;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export function PortalProvider({ children }: { children: ReactNode }) {
  const { user, firebaseUser, isLoading: authLoading } = useAuth();

  // Property state
  const [properties, setProperties] = useState<Property[]>([]);
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);

  // Month state
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Dashboard data
  const [status, setStatusState] = useState<PlanStatus>('DRAFT');
  const [strategySummary, setStrategySummary] = useState('');
  const [reasons, setReasons] = useState<string[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [plan, setPlan] = useState<Plan>({ targetCountries: [], platforms: [], messageFocus: [] });
  const [planId, setPlanId] = useState<string | null>(null);

  // Loading
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track fetch to prevent duplicate calls
  const fetchingRef = useRef(false);

  const activeProperty = properties.find(p => p.id === activePropertyId) || properties[0] || null;

  // Fetch properties list
  const fetchProperties = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/properties', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setProperties(json.data);
        setActivePropertyId((prev) => {
          if (!prev && json.data.length > 0) return json.data[0].id;
          return prev;
        });
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    }
  }, [firebaseUser]);

  // Fetch dashboard data
  const refreshDashboard = useCallback(async () => {
    if (!firebaseUser || !activePropertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await firebaseUser.getIdToken();
      const params = new URLSearchParams({ month: currentMonth });
      params.set('propertyId', activePropertyId);

      const res = await fetch(`/api/portal/dashboard?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const json = await res.json();

      if (json.success && json.data) {
        const d = json.data;
        setStatusState(d.status || 'DRAFT');
        setStrategySummary(d.strategySummary || '');
        setReasons(d.reasons || []);
        setTodos(d.todos || []);
        setPlan(d.plan || { targetCountries: [], platforms: [], messageFocus: [] });
        setPlanId(d.planId || null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser, activePropertyId, currentMonth]);

  // Update plan status
  const updatePlanStatus = useCallback(async (newStatus: PlanStatus, existingPlanId?: string | null) => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const params = new URLSearchParams();
      if (activePropertyId) params.set('propertyId', activePropertyId);

      await fetch(`/api/portal/plan?${params}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: existingPlanId ?? planId,
          status: newStatus,
          month: currentMonth,
        }),
      });

      setStatusState(newStatus);
    } catch (err) {
      console.error('Failed to update plan status:', err);
    }
  }, [firebaseUser, activePropertyId, currentMonth, planId]);

  // Set status (local + API)
  const setStatus = useCallback((newStatus: PlanStatus) => {
    setStatusState(newStatus);
    updatePlanStatus(newStatus);
  }, [updatePlanStatus]);

  // Initial fetch: load properties when auth is fully ready (user doc exists)
  useEffect(() => {
    if (!authLoading && user && firebaseUser) {
      fetchProperties();
    } else if (!authLoading && !firebaseUser) {
      setIsLoading(false);
    }
  }, [authLoading, user, firebaseUser, fetchProperties]);

  // Refresh dashboard when property or month changes
  useEffect(() => {
    if (activePropertyId && firebaseUser) {
      refreshDashboard();
    } else if (!authLoading && !activePropertyId) {
      setIsLoading(false);
    }
  }, [activePropertyId, currentMonth, refreshDashboard, authLoading, firebaseUser]);

  return (
    <PortalContext.Provider
      value={{
        properties,
        activeProperty,
        setActivePropertyId,
        currentMonth,
        setCurrentMonth,
        status,
        setStatus,
        strategySummary,
        reasons,
        todos,
        plan,
        isLoading,
        error,
        refreshDashboard,
        updatePlanStatus,
      }}
    >
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
