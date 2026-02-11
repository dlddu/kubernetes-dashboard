import { useState, useCallback } from 'react';
import { fetchOverview, OverviewData } from '../api/overview';
import { useNamespace } from '../contexts/NamespaceContext';
import { usePolling } from '../hooks/usePolling';
import { SummaryCard } from './SummaryCard';
import { UsageBar } from './UsageBar';

export function SummaryCards() {
  const { selectedNamespace } = useNamespace();
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Pass namespace to API (if not 'all')
      const namespace = selectedNamespace === 'all' ? undefined : selectedNamespace;
      const overview = await fetchOverview(namespace);

      setData(overview);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedNamespace]);

  // Use polling hook with 10 second interval
  usePolling(loadOverview, 10000);

  const handleRetry = () => {
    loadOverview();
  };

  // Loading state - show skeleton cards
  if (isLoading && !data) {
    return (
      <div
        data-testid="summary-cards-container"
        aria-live="polite"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            data-testid="summary-card-skeleton"
            className="bg-white rounded-lg shadow p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  // Error state - show error message with retry button
  if (error) {
    return (
      <div
        data-testid="summary-cards-container"
        aria-live="polite"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="col-span-2 md:col-span-4">
          <div
            data-testid="summary-cards-error"
            className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col gap-4"
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-500"
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
              <p className="text-red-800 font-medium">Failed to load overview data</p>
            </div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors w-fit"
              aria-label="Retry loading overview data"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state - show data
  if (!data) {
    return null;
  }

  return (
    <div
      data-testid="summary-cards-container"
      aria-live="polite"
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      {/* Nodes Card */}
      <SummaryCard
        label="Nodes"
        value={`${data.nodes.ready} / ${data.nodes.total}`}
        testId="summary-card-nodes"
      />

      {/* Unhealthy Pods Card */}
      <SummaryCard
        label="Unhealthy Pods"
        value={String(data.unhealthyPods)}
        testId="summary-card-unhealthy-pods"
      />

      {/* Avg CPU Card with UsageBar */}
      <SummaryCard
        label="Avg CPU"
        value={`${data.avgCpuPercent.toFixed(1)}%`}
        testId="summary-card-avg-cpu"
      >
        <UsageBar percentage={data.avgCpuPercent} label="CPU Usage" />
      </SummaryCard>

      {/* Avg Memory Card with UsageBar */}
      <SummaryCard
        label="Avg Memory"
        value={`${data.avgMemoryPercent.toFixed(1)}%`}
        testId="summary-card-avg-memory"
      >
        <UsageBar percentage={data.avgMemoryPercent} label="Memory Usage" />
      </SummaryCard>
    </div>
  );
}
