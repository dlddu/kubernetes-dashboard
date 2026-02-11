import { useState, useEffect } from 'react';
import { fetchOverview, NodeInfo } from '@/api/overview';
import { UsageBar } from './UsageBar';
import { usePolling } from '../hooks/usePolling';

interface NodeQuickViewProps {
  namespace?: string;
}

export function NodeQuickView({ namespace }: NodeQuickViewProps = {}) {
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchOverview(namespace);
      setNodes(data.nodesList || []);
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

  const handleRetry = () => {
    loadData();
  };

  // Loading state
  if (isLoading) {
    return (
      <section
        data-testid="node-quick-view"
        aria-label="Nodes"
        aria-busy="true"
        className="bg-white rounded-lg shadow p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nodes</h2>
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
        data-testid="node-quick-view"
        aria-label="Nodes"
        role="region"
        className="bg-white rounded-lg shadow p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nodes</h2>
        <div
          data-testid="error-message"
          className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800"
        >
          Failed to load nodes. Please try again.
        </div>
        <button
          onClick={handleRetry}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </section>
    );
  }

  // Sort nodes: NotReady first, then Ready
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.status === 'NotReady' && b.status !== 'NotReady') return -1;
    if (a.status !== 'NotReady' && b.status === 'NotReady') return 1;
    return 0;
  });

  // Display up to 5 nodes
  const displayNodes = sortedNodes.slice(0, 5);
  const hasMoreNodes = nodes.length > 5;

  return (
    <section
      data-testid="node-quick-view"
      aria-label="Nodes"
      role="region"
      className="bg-white rounded-lg shadow p-6"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Nodes</h2>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="text-gray-600">
          No nodes found
        </div>
      )}

      {/* All nodes healthy message */}
      {nodes.length > 0 && nodes.every(n => n.status === 'Ready') && (
        <div
          data-testid="all-nodes-healthy-message"
          className="text-green-600 text-sm mb-3 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          All nodes healthy
        </div>
      )}

      {/* Node list */}
      {nodes.length > 0 && (
        <ul role="list" className="space-y-3">
          {displayNodes.map((node, index) => (
            <li
              key={`${node.name}-${index}`}
              data-testid="node-item"
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  data-testid="node-name"
                  className="text-sm font-medium text-gray-900 truncate"
                >
                  {node.name}
                </div>
                <div
                  data-testid="node-status"
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    node.status === 'Ready'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {node.status}
                </div>
              </div>

              {/* Ready nodes: show usage bars */}
              {node.status === 'Ready' && (
                <div className="space-y-2">
                  <div data-testid="node-cpu-usage">
                    <div className="text-xs text-gray-600 mb-1">CPU</div>
                    <UsageBar percentage={node.cpuPercent} label="CPU" />
                  </div>
                  <div data-testid="node-memory-usage">
                    <div className="text-xs text-gray-600 mb-1">Memory</div>
                    <UsageBar percentage={node.memoryPercent} label="Memory" />
                  </div>
                </div>
              )}

              {/* NotReady nodes: show warning */}
              {node.status === 'NotReady' && (
                <div
                  data-testid="node-warning-indicator"
                  className="flex items-center gap-2 text-red-700 text-sm"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Node is not ready
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* View more link */}
      {hasMoreNodes && (
        <div className="mt-4 text-center">
          <a
            data-testid="view-more-link"
            href="/nodes"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, '', '/nodes');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            View more
          </a>
        </div>
      )}
    </section>
  );
}
