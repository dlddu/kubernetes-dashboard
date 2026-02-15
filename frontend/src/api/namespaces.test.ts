import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchNamespaces } from './namespaces';

// Mock fetch globally with proper typing
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('Namespaces API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchNamespaces - happy path', () => {
    it('should fetch namespace list from backend', async () => {
      // Arrange
      const mockNamespaces = ['default', 'kube-system', 'kube-public'];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNamespaces,
      });

      // Act
      const result = await fetchNamespaces();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/namespaces', undefined);
      expect(result).toEqual(mockNamespaces);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return array of namespace strings', async () => {
      // Arrange
      const mockNamespaces = ['default', 'production', 'staging'];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNamespaces,
      });

      // Act
      const result = await fetchNamespaces();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('default');
      expect(result[1]).toBe('production');
      expect(result[2]).toBe('staging');
    });

    it('should handle empty namespace list', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      const result = await fetchNamespaces();

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('fetchNamespaces - error cases', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(fetchNamespaces()).rejects.toThrow('Network error');
    });

    it('should handle non-200 responses', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Act & Assert
      await expect(fetchNamespaces()).rejects.toThrow();
    });

    it('should handle 404 not found', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      // Act & Assert
      await expect(fetchNamespaces()).rejects.toThrow();
    });

    it('should handle 403 forbidden', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      // Act & Assert
      await expect(fetchNamespaces()).rejects.toThrow();
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
      await expect(fetchNamespaces()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('fetchNamespaces - edge cases', () => {
    it('should handle very long namespace list', async () => {
      // Arrange
      const mockNamespaces = Array.from({ length: 100 }, (_, i) => `namespace-${i}`);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNamespaces,
      });

      // Act
      const result = await fetchNamespaces();

      // Assert
      expect(result).toHaveLength(100);
      expect(result[0]).toBe('namespace-0');
      expect(result[99]).toBe('namespace-99');
    });

    it('should handle namespace names with special characters', async () => {
      // Arrange
      const mockNamespaces = ['my-app-prod', 'test_env', 'dev.local'];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNamespaces,
      });

      // Act
      const result = await fetchNamespaces();

      // Assert
      expect(result).toEqual(mockNamespaces);
      expect(result).toContain('my-app-prod');
      expect(result).toContain('test_env');
      expect(result).toContain('dev.local');
    });

    it('should handle timeout scenarios', async () => {
      // Arrange
      mockFetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      });

      // Act & Assert
      await expect(fetchNamespaces()).rejects.toThrow('Request timeout');
    });
  });

  describe('fetchNamespaces - type safety', () => {
    it('should return type-safe namespace array', async () => {
      // Arrange
      const mockNamespaces = ['default', 'kube-system'];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNamespaces,
      });

      // Act
      const result = await fetchNamespaces();

      // Assert - TypeScript compile-time check
      const firstNamespace: string = result[0];
      expect(firstNamespace).toBe('default');
    });
  });
});
