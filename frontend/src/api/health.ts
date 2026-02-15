import { debugFetch } from './debugFetch';

export interface HealthResponse {
  status: string;
  message: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await debugFetch('/api/health');

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
