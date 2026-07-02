import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

export const NAMESPACE_QUERY_PARAM = 'namespace';

interface NamespaceContextType {
  selectedNamespace: string;
  setSelectedNamespace: (namespace: string) => void;
}

const NamespaceContext = createContext<NamespaceContextType | undefined>(undefined);

export function NamespaceProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  // Treat an empty ?namespace= the same as an absent param
  const urlNamespace = searchParams.get(NAMESPACE_QUERY_PARAM) || null;
  const [selectedNamespace, setSelectedNamespaceState] = useState<string>(urlNamespace ?? 'all');

  const setSelectedNamespace = useCallback(
    (namespace: string) => {
      setSelectedNamespaceState(namespace);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (namespace === 'all') {
            next.delete(NAMESPACE_QUERY_PARAM);
          } else {
            next.set(NAMESPACE_QUERY_PARAM, namespace);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (urlNamespace && urlNamespace !== selectedNamespace) {
      // URL is the source of truth for deep links and history navigation
      setSelectedNamespaceState(urlNamespace);
    } else if (!urlNamespace && selectedNamespace !== 'all') {
      // In-app navigation dropped the param; restore it so the URL stays shareable
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(NAMESPACE_QUERY_PARAM, selectedNamespace);
          return next;
        },
        { replace: true }
      );
    }
  }, [urlNamespace, selectedNamespace, setSearchParams]);

  return (
    <NamespaceContext.Provider value={{ selectedNamespace, setSelectedNamespace }}>
      {children}
    </NamespaceContext.Provider>
  );
}

export function useNamespace() {
  const context = useContext(NamespaceContext);
  if (context === undefined) {
    throw new Error('useNamespace must be used within a NamespaceProvider');
  }
  return context;
}
