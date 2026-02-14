/**
 * Represents a single API request log entry for debugging purposes
 */
export interface ApiLog {
  /** Unique identifier for the log entry */
  id: string;

  /** HTTP method (GET, POST, PUT, DELETE, PATCH, etc.) */
  method: string;

  /** Request URL */
  url: string;

  /** URL query parameters */
  params: Record<string, string>;

  /** HTTP status code */
  status: number;

  /** ISO 8601 timestamp when the request was made */
  timestamp: string;

  /** Request duration in milliseconds */
  duration: number;

  /** Parsed response body (JSON) */
  responseBody: unknown;

  /** Response size in bytes */
  responseSize: number;
}
