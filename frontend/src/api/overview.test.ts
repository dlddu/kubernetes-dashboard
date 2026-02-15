import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchOverview } from './overview';

// Mock fetch globally with proper typing
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('Overview API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchOverview - happy path', () => {
    it('should fetch overview data from backend', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/overview', undefined);
      expect(result).toEqual(mockOverview);
    });

    it('should return correctly structured overview data', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 5, total: 5 },
        unhealthyPods: 0,
        avgCpuPercent: 30.2,
        avgMemoryPercent: 55.8,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.nodes).toBeDefined();
      expect(result.nodes.ready).toBe(5);
      expect(result.nodes.total).toBe(5);
      expect(result.unhealthyPods).toBe(0);
      expect(result.avgCpuPercent).toBe(30.2);
      expect(result.avgMemoryPercent).toBe(55.8);
    });

    it('should handle zero values correctly', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 0, total: 0 },
        unhealthyPods: 0,
        avgCpuPercent: 0,
        avgMemoryPercent: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.nodes.ready).toBe(0);
      expect(result.nodes.total).toBe(0);
      expect(result.unhealthyPods).toBe(0);
      expect(result.avgCpuPercent).toBe(0);
      expect(result.avgMemoryPercent).toBe(0);
    });

    it('should handle high usage percentages', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 10, total: 10 },
        unhealthyPods: 5,
        avgCpuPercent: 95.7,
        avgMemoryPercent: 88.3,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.avgCpuPercent).toBeGreaterThanOrEqual(0);
      expect(result.avgCpuPercent).toBeLessThanOrEqual(100);
      expect(result.avgMemoryPercent).toBeGreaterThanOrEqual(0);
      expect(result.avgMemoryPercent).toBeLessThanOrEqual(100);
    });
  });

  describe('fetchOverview - with namespace filter', () => {
    it('should fetch overview data for specific namespace', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview('default');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/overview?namespace=default', undefined);
      expect(result).toEqual(mockOverview);
    });

    it('should fetch overview data for kube-system namespace', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        avgCpuPercent: 20.0,
        avgMemoryPercent: 40.0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview('kube-system');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/overview?namespace=kube-system', undefined);
      expect(result).toEqual(mockOverview);
    });

    it('should omit namespace parameter when undefined', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/overview', undefined);
      expect(result).toEqual(mockOverview);
    });

    it('should handle empty string namespace', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview('');

      // Assert
      // Empty namespace should fetch all namespaces (no query param)
      expect(mockFetch).toHaveBeenCalledWith('/api/overview', undefined);
      expect(result).toEqual(mockOverview);
    });
  });

  describe('fetchOverview - error cases', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(fetchOverview()).rejects.toThrow('Network error');
    });

    it('should handle non-200 responses', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Act & Assert
      await expect(fetchOverview()).rejects.toThrow();
    });

    it('should handle 404 not found', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      // Act & Assert
      await expect(fetchOverview()).rejects.toThrow();
    });

    it('should handle 403 forbidden', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      // Act & Assert
      await expect(fetchOverview()).rejects.toThrow();
    });

    it('should handle invalid JSON response', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      // Act & Assert
      await expect(fetchOverview()).rejects.toThrow('Invalid JSON');
    });

    it('should handle timeout scenarios', async () => {
      // Arrange
      mockFetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      });

      // Act & Assert
      await expect(fetchOverview()).rejects.toThrow('Request timeout');
    });
  });

  describe('fetchOverview - edge cases', () => {
    it('should handle decimal percentages correctly', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.567,
        avgMemoryPercent: 62.345,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.avgCpuPercent).toBeCloseTo(45.567, 2);
      expect(result.avgMemoryPercent).toBeCloseTo(62.345, 2);
    });

    it('should handle large unhealthy pod counts', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 100, total: 100 },
        unhealthyPods: 999,
        avgCpuPercent: 50.0,
        avgMemoryPercent: 50.0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.unhealthyPods).toBe(999);
    });

    it('should handle ready nodes equal to total nodes', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 10, total: 10 },
        unhealthyPods: 0,
        avgCpuPercent: 30.0,
        avgMemoryPercent: 40.0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.nodes.ready).toBe(result.nodes.total);
    });

    it('should handle ready nodes less than total nodes', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 5, total: 10 },
        unhealthyPods: 3,
        avgCpuPercent: 60.0,
        avgMemoryPercent: 70.0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.nodes.ready).toBeLessThan(result.nodes.total);
    });
  });

  describe('fetchOverview - type safety', () => {
    it('should return type-safe overview data', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert - TypeScript compile-time check
      const ready: number = result.nodes.ready;
      const total: number = result.nodes.total;
      const unhealthy: number = result.unhealthyPods;
      const cpu: number = result.avgCpuPercent;
      const memory: number = result.avgMemoryPercent;

      expect(ready).toBe(2);
      expect(total).toBe(3);
      expect(unhealthy).toBe(1);
      expect(cpu).toBe(45.5);
      expect(memory).toBe(62.3);
    });
  });
});
