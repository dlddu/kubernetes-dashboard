export interface SecretInfo {
  name: string;
  namespace: string;
  type: string;
  keys: string[];
}

export interface SecretDetail {
  name: string;
  namespace: string;
  type: string;
  data: Record<string, string>;
}

export async function fetchSecrets(namespace?: string): Promise<SecretInfo[]> {
  let url = '/api/secrets';

  // Add namespace query parameter if provided and not empty
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

export async function fetchSecretDetail(namespace: string, name: string): Promise<SecretDetail> {
  const url = `/api/secrets/${namespace}/${name}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
