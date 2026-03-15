import { fetchJSON, buildURL } from './client';

export interface UnhealthyPodDetails {
  name: string;
  namespace: string;
  status: string;
  restarts: number;
  node: string;
  age: string;
  containers: string[];
  initContainers: string[];
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

export async function fetchPodLogs(
  namespace: string,
  name: string,
  container?: string,
  tailLines?: number,
): Promise<string> {
  const params: Record<string, string | undefined> = {
    container,
    tailLines: tailLines !== undefined ? String(tailLines) : undefined,
  };
  const url = buildURL(`/api/pods/logs/${namespace}/${name}`, params);
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.error || `HTTP error! status: ${response.status}`;
    throw new Error(message);
  }

  return response.text();
}

export function streamPodLogs(
  namespace: string,
  name: string,
  onLine: (line: string) => void,
  container?: string,
  tailLines?: number,
): () => void {
  const params: Record<string, string | undefined> = {
    container,
    tailLines: tailLines !== undefined ? String(tailLines) : undefined,
    follow: 'true',
  };
  const url = buildURL(`/api/pods/logs/${namespace}/${name}`, params);
  const eventSource = new EventSource(url);

  const handler = (e: MessageEvent) => {
    onLine(e.data);
  };

  eventSource.addEventListener('message', handler);
  eventSource.addEventListener('log', handler);

  let closed = false;
  return () => {
    if (!closed) {
      closed = true;
      eventSource.close();
    }
  };
}
