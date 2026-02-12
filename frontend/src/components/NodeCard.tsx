import { NodeInfo } from '../api/nodes';
import { StatusBadge } from './StatusBadge';
import { UsageBar } from './UsageBar';

export function NodeCard({ name, status, cpuPercent, memoryPercent, podCount }: NodeInfo) {
  const isReady = status === 'Ready';

  // Clamp percentages between 0 and 100
  const clampedCpuPercent = Math.max(0, Math.min(100, cpuPercent));
  const clampedMemoryPercent = Math.max(0, Math.min(100, memoryPercent));

  return (
    <div data-testid="node-card" className="bg-white rounded-lg shadow p-6 space-y-4">
      {/* Node Name */}
      <div className="flex items-center justify-between">
        <h3 data-testid="node-name" className="text-lg font-semibold text-gray-900 truncate">
          {name}
        </h3>
        <StatusBadge status={status} testId="status-badge" />
      </div>

      {/* Ready Node - Show Usage Bars */}
      {isReady && (
        <div className="space-y-4">
          <div data-testid="node-cpu-usage">
            <div className="text-sm font-medium text-gray-700 mb-2">CPU</div>
            <UsageBar percentage={clampedCpuPercent} label="CPU" />
          </div>

          <div data-testid="node-memory-usage">
            <div className="text-sm font-medium text-gray-700 mb-2">Memory</div>
            <UsageBar percentage={clampedMemoryPercent} label="Memory" />
          </div>
        </div>
      )}

      {/* NotReady Node - Show Warning */}
      {!isReady && (
        <div data-testid="node-not-ready-warning" className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <div className="text-yellow-800 text-sm">
            This node is not ready and unavailable for scheduling pods.
          </div>
        </div>
      )}

      {/* Pod Count */}
      <div data-testid="node-pod-count" className="text-sm text-gray-600">
        {podCount} {podCount === 1 ? 'Pod' : 'Pods'}
      </div>
    </div>
  );
}
