import { useEffect } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { useNamespace } from '../contexts/NamespaceContext';
import { usePolling } from '../hooks/usePolling';
import { SummaryCards } from './SummaryCards';
import { UnhealthyPodPreview } from './UnhealthyPodPreview';
import { NodeQuickView } from './NodeQuickView';

export function OverviewTab() {
  const { selectedNamespace } = useNamespace();
  const { loadDashboard } = useDashboard();
  usePolling(loadDashboard);

  // Re-fetch when namespace changes
  useEffect(() => {
    loadDashboard();
  }, [selectedNamespace]);

  return (
    <div data-testid="overview-tab" className="space-y-6">
      <SummaryCards />
      <UnhealthyPodPreview />
      <NodeQuickView />
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Welcome to the Kubernetes Dashboard. This is a modern web interface for managing Kubernetes clusters.
        </p>
      </div>
    </div>
  );
}
