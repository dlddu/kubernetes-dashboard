import { render, screen, renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DebugProvider, useDebugContext } from './DebugContext';
import { ReactNode } from 'react';

// Helper to render with DebugProvider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<DebugProvider>{ui}</DebugProvider>);
};

// Helper component for testing context values
function TestComponent() {
  const { isDebugMode, logs, toggleDebugMode, addLog, clearLogs } = useDebugContext();

  return (
    <div>
      <div data-testid="debug-mode">{isDebugMode ? 'enabled' : 'disabled'}</div>
      <div data-testid="logs-count">{logs.length}</div>
      <button onClick={toggleDebugMode} data-testid="toggle-button">Toggle</button>
      <button
        onClick={() => addLog({
          method: 'GET',
          url: '/api/test',
          params: undefined,
          status: 200,
          timestamp: Date.now(),
          duration: 100,
          responseBody: { data: 'test' },
          responseSize: 16
        })}
        data-testid="add-log-button"
      >
        Add Log
      </button>
      <button onClick={clearLogs} data-testid="clear-logs-button">Clear Logs</button>
    </div>
  );
}

describe('DebugContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  describe('DebugProvider - initialization', () => {
    it('should render without crashing', () => {
      // Act
      renderWithProvider(<div data-testid="test-child">Test</div>);

      // Assert
      const child = screen.getByTestId('test-child');
      expect(child).toBeInTheDocument();
    });

    it('should provide default context values', () => {
      // Act
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      // Assert
      expect(result.current.isDebugMode).toBe(false);
      expect(result.current.logs).toEqual([]);
      expect(typeof result.current.toggleDebugMode).toBe('function');
      expect(typeof result.current.addLog).toBe('function');
      expect(typeof result.current.clearLogs).toBe('function');
    });

    it('should start with debug mode disabled', () => {
      // Act
      renderWithProvider(<TestComponent />);

      // Assert
      const debugMode = screen.getByTestId('debug-mode');
      expect(debugMode).toHaveTextContent('disabled');
    });

    it('should start with empty logs array', () => {
      // Act
      renderWithProvider(<TestComponent />);

      // Assert
      const logsCount = screen.getByTestId('logs-count');
      expect(logsCount).toHaveTextContent('0');
    });
  });

  describe('useDebugContext - error handling', () => {
    it('should throw error when used outside DebugProvider', () => {
      // Arrange
      const TestComponentWithoutProvider = () => {
        useDebugContext();
        return <div>Test</div>;
      };

      // Act & Assert
      expect(() => render(<TestComponentWithoutProvider />)).toThrow(
        'useDebugContext must be used within a DebugProvider'
      );
    });
  });

  describe('toggleDebugMode - happy path', () => {
    it('should toggle debug mode from disabled to enabled', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      expect(result.current.isDebugMode).toBe(false);

      // Act
      act(() => {
        result.current.toggleDebugMode();
      });

      // Assert
      expect(result.current.isDebugMode).toBe(true);
    });

    it('should toggle debug mode from enabled to disabled', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      // First enable
      act(() => {
        result.current.toggleDebugMode();
      });
      expect(result.current.isDebugMode).toBe(true);

      // Act - Toggle again
      act(() => {
        result.current.toggleDebugMode();
      });

      // Assert
      expect(result.current.isDebugMode).toBe(false);
    });

    it('should toggle multiple times correctly', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      // Act & Assert - Multiple toggles
      expect(result.current.isDebugMode).toBe(false);

      act(() => result.current.toggleDebugMode());
      expect(result.current.isDebugMode).toBe(true);

      act(() => result.current.toggleDebugMode());
      expect(result.current.isDebugMode).toBe(false);

      act(() => result.current.toggleDebugMode());
      expect(result.current.isDebugMode).toBe(true);
    });
  });

  describe('addLog - happy path', () => {
    it('should add a log entry to logs array', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      const mockLog = {
        method: 'GET' as const,
        url: '/api/health',
        params: undefined,
        status: 200,
        timestamp: 1234567890,
        duration: 150,
        responseBody: { status: 'ok' },
        responseSize: 15
      };

      // Act
      act(() => {
        result.current.addLog(mockLog);
      });

      // Assert
      expect(result.current.logs).toHaveLength(1);
      expect(result.current.logs[0]).toEqual(mockLog);
    });

    it('should add multiple log entries', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      const log1 = {
        method: 'GET' as const,
        url: '/api/health',
        params: undefined,
        status: 200,
        timestamp: 1000,
        duration: 100,
        responseBody: {},
        responseSize: 2
      };

      const log2 = {
        method: 'POST' as const,
        url: '/api/data',
        params: { key: 'value' },
        status: 201,
        timestamp: 2000,
        duration: 200,
        responseBody: { id: 1 },
        responseSize: 8
      };

      // Act
      act(() => {
        result.current.addLog(log1);
        result.current.addLog(log2);
      });

      // Assert
      expect(result.current.logs).toHaveLength(2);
      expect(result.current.logs[0]).toEqual(log1);
      expect(result.current.logs[1]).toEqual(log2);
    });

    it('should maintain logs order (newest first)', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      const timestamps = [1000, 2000, 3000];

      // Act
      act(() => {
        timestamps.forEach(timestamp => {
          result.current.addLog({
            method: 'GET',
            url: '/api/test',
            params: undefined,
            status: 200,
            timestamp,
            duration: 100,
            responseBody: {},
            responseSize: 2
          });
        });
      });

      // Assert
      expect(result.current.logs).toHaveLength(3);
      expect(result.current.logs[0].timestamp).toBe(1000);
      expect(result.current.logs[1].timestamp).toBe(2000);
      expect(result.current.logs[2].timestamp).toBe(3000);
    });
  });

  describe('addLog - different HTTP methods', () => {
    it('should handle GET request log', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      const log = {
        method: 'GET' as const,
        url: '/api/namespaces',
        params: undefined,
        status: 200,
        timestamp: Date.now(),
        duration: 100,
        responseBody: ['default', 'kube-system'],
        responseSize: 32
      };

      // Act
      act(() => {
        result.current.addLog(log);
      });

      // Assert
      expect(result.current.logs[0].method).toBe('GET');
    });

    it('should handle POST request log', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      const log = {
        method: 'POST' as const,
        url: '/api/pods/restart',
        params: { namespace: 'default', pod: 'test-pod' },
        status: 200,
        timestamp: Date.now(),
        duration: 500,
        responseBody: { success: true },
        responseSize: 17
      };

      // Act
      act(() => {
        result.current.addLog(log);
      });

      // Assert
      expect(result.current.logs[0].method).toBe('POST');
      expect(result.current.logs[0].params).toEqual({ namespace: 'default', pod: 'test-pod' });
    });

    it('should handle PUT request log', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      const log = {
        method: 'PUT' as const,
        url: '/api/config',
        params: { setting: 'value' },
        status: 200,
        timestamp: Date.now(),
        duration: 200,
        responseBody: {},
        responseSize: 2
      };

      // Act
      act(() => {
        result.current.addLog(log);
      });

      // Assert
      expect(result.current.logs[0].method).toBe('PUT');
    });

    it('should handle DELETE request log', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      const log = {
        method: 'DELETE' as const,
        url: '/api/resource/123',
        params: undefined,
        status: 204,
        timestamp: Date.now(),
        duration: 150,
        responseBody: null,
        responseSize: 0
      };

      // Act
      act(() => {
        result.current.addLog(log);
      });

      // Assert
      expect(result.current.logs[0].method).toBe('DELETE');
      expect(result.current.logs[0].responseBody).toBeNull();
    });
  });

  describe('addLog - different response statuses', () => {
    it('should handle successful 200 response', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      const log = {
        method: 'GET' as const,
        url: '/api/test',
        params: undefined,
        status: 200,
        timestamp: Date.now(),
        duration: 100,
        responseBody: {},
        responseSize: 2
      };

      // Act
      act(() => {
        result.current.addLog(log);
      });

      // Assert
      expect(result.current.logs[0].status).toBe(200);
    });

    it('should handle 404 not found response', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      const log = {
        method: 'GET' as const,
        url: '/api/missing',
        params: undefined,
        status: 404,
        timestamp: Date.now(),
        duration: 50,
        responseBody: { error: 'Not found' },
        responseSize: 20
      };

      // Act
      act(() => {
        result.current.addLog(log);
      });

      // Assert
      expect(result.current.logs[0].status).toBe(404);
    });

    it('should handle 500 server error response', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      const log = {
        method: 'POST' as const,
        url: '/api/action',
        params: {},
        status: 500,
        timestamp: Date.now(),
        duration: 300,
        responseBody: { error: 'Internal server error' },
        responseSize: 30
      };

      // Act
      act(() => {
        result.current.addLog(log);
      });

      // Assert
      expect(result.current.logs[0].status).toBe(500);
    });
  });

  describe('clearLogs - happy path', () => {
    it('should clear all logs', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      // Add some logs
      act(() => {
        result.current.addLog({
          method: 'GET',
          url: '/api/test1',
          params: undefined,
          status: 200,
          timestamp: 1000,
          duration: 100,
          responseBody: {},
          responseSize: 2
        });
        result.current.addLog({
          method: 'GET',
          url: '/api/test2',
          params: undefined,
          status: 200,
          timestamp: 2000,
          duration: 100,
          responseBody: {},
          responseSize: 2
        });
      });

      expect(result.current.logs).toHaveLength(2);

      // Act
      act(() => {
        result.current.clearLogs();
      });

      // Assert
      expect(result.current.logs).toHaveLength(0);
      expect(result.current.logs).toEqual([]);
    });

    it('should not affect debug mode state when clearing logs', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      // Enable debug mode and add logs
      act(() => {
        result.current.toggleDebugMode();
        result.current.addLog({
          method: 'GET',
          url: '/api/test',
          params: undefined,
          status: 200,
          timestamp: Date.now(),
          duration: 100,
          responseBody: {},
          responseSize: 2
        });
      });

      expect(result.current.isDebugMode).toBe(true);
      expect(result.current.logs).toHaveLength(1);

      // Act
      act(() => {
        result.current.clearLogs();
      });

      // Assert
      expect(result.current.isDebugMode).toBe(true);
      expect(result.current.logs).toHaveLength(0);
    });

    it('should do nothing when logs are already empty', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      expect(result.current.logs).toHaveLength(0);

      // Act
      act(() => {
        result.current.clearLogs();
      });

      // Assert
      expect(result.current.logs).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very large number of logs', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      // Act - Add 1000 logs
      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.addLog({
            method: 'GET',
            url: `/api/test-${i}`,
            params: undefined,
            status: 200,
            timestamp: Date.now() + i,
            duration: 100,
            responseBody: {},
            responseSize: 2
          });
        }
      });

      // Assert
      expect(result.current.logs).toHaveLength(1000);
    });

    it('should handle log with very large response body', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      const largeResponseBody = {
        data: Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `item-${i}` }))
      };

      const log = {
        method: 'GET' as const,
        url: '/api/large-data',
        params: undefined,
        status: 200,
        timestamp: Date.now(),
        duration: 5000,
        responseBody: largeResponseBody,
        responseSize: JSON.stringify(largeResponseBody).length
      };

      // Act
      act(() => {
        result.current.addLog(log);
      });

      // Assert
      expect(result.current.logs).toHaveLength(1);
      expect(result.current.logs[0].responseBody).toEqual(largeResponseBody);
      expect(result.current.logs[0].responseSize).toBeGreaterThan(10000);
    });

    it('should handle log with undefined params', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      const log = {
        method: 'GET' as const,
        url: '/api/test',
        params: undefined,
        status: 200,
        timestamp: Date.now(),
        duration: 100,
        responseBody: {},
        responseSize: 2
      };

      // Act
      act(() => {
        result.current.addLog(log);
      });

      // Assert
      expect(result.current.logs[0].params).toBeUndefined();
    });

    it('should handle log with empty params object', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      const log = {
        method: 'GET' as const,
        url: '/api/test',
        params: {},
        status: 200,
        timestamp: Date.now(),
        duration: 100,
        responseBody: {},
        responseSize: 2
      };

      // Act
      act(() => {
        result.current.addLog(log);
      });

      // Assert
      expect(result.current.logs[0].params).toEqual({});
    });

    it('should handle log with zero duration', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      const log = {
        method: 'GET' as const,
        url: '/api/instant',
        params: undefined,
        status: 200,
        timestamp: Date.now(),
        duration: 0,
        responseBody: {},
        responseSize: 2
      };

      // Act
      act(() => {
        result.current.addLog(log);
      });

      // Assert
      expect(result.current.logs[0].duration).toBe(0);
    });

    it('should handle log with very long URL', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      const longUrl = '/api/very/long/path/that/goes/on/and/on/with/many/segments/' + 'a'.repeat(1000);

      const log = {
        method: 'GET' as const,
        url: longUrl,
        params: undefined,
        status: 200,
        timestamp: Date.now(),
        duration: 100,
        responseBody: {},
        responseSize: 2
      };

      // Act
      act(() => {
        result.current.addLog(log);
      });

      // Assert
      expect(result.current.logs[0].url).toBe(longUrl);
      expect(result.current.logs[0].url.length).toBeGreaterThan(1000);
    });
  });

  describe('type safety', () => {
    it('should enforce ApiLog type structure', () => {
      // Arrange
      const { result } = renderHook(() => useDebugContext(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DebugProvider>{children}</DebugProvider>
        ),
      });

      const validLog = {
        method: 'GET' as const,
        url: '/api/test',
        params: undefined,
        status: 200,
        timestamp: 1234567890,
        duration: 100,
        responseBody: { test: true },
        responseSize: 13
      };

      // Act
      act(() => {
        result.current.addLog(validLog);
      });

      // Assert - TypeScript compile-time check
      const log = result.current.logs[0];
      const method: string = log.method;
      const url: string = log.url;
      const status: number = log.status;
      const timestamp: number = log.timestamp;
      const duration: number = log.duration;
      const responseSize: number = log.responseSize;

      expect(method).toBe('GET');
      expect(url).toBe('/api/test');
      expect(status).toBe(200);
      expect(timestamp).toBe(1234567890);
      expect(duration).toBe(100);
      expect(responseSize).toBe(13);
    });
  });
});
