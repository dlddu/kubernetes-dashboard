import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ALL_NAMESPACES,
  buildNamespacePath,
  isNamespaceScopedPath,
  parseNamespaceFromPath,
} from '../utils/namespacePath';

interface NamespaceContextType {
  selectedNamespace: string;
  setSelectedNamespace: (namespace: string) => void;
}

const NamespaceContext = createContext<NamespaceContextType | undefined>(undefined);

export function NamespaceProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const urlNamespace = parseNamespaceFromPath(location.pathname);

  // Last known selection. Cluster-scoped pages (e.g. /nodes) carry no
  // namespace segment, so the selection falls back to this instead of
  // resetting while the user is there.
  const [fallbackNamespace, setFallbackNamespace] = useState<string>(
    urlNamespace ?? ALL_NAMESPACES
  );
  const selectedNamespace = urlNamespace ?? fallbackNamespace;

  useEffect(() => {
    if (urlNamespace) {
      setFallbackNamespace(urlNamespace);
    }
  }, [urlNamespace]);

  const setSelectedNamespace = useCallback(
    (namespace: string) => {
      setFallbackNamespace(namespace);
      const target = buildNamespacePath(location.pathname, namespace);
      if (target !== location.pathname) {
        navigate(
          { pathname: target, search: location.search, hash: location.hash },
          { replace: true }
        );
      }
    },
    [location, navigate]
  );

  // In-app links use bare tab paths; put the namespace segment back so the
  // URL stays a shareable kube-style deep link (/namespaces/<ns>/...).
  useEffect(() => {
    if (urlNamespace || fallbackNamespace === ALL_NAMESPACES) {
      return;
    }
    if (!isNamespaceScopedPath(location.pathname)) {
      return;
    }
    navigate(
      {
        pathname: buildNamespacePath(location.pathname, fallbackNamespace),
        search: location.search,
        hash: location.hash,
      },
      { replace: true }
    );
  }, [location, urlNamespace, fallbackNamespace, navigate]);

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
