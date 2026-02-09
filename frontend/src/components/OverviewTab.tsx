import { useState, useEffect } from 'react';
import { SummaryCards } from './SummaryCards';
import { fetchOverview, type OverviewData } from '../api/overview';
import { useNamespace } from '../contexts/NamespaceContext';

export function OverviewTab() {
  const { selectedNamespace } = useNamespace();
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchOverview(selectedNamespace);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedNamespace]);

  const handleRetry = () => {
    loadData();
  };

  const isEmpty = data && data.nodes.total === 0;

  return (
    <div
      data-testid="overview-tab"
      aria-busy={isLoading}
      aria-label="Overview"
      role="region"
      className="overview-tab p-4 overflow-auto"
    >
      <h2 className="text-2xl font-bold mb-6">Overview</h2>

      {isLoading && (
        <div data-testid="overview-loading">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                data-testid="summary-card-skeleton"
                className="skeleton border border-gray-200 rounded-lg p-4 bg-gray-200 animate-pulse h-32"
              />
            ))}
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div
          data-testid="summary-cards-error"
          role="alert"
          className="border border-red-300 bg-red-50 rounded-lg p-4"
        >
          <div className="flex flex-col gap-3">
            <p className="text-red-800 font-medium">
              Unable to load overview data. Please try again.
            </p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors self-start"
              aria-label="Retry loading overview data"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && isEmpty && (
        <div
          data-testid="overview-empty-state"
          className="border border-gray-200 rounded-lg p-8 bg-gray-50 text-center"
        >
          <p className="text-gray-600 text-lg">
            Cluster is empty - no nodes available
          </p>
        </div>
      )}

      {!isLoading && !error && data && !isEmpty && <SummaryCards data={data} />}
    </div>
  );
}
