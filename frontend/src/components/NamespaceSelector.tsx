import React, { useState, useEffect, useRef, useContext } from 'react';
import { fetchNamespaces } from '../api/namespaces';
import { useNamespace } from '../contexts/NamespaceContext';
import { FavoritesContext } from '../contexts/FavoritesContext';

export function NamespaceSelector() {
  const { selectedNamespace, setSelectedNamespace } = useNamespace();
  const favoritesCtx = useContext(FavoritesContext);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? (window.matchMedia('(min-width: 640px)')?.matches ?? true)
      : true
  );

  const favorites: string[] = favoritesCtx?.favorites ?? [];
  const isFavorite = (ns: string) => favoritesCtx?.isFavorite(ns) ?? false;
  const toggleFavorite = (ns: string) => favoritesCtx?.toggleFavorite(ns);

  // favorites ∩ namespaces
  const favoriteNamespaces = favorites.filter((f) => namespaces.includes(f));
  // namespaces - favorites
  const nonFavoriteNamespaces = namespaces.filter((ns) => !favorites.includes(ns));

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

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(min-width: 640px)');
    if (!mediaQuery) return;
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (namespace: string) => {
    setSelectedNamespace(namespace);
    setIsOpen(false);
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

  const hasFavorites = favoriteNamespaces.length > 0;

  return (
    <div data-testid="namespace-selector" className="relative" ref={dropdownRef}>
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
          {/* All Namespaces option */}
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

          {/* Favorites section */}
          <div data-testid="namespace-favorites-section">
            <div
              data-testid="namespace-favorites-header"
              className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-t border-gray-200"
            >
              Favorites
            </div>
            {!hasFavorites ? (
              <div
                data-testid="namespace-favorites-hint"
                className="px-4 py-2 text-sm text-gray-400 italic"
              >
                {isDesktop
                  ? 'Hover over a namespace and click ⭐ to add favorites'
                  : 'Tap ⭐ next to a namespace to add favorites'}
              </div>
            ) : (
              favoriteNamespaces.slice(0, 5).map((ns) => (
                <div
                  key={`favorite-${ns}`}
                  data-testid={`namespace-option-${ns}`}
                >
                  <div
                    data-testid={`namespace-favorite-item-${ns}`}
                    role="option"
                    aria-selected={selectedNamespace === ns}
                    aria-label={ns}
                    onClick={() => handleSelect(ns)}
                    className={`flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                      selectedNamespace === ns ? 'bg-blue-50' : ''
                    }`}
                  >
                    <button
                      type="button"
                      data-testid="namespace-favorite-toggle"
                      aria-pressed={isFavorite(ns)}
                      aria-label={`Toggle favorite ${ns}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(ns);
                      }}
                      className="mr-2 text-yellow-400 hover:text-yellow-500 focus:outline-none opacity-100"
                    >
                      <span aria-hidden="true">★</span>
                    </button>
                    <span
                      data-testid={`namespace-option-label-${ns}`}
                      className="flex-1 cursor-pointer"
                      onClick={() => handleSelect(ns)}
                    >
                      {ns}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* All section */}
          {namespaces.length > 0 && (
            <div>
              <div
                data-testid="namespace-all-header"
                className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-t border-gray-200"
              >
                All
              </div>
              {nonFavoriteNamespaces.map((ns) => (
                <div
                  key={ns}
                  role="option"
                  data-testid={`namespace-option-${ns}`}
                  aria-selected={selectedNamespace === ns}
                  aria-label={ns}
                  onClick={() => handleSelect(ns)}
                  className={`group flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                    selectedNamespace === ns ? 'bg-blue-50' : ''
                  }`}
                >
                  <button
                    type="button"
                    data-testid="namespace-favorite-toggle"
                    aria-pressed={isFavorite(ns)}
                    aria-label={`Toggle favorite ${ns}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(ns);
                    }}
                    className="mr-2 text-gray-300 hover:text-yellow-400 focus:outline-none opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  >
                    <span aria-hidden="true">☆</span>
                  </button>
                  <span
                    data-testid={`namespace-option-label-${ns}`}
                    className="flex-1 cursor-pointer"
                    onClick={() => handleSelect(ns)}
                  >
                    {ns}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
