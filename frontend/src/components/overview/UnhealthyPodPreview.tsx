import { UnhealthyPod } from '../../api/overview';

interface UnhealthyPodPreviewProps {
  pods: UnhealthyPod[];
  onPodClick?: (name: string, namespace: string) => void;
}

export function UnhealthyPodPreview({ pods, onPodClick }: UnhealthyPodPreviewProps) {
  const displayPods = pods.slice(0, 3);
  const remainingCount = pods.length - 3;

  const getStatusClass = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('error') || statusLower.includes('failed')) {
      return 'bg-red-100 text-red-800';
    } else if (statusLower.includes('crashloop')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (statusLower.includes('pending')) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  if (pods.length === 0) {
    return (
      <div
        className="bg-white rounded-lg border border-gray-200 p-6"
        data-testid="unhealthy-pod-preview"
        aria-label="Unhealthy pods preview"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Unhealthy Pods</h2>
        <div
          className="flex flex-col items-center justify-center py-8 text-gray-500"
          data-testid="unhealthy-pods-empty-state"
        >
          <svg
            className="w-12 h-12 mb-3 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="font-medium">All pods are healthy</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-6"
      data-testid="unhealthy-pod-preview"
      aria-label="Unhealthy pods preview"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Unhealthy Pods</h2>
      <ul className="space-y-3" role="list">
        {displayPods.map((pod) => (
          <li
            key={`${pod.namespace}-${pod.name}`}
            className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden truncate text-ellipsis"
            data-testid="unhealthy-pod-item"
            onClick={() => onPodClick?.(pod.name, pod.namespace)}
            role="listitem"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 truncate">
                    {pod.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusClass(pod.status)}`}
                    data-testid="pod-status-indicator"
                  >
                    {pod.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="truncate">Namespace: {pod.namespace}</span>
                  {pod.restarts > 0 && (
                    <span className="text-red-600">
                      {pod.restarts} restart{pod.restarts !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {remainingCount > 0 && (
        <a
          href="#/pods"
          className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
          role="link"
        >
          View all {remainingCount} more unhealthy pod{remainingCount !== 1 ? 's' : ''}
          <svg
            className="ml-1 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </a>
      )}
    </div>
  );
}
