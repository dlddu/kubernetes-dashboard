import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchPodLogs, streamPodLogs } from './pods';

// Mock fetch globally with proper typing
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('Pod Logs API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ---------------------------------------------------------------------------
  // fetchPodLogs
  // ---------------------------------------------------------------------------

  describe('fetchPodLogs - happy path', () => {
    it('should fetch pod logs and return a string', async () => {
      // Arrange
      const logContent = '2024-01-01 INFO Starting application\n2024-01-01 INFO Ready';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => logContent,
      });

      // Act
      const result = await fetchPodLogs('default', 'my-pod');

      // Assert
      expect(result).toBe(logContent);
    });

    it('should call /api/pods/logs/{namespace}/{name} endpoint', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      // Act
      await fetchPodLogs('my-namespace', 'my-pod');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/pods/logs/my-namespace/my-pod')
      );
    });

    it('should not append query params when container and tailLines are omitted', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      // Act
      await fetchPodLogs('default', 'my-pod');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/pods/logs/default/my-pod');
    });

    it('should append container query param when container is provided', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      // Act
      await fetchPodLogs('default', 'my-pod', 'main-container');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/pods/logs/default/my-pod?container=main-container'
      );
    });

    it('should append tailLines query param when tailLines is provided', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      // Act
      await fetchPodLogs('default', 'my-pod', undefined, 100);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/pods/logs/default/my-pod?tailLines=100'
      );
    });

    it('should append both container and tailLines when both are provided', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      // Act
      await fetchPodLogs('dashboard-test', 'busybox-test', 'busybox', 50);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/pods/logs/dashboard-test/busybox-test?container=busybox&tailLines=50'
      );
    });

    it('should return empty string when pod has no logs', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      // Act
      const result = await fetchPodLogs('default', 'my-pod');

      // Assert
      expect(result).toBe('');
    });

    it('should return multiline log content', async () => {
      // Arrange
      const multilineLogs = [
        '2024-01-01T00:00:01Z INFO Starting',
        '2024-01-01T00:00:02Z WARN Retrying connection',
        '2024-01-01T00:00:03Z ERROR Connection failed',
      ].join('\n');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => multilineLogs,
      });

      // Act
      const result = await fetchPodLogs('default', 'my-pod');

      // Assert
      expect(result).toBe(multilineLogs);
      expect(result.split('\n').length).toBe(3);
    });
  });

  describe('fetchPodLogs - error cases', () => {
    it('should throw when pod does not exist (404)', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'pod not found' }),
      });

      // Act & Assert
      await expect(fetchPodLogs('default', 'nonexistent-pod')).rejects.toThrow();
    });

    it('should throw when container does not exist (400)', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'container not found' }),
      });

      // Act & Assert
      await expect(
        fetchPodLogs('default', 'my-pod', 'nonexistent-container')
      ).rejects.toThrow();
    });

    it('should throw on network error', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(fetchPodLogs('default', 'my-pod')).rejects.toThrow('Network error');
    });

    it('should throw on HTTP 500 response', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' }),
      });

      // Act & Assert
      await expect(fetchPodLogs('default', 'my-pod')).rejects.toThrow();
    });

    it('should propagate server error message', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'pod not found' }),
      });

      // Act & Assert
      await expect(fetchPodLogs('default', 'no-pod')).rejects.toThrow('pod not found');
    });
  });

  describe('fetchPodLogs - edge cases', () => {
    it('should handle namespace with hyphens', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'log line',
      });

      // Act
      await fetchPodLogs('dashboard-test', 'my-pod');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/pods/logs/dashboard-test/my-pod')
      );
    });

    it('should handle pod name with hyphens and numbers', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      // Act
      await fetchPodLogs('default', 'my-app-deployment-7d4f8b9c6-xkj2p');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/pods/logs/default/my-app-deployment-7d4f8b9c6-xkj2p'
      );
    });

    it('should handle tailLines of 1', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'last log line',
      });

      // Act
      const result = await fetchPodLogs('default', 'my-pod', undefined, 1);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/pods/logs/default/my-pod?tailLines=1');
      expect(result).toBe('last log line');
    });

    it('should handle large tailLines value', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      // Act
      await fetchPodLogs('default', 'my-pod', undefined, 10000);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/pods/logs/default/my-pod?tailLines=10000');
    });
  });

  // ---------------------------------------------------------------------------
  // streamPodLogs
  // ---------------------------------------------------------------------------

  describe('streamPodLogs - happy path', () => {
    it('should return a cleanup function', () => {
      // Arrange
      const mockEventSource = {
        addEventListener: vi.fn(),
        close: vi.fn(),
        readyState: 1,
      };
      vi.stubGlobal('EventSource', vi.fn(() => mockEventSource));

      // Act
      const cleanup = streamPodLogs('default', 'my-pod', vi.fn());

      // Assert
      expect(typeof cleanup).toBe('function');

      vi.unstubAllGlobals();
    });

    it('should create EventSource with correct SSE URL', () => {
      // Arrange
      const mockEventSource = {
        addEventListener: vi.fn(),
        close: vi.fn(),
        readyState: 1,
      };
      const MockEventSource = vi.fn(() => mockEventSource);
      vi.stubGlobal('EventSource', MockEventSource);

      // Act
      streamPodLogs('default', 'my-pod', vi.fn());

      // Assert
      expect(MockEventSource).toHaveBeenCalledWith(
        expect.stringContaining('/api/pods/logs/default/my-pod')
      );
      expect(MockEventSource).toHaveBeenCalledWith(
        expect.stringContaining('follow=true')
      );

      vi.unstubAllGlobals();
    });

    it('should include container param in SSE URL when provided', () => {
      // Arrange
      const mockEventSource = {
        addEventListener: vi.fn(),
        close: vi.fn(),
        readyState: 1,
      };
      const MockEventSource = vi.fn(() => mockEventSource);
      vi.stubGlobal('EventSource', MockEventSource);

      // Act
      streamPodLogs('default', 'my-pod', vi.fn(), 'sidecar');

      // Assert
      expect(MockEventSource).toHaveBeenCalledWith(
        expect.stringContaining('container=sidecar')
      );

      vi.unstubAllGlobals();
    });

    it('should include tailLines param in SSE URL when provided', () => {
      // Arrange
      const mockEventSource = {
        addEventListener: vi.fn(),
        close: vi.fn(),
        readyState: 1,
      };
      const MockEventSource = vi.fn(() => mockEventSource);
      vi.stubGlobal('EventSource', MockEventSource);

      // Act
      streamPodLogs('default', 'my-pod', vi.fn(), undefined, 200);

      // Assert
      expect(MockEventSource).toHaveBeenCalledWith(
        expect.stringContaining('tailLines=200')
      );

      vi.unstubAllGlobals();
    });

    it('should call the callback with each received log line', () => {
      // Arrange
      const listeners: Record<string, ((e: MessageEvent) => void)> = {};
      const mockEventSource = {
        addEventListener: vi.fn((event: string, handler: (e: MessageEvent) => void) => {
          listeners[event] = handler;
        }),
        close: vi.fn(),
        readyState: 1,
      };
      vi.stubGlobal('EventSource', vi.fn(() => mockEventSource));

      const onLine = vi.fn();

      // Act
      streamPodLogs('default', 'my-pod', onLine);

      // Simulate incoming SSE events
      listeners['message']?.({ data: 'INFO Application started' } as MessageEvent);
      listeners['message']?.({ data: 'WARN Low memory' } as MessageEvent);

      // Assert
      expect(onLine).toHaveBeenCalledWith('INFO Application started');
      expect(onLine).toHaveBeenCalledWith('WARN Low memory');
      expect(onLine).toHaveBeenCalledTimes(2);

      vi.unstubAllGlobals();
    });

    it('should also listen on "log" event type if provided by server', () => {
      // Arrange
      const listeners: Record<string, ((e: MessageEvent) => void)> = {};
      const mockEventSource = {
        addEventListener: vi.fn((event: string, handler: (e: MessageEvent) => void) => {
          listeners[event] = handler;
        }),
        close: vi.fn(),
        readyState: 1,
      };
      vi.stubGlobal('EventSource', vi.fn(() => mockEventSource));

      const onLine = vi.fn();

      // Act
      streamPodLogs('default', 'my-pod', onLine);

      // Simulate "log" named event
      listeners['log']?.({ data: 'ERROR Something went wrong' } as MessageEvent);

      // Assert
      // Either "message" or "log" event must invoke the callback
      const called = onLine.mock.calls.length > 0;
      expect(called).toBe(true);

      vi.unstubAllGlobals();
    });

    it('should close EventSource when cleanup function is called', () => {
      // Arrange
      const mockEventSource = {
        addEventListener: vi.fn(),
        close: vi.fn(),
        readyState: 1,
      };
      vi.stubGlobal('EventSource', vi.fn(() => mockEventSource));

      // Act
      const cleanup = streamPodLogs('default', 'my-pod', vi.fn());
      cleanup();

      // Assert
      expect(mockEventSource.close).toHaveBeenCalledTimes(1);

      vi.unstubAllGlobals();
    });
  });

  describe('streamPodLogs - edge cases', () => {
    it('should not throw if cleanup is called multiple times', () => {
      // Arrange
      const mockEventSource = {
        addEventListener: vi.fn(),
        close: vi.fn(),
        readyState: 1,
      };
      vi.stubGlobal('EventSource', vi.fn(() => mockEventSource));

      // Act
      const cleanup = streamPodLogs('default', 'my-pod', vi.fn());

      // Assert: calling cleanup multiple times should not throw
      expect(() => {
        cleanup();
        cleanup();
      }).not.toThrow();

      vi.unstubAllGlobals();
    });

    it('should create a new EventSource for each call to streamPodLogs', () => {
      // Arrange
      const MockEventSource = vi.fn(() => ({
        addEventListener: vi.fn(),
        close: vi.fn(),
        readyState: 1,
      }));
      vi.stubGlobal('EventSource', MockEventSource);

      // Act
      streamPodLogs('default', 'pod-1', vi.fn());
      streamPodLogs('default', 'pod-2', vi.fn());

      // Assert
      expect(MockEventSource).toHaveBeenCalledTimes(2);

      vi.unstubAllGlobals();
    });
  });
});
