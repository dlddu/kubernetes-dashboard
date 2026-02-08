import { useEffect, useRef } from 'react';

export function usePolling(callback: () => void, interval: number = 10000) {
  const savedCallback = useRef(callback);
  const intervalRef = useRef<number | null>(null);

  // Update callback ref when callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    // Call immediately on mount with error handling
    try {
      savedCallback.current();
    } catch (error) {
      console.error('Polling callback error:', error);
    }

    // Start polling
    const startPolling = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = window.setInterval(() => {
        try {
          savedCallback.current();
        } catch (error) {
          console.error('Polling callback error:', error);
        }
      }, interval);
    };

    // Stop polling
    const stopPolling = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
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

    // Start polling if tab is visible
    if (!document.hidden) {
      startPolling();
    }

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [interval]);
}
