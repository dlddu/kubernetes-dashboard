import { UnhealthyPodDetails } from '../api/pods';
import { StatusBadge } from './StatusBadge';

interface UnhealthyPodCardProps {
  pod: UnhealthyPodDetails;
}

export function UnhealthyPodCard({ pod }: UnhealthyPodCardProps) {
  // Determine if restart count should be highlighted (> 10)
  const isHighRestartCount = pod.restarts > 10;

  return (
    <div data-testid="pod-card" className="bg-white rounded-lg border border-gray-200 shadow p-6 space-y-4">
      {/* Pod Name */}
      <div>
        <h3 data-testid="pod-name" className="text-lg font-semibold text-gray-900 truncate">
          {pod.name}
        </h3>
      </div>

      {/* Namespace */}
      <div>
        <div className="text-sm text-gray-600">Namespace</div>
        <div data-testid="pod-namespace" className="text-sm font-medium text-gray-900">
          {pod.namespace}
        </div>
      </div>

      {/* Status Badge */}
      <div>
        <div className="text-sm text-gray-600">Status</div>
        <div className="mt-1">
          <StatusBadge status={pod.status} testId="status-badge" />
        </div>
      </div>

      {/* Restart Count */}
      <div>
        <div className="text-sm text-gray-600">Restarts</div>
        <div
          data-testid="pod-restarts"
          className={`text-sm font-medium ${
            isHighRestartCount ? 'text-red-600 font-bold' : 'text-gray-900'
          }`}
        >
          {pod.restarts}
        </div>
      </div>

      {/* Node */}
      <div>
        <div className="text-sm text-gray-600">Node</div>
        <div data-testid="pod-node" className="text-sm font-medium text-gray-900">
          {pod.node}
        </div>
      </div>

      {/* Age */}
      <div>
        <div className="text-sm text-gray-600">Age</div>
        <div data-testid="pod-age" className="text-sm font-medium text-gray-900">
          {pod.age}
        </div>
      </div>
    </div>
  );
}
