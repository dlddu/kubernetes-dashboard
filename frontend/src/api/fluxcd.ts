import { fetchJSON, buildURL } from './client';

export interface KustomizationInfo {
  name: string;
  namespace: string;
  ready: boolean;
  suspended: boolean;
  sourceKind: string;
  sourceName: string;
  revision: string;
  interval: string;
  lastApplied: string;
  path: string;
}

export async function fetchKustomizations(namespace?: string): Promise<KustomizationInfo[]> {
  const url = buildURL('/api/fluxcd/kustomizations', { ns: namespace });
  return fetchJSON<KustomizationInfo[]>(url);
}
