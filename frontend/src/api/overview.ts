import { fetchJSON, buildURL } from './client';
import type { NodeInfo } from './nodes';

export interface UnhealthyPodInfo {
  name: string;
  namespace: string;
  status: string;
}

/** Node info as returned by the overview endpoint (without podCount). */
export type OverviewNodeInfo = Omit<NodeInfo, 'podCount'>;

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
  const url = buildURL('/api/overview', { ns: namespace });
  return fetchJSON<OverviewData>(url);
}
