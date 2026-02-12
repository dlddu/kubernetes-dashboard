import { useState, useEffect } from 'react';
import { fetchNodes, NodeInfo } from '../api/nodes';
import { NodeCard } from './NodeCard';

export function NodesTab() {
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNodes = async () => {
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
  };

  useEffect(() => {
    loadNodes();
  }, []);

  const handleRetry = () => {
    loadNodes();
  };

  return (
    <div data-testid="nodes-page" className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Nodes</h1>

      {isLoading && (
        <div data-testid="nodes-loading" className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading nodes...</div>
        </div>
      )}

      {error && (
        <div data-testid="nodes-error" className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-red-800 font-medium mb-2">Error loading nodes</div>
          <div className="text-red-600 mb-4">{error}</div>
          <button
            data-testid="retry-button"
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !error && nodes.length === 0 && (
        <div data-testid="nodes-empty" className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-500 text-lg">No nodes found</div>
        </div>
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
