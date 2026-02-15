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
  let url = '/api/pods';

  if (namespace && namespace !== '') {
    url += `?ns=${namespace}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

export async function fetchUnhealthyPods(namespace?: string): Promise<PodDetails[]> {
  let url = '/api/pods/unhealthy';

  if (namespace && namespace !== '') {
    url += `?ns=${namespace}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
