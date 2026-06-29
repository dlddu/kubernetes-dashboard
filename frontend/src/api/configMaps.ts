import { fetchJSON, buildURL } from './client';

export interface ConfigMapInfo {
  name: string;
  namespace: string;
  keys: string[];
}

export interface ConfigMapDetail {
  name: string;
  namespace: string;
  data: Record<string, string>;
}

export async function fetchConfigMaps(namespace?: string): Promise<ConfigMapInfo[]> {
  const url = buildURL('/api/configmaps', { ns: namespace });
  return fetchJSON<ConfigMapInfo[]>(url);
}

export async function fetchConfigMapDetail(namespace: string, name: string): Promise<ConfigMapDetail> {
  return fetchJSON<ConfigMapDetail>(`/api/configmaps/${namespace}/${name}`);
}
