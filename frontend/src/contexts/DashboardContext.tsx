import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { fetchOverview, OverviewData } from '../api/overview';
import { useNamespace } from './NamespaceContext';

interface DashboardContextType {
  overviewData: OverviewData | null;
  isLoading: boolean;
  error: Error | null;
  loadDashboard: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { selectedNamespace } = useNamespace();
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadDashboard = useCallback(async () => {
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

  return (
    <DashboardContext.Provider value={{ overviewData, isLoading, error, loadDashboard }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
