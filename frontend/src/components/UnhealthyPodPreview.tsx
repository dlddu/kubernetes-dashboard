interface Pod {
  name: string;
  namespace: string;
  status: string;
}

interface UnhealthyPodPreviewProps {
  pods: Pod[];
  totalCount?: number;
  loading?: boolean;
  onPodClick?: (pod: Pod) => void;
}

export function UnhealthyPodPreview({
  pods,
  totalCount,
  loading = false,
  onPodClick,
}: UnhealthyPodPreviewProps) {
  const displayPods = pods.slice(0, 3);
  const shouldShowViewAll = (totalCount || pods.length) > 3;

  const getStatusColor = (status: string) => {
    if (status === 'CrashLoopBackOff' || status === 'Error' || status === 'Failed') {
      return 'bg-red-500';
    } else if (status === 'Pending') {
      return 'bg-orange-500';
    } else if (status === 'Unknown') {
      return 'bg-gray-500';
    }
    return 'bg-yellow-500';
  };

  if (loading) {
    return (
      <div
        data-testid="unhealthy-pod-preview"
        aria-label="Unhealthy pods preview"
        className="border rounded shadow bg-white p-4"
      >
        <h2 className="text-lg font-semibold mb-4">Unhealthy Pods</h2>
        <div data-testid="unhealthy-pods-skeleton">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              data-testid={`skeleton-item-${i}`}
              className="h-12 bg-gray-200 rounded animate-pulse mb-2"
            />
          ))}
        </div>
      </div>
    );
  }

  if (pods.length === 0) {
    return (
      <div
        data-testid="unhealthy-pod-preview"
        aria-label="Unhealthy pods preview"
        className="border rounded shadow bg-white p-4"
      >
        <h2 className="text-lg font-semibold mb-4">Unhealthy Pods</h2>
        <div className="text-center py-8">
          <div
            data-testid="empty-state-icon"
            className="text-green-500 text-4xl mb-2"
          >
            ✓
          </div>
          <p className="text-gray-600">No unhealthy pods</p>
          <p className="text-sm text-gray-500 mt-1">All pods are healthy and running normally</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="unhealthy-pod-preview"
      aria-label="Unhealthy pods preview"
      className="border rounded shadow bg-white p-4"
    >
      <h2 className="text-lg font-semibold mb-4">Unhealthy Pods</h2>
      <ul role="list" className="space-y-2">
        {displayPods.map((pod) => (
          <li
            key={`${pod.namespace}/${pod.name}`}
            data-testid="unhealthy-pod-item"
            role="listitem"
            tabIndex={0}
            onClick={() => onPodClick?.(pod)}
            className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <div
              data-testid="pod-status-indicator"
              className={`w-3 h-3 rounded-full ${getStatusColor(pod.status)}`}
            />
            <div className="flex-1 overflow-hidden">
              <div className="font-medium truncate">{pod.name}</div>
              <div className="text-sm text-gray-500 truncate">{pod.namespace}</div>
            </div>
            <div className="text-sm text-gray-600">{pod.status}</div>
          </li>
        ))}
      </ul>
      {shouldShowViewAll && (
        <a
          href="/pods"
          role="link"
          className="block text-center mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View All ({totalCount || pods.length} unhealthy pods)
        </a>
      )}
    </div>
  );
}
