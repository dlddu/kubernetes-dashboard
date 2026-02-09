import { useEffect, useRef } from 'react';

export function usePolling(callback: () => void | Promise<void>, interval: number) {
  const savedCallback = useRef(callback);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update ref when callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    // Call immediately on mount
    const executeCallback = async () => {
      try {
        await savedCallback.current();
      } catch (error) {
        console.error('Polling callback error:', error);
      }
    };

    executeCallback();

    // Set up polling interval
    const startPolling = () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }

      intervalIdRef.current = setInterval(() => {
        if (!document.hidden) {
          executeCallback();
        }
      }, interval);
    };

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Stop polling when tab is hidden
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
      } else {
        // Resume polling when tab becomes visible
        executeCallback();
        startPolling();
      }
    };

    // Start polling
    startPolling();

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [interval]);
}
