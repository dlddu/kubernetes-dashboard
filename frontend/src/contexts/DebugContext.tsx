import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ApiLog } from '@/types/debug';

interface DebugContextType {
  isDebugMode: boolean;
  logs: ApiLog[];
  toggleDebugMode: () => void;
  addLog: (log: ApiLog) => void;
  clearLogs: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export function DebugProvider({ children }: { children: ReactNode }) {
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false);
  const [logs, setLogs] = useState<ApiLog[]>([]);

  const toggleDebugMode = useCallback(() => {
    setIsDebugMode((prev) => !prev);
  }, []);

  const addLog = useCallback((log: ApiLog) => {
    setLogs((prev) => [...prev, log]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <DebugContext.Provider
      value={{
        isDebugMode,
        logs,
        toggleDebugMode,
        addLog,
        clearLogs,
      }}
    >
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
}
