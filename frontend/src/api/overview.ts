import { fetchJSON, buildURL } from './client';

export interface UnhealthyPodInfo {
  name: string;
  namespace: string;
  status: string;
}

export interface OverviewNodeInfo {
  name: string;
  status: string;
  role: string;
  cpuPercent: number;
  memoryPercent: number;
}

export interface OverviewData {
  nodes: {
    ready: number;
    total: number;
  };
  unhealthyPods: number;
  unhealthyPodsList?: UnhealthyPodInfo[];
  avgCpuPercent: number;
  avgMemoryPercent: number;
  nodesList?: OverviewNodeInfo[];
}

export async function fetchOverview(namespace?: string): Promise<OverviewData> {
  const url = buildURL('/api/overview', { namespace });
  return fetchJSON<OverviewData>(url);
}
