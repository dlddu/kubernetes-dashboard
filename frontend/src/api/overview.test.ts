import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchOverview } from './overview';

// Mock fetch globally with proper typing
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Type definitions for overview data
export interface OverviewData {
  nodes: {
    ready: number;
    total: number;
  };
  unhealthyPods: number;
  averageCpu: number;
  averageMemory: number;
}

describe('Overview API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchOverview - happy path', () => {
    it('should fetch overview data from backend', async () => {
      // Arrange
      const mockData: OverviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCpu: 45.5,
        averageMemory: 60.2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/overview');
      expect(result).toEqual(mockData);
    });

    it('should return correct data structure with all fields', async () => {
      // Arrange
      const mockData: OverviewData = {
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 5,
        averageCpu: 75.0,
        averageMemory: 80.5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.nodes).toBeDefined();
      expect(result.nodes.ready).toBe(2);
      expect(result.nodes.total).toBe(3);
      expect(result.unhealthyPods).toBe(5);
      expect(result.averageCpu).toBe(75.0);
      expect(result.averageMemory).toBe(80.5);
    });

    it('should handle zero values correctly', async () => {
      // Arrange
      const mockData: OverviewData = {
        nodes: { ready: 0, total: 0 },
        unhealthyPods: 0,
        averageCpu: 0,
        averageMemory: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.nodes.ready).toBe(0);
      expect(result.nodes.total).toBe(0);
      expect(result.unhealthyPods).toBe(0);
      expect(result.averageCpu).toBe(0);
      expect(result.averageMemory).toBe(0);
    });
  });

  describe('fetchOverview - with namespace filter', () => {
    it('should send namespace query parameter when provided', async () => {
      // Arrange
      const mockData: OverviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 1,
        averageCpu: 50.0,
        averageMemory: 55.0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      // Act
      const result = await fetchOverview('default');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/overview?namespace=default');
      expect(result).toEqual(mockData);
    });

    it('should fetch all namespaces when namespace is not provided', async () => {
      // Arrange
      const mockData: OverviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 2,
        averageCpu: 60.0,
        averageMemory: 65.0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/overview');
      expect(result).toEqual(mockData);
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
    it('should handle very high CPU and memory percentages', async () => {
      // Arrange
      const mockData: OverviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCpu: 99.9,
        averageMemory: 98.5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.averageCpu).toBe(99.9);
      expect(result.averageMemory).toBe(98.5);
    });

    it('should handle large number of unhealthy pods', async () => {
      // Arrange
      const mockData: OverviewData = {
        nodes: { ready: 5, total: 5 },
        unhealthyPods: 150,
        averageCpu: 70.0,
        averageMemory: 75.0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.unhealthyPods).toBe(150);
    });

    it('should handle decimal values in node counts', async () => {
      // Arrange - Backend might return integers but testing robustness
      const mockData: OverviewData = {
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 5,
        averageCpu: 45.678,
        averageMemory: 60.123,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.averageCpu).toBeCloseTo(45.678, 2);
      expect(result.averageMemory).toBeCloseTo(60.123, 2);
    });
  });

  describe('fetchOverview - type safety', () => {
    it('should return type-safe overview data', async () => {
      // Arrange
      const mockData: OverviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCpu: 50.0,
        averageMemory: 60.0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      // Act
      const result = await fetchOverview();

      // Assert - TypeScript compile-time check
      const nodes: { ready: number; total: number } = result.nodes;
      const unhealthyPods: number = result.unhealthyPods;
      const avgCpu: number = result.averageCpu;
      const avgMemory: number = result.averageMemory;

      expect(nodes.ready).toBeDefined();
      expect(unhealthyPods).toBeDefined();
      expect(avgCpu).toBeDefined();
      expect(avgMemory).toBeDefined();
    });
  });
});
