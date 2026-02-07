import { useEffect, useRef } from 'react';

export function usePolling(callback: () => void, intervalMs: number = 10000) {
  const savedCallback = useRef(callback);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // Update ref when callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    // Call immediately on mount
    savedCallback.current();

    // Start polling
    const startPolling = () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      intervalIdRef.current = setInterval(() => {
        savedCallback.current();
      }, intervalMs);
    };

    // Stop polling
    const stopPolling = () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Call immediately when tab becomes visible
        savedCallback.current();
        startPolling();
      }
    };

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start polling if tab is visible
    if (!document.hidden) {
      startPolling();
    }

    // Cleanup
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs]);
}
