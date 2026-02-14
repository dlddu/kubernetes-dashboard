import { useDebug } from '@/contexts/DebugContext';
import { ApiLog } from '@/types/debug';

export async function debugFetch(url: string, options?: RequestInit): Promise<Response> {
  // Get debug context - this will be mocked in tests
  const { isDebugMode, addLog } = useDebug();

  // If debug mode is OFF, use regular fetch
  if (!isDebugMode) {
    return fetch(url, options);
  }

  const startTime = performance.now();
  const method = options?.method || 'GET';
  const timestamp = new Date().toISOString();

  try {
    const response = await fetch(url, options);
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Clone response to read body without consuming the original
    const clonedResponse = response.clone();

    let responseBody: unknown;
    let responseSize: number;

    try {
      responseBody = await clonedResponse.json();
      responseSize = responseBody === null || responseBody === undefined
        ? 0
        : new TextEncoder().encode(JSON.stringify(responseBody)).length;
    } catch {
      responseBody = { error: 'Failed to parse JSON' };
      responseSize = new TextEncoder().encode(JSON.stringify(responseBody)).length;
    }

    // Parse URL params
    const params: Record<string, string> = {};
    try {
      const urlObj = new URL(url, window.location.origin);
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
    } catch {
      // If URL parsing fails, leave params empty
    }

    const log: ApiLog = {
      id: crypto.randomUUID(),
      method,
      url,
      params,
      status: response.status,
      timestamp,
      duration,
      responseBody,
      responseSize,
    };

    addLog(log);

    return response;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Log error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const params: Record<string, string> = {};
    try {
      const urlObj = new URL(url, window.location.origin);
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
    } catch {
      // If URL parsing fails, leave params empty
    }

    const log: ApiLog = {
      id: crypto.randomUUID(),
      method,
      url,
      params,
      status: 0,
      timestamp,
      duration,
      responseBody: { error: errorMessage },
      responseSize: new TextEncoder().encode(JSON.stringify({ error: errorMessage })).length,
    };

    addLog(log);

    throw error;
  }
}
