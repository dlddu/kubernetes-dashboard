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
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 2,
        averageCPUUsage: 45.5,
        averageMemoryUsage: 62.3,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/overview');
      expect(result).toEqual(mockOverview);
    });

    it('should return properly typed overview response', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 5, total: 6 },
        unhealthyPods: 0,
        averageCPUUsage: 23.4,
        averageMemoryUsage: 55.1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.nodes).toHaveProperty('ready');
      expect(result.nodes).toHaveProperty('total');
      expect(result).toHaveProperty('unhealthyPods');
      expect(result).toHaveProperty('averageCPUUsage');
      expect(result).toHaveProperty('averageMemoryUsage');
    });

    it('should handle zero unhealthy pods', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCPUUsage: 30.0,
        averageMemoryUsage: 40.0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.unhealthyPods).toBe(0);
    });

    it('should handle cluster with all nodes ready', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 10, total: 10 },
        unhealthyPods: 0,
        averageCPUUsage: 25.0,
        averageMemoryUsage: 35.0,
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

    it('should handle high CPU and memory usage', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 1,
        averageCPUUsage: 95.5,
        averageMemoryUsage: 88.7,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.averageCPUUsage).toBeGreaterThan(90);
      expect(result.averageMemoryUsage).toBeGreaterThan(80);
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
    it('should handle cluster with no nodes', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 0, total: 0 },
        unhealthyPods: 0,
        averageCPUUsage: 0,
        averageMemoryUsage: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.nodes.total).toBe(0);
      expect(result.nodes.ready).toBe(0);
    });

    it('should handle cluster with all nodes not ready', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 0, total: 5 },
        unhealthyPods: 10,
        averageCPUUsage: 0,
        averageMemoryUsage: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.nodes.ready).toBe(0);
      expect(result.nodes.total).toBeGreaterThan(0);
    });

    it('should handle many unhealthy pods', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 1000,
        averageCPUUsage: 45.0,
        averageMemoryUsage: 60.0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.unhealthyPods).toBe(1000);
    });

    it('should handle fractional CPU and memory percentages', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 2, total: 2 },
        unhealthyPods: 1,
        averageCPUUsage: 33.333,
        averageMemoryUsage: 66.667,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.averageCPUUsage).toBeCloseTo(33.333, 2);
      expect(result.averageMemoryUsage).toBeCloseTo(66.667, 2);
    });

    it('should handle CPU usage at 100%', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 5,
        averageCPUUsage: 100.0,
        averageMemoryUsage: 95.0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.averageCPUUsage).toBe(100.0);
    });
  });

  describe('fetchOverview - type safety', () => {
    it('should return type-safe overview data', async () => {
      // Arrange
      const mockOverview = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 2,
        averageCPUUsage: 45.5,
        averageMemoryUsage: 62.3,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverview,
      });

      // Act
      const result = await fetchOverview();

      // Assert - TypeScript compile-time check
      const readyNodes: number = result.nodes.ready;
      const totalNodes: number = result.nodes.total;
      const unhealthyPods: number = result.unhealthyPods;
      const cpuUsage: number = result.averageCPUUsage;
      const memoryUsage: number = result.averageMemoryUsage;

      expect(readyNodes).toBe(3);
      expect(totalNodes).toBe(3);
      expect(unhealthyPods).toBe(2);
      expect(cpuUsage).toBe(45.5);
      expect(memoryUsage).toBe(62.3);
    });
  });
});
