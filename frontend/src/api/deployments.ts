export interface DeploymentInfo {
  name: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  availableReplicas: number;
}

export async function fetchDeployments(namespace?: string): Promise<DeploymentInfo[]> {
  let url = '/api/deployments';

  // Add namespace query parameter if provided and not empty
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

export async function restartDeployment(namespace: string, name: string): Promise<void> {
  const url = `/api/deployments/${namespace}/${name}/restart`;

  const response = await fetch(url, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
}
