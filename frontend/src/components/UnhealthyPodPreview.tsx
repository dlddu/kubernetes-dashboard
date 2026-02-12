import { useState, useEffect } from 'react';
import { fetchOverview, UnhealthyPodInfo } from '../api/overview';
import { StatusBadge } from './StatusBadge';
import { usePolling } from '../hooks/usePolling';

interface UnhealthyPodPreviewProps {
  namespace?: string;
}

export function UnhealthyPodPreview({ namespace }: UnhealthyPodPreviewProps) {
  const [unhealthyPods, setUnhealthyPods] = useState<UnhealthyPodInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchOverview(namespace);

      // Generate mock unhealthy pods data based on unhealthyPods count
      // This will be replaced by actual backend data later
      const mockPods: UnhealthyPodInfo[] = [];
      const statuses = ['CrashLoopBackOff', 'ImagePullBackOff', 'Pending', 'Failed', 'Unknown'];
      const namespaces = ['default', 'kube-system', 'monitoring', 'production'];

      for (let i = 0; i < data.unhealthyPods; i++) {
        mockPods.push({
          name: `pod-${i + 1}`,
          namespace: namespaces[i % namespaces.length],
          status: statuses[i % statuses.length],
        });
      }

      setUnhealthyPods(data.unhealthyPodsList || mockPods);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use polling hook for automatic refresh
  usePolling(loadData);

  // Re-load when namespace changes
  useEffect(() => {
    loadData();
  }, [namespace]);

  // Loading state
  if (isLoading) {
    return (
      <section
        data-testid="unhealthy-pod-preview"
        aria-label="Unhealthy Pods"
        aria-busy="true"
        className="bg-white rounded-lg shadow p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Unhealthy Pods</h2>
        <div data-testid="loading-indicator" className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section
        data-testid="unhealthy-pod-preview"
        aria-label="Unhealthy Pods"
        className="bg-white rounded-lg shadow p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Unhealthy Pods</h2>
        <div
          data-testid="error-message"
          className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800"
        >
          Failed to load unhealthy pods. Please try again later.
        </div>
      </section>
    );
  }

  // Display up to 3 pods
  const displayPods = unhealthyPods.slice(0, 3);
  const hasMorePods = unhealthyPods.length > 3;

  return (
    <section
      data-testid="unhealthy-pod-preview"
      aria-label="Unhealthy Pods"
      role="region"
      className="bg-white rounded-lg shadow p-6"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Unhealthy Pods</h2>

      {/* Empty state - all pods healthy */}
      {unhealthyPods.length === 0 && (
        <div
          data-testid="all-pods-healthy-message"
          className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800"
        >
          All pods are healthy and running normally.
        </div>
      )}

      {/* Pod list */}
      {unhealthyPods.length > 0 && (
        <ul role="list" className="space-y-3">
          {displayPods.map((pod, index) => (
            <li
              key={`${pod.namespace}-${pod.name}-${index}`}
              data-testid="unhealthy-pod-item"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-1 min-w-0">
                <div
                  data-testid="unhealthy-pod-name"
                  className="text-sm font-medium text-gray-900 truncate"
                >
                  {pod.name}
                </div>
                <div
                  data-testid="unhealthy-pod-namespace"
                  className="text-xs text-gray-500 mt-1"
                >
                  {pod.namespace}
                </div>
              </div>
              <div className="ml-4 flex-shrink-0">
                <StatusBadge status={pod.status} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* View more link - TODO: Replace <a> with React Router <Link> when implementing Pods page */}
      {hasMorePods && (
        <div className="mt-4 text-center">
          <a
            data-testid="view-more-link"
            href="/pods"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, '', '/pods');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            View all pods ({unhealthyPods.length} total)
          </a>
        </div>
      )}
    </section>
  );
}
