import { useState, useCallback, useEffect } from 'react';
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

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessage);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const { refresh } = usePolling(load);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, isLoading, error, refresh };
}
