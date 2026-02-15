import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchOverview, OverviewData } from '../api/overview';
import { useNamespace } from './NamespaceContext';
import { usePollingContext } from './PollingContext';

interface OverviewContextType {
  overviewData: OverviewData | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  lastUpdate: Date;
}

const OverviewContext = createContext<OverviewContextType | undefined>(undefined);

export function OverviewProvider({ children }: { children: ReactNode }) {
  const { selectedNamespace } = useNamespace();
  const location = useLocation();
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { register, unregister, refresh, lastUpdate } = usePollingContext();

  const loadOverview = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const namespace = selectedNamespace === 'all' ? undefined : selectedNamespace;
      const data = await fetchOverview(namespace);
      setOverviewData(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedNamespace]);

  // Keep callback ref up to date to prevent stale closures
  const callbackRef = useRef(loadOverview);
  useEffect(() => {
    callbackRef.current = loadOverview;
  }, [loadOverview]);

  // Only register for polling when on the overview tab
  const isOverviewTab = location.pathname === '/';
  useEffect(() => {
    if (isOverviewTab) {
      const wrappedCallback = async () => { await callbackRef.current(); };
      register('overview', wrappedCallback);
      return () => unregister('overview');
    }
  }, [isOverviewTab, register, unregister]);

  // Re-fetch when namespace changes
  useEffect(() => {
    loadOverview();
  }, [selectedNamespace]);

  return (
    <OverviewContext.Provider value={{ overviewData, isLoading, error, refresh, lastUpdate }}>
      {children}
    </OverviewContext.Provider>
  );
}

export function useOverview() {
  const context = useContext(OverviewContext);
  if (context === undefined) {
    throw new Error('useOverview must be used within an OverviewProvider');
  }
  return context;
}
