import { fetchJSON, buildURL } from './client';

export interface SecretInfo {
  name: string;
  namespace: string;
  type: string;
  keys: string[];
}

export interface SecretDetail {
  name: string;
  namespace: string;
  type: string;
  data: Record<string, string>;
}

export async function fetchSecrets(namespace?: string): Promise<SecretInfo[]> {
  const url = buildURL('/api/secrets', { ns: namespace });
  return fetchJSON<SecretInfo[]>(url);
}

export async function fetchSecretDetail(namespace: string, name: string): Promise<SecretDetail> {
  return fetchJSON<SecretDetail>(`/api/secrets/${namespace}/${name}`);
}
