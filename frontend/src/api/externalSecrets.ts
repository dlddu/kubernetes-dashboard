import { fetchJSON, buildURL } from './client';

export interface ExternalSecretInfo {
  name: string;
  namespace: string;
  ready: boolean;
  status: string;
  reason: string;
  message: string;
  storeKind: string;
  storeName: string;
  targetName: string;
  refreshInterval: string;
  lastSyncTime: string;
  syncedResourceVersion: string;
}

export async function fetchExternalSecrets(namespace?: string): Promise<ExternalSecretInfo[]> {
  const url = buildURL('/api/external-secrets', { ns: namespace });
  return fetchJSON<ExternalSecretInfo[]>(url);
}
