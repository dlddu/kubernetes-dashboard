export interface NamespacesResponse {
  namespaces: string[];
}

export async function fetchNamespaces(): Promise<NamespacesResponse> {
  const response = await fetch('/api/namespaces');

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
