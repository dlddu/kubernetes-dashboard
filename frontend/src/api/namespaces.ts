export async function fetchNamespaces(): Promise<string[]> {
  const response = await fetch('/api/namespaces');

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
