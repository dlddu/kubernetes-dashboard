import { useState, useEffect } from 'react';
import { fetchNamespaces } from '../api/namespaces';
import { useNamespace } from '../context/NamespaceContext';

export default function NamespaceSelector() {
  const { selectedNamespace, setSelectedNamespace } = useNamespace();
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const loadNamespaces = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchNamespaces();
      const sortedNamespaces = [...response.namespaces].sort();
      setNamespaces(sortedNamespaces);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNamespaces();
  }, []);

  const handleSelect = (namespace: string) => {
    setSelectedNamespace(namespace);
    setIsOpen(false);
  };

  const handleRetry = () => {
    loadNamespaces();
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getDisplayValue = () => {
    if (selectedNamespace === 'all') {
      return 'All Namespaces';
    }
    return selectedNamespace;
  };

  // Loading state
  if (isLoading) {
    return (
      <div data-testid="namespace-loading" className="animate-pulse">
        <div className="h-10 w-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-red-600">
        <div>Error loading namespaces: {error}</div>
        <button
          onClick={handleRetry}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Success state
  return (
    <div data-testid="namespace-selector" className="relative">
      <button
        role="combobox"
        aria-label="Select namespace"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="px-4 py-2 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px] text-left flex justify-between items-center"
      >
        <span>{getDisplayValue()}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto"
        >
          <div
            role="option"
            aria-selected={selectedNamespace === 'all'}
            onClick={() => handleSelect('all')}
            className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
          >
            All Namespaces
          </div>
          {namespaces.map((ns) => (
            <div
              key={ns}
              role="option"
              aria-selected={selectedNamespace === ns}
              onClick={() => handleSelect(ns)}
              className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
            >
              {ns}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
