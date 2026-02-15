import { useState, useEffect } from 'react';
import { fetchAllPods, PodDetails } from '../api/pods';
import { UnhealthyPodCard } from './UnhealthyPodCard';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorRetry } from './ErrorRetry';
import { EmptyState } from './EmptyState';

interface PodsTabProps {
  namespace?: string;
}

export function PodsTab({ namespace }: PodsTabProps = {}) {
  const [pods, setPods] = useState<PodDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPods = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchAllPods(namespace);
      setPods(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pods');
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
          All Pods {!isLoading && !error && `(${pods.length})`}
        </h2>

        {isLoading && (
          <LoadingSkeleton
            variant="card"
            count={3}
            testId="pods-loading"
          />
        )}

        {error && (
          <ErrorRetry
            error={error}
            onRetry={handleRetry}
            title="Error loading pods"
            testId="pods-error"
          />
        )}

        {!isLoading && !error && pods.length === 0 && (
          <EmptyState
            message="No pods found"
            testId="no-pods-message"
          />
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
