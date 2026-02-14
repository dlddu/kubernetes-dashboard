import { describe, it, expect, vi, beforeEach } from 'vitest';
import { debugFetch } from './debugFetch';

// Mock DebugContext
const mockAddLog = vi.fn();
const mockDebugContext = {
  isDebugMode: false,
  logs: [],
  addLog: mockAddLog,
  clearLogs: vi.fn(),
  toggleDebugMode: vi.fn(),
};

vi.mock('../contexts/DebugContext', () => ({
  useDebug: () => mockDebugContext,
}));

// Mock global fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('debugFetch', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockDebugContext.isDebugMode = false;
    mockDebugContext.logs = [];
  });

  describe('pass-through when debug mode is OFF', () => {
    it('should call original fetch when debug mode is OFF', async () => {
      // Arrange
      mockDebugContext.isDebugMode = false;
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/test');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/test', undefined);
      expect(mockAddLog).not.toHaveBeenCalled();
    });

    it('should return response as-is when debug mode is OFF', async () => {
      // Arrange
      mockDebugContext.isDebugMode = false;
      const mockData = { result: 'success' };
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockData,
        clone: vi.fn().mockReturnThis(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      const response = await debugFetch('/api/test');
      const data = await response.json();

      // Assert
      expect(data).toEqual(mockData);
    });

    it('should pass through fetch options when debug mode is OFF', async () => {
      // Arrange
      mockDebugContext.isDebugMode = false;
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({}),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      };

      // Act
      await debugFetch('/api/test', fetchOptions);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/test', fetchOptions);
    });

    it('should handle errors when debug mode is OFF', async () => {
      // Arrange
      mockDebugContext.isDebugMode = false;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(debugFetch('/api/test')).rejects.toThrow('Network error');
      expect(mockAddLog).not.toHaveBeenCalled();
    });
  });

  describe('capture and log when debug mode is ON', () => {
    it('should capture API log when debug mode is ON', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseData = { data: 'test' };
      const mockResponseJson = vi.fn().mockResolvedValue(mockResponseData);
      const mockResponse = {
        ok: true,
        status: 200,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/overview');

      // Assert
      expect(mockAddLog).toHaveBeenCalledTimes(1);
      expect(mockAddLog).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/api/overview',
          status: 200,
        })
      );
    });

    it('should capture all required metadata fields', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseData = { result: 'success' };
      const mockResponseJson = vi.fn().mockResolvedValue(mockResponseData);
      const mockResponse = {
        ok: true,
        status: 200,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/pods?namespace=default');

      // Assert
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall).toHaveProperty('id');
      expect(logCall).toHaveProperty('method');
      expect(logCall).toHaveProperty('url');
      expect(logCall).toHaveProperty('params');
      expect(logCall).toHaveProperty('status');
      expect(logCall).toHaveProperty('timestamp');
      expect(logCall).toHaveProperty('duration');
      expect(logCall).toHaveProperty('responseBody');
      expect(logCall).toHaveProperty('responseSize');
    });

    it('should generate unique ID for each log', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseJson = vi.fn().mockResolvedValue({});
      const mockResponse = {
        ok: true,
        status: 200,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      await debugFetch('/api/test1');
      await debugFetch('/api/test2');

      // Assert
      expect(mockAddLog).toHaveBeenCalledTimes(2);
      const id1 = mockAddLog.mock.calls[0][0].id;
      const id2 = mockAddLog.mock.calls[1][0].id;
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should capture HTTP method correctly', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseJson = vi.fn().mockResolvedValue({});
      const mockResponse = {
        ok: true,
        status: 201,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/pods', { method: 'POST' });

      // Assert
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.method).toBe('POST');
    });

    it('should default to GET method when not specified', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseJson = vi.fn().mockResolvedValue({});
      const mockResponse = {
        ok: true,
        status: 200,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/test');

      // Assert
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.method).toBe('GET');
    });

    it('should capture URL correctly', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseJson = vi.fn().mockResolvedValue({});
      const mockResponse = {
        ok: true,
        status: 200,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/deployments/my-app');

      // Assert
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.url).toBe('/api/deployments/my-app');
    });

    it('should parse URL query parameters', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseJson = vi.fn().mockResolvedValue({});
      const mockResponse = {
        ok: true,
        status: 200,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/pods?namespace=default&status=running');

      // Assert
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.params).toEqual({
        namespace: 'default',
        status: 'running',
      });
    });

    it('should handle URL without query parameters', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseJson = vi.fn().mockResolvedValue({});
      const mockResponse = {
        ok: true,
        status: 200,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/overview');

      // Assert
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.params).toEqual({});
    });

    it('should capture HTTP status code', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseJson = vi.fn().mockResolvedValue({});
      const mockResponse = {
        ok: false,
        status: 404,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/not-found');

      // Assert
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.status).toBe(404);
    });

    it('should capture timestamp in ISO 8601 format', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseJson = vi.fn().mockResolvedValue({});
      const mockResponse = {
        ok: true,
        status: 200,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/test');

      // Assert
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should capture duration in milliseconds', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseJson = vi.fn().mockResolvedValue({});
      const mockResponse = {
        ok: true,
        status: 200,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/test');

      // Assert
      const logCall = mockAddLog.mock.calls[0][0];
      expect(typeof logCall.duration).toBe('number');
      expect(logCall.duration).toBeGreaterThanOrEqual(0);
    });

    it('should capture response body as JSON', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseData = { nodes: { ready: 3, total: 5 } };
      const mockResponseJson = vi.fn().mockResolvedValue(mockResponseData);
      const mockResponse = {
        ok: true,
        status: 200,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/overview');

      // Assert
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.responseBody).toEqual(mockResponseData);
    });

    it('should calculate response size in bytes', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseData = { data: 'test response' };
      const mockResponseJson = vi.fn().mockResolvedValue(mockResponseData);
      const mockResponse = {
        ok: true,
        status: 200,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/test');

      // Assert
      const logCall = mockAddLog.mock.calls[0][0];
      expect(typeof logCall.responseSize).toBe('number');
      expect(logCall.responseSize).toBeGreaterThan(0);
    });
  });

  describe('response cloning - preserve original response', () => {
    it('should clone response before reading body', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockClone = vi.fn();
      const mockResponseJson = vi.fn().mockResolvedValue({ data: 'test' });
      const mockResponse = {
        ok: true,
        status: 200,
        json: mockResponseJson,
        clone: mockClone.mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/test');

      // Assert
      expect(mockClone).toHaveBeenCalledTimes(1);
    });

    it('should return original response unchanged', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseData = { result: 'success' };
      const mockResponseJson = vi.fn().mockResolvedValue(mockResponseData);
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      const response = await debugFetch('/api/test');

      // Assert
      expect(response).toBe(mockResponse);
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
    });

    it('should allow consuming response body after logging', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseData = { data: 'test' };
      const mockResponseJson = vi.fn().mockResolvedValue(mockResponseData);
      const mockResponse = {
        ok: true,
        status: 200,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockResolvedValue(mockResponseData),
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      const response = await debugFetch('/api/test');
      const data = await response.json();

      // Assert
      expect(data).toEqual(mockResponseData);
    });
  });

  describe('error handling when debug mode is ON', () => {
    it('should log error responses', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockErrorData = { error: 'Not found' };
      const mockResponseJson = vi.fn().mockResolvedValue(mockErrorData);
      const mockResponse = {
        ok: false,
        status: 404,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/not-found');

      // Assert
      expect(mockAddLog).toHaveBeenCalledTimes(1);
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.status).toBe(404);
      expect(logCall.responseBody).toEqual(mockErrorData);
    });

    it('should log 500 server errors', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockErrorData = { error: 'Internal server error' };
      const mockResponseJson = vi.fn().mockResolvedValue(mockErrorData);
      const mockResponse = {
        ok: false,
        status: 500,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/error');

      // Assert
      expect(mockAddLog).toHaveBeenCalledTimes(1);
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.status).toBe(500);
    });

    it('should handle network errors and still log', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(debugFetch('/api/test')).rejects.toThrow('Network error');
      expect(mockAddLog).toHaveBeenCalledTimes(1);
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.status).toBe(0);
      expect(logCall.responseBody).toEqual({ error: 'Network error' });
    });

    it('should log when response.json() fails', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        clone: vi.fn().mockReturnValue({
          json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/test');

      // Assert
      expect(mockAddLog).toHaveBeenCalledTimes(1);
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.responseBody).toEqual({ error: 'Failed to parse JSON' });
    });
  });

  describe('different HTTP methods', () => {
    it('should capture POST requests', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseJson = vi.fn().mockResolvedValue({ id: '123' });
      const mockResponse = {
        ok: true,
        status: 201,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/pods', {
        method: 'POST',
        body: JSON.stringify({ name: 'test-pod' }),
      });

      // Assert
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.method).toBe('POST');
      expect(logCall.status).toBe(201);
    });

    it('should capture PUT requests', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseJson = vi.fn().mockResolvedValue({ updated: true });
      const mockResponse = {
        ok: true,
        status: 200,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/pods/test', { method: 'PUT' });

      // Assert
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.method).toBe('PUT');
    });

    it('should capture DELETE requests', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseJson = vi.fn().mockResolvedValue({});
      const mockResponse = {
        ok: true,
        status: 204,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/pods/test', { method: 'DELETE' });

      // Assert
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.method).toBe('DELETE');
      expect(logCall.status).toBe(204);
    });

    it('should capture PATCH requests', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseJson = vi.fn().mockResolvedValue({ patched: true });
      const mockResponse = {
        ok: true,
        status: 200,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/pods/test', { method: 'PATCH' });

      // Assert
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.method).toBe('PATCH');
    });
  });

  describe('edge cases', () => {
    it('should handle empty response body', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseJson = vi.fn().mockResolvedValue(null);
      const mockResponse = {
        ok: true,
        status: 204,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/test');

      // Assert
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.responseBody).toBeNull();
      expect(logCall.responseSize).toBe(0);
    });

    it('should handle very large response bodies', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const largeResponse = { items: Array(1000).fill({ data: 'test' }) };
      const mockResponseJson = vi.fn().mockResolvedValue(largeResponse);
      const mockResponse = {
        ok: true,
        status: 200,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/test');

      // Assert
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.responseBody).toEqual(largeResponse);
      expect(logCall.responseSize).toBeGreaterThan(0);
    });

    it('should handle URLs with complex query parameters', async () => {
      // Arrange
      mockDebugContext.isDebugMode = true;
      const mockResponseJson = vi.fn().mockResolvedValue({});
      const mockResponse = {
        ok: true,
        status: 200,
        json: mockResponseJson,
        clone: vi.fn().mockReturnValue({
          json: mockResponseJson,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/pods?namespace=default&labels=app%3Dtest&limit=100');

      // Assert
      const logCall = mockAddLog.mock.calls[0][0];
      expect(logCall.params).toHaveProperty('namespace');
      expect(logCall.params).toHaveProperty('labels');
      expect(logCall.params).toHaveProperty('limit');
    });
  });
});
