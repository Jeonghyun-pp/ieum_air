'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UseAdminApiOptions {
  endpoint: string;
  params?: Record<string, string>;
  enabled?: boolean;
}

interface UseAdminApiResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAdminApi<T>({
  endpoint,
  params,
  enabled = true,
}: UseAdminApiOptions): UseAdminApiResult<T> {
  const { firebaseUser } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paramsKey = useMemo(() => JSON.stringify(params), [params]);

  const fetchData = useCallback(async () => {
    if (!firebaseUser || !enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await firebaseUser.getIdToken();
      const qs = params ? new URLSearchParams(params).toString() : '';
      const url = `/api/admin/${endpoint}${qs ? `?${qs}` : ''}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
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
  }, [firebaseUser, endpoint, paramsKey, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Mutation helper for POST/PATCH/DELETE requests
 */
export function useAdminMutation() {
  const { firebaseUser } = useAuth();

  const mutate = useCallback(
    async <T = any>(
      endpoint: string,
      method: 'POST' | 'PATCH' | 'DELETE' = 'POST',
      body?: any
    ): Promise<{ success: boolean; data?: T; error?: string }> => {
      if (!firebaseUser) {
        return { success: false, error: 'Not authenticated' };
      }

      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch(`/api/admin/${endpoint}`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        const json = await res.json();
        if (json.success) {
          return { success: true, data: json.data };
        }
        return { success: false, error: json.error?.message || 'Request failed' };
      } catch (err: any) {
        return { success: false, error: err.message || 'Network error' };
      }
    },
    [firebaseUser]
  );

  return { mutate };
}
