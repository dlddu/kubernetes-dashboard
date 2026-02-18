import { debugFetch } from './debugFetch';
import { fetchJSON, buildURL } from './client';

export interface DeploymentInfo {
  name: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  availableReplicas: number;
}

export async function fetchDeployments(namespace?: string): Promise<DeploymentInfo[]> {
  const url = buildURL('/api/deployments', { ns: namespace });
  return fetchJSON<DeploymentInfo[]>(url);
}

export async function restartDeployment(namespace: string, name: string): Promise<void> {
  const url = `/api/deployments/${namespace}/${name}/restart`;

  const response = await debugFetch(url, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
}
