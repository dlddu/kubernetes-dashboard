import { fetchJSON } from './client';

export interface NodeInfo {
  name: string;
  status: 'Ready' | 'NotReady';
  role: string;
  cpuPercent: number;
  memoryPercent: number;
  podCount: number;
}

export async function fetchNodes(): Promise<NodeInfo[]> {
  return fetchJSON<NodeInfo[]>('/api/nodes');
}
