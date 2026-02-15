import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { setDebugStore } from '../utils/debugStore';

const DEBUG_MODE_KEY = 'debug-mode';
const DEBUG_LOGS_KEY = 'debug-logs';

export interface ApiLog {
  method: string;
  url: string;
  params?: unknown;
  status: number;
  timestamp: number;
  duration: number;
  responseBody: unknown;
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

function loadDebugMode(): boolean {
  try {
    return localStorage.getItem(DEBUG_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

function loadLogs(): ApiLog[] {
  try {
    const stored = localStorage.getItem(DEBUG_LOGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function DebugProvider({ children }: { children: ReactNode }) {
  const [isDebugMode, setIsDebugMode] = useState<boolean>(loadDebugMode);
  const [logs, setLogs] = useState<ApiLog[]>(loadLogs);

  const toggleDebugMode = useCallback(() => {
    setIsDebugMode(prev => {
      const next = !prev;
      localStorage.setItem(DEBUG_MODE_KEY, String(next));
      if (!next) {
        // Clear logs when turning debug mode OFF
        setLogs([]);
        localStorage.removeItem(DEBUG_LOGS_KEY);
      }
      return next;
    });
  }, []);

  const addLog = useCallback((log: ApiLog) => {
    setLogs(prev => {
      const next = [...prev, log];
      try { localStorage.setItem(DEBUG_LOGS_KEY, JSON.stringify(next)); } catch { /* quota exceeded */ }
      return next;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem(DEBUG_LOGS_KEY);
  }, []);

  // Set up global debug store synchronously during render so it is
  // available before any child useEffect fires (children's effects run
  // before the parent's effect, so a useEffect here would be too late).
  setDebugStore({ isDebugMode, addLog });

  useEffect(() => {
    return () => {
      setDebugStore(null);
    };
  }, []);

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
