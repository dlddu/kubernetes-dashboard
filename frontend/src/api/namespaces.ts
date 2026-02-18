import { fetchJSON } from './client';

export async function fetchNamespaces(): Promise<string[]> {
  return fetchJSON<string[]>('/api/namespaces');
}
