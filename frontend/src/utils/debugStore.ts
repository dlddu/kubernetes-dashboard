import type { ApiLog } from '../contexts/DebugContext';

interface DebugStore {
  isDebugMode: boolean;
  addLog: (log: ApiLog) => void;
}

let debugStore: DebugStore | null = null;

export function setDebugStore(store: DebugStore | null): void {
  debugStore = store;
}

export function getDebugStore(): DebugStore | null {
  return debugStore;
}
