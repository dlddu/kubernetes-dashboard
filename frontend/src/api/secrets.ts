export interface Secret {
  name: string;
  namespace: string;
  type: string;
  data: Record<string, string>;
}

export async function fetchSecrets(namespace?: string): Promise<Secret[]> {
  let url = '/api/secrets';

  if (namespace && namespace !== '') {
    url += `?ns=${namespace}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
