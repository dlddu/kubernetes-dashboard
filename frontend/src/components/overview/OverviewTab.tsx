import { useState, useCallback } from 'react';
import { fetchOverview, OverviewData } from '../../api/overview';
import { usePolling } from '../../hooks/usePolling';
import { SummaryCards } from './SummaryCards';
import { UnhealthyPodPreview } from './UnhealthyPodPreview';
import { NodeQuickView } from './NodeQuickView';
import { PollingIndicator } from './PollingIndicator';

export function OverviewTab() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const overviewData = await fetchOverview();
      setData(overviewData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load overview data');
      console.error('Error loading overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 10 seconds
  usePolling(loadData, 10000);

  const handleRetry = () => {
    loadData();
  };

  // Loading state
  if (loading && !data) {
    return (
      <div
        className="space-y-6"
        data-testid="overview-tab"
        aria-label="Cluster overview dashboard"
      >
        <div
          className="flex items-center justify-center py-12"
          data-testid="overview-loading"
          aria-live="polite"
        >
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" data-testid="skeleton-spinner" />
            <p className="text-gray-600">Loading overview...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div
        className="space-y-6"
        data-testid="overview-tab"
        aria-label="Cluster overview dashboard"
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg
            className="w-12 h-12 text-red-500 mx-auto mb-3"
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
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error loading overview</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
        className="space-y-6"
        data-testid="overview-tab"
        aria-label="Cluster overview dashboard"
      >
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No cluster data available</h3>
          <p className="text-gray-600">Connect to a Kubernetes cluster to see overview data.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-6"
      data-testid="overview-tab"
      aria-label="Cluster overview dashboard"
    >
      {/* Polling Indicator */}
      <div className="flex justify-end">
        <PollingIndicator
          lastUpdated={lastUpdated}
          isLoading={loading}
          onRefresh={loadData}
        />
      </div>

      {/* Summary Cards */}
      {data && (
        <>
          <SummaryCards data={data} />

          {/* Two-column layout for pod preview and node view */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UnhealthyPodPreview pods={data.unhealthyPodsList || []} />
            <NodeQuickView nodes={data.nodesList || []} />
          </div>
        </>
      )}
    </div>
  );
}
