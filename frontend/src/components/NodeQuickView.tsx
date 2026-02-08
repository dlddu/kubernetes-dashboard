import { UsageBar } from './UsageBar';

interface Node {
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  status: string;
}

interface NodeQuickViewProps {
  nodes: Node[];
  loading?: boolean;
  filter?: string;
  sortBy?: 'name' | 'cpu' | 'memory';
}

export function NodeQuickView({
  nodes,
  loading = false,
  filter,
  sortBy = 'name',
}: NodeQuickViewProps) {
  const getStatusColor = (status: string) => {
    if (status === 'Ready') {
      return 'bg-green-500';
    } else if (status === 'NotReady') {
      return 'bg-red-500';
    } else if (status === 'Unknown') {
      return 'bg-gray-500';
    }
    return 'bg-orange-500';
  };

  // Filter nodes
  const filteredNodes = filter
    ? nodes.filter((node) => node.status === filter)
    : nodes;

  // Sort nodes
  const sortedNodes = [...filteredNodes].sort((a, b) => {
    if (sortBy === 'cpu') {
      return a.cpuUsage - b.cpuUsage;
    } else if (sortBy === 'memory') {
      return a.memoryUsage - b.memoryUsage;
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  if (loading) {
    return (
      <div
        data-testid="node-quick-view"
        aria-label="Node quick view"
        className="border rounded shadow bg-white p-4"
      >
        <h2 className="text-lg font-semibold mb-4">Nodes</h2>
        <div data-testid="node-quick-view-skeleton">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              data-testid={`skeleton-item-${i}`}
              className="h-20 bg-gray-200 rounded animate-pulse mb-2"
            />
          ))}
        </div>
      </div>
    );
  }

  if (sortedNodes.length === 0) {
    return (
      <div
        data-testid="node-quick-view"
        aria-label="Node quick view"
        className="border rounded shadow bg-white p-4"
      >
        <h2 className="text-lg font-semibold mb-4">Nodes</h2>
        <div className="text-center py-8 text-gray-600">
          <p>No nodes found</p>
          <p className="text-sm text-gray-500 mt-1">Cluster is empty. Add nodes to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="node-quick-view"
      aria-label="Node quick view"
      className="border rounded shadow bg-white p-4 overflow-auto"
    >
      <h2 className="text-lg font-semibold mb-4">Nodes</h2>
      <div data-testid="node-list-container" className="max-h-96 overflow-y-auto">
        <ul role="list" className="space-y-3">
          {sortedNodes.map((node) => (
            <li
              key={node.name}
              data-testid="node-item"
              role="listitem"
              className="p-3 border rounded hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  data-testid="node-status-indicator"
                  className={`w-3 h-3 rounded-full ${getStatusColor(node.status)}`}
                />
                <div className="font-medium truncate flex-1">{node.name}</div>
                <div className="text-sm text-gray-600">{node.status}</div>
              </div>
              <div className="space-y-2 ml-5">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">CPU</span>
                    <span className="font-medium">{node.cpuUsage.toFixed(1)}%</span>
                  </div>
                  <UsageBar
                    percentage={node.cpuUsage}
                    label={`CPU usage for ${node.name}`}
                    data-testid="cpu-usage-bar"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Memory</span>
                    <span className="font-medium">{node.memoryUsage.toFixed(1)}%</span>
                  </div>
                  <UsageBar
                    percentage={node.memoryUsage}
                    label={`Memory usage for ${node.name}`}
                    data-testid="memory-usage-bar"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
