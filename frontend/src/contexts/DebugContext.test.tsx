import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { DebugProvider, useDebug } from './DebugContext';
import { ReactNode } from 'react';

// Helper to render hook with DebugProvider
const wrapper = ({ children }: { children: ReactNode }) => (
  <DebugProvider>{children}</DebugProvider>
);

describe('DebugContext', () => {
  beforeEach(() => {
    // Reset any mocks if needed
  });

  describe('DebugProvider - rendering', () => {
    it('should render DebugProvider without crashing', () => {
      // Act & Assert
      const { result } = renderHook(() => useDebug(), { wrapper });
      expect(result.current).toBeDefined();
    });

    it('should provide DebugContext to children', () => {
      // Act
      const { result } = renderHook(() => useDebug(), { wrapper });

      // Assert
      expect(result.current.isDebugMode).toBeDefined();
      expect(result.current.logs).toBeDefined();
      expect(result.current.addLog).toBeDefined();
      expect(result.current.clearLogs).toBeDefined();
      expect(result.current.toggleDebugMode).toBeDefined();
    });
  });

  describe('isDebugMode - initial state', () => {
    it('should have isDebugMode set to false by default', () => {
      // Act
      const { result } = renderHook(() => useDebug(), { wrapper });

      // Assert
      expect(result.current.isDebugMode).toBe(false);
    });
  });

  describe('logs - initial state', () => {
    it('should have empty logs array by default', () => {
      // Act
      const { result } = renderHook(() => useDebug(), { wrapper });

      // Assert
      expect(result.current.logs).toEqual([]);
      expect(result.current.logs).toHaveLength(0);
    });

    it('should return logs as an array', () => {
      // Act
      const { result } = renderHook(() => useDebug(), { wrapper });

      // Assert
      expect(Array.isArray(result.current.logs)).toBe(true);
    });
  });

  describe('toggleDebugMode - happy path', () => {
    it('should toggle debug mode from false to true', () => {
      // Arrange
      const { result } = renderHook(() => useDebug(), { wrapper });
      expect(result.current.isDebugMode).toBe(false);

      // Act
      act(() => {
        result.current.toggleDebugMode();
      });

      // Assert
      expect(result.current.isDebugMode).toBe(true);
    });

    it('should toggle debug mode from true to false', () => {
      // Arrange
      const { result } = renderHook(() => useDebug(), { wrapper });

      // Toggle to true first
      act(() => {
        result.current.toggleDebugMode();
      });
      expect(result.current.isDebugMode).toBe(true);

      // Act
      act(() => {
        result.current.toggleDebugMode();
      });

      // Assert
      expect(result.current.isDebugMode).toBe(false);
    });

    it('should toggle debug mode multiple times correctly', () => {
      // Arrange
      const { result } = renderHook(() => useDebug(), { wrapper });

      // Act & Assert
      expect(result.current.isDebugMode).toBe(false);

      act(() => {
        result.current.toggleDebugMode();
      });
      expect(result.current.isDebugMode).toBe(true);

      act(() => {
        result.current.toggleDebugMode();
      });
      expect(result.current.isDebugMode).toBe(false);

      act(() => {
        result.current.toggleDebugMode();
      });
      expect(result.current.isDebugMode).toBe(true);
    });
  });

  describe('addLog - happy path', () => {
    it('should add a log to the logs array', () => {
      // Arrange
      const { result } = renderHook(() => useDebug(), { wrapper });
      const mockLog = {
        id: 'log-1',
        method: 'GET',
        url: '/api/overview',
        params: {},
        status: 200,
        timestamp: new Date().toISOString(),
        duration: 123,
        responseBody: { data: 'test' },
        responseSize: 1024,
      };

      // Act
      act(() => {
        result.current.addLog(mockLog);
      });

      // Assert
      expect(result.current.logs).toHaveLength(1);
      expect(result.current.logs[0]).toEqual(mockLog);
    });

    it('should add multiple logs to the logs array', () => {
      // Arrange
      const { result } = renderHook(() => useDebug(), { wrapper });
      const mockLog1 = {
        id: 'log-1',
        method: 'GET',
        url: '/api/overview',
        params: {},
        status: 200,
        timestamp: new Date().toISOString(),
        duration: 100,
        responseBody: { data: 'test1' },
        responseSize: 1024,
      };
      const mockLog2 = {
        id: 'log-2',
        method: 'POST',
        url: '/api/pods',
        params: { namespace: 'default' },
        status: 201,
        timestamp: new Date().toISOString(),
        duration: 200,
        responseBody: { data: 'test2' },
        responseSize: 2048,
      };

      // Act
      act(() => {
        result.current.addLog(mockLog1);
        result.current.addLog(mockLog2);
      });

      // Assert
      expect(result.current.logs).toHaveLength(2);
      expect(result.current.logs[0]).toEqual(mockLog1);
      expect(result.current.logs[1]).toEqual(mockLog2);
    });

    it('should preserve log order when adding multiple logs', () => {
      // Arrange
      const { result } = renderHook(() => useDebug(), { wrapper });
      const logs = [
        {
          id: 'log-1',
          method: 'GET',
          url: '/api/overview',
          params: {},
          status: 200,
          timestamp: '2024-01-01T00:00:00Z',
          duration: 100,
          responseBody: {},
          responseSize: 100,
        },
        {
          id: 'log-2',
          method: 'POST',
          url: '/api/pods',
          params: {},
          status: 201,
          timestamp: '2024-01-01T00:01:00Z',
          duration: 200,
          responseBody: {},
          responseSize: 200,
        },
        {
          id: 'log-3',
          method: 'DELETE',
          url: '/api/pods/test',
          params: {},
          status: 204,
          timestamp: '2024-01-01T00:02:00Z',
          duration: 300,
          responseBody: {},
          responseSize: 0,
        },
      ];

      // Act
      act(() => {
        logs.forEach((log) => result.current.addLog(log));
      });

      // Assert
      expect(result.current.logs).toHaveLength(3);
      expect(result.current.logs[0].id).toBe('log-1');
      expect(result.current.logs[1].id).toBe('log-2');
      expect(result.current.logs[2].id).toBe('log-3');
    });
  });

  describe('addLog - with all metadata fields', () => {
    it('should store log with all required metadata fields', () => {
      // Arrange
      const { result } = renderHook(() => useDebug(), { wrapper });
      const mockLog = {
        id: 'unique-id-123',
        method: 'PUT',
        url: '/api/deployments/my-app',
        params: { namespace: 'production', replicas: '3' },
        status: 200,
        timestamp: '2024-01-15T10:30:45.123Z',
        duration: 456,
        responseBody: { success: true, message: 'Updated' },
        responseSize: 2048,
      };

      // Act
      act(() => {
        result.current.addLog(mockLog);
      });

      // Assert
      const addedLog = result.current.logs[0];
      expect(addedLog.id).toBe('unique-id-123');
      expect(addedLog.method).toBe('PUT');
      expect(addedLog.url).toBe('/api/deployments/my-app');
      expect(addedLog.params).toEqual({ namespace: 'production', replicas: '3' });
      expect(addedLog.status).toBe(200);
      expect(addedLog.timestamp).toBe('2024-01-15T10:30:45.123Z');
      expect(addedLog.duration).toBe(456);
      expect(addedLog.responseBody).toEqual({ success: true, message: 'Updated' });
      expect(addedLog.responseSize).toBe(2048);
    });

    it('should handle logs with empty params object', () => {
      // Arrange
      const { result } = renderHook(() => useDebug(), { wrapper });
      const mockLog = {
        id: 'log-empty-params',
        method: 'GET',
        url: '/api/health',
        params: {},
        status: 200,
        timestamp: new Date().toISOString(),
        duration: 50,
        responseBody: { status: 'ok' },
        responseSize: 512,
      };

      // Act
      act(() => {
        result.current.addLog(mockLog);
      });

      // Assert
      expect(result.current.logs[0].params).toEqual({});
    });

    it('should handle logs with large response body', () => {
      // Arrange
      const { result } = renderHook(() => useDebug(), { wrapper });
      const largeResponseBody = {
        items: Array(100).fill({ name: 'pod', status: 'Running' }),
      };
      const mockLog = {
        id: 'log-large',
        method: 'GET',
        url: '/api/pods',
        params: {},
        status: 200,
        timestamp: new Date().toISOString(),
        duration: 500,
        responseBody: largeResponseBody,
        responseSize: 102400,
      };

      // Act
      act(() => {
        result.current.addLog(mockLog);
      });

      // Assert
      expect(result.current.logs[0].responseBody).toEqual(largeResponseBody);
      expect(result.current.logs[0].responseSize).toBe(102400);
    });
  });

  describe('clearLogs - happy path', () => {
    it('should clear all logs from the array', () => {
      // Arrange
      const { result } = renderHook(() => useDebug(), { wrapper });
      const mockLog = {
        id: 'log-1',
        method: 'GET',
        url: '/api/overview',
        params: {},
        status: 200,
        timestamp: new Date().toISOString(),
        duration: 123,
        responseBody: {},
        responseSize: 1024,
      };

      act(() => {
        result.current.addLog(mockLog);
      });
      expect(result.current.logs).toHaveLength(1);

      // Act
      act(() => {
        result.current.clearLogs();
      });

      // Assert
      expect(result.current.logs).toEqual([]);
      expect(result.current.logs).toHaveLength(0);
    });

    it('should clear multiple logs from the array', () => {
      // Arrange
      const { result } = renderHook(() => useDebug(), { wrapper });

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.addLog({
            id: `log-${i}`,
            method: 'GET',
            url: `/api/test/${i}`,
            params: {},
            status: 200,
            timestamp: new Date().toISOString(),
            duration: 100,
            responseBody: {},
            responseSize: 1024,
          });
        }
      });
      expect(result.current.logs).toHaveLength(5);

      // Act
      act(() => {
        result.current.clearLogs();
      });

      // Assert
      expect(result.current.logs).toEqual([]);
      expect(result.current.logs).toHaveLength(0);
    });

    it('should not affect debug mode when clearing logs', () => {
      // Arrange
      const { result } = renderHook(() => useDebug(), { wrapper });

      act(() => {
        result.current.toggleDebugMode();
        result.current.addLog({
          id: 'log-1',
          method: 'GET',
          url: '/api/test',
          params: {},
          status: 200,
          timestamp: new Date().toISOString(),
          duration: 100,
          responseBody: {},
          responseSize: 1024,
        });
      });
      expect(result.current.isDebugMode).toBe(true);
      expect(result.current.logs).toHaveLength(1);

      // Act
      act(() => {
        result.current.clearLogs();
      });

      // Assert
      expect(result.current.logs).toHaveLength(0);
      expect(result.current.isDebugMode).toBe(true);
    });
  });

  describe('clearLogs - edge cases', () => {
    it('should handle clearing already empty logs array', () => {
      // Arrange
      const { result } = renderHook(() => useDebug(), { wrapper });
      expect(result.current.logs).toHaveLength(0);

      // Act
      act(() => {
        result.current.clearLogs();
      });

      // Assert
      expect(result.current.logs).toEqual([]);
    });

    it('should allow adding logs after clearing', () => {
      // Arrange
      const { result } = renderHook(() => useDebug(), { wrapper });
      const mockLog = {
        id: 'log-new',
        method: 'GET',
        url: '/api/test',
        params: {},
        status: 200,
        timestamp: new Date().toISOString(),
        duration: 100,
        responseBody: {},
        responseSize: 1024,
      };

      act(() => {
        result.current.addLog({
          id: 'log-old',
          method: 'GET',
          url: '/api/old',
          params: {},
          status: 200,
          timestamp: new Date().toISOString(),
          duration: 100,
          responseBody: {},
          responseSize: 1024,
        });
        result.current.clearLogs();
      });

      // Act
      act(() => {
        result.current.addLog(mockLog);
      });

      // Assert
      expect(result.current.logs).toHaveLength(1);
      expect(result.current.logs[0]).toEqual(mockLog);
    });
  });

  describe('useDebug - error cases', () => {
    it('should throw error when used outside DebugProvider', () => {
      // Act & Assert
      expect(() => {
        renderHook(() => useDebug());
      }).toThrow('useDebug must be used within a DebugProvider');
    });
  });

  describe('integration - debug mode and logs interaction', () => {
    it('should maintain logs when toggling debug mode', () => {
      // Arrange
      const { result } = renderHook(() => useDebug(), { wrapper });
      const mockLog = {
        id: 'log-1',
        method: 'GET',
        url: '/api/test',
        params: {},
        status: 200,
        timestamp: new Date().toISOString(),
        duration: 100,
        responseBody: {},
        responseSize: 1024,
      };

      // Act
      act(() => {
        result.current.addLog(mockLog);
        result.current.toggleDebugMode();
      });

      // Assert
      expect(result.current.isDebugMode).toBe(true);
      expect(result.current.logs).toHaveLength(1);
      expect(result.current.logs[0]).toEqual(mockLog);

      // Toggle back
      act(() => {
        result.current.toggleDebugMode();
      });

      expect(result.current.isDebugMode).toBe(false);
      expect(result.current.logs).toHaveLength(1);
    });

    it('should handle all operations in sequence', () => {
      // Arrange
      const { result } = renderHook(() => useDebug(), { wrapper });

      // Act & Assert - Initial state
      expect(result.current.isDebugMode).toBe(false);
      expect(result.current.logs).toHaveLength(0);

      // Toggle debug mode
      act(() => {
        result.current.toggleDebugMode();
      });
      expect(result.current.isDebugMode).toBe(true);

      // Add logs
      act(() => {
        result.current.addLog({
          id: 'log-1',
          method: 'GET',
          url: '/api/test1',
          params: {},
          status: 200,
          timestamp: new Date().toISOString(),
          duration: 100,
          responseBody: {},
          responseSize: 1024,
        });
        result.current.addLog({
          id: 'log-2',
          method: 'POST',
          url: '/api/test2',
          params: {},
          status: 201,
          timestamp: new Date().toISOString(),
          duration: 200,
          responseBody: {},
          responseSize: 2048,
        });
      });
      expect(result.current.logs).toHaveLength(2);

      // Clear logs
      act(() => {
        result.current.clearLogs();
      });
      expect(result.current.logs).toHaveLength(0);
      expect(result.current.isDebugMode).toBe(true);

      // Toggle debug mode off
      act(() => {
        result.current.toggleDebugMode();
      });
      expect(result.current.isDebugMode).toBe(false);
    });
  });
});
