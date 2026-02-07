export interface Namespace {
  name: string;
  status: string;
}

export interface NamespacesResponse {
  items: Namespace[];
}

export async function fetchNamespaces(): Promise<NamespacesResponse> {
  const response = await fetch('/api/namespaces');

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
