import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchOverview } from './overview';

describe('fetchOverview API', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('happy path', () => {
    it('should fetch overview data successfully', async () => {
      // Arrange
      const mockData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        avgCpu: 45.5,
        avgMemory: 62.3,
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/overview?namespace=all');
    });

    it('should include namespace query parameter', async () => {
      // Arrange
      const mockData = {
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpu: 30.0,
        avgMemory: 50.0,
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      // Act
      await fetchOverview('default');

      // Assert
      expect(global.fetch).toHaveBeenCalledWith('/api/overview?namespace=default');
    });

    it('should default to "all" namespace when not specified', async () => {
      // Arrange
      const mockData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        avgCpu: 0,
        avgMemory: 0,
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      // Act
      await fetchOverview();

      // Assert
      expect(global.fetch).toHaveBeenCalledWith('/api/overview?namespace=all');
    });
  });

  describe('error handling', () => {
    it('should throw error when response is not ok', async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      // Act & Assert
      await expect(fetchOverview()).rejects.toThrow('HTTP error! status: 500');
    });

    it('should throw error on 404 status', async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      // Act & Assert
      await expect(fetchOverview('nonexistent')).rejects.toThrow('HTTP error! status: 404');
    });

    it('should throw error on network failure', async () => {
      // Arrange
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(fetchOverview()).rejects.toThrow('Network error');
    });

    it('should throw error on invalid JSON response', async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      // Act & Assert
      await expect(fetchOverview()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('data validation', () => {
    it('should return data with correct structure', async () => {
      // Arrange
      const mockData = {
        nodes: { ready: 1, total: 2 },
        unhealthyPods: 3,
        avgCpu: 25.5,
        avgMemory: 45.8,
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result).toHaveProperty('nodes');
      expect(result.nodes).toHaveProperty('ready');
      expect(result.nodes).toHaveProperty('total');
      expect(result).toHaveProperty('unhealthyPods');
      expect(result).toHaveProperty('avgCpu');
      expect(result).toHaveProperty('avgMemory');
    });

    it('should handle zero values correctly', async () => {
      // Arrange
      const mockData = {
        nodes: { ready: 0, total: 0 },
        unhealthyPods: 0,
        avgCpu: 0,
        avgMemory: 0,
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.nodes.ready).toBe(0);
      expect(result.nodes.total).toBe(0);
      expect(result.unhealthyPods).toBe(0);
      expect(result.avgCpu).toBe(0);
      expect(result.avgMemory).toBe(0);
    });

    it('should handle high CPU and memory values', async () => {
      // Arrange
      const mockData = {
        nodes: { ready: 5, total: 5 },
        unhealthyPods: 0,
        avgCpu: 95.7,
        avgMemory: 88.9,
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      // Act
      const result = await fetchOverview();

      // Assert
      expect(result.avgCpu).toBeGreaterThanOrEqual(0);
      expect(result.avgCpu).toBeLessThanOrEqual(100);
      expect(result.avgMemory).toBeGreaterThanOrEqual(0);
      expect(result.avgMemory).toBeLessThanOrEqual(100);
    });
  });

  describe('namespace filtering', () => {
    it('should fetch data for specific namespace', async () => {
      // Arrange
      const mockData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 2,
        avgCpu: 60.0,
        avgMemory: 70.0,
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      // Act
      await fetchOverview('kube-system');

      // Assert
      expect(global.fetch).toHaveBeenCalledWith('/api/overview?namespace=kube-system');
    });

    it('should handle special namespace names', async () => {
      // Arrange
      const mockData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        avgCpu: 0,
        avgMemory: 0,
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      // Act
      await fetchOverview('my-app-prod');

      // Assert
      expect(global.fetch).toHaveBeenCalledWith('/api/overview?namespace=my-app-prod');
    });

    it('should properly encode namespace parameter', async () => {
      // Arrange
      const mockData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        avgCpu: 0,
        avgMemory: 0,
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as Response);

      // Act
      await fetchOverview('test namespace');

      // Assert
      expect(global.fetch).toHaveBeenCalledWith('/api/overview?namespace=test+namespace');
    });
  });
});
