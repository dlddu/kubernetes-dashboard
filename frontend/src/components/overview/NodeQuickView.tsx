import { Node } from '../../api/overview';
import { UsageBar } from './UsageBar';

interface NodeQuickViewProps {
  nodes: Node[];
}

export function NodeQuickView({ nodes }: NodeQuickViewProps) {
  const getStatusClass = (status: string) => {
    if (status === 'Ready') {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-red-100 text-red-800';
  };

  if (nodes.length === 0) {
    return (
      <div
        className="bg-white rounded-lg border border-gray-200 p-6"
        data-testid="node-quick-view"
        aria-label="Node quick view"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nodes</h2>
        <div
          className="flex flex-col items-center justify-center py-8 text-gray-500"
          data-testid="nodes-empty-state"
        >
          <svg
            className="w-12 h-12 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
            />
          </svg>
          <p className="font-medium">No nodes available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-6 max-h-96 overflow-y-auto"
      data-testid="node-quick-view"
      aria-label="Node quick view"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Nodes</h2>
      <ul className="space-y-4" role="list">
        {nodes.map((node) => (
          <li
            key={node.name}
            className="p-4 rounded-lg bg-gray-50"
            data-testid="node-item"
            role="listitem"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900 truncate">
                {node.name}
              </span>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusClass(node.status)}`}
                data-testid="node-status-indicator"
              >
                {node.status}
              </span>
            </div>

            <div className="space-y-3">
              <div data-testid="cpu-usage-bar">
                <UsageBar
                  percentage={node.cpuUsage}
                  label="CPU"
                />
              </div>
              <div data-testid="memory-usage-bar">
                <UsageBar
                  percentage={node.memoryUsage}
                  label="Memory"
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
