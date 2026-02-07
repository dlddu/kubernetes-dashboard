import { createContext, useContext, useState, ReactNode } from 'react';

interface NamespaceContextType {
  selectedNamespace: string;
  setSelectedNamespace: (_namespace: string) => void;
}

const NamespaceContext = createContext<NamespaceContextType | undefined>(
  undefined
);

interface NamespaceProviderProps {
  children: ReactNode;
}

export function NamespaceProvider({ children }: NamespaceProviderProps) {
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');

  return (
    <NamespaceContext.Provider value={{ selectedNamespace, setSelectedNamespace }}>
      {children}
    </NamespaceContext.Provider>
  );
}

export function useNamespace(): NamespaceContextType {
  const context = useContext(NamespaceContext);

  if (context === undefined) {
    throw new Error('useNamespace must be used within a NamespaceProvider');
  }

  return context;
}
