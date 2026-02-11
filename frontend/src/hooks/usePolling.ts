import { useEffect, useRef, useState, useCallback } from 'react';

export interface UsePollingReturn {
  refresh: () => void;
  lastUpdate: Date;
  isLoading: boolean;
}

export function usePolling(
  callback: () => void | Promise<void>,
  interval: number = 10000
): UsePollingReturn {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const callbackRef = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  // Keep callback ref up to date to prevent stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Execute callback and handle loading state
  const executeCallback = useCallback(async () => {
    if (isLoading) return; // Prevent multiple simultaneous calls

    try {
      setIsLoading(true);
      await callbackRef.current();
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Polling callback error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Clear existing interval
  const clearPollingInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start polling interval
  const startPollingInterval = useCallback(() => {
    clearPollingInterval();
    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        executeCallback();
      }
    }, interval);
  }, [interval, executeCallback, clearPollingInterval]);

  // Manual refresh function
  const refresh = useCallback(() => {
    executeCallback();
    // Reset the interval after manual refresh
    if (isVisibleRef.current) {
      startPollingInterval();
    }
  }, [executeCallback, startPollingInterval]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - stop polling
        isVisibleRef.current = false;
        clearPollingInterval();
      } else {
        // Tab is visible - resume polling
        isVisibleRef.current = true;
        // Immediately fetch on visibility restore
        executeCallback();
        // Restart polling interval
        startPollingInterval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [executeCallback, startPollingInterval, clearPollingInterval]);

  // Initial call and polling setup
  useEffect(() => {
    // Call immediately on mount
    executeCallback();

    // Start polling interval
    startPollingInterval();

    // Cleanup on unmount
    return () => {
      clearPollingInterval();
    };
  }, [interval]); // Only depend on interval changes

  return {
    refresh,
    lastUpdate,
    isLoading,
  };
}
