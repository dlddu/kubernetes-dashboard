import { createContext, useContext, useState, ReactNode } from 'react';

export interface ApiLog {
  method: string;
  url: string;
  params?: any;
  status: number;
  timestamp: number;
  duration: number;
  responseBody: any;
  responseSize: number;
}

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

  const toggleDebugMode = () => {
    setIsDebugMode(prev => !prev);
  };

  const addLog = (log: ApiLog) => {
    setLogs(prev => [...prev, log]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <DebugContext.Provider
      value={{
        isDebugMode,
        logs,
        toggleDebugMode,
        addLog,
        clearLogs
      }}
    >
      {children}
    </DebugContext.Provider>
  );
}

export function useDebugContext() {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebugContext must be used within a DebugProvider');
  }
  return context;
}
