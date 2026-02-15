import { debugFetch } from './debugFetch';

export async function fetchNamespaces(): Promise<string[]> {
  const response = await debugFetch('/api/namespaces');

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
