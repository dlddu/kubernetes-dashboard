export interface OverviewData {
  nodes: {
    ready: number;
    total: number;
  };
  unhealthyPods: number;
  averageCpu: number;
  averageMemory: number;
}

export async function fetchOverview(namespace?: string): Promise<OverviewData> {
  const url = namespace
    ? `/api/overview?namespace=${encodeURIComponent(namespace)}`
    : '/api/overview';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
