import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { fetchOverview, OverviewData } from '../api/overview';
import { useNamespace } from './NamespaceContext';
import { usePolling } from '../hooks/usePolling';

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
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

  const { refresh, lastUpdate } = usePolling(loadOverview);

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
