import { FC, useState, useEffect } from 'react';
import { fetchNamespaces, Namespace } from '../api/namespaces';

interface NamespaceSelectorProps {
  onChange?: (value: string) => void;
}

const NamespaceSelector: FC<NamespaceSelectorProps> = ({ onChange }) => {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadNamespaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchNamespaces();
      setNamespaces(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch namespaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNamespaces();
  }, []);

  const handleSelect = (namespace: string) => {
    setSelectedNamespace(namespace);
    if (onChange) {
      onChange(namespace);
    }
  };

  const handleRetry = () => {
    loadNamespaces();
  };

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <div
          data-testid="namespace-error-message"
          className="text-sm text-red-600"
        >
          Error loading namespaces
        </div>
        <button
          data-testid="namespace-retry-button"
          onClick={handleRetry}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
        <select
          data-testid="namespace-selector"
          role="combobox"
          aria-label="Select namespace"
          aria-busy="false"
          value={selectedNamespace}
          onChange={(e) => handleSelect(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Namespaces</option>
        </select>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading ? (
        <>
          <div
            data-testid="namespace-loading"
            className="text-sm text-gray-600"
          >
            Loading...
          </div>
          <select
            data-testid="namespace-selector"
            role="combobox"
            aria-label="Select namespace"
            aria-busy="true"
            disabled
            value={selectedNamespace}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed"
          >
            <option value="all">All Namespaces</option>
          </select>
        </>
      ) : (
        <select
          data-testid="namespace-selector"
          role="combobox"
          aria-label="Select namespace"
          aria-busy="false"
          value={selectedNamespace}
          onChange={(e) => handleSelect(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Namespaces</option>
          {namespaces.length === 0 && (
            <option disabled data-testid="namespace-empty-message">
              No namespaces available
            </option>
          )}
          {namespaces.map((ns) => (
            <option key={ns.name} value={ns.name}>
              {ns.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default NamespaceSelector;
