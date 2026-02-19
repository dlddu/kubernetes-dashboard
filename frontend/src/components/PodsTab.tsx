import { fetchAllPods, PodDetails } from '../api/pods';
import { UnhealthyPodCard } from './UnhealthyPodCard';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorRetry } from './ErrorRetry';
import { EmptyState } from './EmptyState';
import { useDataFetch } from '../hooks/useDataFetch';

interface PodsTabProps {
  namespace?: string;
}

export function PodsTab({ namespace }: PodsTabProps = {}) {
  const { data: pods, isLoading, error, refresh } = useDataFetch<PodDetails>(
    () => fetchAllPods(namespace),
    'Failed to fetch pods',
    [namespace],
  );

  return (
    <div data-testid="pods-page" className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Pods</h1>

      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          All Pods {pods.length > 0 && `(${pods.length})`}
        </h2>

        {isLoading && pods.length === 0 && (
          <LoadingSkeleton
            variant="card"
            count={3}
            testId="pods-loading"
          />
        )}

        {error && pods.length === 0 && (
          <ErrorRetry
            error={error}
            onRetry={refresh}
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

        {pods.length > 0 && (
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
