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
      const mockResponse = {
        nodes: { ready: 3, total: 5 },
        unhealthyPods: 2,
        avgCpuUsage: 45.5,
        avgMemoryUsage: 62.3,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/overview');
      expect(result.nodes.ready).toBe(3);
      expect(result.nodes.total).toBe(5);
      expect(result.unhealthyPods).toBe(2);
      expect(result.avgCpuUsage).toBe(45.5);
      expect(result.avgMemoryUsage).toBe(62.3);
    });

    it('should return valid node counts', async () => {
      // Arrange
      const mockResponse = {
        nodes: { ready: 10, total: 10 },
        unhealthyPods: 0,
        avgCpuUsage: 25.0,
        avgMemoryUsage: 30.0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.nodes.ready).toBeLessThanOrEqual(result.nodes.total);
      expect(result.nodes.ready).toBeGreaterThanOrEqual(0);
      expect(result.nodes.total).toBeGreaterThanOrEqual(0);
    });

    it('should return valid usage percentages', async () => {
      // Arrange
      const mockResponse = {
        nodes: { ready: 5, total: 5 },
        unhealthyPods: 0,
        avgCpuUsage: 75.5,
        avgMemoryUsage: 85.2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.avgCpuUsage).toBeGreaterThanOrEqual(0);
      expect(result.avgCpuUsage).toBeLessThanOrEqual(100);
      expect(result.avgMemoryUsage).toBeGreaterThanOrEqual(0);
      expect(result.avgMemoryUsage).toBeLessThanOrEqual(100);
    });

    it('should handle zero unhealthy pods', async () => {
      // Arrange
      const mockResponse = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        avgCpuUsage: 20.0,
        avgMemoryUsage: 15.0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.unhealthyPods).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(fetchOverview()).rejects.toThrow('Network error');
    });

    it('should handle 500 server errors', async () => {
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

    it('should handle malformed JSON response', async () => {
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

    it('should handle timeout errors', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      // Act & Assert
      await expect(fetchOverview()).rejects.toThrow('Request timeout');
    });
  });

  describe('edge cases', () => {
    it('should handle empty cluster with zero nodes', async () => {
      // Arrange
      const mockResponse = {
        nodes: { ready: 0, total: 0 },
        unhealthyPods: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.nodes.total).toBe(0);
      expect(result.nodes.ready).toBe(0);
      expect(result.unhealthyPods).toBe(0);
    });

    it('should handle cluster with all nodes not ready', async () => {
      // Arrange
      const mockResponse = {
        nodes: { ready: 0, total: 5 },
        unhealthyPods: 10,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.nodes.ready).toBe(0);
      expect(result.nodes.total).toBe(5);
      expect(result.unhealthyPods).toBeGreaterThan(0);
    });

    it('should handle high resource usage', async () => {
      // Arrange
      const mockResponse = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        avgCpuUsage: 99.9,
        avgMemoryUsage: 98.5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.avgCpuUsage).toBeGreaterThan(95);
      expect(result.avgMemoryUsage).toBeGreaterThan(95);
    });

    it('should handle large number of unhealthy pods', async () => {
      // Arrange
      const mockResponse = {
        nodes: { ready: 10, total: 10 },
        unhealthyPods: 1000,
        avgCpuUsage: 50.0,
        avgMemoryUsage: 60.0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.unhealthyPods).toBe(1000);
    });
  });

  describe('response validation', () => {
    it('should return data with correct structure', async () => {
      // Arrange
      const mockResponse = {
        nodes: { ready: 3, total: 5 },
        unhealthyPods: 2,
        avgCpuUsage: 45.5,
        avgMemoryUsage: 62.3,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result).toHaveProperty('nodes');
      expect(result.nodes).toHaveProperty('ready');
      expect(result.nodes).toHaveProperty('total');
      expect(result).toHaveProperty('unhealthyPods');
      expect(result).toHaveProperty('avgCpuUsage');
      expect(result).toHaveProperty('avgMemoryUsage');
    });

    it('should handle numeric types correctly', async () => {
      // Arrange
      const mockResponse = {
        nodes: { ready: 3, total: 5 },
        unhealthyPods: 2,
        avgCpuUsage: 45.5,
        avgMemoryUsage: 62.3,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await fetchOverview();

      // Assert
      expect(typeof result.nodes.ready).toBe('number');
      expect(typeof result.nodes.total).toBe('number');
      expect(typeof result.unhealthyPods).toBe('number');
      expect(typeof result.avgCpuUsage).toBe('number');
      expect(typeof result.avgMemoryUsage).toBe('number');
    });
  });
});
