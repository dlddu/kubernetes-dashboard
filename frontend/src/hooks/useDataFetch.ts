import { useState, useCallback, useEffect, useRef } from 'react';
import { usePolling, UsePollingReturn } from './usePolling';

export interface UseDataFetchReturn<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  refresh: UsePollingReturn['refresh'];
}

/**
 * Hook that combines data fetching, loading/error state, and polling.
 * Automatically re-fetches when deps change.
 *
 * @param fetcher - Async function that returns the data array
 * @param errorMessage - Fallback error message if the error is not an Error instance
 * @param deps - Dependency array that triggers re-fetch when changed
 */
export function useDataFetch<T>(
  fetcher: () => Promise<T[]>,
  errorMessage: string,
  deps: unknown[] = [],
): UseDataFetchReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  const errorMessageRef = useRef(errorMessage);

  // Keep refs in sync with latest values
  useEffect(() => {
    fetcherRef.current = fetcher;
    errorMessageRef.current = errorMessage;
  });

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessageRef.current);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { refresh } = usePolling(load);

  // Re-fetch when deps change
  const depsKey = JSON.stringify(deps);
  useEffect(() => {
    load();
  }, [depsKey, load]);

  return { data, isLoading, error, refresh };
}
