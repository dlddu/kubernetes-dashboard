import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NamespaceContextType {
  selectedNamespace: string;
  setSelectedNamespace: (namespace: string) => void;
}

const NamespaceContext = createContext<NamespaceContextType | undefined>(undefined);

const STORAGE_KEY = 'kubernetes-dashboard-namespace';

export function NamespaceProvider({ children }: { children: ReactNode }) {
  const [selectedNamespace, setSelectedNamespace] = useState<string>(() => {
    // Initialize from localStorage if available
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored || 'all';
    } catch {
      return 'all';
    }
  });

  useEffect(() => {
    // Persist to localStorage whenever it changes
    try {
      localStorage.setItem(STORAGE_KEY, selectedNamespace);
    } catch {
      // Ignore localStorage errors
    }
  }, [selectedNamespace]);

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
