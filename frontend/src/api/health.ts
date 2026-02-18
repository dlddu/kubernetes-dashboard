import { fetchJSON } from './client';

export interface HealthResponse {
  status: string;
  message: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  return fetchJSON<HealthResponse>('/api/health');
}
