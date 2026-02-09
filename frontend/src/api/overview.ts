export interface OverviewData {
  nodes: {
    ready: number;
    total: number;
  };
  unhealthyPods: number;
  avgCpu: number;
  avgMemory: number;
}

export async function fetchOverview(namespace: string = 'all'): Promise<OverviewData> {
  const params = new URLSearchParams({ namespace });
  const response = await fetch(`/api/overview?${params}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
