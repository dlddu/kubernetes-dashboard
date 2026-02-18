import { fetchJSON, buildURL } from './client';

export interface UnhealthyPodDetails {
  name: string;
  namespace: string;
  status: string;
  restarts: number;
  node: string;
  age: string;
}

export type PodDetails = UnhealthyPodDetails;

export async function fetchAllPods(namespace?: string): Promise<PodDetails[]> {
  const url = buildURL('/api/pods/all', { ns: namespace });
  return fetchJSON<PodDetails[]>(url);
}

export async function fetchUnhealthyPods(namespace?: string): Promise<UnhealthyPodDetails[]> {
  const url = buildURL('/api/pods/unhealthy', { ns: namespace });
  return fetchJSON<UnhealthyPodDetails[]>(url);
}
