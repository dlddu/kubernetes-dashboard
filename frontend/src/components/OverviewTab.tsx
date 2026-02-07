import { useState } from 'react';
import { fetchOverview, OverviewResponse } from '../api/overview';
import { usePolling } from '../hooks/usePolling';
import { SummaryCards } from './SummaryCards';
import { PollingIndicator } from './PollingIndicator';

export function OverviewTab() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchOverview();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll every 10 seconds
  usePolling(loadData, 10000);

  const handleRetry = () => {
    loadData();
  };

  // Loading state - show skeleton
  if (isLoading && !data) {
    return (
      <div data-testid="overview-tab" className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Cluster Overview</h2>
        </div>
        <div data-testid="cards-grid" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            data-testid="skeleton-card"
            className="bg-gray-200 rounded-lg h-32 animate-pulse"
          >
            <div data-testid="nodes-skeleton" className="h-full"></div>
          </div>
          <div
            data-testid="skeleton-card"
            className="bg-gray-200 rounded-lg h-32 animate-pulse"
          >
            <div data-testid="pods-skeleton" className="h-full"></div>
          </div>
          <div
            data-testid="skeleton-card"
            className="bg-gray-200 rounded-lg h-32 animate-pulse"
          >
            <div data-testid="cpu-skeleton" className="h-full"></div>
          </div>
          <div
            data-testid="skeleton-card"
            className="bg-gray-200 rounded-lg h-32 animate-pulse"
          >
            <div data-testid="memory-skeleton" className="h-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div data-testid="overview-tab" className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Cluster Overview</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="h-5 w-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-red-800 font-medium">Error loading overview</h3>
          </div>
          <p className="text-red-700 text-sm mb-4">{error.message}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (data && data.nodes.total === 0) {
    return (
      <div data-testid="overview-tab" className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Cluster Overview</h2>
          <PollingIndicator lastUpdated={lastUpdated} isLoading={isLoading} />
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <svg
            className="mx-auto h-12 w-12 text-yellow-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Cluster is empty
          </h3>
          <p className="text-yellow-700">
            No nodes or pods are currently available in the cluster.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div data-testid="overview-tab" className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Cluster Overview</h2>
        <PollingIndicator lastUpdated={lastUpdated} isLoading={isLoading} />
      </div>
      <div data-testid="cards-grid">
        <SummaryCards
          nodes={data!.nodes}
          unhealthyPods={data!.unhealthyPods}
          avgCpuUsage={data!.avgCpuUsage}
          avgMemoryUsage={data!.avgMemoryUsage}
        />
      </div>
    </div>
  );
}
