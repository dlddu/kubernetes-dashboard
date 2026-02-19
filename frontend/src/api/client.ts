import { debugFetch } from './debugFetch';

/**
 * Builds a URL with optional query parameters.
 * Empty or undefined values are omitted from the query string.
 */
export function buildURL(path: string, params?: Record<string, string | undefined>): string {
  if (!params) return path;

  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== ''
  );

  if (entries.length === 0) return path;

  const searchParams = new URLSearchParams();
  for (const [key, value] of entries) {
    searchParams.set(key, value!);
  }
  return `${path}?${searchParams.toString()}`;
}

/**
 * Fetches JSON data from the given URL using debugFetch.
 * Throws an error with the server's error message if the response is not ok.
 */
export async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await debugFetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.error || `HTTP error! status: ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}
