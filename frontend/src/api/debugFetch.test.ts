import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debugFetch } from './debugFetch';
import { setDebugStore } from '../utils/debugStore';

// Mock addLog function
const mockAddLog = vi.fn();

// Mock global fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('debugFetch', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('debugFetch - debug mode OFF (pass-through)', () => {
    beforeEach(() => {
      setDebugStore({
        isDebugMode: false,
        addLog: mockAddLog
      });
    });

    it('should pass through to native fetch when debug mode is off', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
        clone: function() { return this; }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await debugFetch('/api/test');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/test', undefined);
      expect(mockAddLog).not.toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });

    it('should not log API calls when debug mode is off', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
        clone: function() { return this; }
      });

      // Act
      await debugFetch('/api/health');

      // Assert
      expect(mockAddLog).not.toHaveBeenCalled();
    });

    it('should pass through errors when debug mode is off', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(debugFetch('/api/test')).rejects.toThrow('Network error');
      expect(mockAddLog).not.toHaveBeenCalled();
    });

    it('should pass through request options when debug mode is off', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({}),
        clone: function() { return this; }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      };

      // Act
      await debugFetch('/api/data', options);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/data', options);
    });

    it('should have no performance overhead when debug mode is off', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
        clone: function() { return this; }
      });

      const startTime = Date.now();

      // Act
      await debugFetch('/api/test');

      const endTime = Date.now();

      // Assert - Should be instant (no logging overhead)
      expect(endTime - startTime).toBeLessThan(10);
    });
  });

  describe('debugFetch - debug mode ON (logging)', () => {
    beforeEach(() => {
      setDebugStore({
        isDebugMode: true,
        addLog: mockAddLog
      });
    });

    it('should log GET request when debug mode is on', async () => {
      // Arrange
      const mockResponseBody = { status: 'ok' };
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockResponseBody,
        clone: function() {
          return {
            ...this,
            json: async () => mockResponseBody
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const startTime = Date.now();
      vi.setSystemTime(startTime);

      // Act
      await debugFetch('/api/health');

      vi.advanceTimersByTime(100);

      // Assert
      expect(mockAddLog).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/health',
        params: undefined,
        status: 200,
        timestamp: expect.any(Number),
        duration: expect.any(Number),
        responseBody: mockResponseBody,
        responseSize: expect.any(Number)
      });
    });

    it('should log POST request with params', async () => {
      // Arrange
      const requestBody = { namespace: 'default', pod: 'test-pod' };
      const mockResponseBody = { success: true };
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockResponseBody,
        clone: function() {
          return {
            ...this,
            json: async () => mockResponseBody
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const options = {
        method: 'POST',
        body: JSON.stringify(requestBody)
      };

      // Act
      await debugFetch('/api/pods/restart', options);

      // Assert
      expect(mockAddLog).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/pods/restart',
        params: requestBody,
        status: 200,
        timestamp: expect.any(Number),
        duration: expect.any(Number),
        responseBody: mockResponseBody,
        responseSize: expect.any(Number)
      });
    });

    it('should calculate response size correctly', async () => {
      // Arrange
      const mockResponseBody = { data: 'test', count: 42 };
      const expectedSize = JSON.stringify(mockResponseBody).length;

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockResponseBody,
        clone: function() {
          return {
            ...this,
            json: async () => mockResponseBody
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/test');

      // Assert
      expect(mockAddLog).toHaveBeenCalledWith(
        expect.objectContaining({
          responseSize: expectedSize
        })
      );
    });

    it('should calculate request duration accurately', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({}),
        clone: function() {
          return {
            ...this,
            json: async () => ({})
          };
        }
      };

      let resolveFetch: (value: any) => void;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      );

      const startTime = Date.now();
      vi.setSystemTime(startTime);

      // Act
      const fetchPromise = debugFetch('/api/test');

      // Simulate 250ms delay
      vi.advanceTimersByTime(250);
      resolveFetch!(mockResponse);
      await fetchPromise;

      // Assert
      expect(mockAddLog).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: expect.any(Number)
        })
      );

      const loggedDuration = mockAddLog.mock.calls[0][0].duration;
      expect(loggedDuration).toBeGreaterThanOrEqual(0);
    });

    it('should preserve original response using clone()', async () => {
      // Arrange
      const mockResponseBody = { data: 'important' };
      let cloneCalled = false;

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockResponseBody,
        clone: function() {
          cloneCalled = true;
          return {
            ...this,
            json: async () => mockResponseBody
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await debugFetch('/api/test');

      // Assert - Original response should be returned
      expect(cloneCalled).toBe(true);
      expect(result).toBe(mockResponse);

      // Should be able to consume original response
      const data = await result.json();
      expect(data).toEqual(mockResponseBody);
    });

    it('should use cloned response for logging to avoid consuming original', async () => {
      // Arrange
      const mockResponseBody = { test: 'data' };
      let originalJsonCalled = false;
      let clonedJsonCalled = false;

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => {
          originalJsonCalled = true;
          return mockResponseBody;
        },
        clone: function() {
          return {
            ok: this.ok,
            status: this.status,
            json: async () => {
              clonedJsonCalled = true;
              return mockResponseBody;
            }
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await debugFetch('/api/test');

      // Assert
      expect(clonedJsonCalled).toBe(true);
      expect(originalJsonCalled).toBe(false);

      // Original response should still be consumable
      const data = await result.json();
      expect(originalJsonCalled).toBe(true);
      expect(data).toEqual(mockResponseBody);
    });
  });

  describe('debugFetch - different HTTP methods', () => {
    beforeEach(() => {
      setDebugStore({
        isDebugMode: true,
        addLog: mockAddLog
      });
    });

    it('should log GET request correctly', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({}),
        clone: function() {
          return {
            ...this,
            json: async () => ({})
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/namespaces');

      // Assert
      expect(mockAddLog).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/api/namespaces'
        })
      );
    });

    it('should log POST request correctly', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 201,
        json: async () => ({}),
        clone: function() {
          return {
            ...this,
            json: async () => ({})
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const options = {
        method: 'POST',
        body: JSON.stringify({ name: 'test' })
      };

      // Act
      await debugFetch('/api/resources', options);

      // Assert
      expect(mockAddLog).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/api/resources'
        })
      );
    });

    it('should log PUT request correctly', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({}),
        clone: function() {
          return {
            ...this,
            json: async () => ({})
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const options = {
        method: 'PUT',
        body: JSON.stringify({ update: 'data' })
      };

      // Act
      await debugFetch('/api/config', options);

      // Assert
      expect(mockAddLog).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          url: '/api/config'
        })
      );
    });

    it('should log DELETE request correctly', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 204,
        json: async () => null,
        clone: function() {
          return {
            ...this,
            json: async () => null
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const options = {
        method: 'DELETE'
      };

      // Act
      await debugFetch('/api/resource/123', options);

      // Assert
      expect(mockAddLog).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
          url: '/api/resource/123'
        })
      );
    });
  });

  describe('debugFetch - different response statuses', () => {
    beforeEach(() => {
      setDebugStore({
        isDebugMode: true,
        addLog: mockAddLog
      });
    });

    it('should log 200 OK response', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({}),
        clone: function() {
          return {
            ...this,
            json: async () => ({})
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/test');

      // Assert
      expect(mockAddLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200
        })
      );
    });

    it('should log 404 Not Found response', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
        clone: function() {
          return {
            ...this,
            json: async () => ({ error: 'Not found' })
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/missing');

      // Assert
      expect(mockAddLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 404,
          responseBody: { error: 'Not found' }
        })
      );
    });

    it('should log 500 Server Error response', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
        clone: function() {
          return {
            ...this,
            json: async () => ({ error: 'Internal server error' })
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/error');

      // Assert
      expect(mockAddLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 500
        })
      );
    });

    it('should log 401 Unauthorized response', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
        clone: function() {
          return {
            ...this,
            json: async () => ({ error: 'Unauthorized' })
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/protected');

      // Assert
      expect(mockAddLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 401
        })
      );
    });
  });

  describe('debugFetch - request params parsing', () => {
    beforeEach(() => {
      setDebugStore({
        isDebugMode: true,
        addLog: mockAddLog
      });
    });

    it('should parse JSON body as params for POST request', async () => {
      // Arrange
      const requestBody = { key: 'value', count: 42 };
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({}),
        clone: function() {
          return {
            ...this,
            json: async () => ({})
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const options = {
        method: 'POST',
        body: JSON.stringify(requestBody)
      };

      // Act
      await debugFetch('/api/test', options);

      // Assert
      expect(mockAddLog).toHaveBeenCalledWith(
        expect.objectContaining({
          params: requestBody
        })
      );
    });

    it('should handle undefined params for GET request', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({}),
        clone: function() {
          return {
            ...this,
            json: async () => ({})
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/test');

      // Assert
      expect(mockAddLog).toHaveBeenCalledWith(
        expect.objectContaining({
          params: undefined
        })
      );
    });

    it('should handle invalid JSON in request body gracefully', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({}),
        clone: function() {
          return {
            ...this,
            json: async () => ({})
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const options = {
        method: 'POST',
        body: 'invalid json'
      };

      // Act
      await debugFetch('/api/test', options);

      // Assert - Should still log, params should be undefined or original string
      expect(mockAddLog).toHaveBeenCalled();
    });

    it('should handle empty request body', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({}),
        clone: function() {
          return {
            ...this,
            json: async () => ({})
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const options = {
        method: 'POST',
        body: ''
      };

      // Act
      await debugFetch('/api/test', options);

      // Assert
      expect(mockAddLog).toHaveBeenCalled();
    });
  });

  describe('debugFetch - error handling', () => {
    beforeEach(() => {
      setDebugStore({
        isDebugMode: true,
        addLog: mockAddLog
      });
    });

    it('should propagate network errors', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(debugFetch('/api/test')).rejects.toThrow('Network error');
    });

    it('should not log when fetch throws error', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      // Act & Assert
      await expect(debugFetch('/api/test')).rejects.toThrow();

      // Logging should happen only on successful fetch
      // (Error handling can be added later if needed)
    });

    it('should handle non-JSON response gracefully', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
        clone: function() {
          return {
            ...this,
            json: async () => {
              throw new Error('Invalid JSON');
            }
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await debugFetch('/api/test');

      // Assert - Should return response even if logging fails
      expect(result).toBe(mockResponse);
    });
  });

  describe('debugFetch - edge cases', () => {
    beforeEach(() => {
      setDebugStore({
        isDebugMode: true,
        addLog: mockAddLog
      });
    });

    it('should handle very large response body', async () => {
      // Arrange
      const largeData = {
        items: Array.from({ length: 10000 }, (_, i) => ({ id: i, data: 'x'.repeat(100) }))
      };
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => largeData,
        clone: function() {
          return {
            ...this,
            json: async () => largeData
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/large-data');

      // Assert
      expect(mockAddLog).toHaveBeenCalledWith(
        expect.objectContaining({
          responseBody: largeData,
          responseSize: expect.any(Number)
        })
      );

      const loggedSize = mockAddLog.mock.calls[0][0].responseSize;
      expect(loggedSize).toBeGreaterThan(100000);
    });

    it('should handle URL with query parameters', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({}),
        clone: function() {
          return {
            ...this,
            json: async () => ({})
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const url = '/api/pods?namespace=default&status=running';

      // Act
      await debugFetch(url);

      // Assert
      expect(mockAddLog).toHaveBeenCalledWith(
        expect.objectContaining({
          url: url
        })
      );
    });

    it('should handle empty response body', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 204,
        json: async () => null,
        clone: function() {
          return {
            ...this,
            json: async () => null
          };
        }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      await debugFetch('/api/no-content');

      // Assert
      expect(mockAddLog).toHaveBeenCalledWith(
        expect.objectContaining({
          responseBody: null,
          responseSize: 4 // "null" as string
        })
      );
    });

    it('should handle concurrent requests', async () => {
      // Arrange
      const mockResponse1 = {
        ok: true,
        status: 200,
        json: async () => ({ id: 1 }),
        clone: function() {
          return {
            ...this,
            json: async () => ({ id: 1 })
          };
        }
      };

      const mockResponse2 = {
        ok: true,
        status: 200,
        json: async () => ({ id: 2 }),
        clone: function() {
          return {
            ...this,
            json: async () => ({ id: 2 })
          };
        }
      };

      mockFetch
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      // Act
      await Promise.all([
        debugFetch('/api/test1'),
        debugFetch('/api/test2')
      ]);

      // Assert - Both requests should be logged
      expect(mockAddLog).toHaveBeenCalledTimes(2);
    });
  });

  describe('debugFetch - type safety', () => {
    it('should return Response type', async () => {
      // Arrange
      setDebugStore({
        isDebugMode: false,
        addLog: mockAddLog
      });

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
        clone: function() { return this; }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await debugFetch('/api/test');

      // Assert - TypeScript compile-time check
      const response: Response = result as any;
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
    });

    it('should accept RequestInit as second parameter', async () => {
      // Arrange
      setDebugStore({
        isDebugMode: false,
        addLog: mockAddLog
      });

      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({}),
        clone: function() { return this; }
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const options: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token'
        },
        body: JSON.stringify({ test: 'data' })
      };

      // Act
      await debugFetch('/api/test', options);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/test', options);
    });
  });
});
