import { useState, useEffect } from 'react';
import { fetchUnhealthyPods, UnhealthyPodDetails } from '../api/pods';
import { UnhealthyPodCard } from './UnhealthyPodCard';

interface PodsTabProps {
  namespace?: string;
}

export function PodsTab({ namespace }: PodsTabProps = {}) {
  const [pods, setPods] = useState<UnhealthyPodDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPods = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchUnhealthyPods(namespace);
      setPods(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch unhealthy pods');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPods();
  }, [namespace]);

  const handleRetry = () => {
    loadPods();
  };

  return (
    <div data-testid="pods-page" className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Pods</h1>

      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Unhealthy Pods {!isLoading && !error && `(${pods.length})`}
        </h2>

        {isLoading && (
          <div
            data-testid="pods-loading"
            aria-busy="true"
            aria-label="loading"
            className="flex items-center justify-center py-12"
          >
            <div className="text-gray-500">Loading...</div>
          </div>
        )}

        {error && (
          <div
            data-testid="pods-error"
            role="alert"
            className="bg-red-50 border border-red-200 rounded-lg p-6"
          >
            <div className="text-red-800 font-medium mb-2">Error loading pods</div>
            <div className="text-red-600 mb-4">{error}</div>
            <button
              data-testid="retry-button"
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && pods.length === 0 && (
          <div
            data-testid="no-unhealthy-pods-message"
            className="bg-green-50 border border-green-200 rounded-lg p-12 text-center"
          >
            <div className="text-green-800 text-lg">
              모든 Pod가 정상 Running 상태입니다 ✅
            </div>
          </div>
        )}

        {!isLoading && !error && pods.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pods.map((pod) => (
              <UnhealthyPodCard key={`${pod.namespace}-${pod.name}`} pod={pod} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
