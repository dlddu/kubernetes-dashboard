import React, { useState, useEffect } from 'react';
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
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
          <button
            disabled
            className="h-10 px-4 border border-gray-300 rounded bg-gray-200 animate-pulse w-48"
            role="combobox"
            aria-label="Namespace selector"
            aria-expanded={false}
          >
            Loading...
          </button>
          <div
            data-testid="namespace-skeleton"
            className="h-10 bg-gray-200 rounded animate-pulse w-48 mt-2"
          ></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="namespace-selector" className="relative">
        <div className="flex flex-col gap-2">
          <button
            className="h-10 px-4 border border-gray-300 rounded bg-white text-left"
            role="combobox"
            aria-label="Namespace selector"
            aria-expanded={false}
            disabled
          >
            All Namespaces
          </button>
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
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className="h-10 px-4 pr-8 border border-gray-300 rounded bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 text-left w-full"
          role="combobox"
          aria-label="Namespace selector"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          {getDisplayValue()}
        </button>
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
