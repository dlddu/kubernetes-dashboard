export interface HealthResponse {
  status: string;
  message: string;
  cluster_connected?: boolean;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch('/api/health');

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
