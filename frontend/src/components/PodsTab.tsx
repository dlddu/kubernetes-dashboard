import { useState } from 'react';
import { fetchAllPods, PodDetails } from '../api/pods';
import { UnhealthyPodCard } from './UnhealthyPodCard';
import { PodLogPanel } from './PodLogPanel';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorRetry } from './ErrorRetry';
import { EmptyState } from './EmptyState';
import { useDataFetch } from '../hooks/useDataFetch';

interface PodsTabProps {
  namespace?: string;
}

const COMPLETED_STATUSES = ['succeeded', 'completed'];

export function PodsTab({ namespace }: PodsTabProps = {}) {
  const { data: pods, isLoading, error, refresh } = useDataFetch<PodDetails>(
    () => fetchAllPods(namespace),
    'Failed to fetch pods',
    [namespace],
  );

  const [selectedPod, setSelectedPod] = useState<PodDetails | null>(null);
  const [hideCompleted, setHideCompleted] = useState(false);

  const filteredPods = hideCompleted
    ? pods.filter((pod) => !COMPLETED_STATUSES.includes(pod.status.toLowerCase()))
    : pods;

  const completedCount = pods.filter((pod) =>
    COMPLETED_STATUSES.includes(pod.status.toLowerCase()),
  ).length;

  return (
    <div data-testid="pods-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pods</h1>
        {completedCount > 0 && (
          <button
            data-testid="hide-completed-toggle"
            onClick={() => setHideCompleted((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              hideCompleted
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-gray-100 text-gray-700 border-gray-300'
            }`}
          >
            <span
              className={`inline-block w-3 h-3 rounded-sm border ${
                hideCompleted
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-gray-400'
              }`}
            />
            Hide Completed ({completedCount})
          </button>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          All Pods {filteredPods.length > 0 && `(${filteredPods.length})`}
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

        {!isLoading && !error && filteredPods.length === 0 && pods.length === 0 && (
          <EmptyState
            message="No pods found"
            testId="no-pods-message"
          />
        )}

        {!isLoading && !error && filteredPods.length === 0 && pods.length > 0 && (
          <EmptyState
            message="All pods are completed. Toggle the filter to show them."
            testId="no-visible-pods-message"
          />
        )}

        {filteredPods.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPods.map((pod) => (
              <UnhealthyPodCard
                key={`${pod.namespace}-${pod.name}`}
                pod={pod}
                onClick={(p) => setSelectedPod(p)}
                isSelected={
                  selectedPod?.name === pod.name &&
                  selectedPod?.namespace === pod.namespace
                }
              />
            ))}
          </div>
        )}
      </div>

      {selectedPod && (
        <PodLogPanel
          pod={selectedPod}
          onClose={() => setSelectedPod(null)}
        />
      )}
    </div>
  );
}
