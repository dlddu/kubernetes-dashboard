export interface OverviewResponse {
  nodes: {
    ready: number;
    total: number;
  };
  unhealthyPods: number;
  avgCpuUsage: number;
  avgMemoryUsage: number;
}

export async function fetchOverview(): Promise<OverviewResponse> {
  const response = await fetch('/api/overview');

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
