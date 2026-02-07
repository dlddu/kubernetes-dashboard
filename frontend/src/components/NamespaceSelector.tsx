import { useState, useEffect } from 'react';
import { fetchNamespaces } from '../api/namespaces';

interface NamespaceSelectorProps {
  onChange?: (namespace: string) => void;
}

export function NamespaceSelector({ onChange }: NamespaceSelectorProps) {
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const loadNamespaces = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchNamespaces();
      setNamespaces(data);
    } catch (err) {
      setError(err as Error);
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
    if (onChange) {
      onChange(namespace);
    }
  };

  const handleRetry = () => {
    loadNamespaces();
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

  if (isLoading) {
    return (
      <div data-testid="namespace-selector" className="relative">
        <div data-testid="namespace-loading" className="namespace-skeleton">
          <select
            disabled
            className="h-10 px-4 border border-gray-300 rounded bg-gray-200 animate-pulse w-48"
            role="combobox"
            aria-label="Namespace selector"
          >
            <option>Loading...</option>
          </select>
          <div
            data-testid="namespace-skeleton"
            className="h-10 bg-gray-200 rounded animate-pulse w-48"
          ></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="namespace-selector" className="relative">
        <div className="flex flex-col gap-2">
          <select
            className="h-10 px-4 border border-gray-300 rounded bg-white"
            value={selectedNamespace}
            role="combobox"
            aria-label="Namespace selector"
            disabled
          >
            <option value="all">All Namespaces</option>
          </select>
          <div className="flex items-center gap-2">
            <p className="text-sm text-red-600">Error loading namespaces</p>
            <button
              onClick={handleRetry}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              aria-label="Retry loading namespaces"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="namespace-selector" className="relative">
      <div className="relative">
        <select
          value={selectedNamespace}
          onChange={(e) => handleSelect(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 px-4 pr-8 border border-gray-300 rounded bg-white cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          role="combobox"
          aria-label="Namespace selector"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <option value="all">All Namespaces</option>
          {namespaces.length === 0 && (
            <option disabled>No namespaces available</option>
          )}
          {namespaces.map((ns) => (
            <option key={ns} value={ns}>
              {ns}
            </option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
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
        </div>
      </div>

      {isOpen && (
        <div
          role="listbox"
          data-testid="namespace-dropdown-menu"
          className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto"
          style={{ display: isOpen ? 'block' : 'none', visibility: isOpen ? 'visible' : 'hidden' }}
        >
          <div
            role="option"
            data-testid="namespace-option-all"
            aria-selected={selectedNamespace === 'all'}
            onClick={() => handleSelect('all')}
            className="px-4 py-2 cursor-pointer hover:bg-gray-100"
          >
            All Namespaces
          </div>
          {namespaces.length === 0 && (
            <div
              data-testid="namespace-empty-message"
              className="px-4 py-2 text-gray-500 text-sm"
            >
              No namespaces available
            </div>
          )}
          {namespaces.map((ns) => (
            <div
              key={ns}
              role="option"
              data-testid={`namespace-option-${ns}`}
              aria-selected={selectedNamespace === ns}
              onClick={() => handleSelect(ns)}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                selectedNamespace === ns ? 'bg-blue-50' : ''
              }`}
            >
              {ns}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
