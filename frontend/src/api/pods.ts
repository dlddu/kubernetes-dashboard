import { debugFetch } from './debugFetch';

export interface UnhealthyPodDetails {
  name: string;
  namespace: string;
  status: string;
  restarts: number;
  node: string;
  age: string;
}

export async function fetchUnhealthyPods(namespace?: string): Promise<UnhealthyPodDetails[]> {
  let url = '/api/pods/unhealthy';

  // Add namespace query parameter if provided and not empty
  if (namespace && namespace !== '') {
    url += `?ns=${namespace}`;
  }

  const response = await debugFetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
