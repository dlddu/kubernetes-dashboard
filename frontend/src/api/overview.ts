export interface OverviewData {
  nodes: {
    ready: number;
    total: number;
  };
  unhealthyPods: number;
  averageCPUUsage: number;
  averageMemoryUsage: number;
  unhealthyPodsList?: UnhealthyPod[];
  nodesList?: Node[];
}

export interface UnhealthyPod {
  name: string;
  namespace: string;
  status: string;
  restarts: number;
}

export interface Node {
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  status: string;
}

export async function fetchOverview(): Promise<OverviewData> {
  const response = await fetch('/api/overview');

  if (!response.ok) {
    throw new Error(`Failed to fetch overview: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
