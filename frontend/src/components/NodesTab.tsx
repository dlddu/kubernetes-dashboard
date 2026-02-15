import { useState, useCallback, useEffect } from 'react';
import { fetchNodes, NodeInfo } from '../api/nodes';
import { NodeCard } from './NodeCard';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorRetry } from './ErrorRetry';
import { EmptyState } from './EmptyState';
import { usePolling } from '../hooks/usePolling';

export function NodesTab() {
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNodes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchNodes();
      setNodes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch nodes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { refresh } = usePolling(loadNodes);

  // Initial load
  useEffect(() => {
    loadNodes();
  }, []);

  return (
    <div data-testid="nodes-page" className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Nodes</h1>

      {isLoading && (
        <LoadingSkeleton
          variant="card"
          count={3}
          testId="nodes-loading"
        />
      )}

      {error && (
        <ErrorRetry
          error={error}
          onRetry={refresh}
          title="Error loading nodes"
          testId="nodes-error"
        />
      )}

      {!isLoading && !error && nodes.length === 0 && (
        <EmptyState
          message="No nodes found"
          testId="nodes-empty"
        />
      )}

      {!isLoading && !error && nodes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nodes.map((node) => (
            <NodeCard key={node.name} {...node} />
          ))}
        </div>
      )}
    </div>
  );
}
