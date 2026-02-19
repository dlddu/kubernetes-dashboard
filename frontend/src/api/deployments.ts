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
  await fetchJSON(`/api/deployments/${namespace}/${name}/restart`, {
    method: 'POST',
  });
}
