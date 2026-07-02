import { createContext, useCallback, useContext, useEffect, useMemo, useRef, ReactNode } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

export const NAMESPACE_QUERY_PARAM = 'namespace';
const ALL_NAMESPACES = 'all';

interface NamespaceContextType {
  selectedNamespace: string;
  setSelectedNamespace: (namespace: string) => void;
}

const NamespaceContext = createContext<NamespaceContextType | undefined>(undefined);

export function NamespaceProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlNamespace = searchParams.get(NAMESPACE_QUERY_PARAM);

  // Last known selection. In-app links drop the query string, so when the
  // param is absent the selection falls back to this instead of resetting.
  const lastSelectedRef = useRef<string>(urlNamespace ?? ALL_NAMESPACES);
  const selectedNamespace = urlNamespace ?? lastSelectedRef.current;

  useEffect(() => {
    if (urlNamespace) {
      lastSelectedRef.current = urlNamespace;
    }
  }, [urlNamespace]);

  const setSelectedNamespace = useCallback(
    (namespace: string) => {
      lastSelectedRef.current = namespace;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (namespace === ALL_NAMESPACES) {
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

  // Put the namespace back into the URL after navigation drops it, so the
  // address bar always holds a shareable deep link to the current view.
  useEffect(() => {
    if (!urlNamespace && lastSelectedRef.current !== ALL_NAMESPACES) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(NAMESPACE_QUERY_PARAM, lastSelectedRef.current);
          return next;
        },
        { replace: true }
      );
    }
  }, [location, urlNamespace, setSearchParams]);

  const value = useMemo(
    () => ({ selectedNamespace, setSelectedNamespace }),
    [selectedNamespace, setSelectedNamespace]
  );

  return <NamespaceContext.Provider value={value}>{children}</NamespaceContext.Provider>;
}

export function useNamespace() {
  const context = useContext(NamespaceContext);
  if (context === undefined) {
    throw new Error('useNamespace must be used within a NamespaceProvider');
  }
  return context;
}
