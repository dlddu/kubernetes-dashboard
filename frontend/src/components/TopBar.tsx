import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { NamespaceSelector } from './NamespaceSelector';
import { ClusterStatus } from './ClusterStatus';
import { PollingIndicator } from './PollingIndicator';
import { DebugToggle } from './DebugToggle';
import { usePolling } from '../hooks/usePolling';
import { useDebugContext } from '../contexts/DebugContext';

export function TopBar() {
  const { isDebugMode } = useDebugContext();

  // Callback for polling (dashboard-wide refresh)
  const refreshDashboard = useCallback(async () => {
    // Trigger a refresh event that components can listen to
    window.dispatchEvent(new CustomEvent('dashboard-refresh'));
  }, []);

  // Use polling hook for the dashboard
  const { refresh, lastUpdate, isLoading } = usePolling(refreshDashboard);

  return (
    <header
      role="banner"
      data-testid="top-bar"
      className="bg-white border-b border-gray-200 shadow-sm"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">
              Kubernetes Dashboard
            </h1>
            {isDebugMode && (
              <Link
                to="/debug"
                data-testid="debug-nav-link"
                className="text-sm font-medium text-cyan-600 hover:text-cyan-700 underline"
              >
                Debug
              </Link>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <PollingIndicator
              lastUpdate={lastUpdate}
              onRefresh={refresh}
              isLoading={isLoading}
            />
            <DebugToggle />
            <NamespaceSelector />
            <ClusterStatus />
          </div>
        </div>
      </div>
    </header>
  );
}
