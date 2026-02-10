export interface OverviewData {
  nodes: {
    ready: number;
    total: number;
  };
  unhealthyPods: number;
  avgCpuPercent: number;
  avgMemoryPercent: number;
}

export async function fetchOverview(namespace?: string): Promise<OverviewData> {
  let url = '/api/overview';

  // Add namespace query parameter if provided and not empty
  if (namespace && namespace !== '') {
    url += `?namespace=${namespace}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
