import { useState, useEffect, useCallback, useRef } from 'react';
import { useVisibilityChange } from './useVisibilityChange';

interface UsePollingResult {
  isPolling: boolean;
  lastUpdated: Date | null;
  refetch: () => void;
}

/**
 * Hook to poll a callback function at specified intervals
 * Automatically pauses when tab is inactive
 *
 * @param callback - Function to execute on each poll
 * @param interval - Polling interval in milliseconds
 * @returns Object with isPolling state, lastUpdated timestamp, and refetch function
 */
export function usePolling(
  callback: () => void,
  interval: number
): UsePollingResult {
  const isVisible = useVisibilityChange();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const callbackRef = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep callback reference up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Execute callback and update timestamp
  const execute = useCallback(() => {
    callbackRef.current();
    setLastUpdated(new Date());
  }, []);

  // Manual refetch function
  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  // Execute immediately on mount
  useEffect(() => {
    execute();
  }, [execute]);

  // Setup/cleanup polling interval based on visibility
  useEffect(() => {
    if (isVisible) {
      // Start polling when visible
      intervalRef.current = setInterval(() => {
        execute();
      }, interval);
    } else {
      // Stop polling when hidden
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isVisible, interval, execute]);

  return {
    isPolling: isVisible,
    lastUpdated,
    refetch,
  };
}
