import { Bug, TerminalSquare } from 'lucide-react';
import { UnhealthyPodDetails } from '../api/pods';
import { StatusBadge } from './StatusBadge';

interface UnhealthyPodCardProps {
  pod: UnhealthyPodDetails;
  onClick?: (pod: UnhealthyPodDetails) => void;
  onExec?: (pod: UnhealthyPodDetails) => void;
  onDebug?: (pod: UnhealthyPodDetails) => void;
  isSelected?: boolean;
}

export function UnhealthyPodCard({ pod, onClick, onExec, onDebug, isSelected }: UnhealthyPodCardProps) {
  // Determine if restart count should be highlighted (> 10)
  const isHighRestartCount = pod.restarts > 10;

  return (
    <div
      data-testid="pod-card"
      className={[
        'bg-white rounded-lg border border-gray-200 shadow p-6 space-y-4',
        onClick ? 'cursor-pointer hover:bg-gray-50 transition-all' : '',
        isSelected ? 'ring-2 ring-blue-500' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick ? () => onClick(pod) : undefined}
    >
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

      {/* Init Containers */}
      {pod.initContainers && pod.initContainers.length > 0 && (
        <div>
          <div className="text-sm text-gray-600">Init Containers</div>
          <div data-testid="pod-init-containers" className="text-sm font-medium text-gray-900">
            {`${pod.initContainers.length} ${pod.initContainers.length === 1 ? 'init container' : 'init containers'}: ${pod.initContainers.join(', ')}`}
          </div>
        </div>
      )}

      {/* Containers */}
      <div>
        <div className="text-sm text-gray-600">Containers</div>
        <div data-testid="pod-containers" className="text-sm font-medium text-gray-900">
          {pod.containers && pod.containers.length > 0
            ? `${pod.containers.length} ${pod.containers.length === 1 ? 'container' : 'containers'}: ${pod.containers.join(', ')}`
            : '0 containers'}
        </div>
      </div>

      {/* Action Buttons */}
      {(onExec || onDebug) && (
        <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
          {onExec && (
            <button
              data-testid="pod-exec-button"
              onClick={(e) => { e.stopPropagation(); onExec(pod); }}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
              title="Open shell"
            >
              <TerminalSquare size={14} />
              Shell
            </button>
          )}
          {onDebug && (
            <button
              data-testid="pod-debug-button"
              onClick={(e) => { e.stopPropagation(); onDebug(pod); }}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors"
              title="Attach ephemeral debug container"
            >
              <Bug size={14} />
              Debug
            </button>
          )}
        </div>
      )}
    </div>
  );
}
