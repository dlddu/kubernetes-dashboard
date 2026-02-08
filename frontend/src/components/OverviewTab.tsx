import { useState, useCallback } from 'react';
import { fetchOverview, OverviewData } from '../api/overview';
import { usePolling } from '../hooks/usePolling';
import { SummaryCards } from './SummaryCards';
import { UnhealthyPodPreview } from './UnhealthyPodPreview';
import { NodeQuickView } from './NodeQuickView';
import { PollingIndicator } from './PollingIndicator';

interface OverviewTabProps {
  namespace?: string;
}

export function OverviewTab({ namespace }: OverviewTabProps) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchOverview(namespace);
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [namespace]);

  // Use polling hook for auto-refresh
  usePolling(loadData, 10000);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    loadData();
  };

  // Loading state
  if (loading && !data) {
    return (
      <div
        data-testid="overview-tab"
        role="tabpanel"
        aria-label="Overview tab"
        className="p-6 overflow-y-auto"
      >
        <div
          data-testid="skeleton-container"
          role="status"
          aria-label="Loading overview data"
          aria-live="polite"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              data-testid={`skeleton-card-${i}`}
              className="h-32 bg-gray-200 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        data-testid="overview-tab"
        role="tabpanel"
        aria-label="Overview tab"
        className="p-6"
      >
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error loading overview data</p>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            aria-label="Retry loading overview data"
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
      <div
        data-testid="overview-tab"
        role="tabpanel"
        aria-label="Overview tab"
        className="p-6"
      >
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-2">Cluster is empty</p>
          <p className="text-gray-500">No nodes found in the cluster</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="overview-tab"
      role="tabpanel"
      aria-label="Overview tab"
      className="p-6 overflow-y-auto"
    >
      {/* Polling Indicator */}
      <div className="mb-4 flex justify-end">
        <PollingIndicator
          lastUpdated={lastUpdated}
          loading={loading}
          onRefresh={handleRetry}
        />
      </div>

      {/* Summary Cards */}
      {data && <SummaryCards data={data} />}

      {/* Additional sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <UnhealthyPodPreview pods={[]} />
        <NodeQuickView nodes={[]} />
      </div>
    </div>
  );
}
