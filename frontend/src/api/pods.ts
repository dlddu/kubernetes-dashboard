import { fetchJSON, buildURL } from './client';

export interface PodDetails {
  name: string;
  namespace: string;
  status: string;
  restarts: number;
  node: string;
  age: string;
}

/** @deprecated Use PodDetails instead */
export type UnhealthyPodDetails = PodDetails;

export async function fetchAllPods(namespace?: string): Promise<PodDetails[]> {
  const url = buildURL('/api/pods/all', { ns: namespace });
  return fetchJSON<PodDetails[]>(url);
}

export async function fetchUnhealthyPods(namespace?: string): Promise<PodDetails[]> {
  const url = buildURL('/api/pods/unhealthy', { ns: namespace });
  return fetchJSON<PodDetails[]>(url);
}
