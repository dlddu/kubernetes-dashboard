import { OverviewData } from '../api/overview';
import { UsageBar } from './UsageBar';

interface SummaryCardsProps {
  data: OverviewData;
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const allNodesReady = data.nodes.ready === data.nodes.total && data.nodes.total > 0;
  const hasUnhealthyPods = data.unhealthyPods > 0;

  return (
    <div
      data-testid="summary-cards-container"
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      {/* Nodes Card */}
      <article
        data-testid="summary-card-nodes"
        aria-label="Node status summary"
        className={`border rounded shadow bg-white p-4 hover:shadow-lg transition-shadow ${
          allNodesReady ? 'text-green-600' : 'text-yellow-600'
        }`}
      >
        <h3 className="text-sm font-medium text-gray-600 mb-2">Nodes</h3>
        <div className="text-2xl font-bold">
          {data.nodes.ready} / {data.nodes.total}
        </div>
        <div className="text-xs text-gray-500 mt-1">Ready / Total</div>
      </article>

      {/* Unhealthy Pods Card */}
      <article
        data-testid="summary-card-unhealthy-pods"
        aria-label="Unhealthy pods summary"
        className={`border rounded shadow bg-white p-4 hover:shadow-lg transition-shadow ${
          hasUnhealthyPods ? 'text-red-600' : 'text-green-600'
        }`}
      >
        <h3 className="text-sm font-medium text-gray-600 mb-2">Unhealthy Pods</h3>
        <div className="text-2xl font-bold">{data.unhealthyPods}</div>
        <div className="text-xs text-gray-500 mt-1">Pods requiring attention</div>
      </article>

      {/* CPU Card */}
      <article
        data-testid="summary-card-cpu"
        aria-label="CPU usage summary"
        className={`border rounded shadow bg-white p-4 hover:shadow-lg transition-shadow ${
          data.averageCpu >= 80 ? 'text-red-600' : 'text-blue-600'
        }`}
      >
        <h3 className="text-sm font-medium text-gray-600 mb-2">Average CPU</h3>
        <div className="text-2xl font-bold">{data.averageCpu.toFixed(1)}%</div>
        <UsageBar percentage={data.averageCpu} label="CPU usage" className="mt-2" />
      </article>

      {/* Memory Card */}
      <article
        data-testid="summary-card-memory"
        aria-label="Memory usage summary"
        className={`border rounded shadow bg-white p-4 hover:shadow-lg transition-shadow ${
          data.averageMemory >= 80 ? 'text-red-600' : 'text-blue-600'
        }`}
      >
        <h3 className="text-sm font-medium text-gray-600 mb-2">Average Memory</h3>
        <div className="text-2xl font-bold">{data.averageMemory.toFixed(1)}%</div>
        <UsageBar percentage={data.averageMemory} label="Memory usage" className="mt-2" />
      </article>
    </div>
  );
}
