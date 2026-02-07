import { useEffect, useRef } from 'react';

export function usePolling(callback: () => void, intervalMs: number = 10000) {
  const savedCallback = useRef(callback);
  const intervalIdRef = useRef<number | null>(null);

  // Update ref when callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    // Call immediately on mount
    try {
      savedCallback.current();
    } catch (error) {
      console.error('Polling callback error:', error);
    }

    // Start polling
    const startPolling = () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      intervalIdRef.current = setInterval(() => {
        try {
          savedCallback.current();
        } catch (error) {
          console.error('Polling callback error:', error);
        }
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
        try {
          savedCallback.current();
        } catch (error) {
          console.error('Polling callback error:', error);
        }
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
