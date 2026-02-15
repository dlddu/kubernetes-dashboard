export interface NodeInfo {
  name: string;
  status: 'Ready' | 'NotReady';
  role: string;
  cpuPercent: number;
  memoryPercent: number;
  podCount: number;
}

export async function fetchNodes(): Promise<NodeInfo[]> {
  const response = await fetch('/api/nodes');

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
