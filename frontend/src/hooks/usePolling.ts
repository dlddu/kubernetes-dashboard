import { useEffect, useRef, useId } from 'react';
import { usePollingContext } from '../contexts/PollingContext';

export interface UsePollingReturn {
  refresh: () => void;
  lastUpdate: Date;
  isLoading: boolean;
}

export function usePolling(
  callback: () => void | Promise<void>,
): UsePollingReturn {
  const id = useId();
  const { register, unregister, refresh, lastUpdate, isLoading } = usePollingContext();
  const callbackRef = useRef(callback);

  // Keep callback ref up to date to prevent stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Register with polling context
  useEffect(() => {
    const wrappedCallback = async () => { await callbackRef.current(); };
    register(id, wrappedCallback);
    return () => unregister(id);
  }, [id, register, unregister]);

  return { refresh, lastUpdate, isLoading };
}
