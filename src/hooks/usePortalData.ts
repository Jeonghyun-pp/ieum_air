'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UsePortalDataOptions {
  endpoint: string;
  propertyId?: string;
  month?: string;
  enabled?: boolean;
}

interface UsePortalDataResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePortalData<T>({
  endpoint,
  propertyId,
  month,
  enabled = true,
}: UsePortalDataOptions): UsePortalDataResult<T> {
  const { firebaseUser } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!firebaseUser || !enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await firebaseUser.getIdToken();
      const params = new URLSearchParams();
      if (propertyId) params.set('propertyId', propertyId);
      if (month) params.set('month', month);
      const qs = params.toString();
      const url = `/api/portal/${endpoint}${qs ? `?${qs}` : ''}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error?.message || 'Failed to fetch data');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser, endpoint, propertyId, month, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
