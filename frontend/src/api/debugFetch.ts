import { getDebugStore } from '../utils/debugStore';

export async function debugFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const debugStore = getDebugStore();

  // Debug mode OFF or no store available - pass through to native fetch
  if (!debugStore || !debugStore.isDebugMode) {
    return fetch(url, options);
  }

  const { addLog } = debugStore;

  // Debug mode ON - log the request
  const startTime = performance.now();
  const response = await fetch(url, options);

  // Clone the response to avoid consuming it
  const clonedResponse = response.clone();

  // Calculate duration
  const endTime = performance.now();
  const duration = endTime - startTime;

  // Extract request method and params
  const method = options?.method || 'GET';
  let params: unknown = undefined;

  // Try to parse request body as JSON for params
  if (options?.body && typeof options.body === 'string') {
    try {
      params = JSON.parse(options.body);
    } catch {
      // Invalid JSON, leave params as undefined
    }
  }

  // Extract response body and calculate size
  try {
    const responseBody = await clonedResponse.json();
    const responseSize = JSON.stringify(responseBody).length;

    // Log the API call
    addLog({
      method,
      url,
      params,
      status: response.status,
      timestamp: Date.now(),
      duration,
      responseBody,
      responseSize
    });
  } catch {
    // Non-JSON response or error parsing, still return original response
    // Logging is optional in case of parse failure
  }

  // Return the original response
  return response;
}
