import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';

const DEFAULT_INTERVAL = 10000;

interface PollingContextType {
  register: (id: string, callback: () => Promise<void>) => void;
  unregister: (id: string) => void;
  refresh: () => void;
  lastUpdate: Date;
  isLoading: boolean;
}

const PollingContext = createContext<PollingContextType | undefined>(undefined);

export function PollingProvider({ children, interval = DEFAULT_INTERVAL }: { children: ReactNode; interval?: number }) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const callbacksRef = useRef<Map<string, () => Promise<void>>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVisibleRef = useRef<boolean>(true);
  const isLoadingRef = useRef<boolean>(false);

  // Execute all registered callbacks
  const executeAll = useCallback(async () => {
    if (isLoadingRef.current) return;

    const callbacks = Array.from(callbacksRef.current.values());
    if (callbacks.length === 0) return;

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      await Promise.allSettled(callbacks.map(cb => cb()));
      setLastUpdate(new Date());
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const clearPollingInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPollingInterval = useCallback(() => {
    clearPollingInterval();
    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        executeAll();
      }
    }, interval);
  }, [interval, executeAll, clearPollingInterval]);

  // Manual refresh: execute all + restart interval
  const refresh = useCallback(() => {
    executeAll();
    if (isVisibleRef.current) {
      startPollingInterval();
    }
  }, [executeAll, startPollingInterval]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisibleRef.current = false;
        clearPollingInterval();
      } else {
        isVisibleRef.current = true;
        executeAll();
        startPollingInterval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [executeAll, startPollingInterval, clearPollingInterval]);

  // Start the single polling interval
  useEffect(() => {
    startPollingInterval();
    return () => clearPollingInterval();
  }, [startPollingInterval, clearPollingInterval]);

  // Register a callback for periodic execution
  const register = useCallback((id: string, callback: () => Promise<void>) => {
    callbacksRef.current.set(id, callback);
    // Execute immediately on registration for initial data load
    callback().catch(err => console.error('Polling callback error:', err));
  }, []);

  const unregister = useCallback((id: string) => {
    callbacksRef.current.delete(id);
  }, []);

  return (
    <PollingContext.Provider value={{ register, unregister, refresh, lastUpdate, isLoading }}>
      {children}
    </PollingContext.Provider>
  );
}

export function usePollingContext() {
  const context = useContext(PollingContext);
  if (context === undefined) {
    throw new Error('usePollingContext must be used within a PollingProvider');
  }
  return context;
}
