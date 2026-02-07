import { UsageBar } from './UsageBar';

interface SummaryCardsProps {
  nodes: {
    ready: number;
    total: number;
  };
  unhealthyPods: number;
  avgCpuUsage: number;
  avgMemoryUsage: number;
}

export function SummaryCards({
  nodes,
  unhealthyPods,
  avgCpuUsage,
  avgMemoryUsage,
}: SummaryCardsProps) {
  return (
    <div
      data-testid="summary-cards"
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      {/* Nodes Card */}
      <div
        data-testid="nodes-card"
        className="bg-white rounded-lg shadow border border-gray-200 p-4"
      >
        <h3 className="text-sm font-medium text-gray-600 mb-2">Nodes</h3>
        <div className="text-2xl font-bold text-gray-900">
          {nodes.ready} / {nodes.total}
        </div>
        <p className="text-xs text-gray-500 mt-1">Ready / Total</p>
      </div>

      {/* Unhealthy Pods Card */}
      <div
        data-testid="pods-card"
        className="bg-white rounded-lg shadow border border-gray-200 p-4"
      >
        <h3 className="text-sm font-medium text-gray-600 mb-2">
          Unhealthy Pods
        </h3>
        <div className="text-2xl font-bold text-gray-900">{unhealthyPods}</div>
        <p className="text-xs text-gray-500 mt-1">Not Running</p>
      </div>

      {/* CPU Usage Card */}
      <div
        data-testid="cpu-card"
        className="bg-white rounded-lg shadow border border-gray-200 p-4"
      >
        <h3 className="text-sm font-medium text-gray-600 mb-2">CPU Usage</h3>
        <div className="text-2xl font-bold text-gray-900">
          {avgCpuUsage.toFixed(1)}%
        </div>
        <div data-testid="cpu-usage-bar" className="mt-3">
          <UsageBar percentage={avgCpuUsage} type="cpu" />
        </div>
      </div>

      {/* Memory Usage Card */}
      <div
        data-testid="memory-card"
        className="bg-white rounded-lg shadow border border-gray-200 p-4"
      >
        <h3 className="text-sm font-medium text-gray-600 mb-2">Memory Usage</h3>
        <div className="text-2xl font-bold text-gray-900">
          {avgMemoryUsage.toFixed(1)}%
        </div>
        <div data-testid="memory-usage-bar" className="mt-3">
          <UsageBar percentage={avgMemoryUsage} type="memory" />
        </div>
      </div>
    </div>
  );
}
