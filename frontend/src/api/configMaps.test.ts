import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchConfigMaps, fetchConfigMapDetail } from './configMaps';

// Mock fetch globally with proper typing
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('ConfigMaps API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchConfigMaps - happy path', () => {
    it('should fetch configmaps list from backend', async () => {
      // Arrange
      const mockConfigMaps = [
        {
          name: 'app-config',
          namespace: 'default',
          keys: ['app.properties', 'nginx.conf'],
        },
        {
          name: 'feature-flags',
          namespace: 'default',
          keys: ['flags.json'],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMaps,
      });

      // Act
      const result = await fetchConfigMaps();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/configmaps');
      expect(result).toEqual(mockConfigMaps);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should fetch configmaps with namespace filter', async () => {
      // Arrange
      const mockConfigMaps = [
        {
          name: 'config-1',
          namespace: 'kube-system',
          keys: ['key1'],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMaps,
      });

      // Act
      const result = await fetchConfigMaps('kube-system');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/configmaps?ns=kube-system');
      expect(result).toEqual(mockConfigMaps);
    });

    it('should return array of configmap info objects', async () => {
      // Arrange
      const mockConfigMaps = [
        {
          name: 'test-config',
          namespace: 'default',
          keys: ['app.properties', 'nginx.conf'],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMaps,
      });

      // Act
      const result = await fetchConfigMaps();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-config');
      expect(result[0].namespace).toBe('default');
      expect(result[0].keys).toEqual(['app.properties', 'nginx.conf']);
    });

    it('should handle empty configmaps list', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      const result = await fetchConfigMaps();

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should NOT include configmap values in list response', async () => {
      // Arrange
      const mockConfigMaps = [
        {
          name: 'app-config',
          namespace: 'default',
          keys: ['app.properties'],
          // data field should NOT be present
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMaps,
      });

      // Act
      const result = await fetchConfigMaps();

      // Assert
      expect(result[0]).not.toHaveProperty('data');
      expect(result[0]).toHaveProperty('keys');
    });
  });

  describe('fetchConfigMaps - error cases', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(fetchConfigMaps()).rejects.toThrow('Network error');
    });

    it('should handle non-200 responses', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Act & Assert
      await expect(fetchConfigMaps()).rejects.toThrow();
    });

    it('should handle 403 forbidden', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      // Act & Assert
      await expect(fetchConfigMaps()).rejects.toThrow();
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
      await expect(fetchConfigMaps()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('fetchConfigMaps - edge cases', () => {
    it('should handle very long configmaps list', async () => {
      // Arrange
      const mockConfigMaps = Array.from({ length: 100 }, (_, i) => ({
        name: `config-${i}`,
        namespace: 'default',
        keys: [`key-${i}`],
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMaps,
      });

      // Act
      const result = await fetchConfigMaps();

      // Assert
      expect(result).toHaveLength(100);
      expect(result[0].name).toBe('config-0');
      expect(result[99].name).toBe('config-99');
    });

    it('should handle configmaps with multiple keys', async () => {
      // Arrange
      const mockConfigMaps = [
        {
          name: 'multi-key-config',
          namespace: 'default',
          keys: ['key1', 'key2', 'key3', 'key4', 'key5'],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMaps,
      });

      // Act
      const result = await fetchConfigMaps();

      // Assert
      expect(result[0].keys).toHaveLength(5);
      expect(result[0].keys).toEqual(['key1', 'key2', 'key3', 'key4', 'key5']);
    });
  });

  describe('fetchConfigMapDetail - happy path', () => {
    it('should fetch configmap detail from backend', async () => {
      // Arrange
      const mockConfigMapDetail = {
        name: 'app-config',
        namespace: 'default',
        data: {
          'app.properties': 'log.level=debug',
          'nginx.conf': 'server { listen 80; }',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMapDetail,
      });

      // Act
      const result = await fetchConfigMapDetail('default', 'app-config');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/configmaps/default/app-config');
      expect(result).toEqual(mockConfigMapDetail);
    });

    it('should include data values', async () => {
      // Arrange
      const mockConfigMapDetail = {
        name: 'app-config',
        namespace: 'default',
        data: {
          'timeout': '30s',
          'retries': '3',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMapDetail,
      });

      // Act
      const result = await fetchConfigMapDetail('default', 'app-config');

      // Assert
      expect(result.data).toBeDefined();
      expect(result.data['timeout']).toBe('30s');
      expect(result.data['retries']).toBe('3');
    });

    it('should handle multiline values', async () => {
      // Arrange
      const mockConfigMapDetail = {
        name: 'nginx-config',
        namespace: 'default',
        data: {
          'nginx.conf': 'server {\n  listen 80;\n  server_name localhost;\n}',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMapDetail,
      });

      // Act
      const result = await fetchConfigMapDetail('default', 'nginx-config');

      // Assert
      expect(result.data['nginx.conf']).toContain('listen 80');
    });

    it('should handle empty data field', async () => {
      // Arrange
      const mockConfigMapDetail = {
        name: 'empty-config',
        namespace: 'default',
        data: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMapDetail,
      });

      // Act
      const result = await fetchConfigMapDetail('default', 'empty-config');

      // Assert
      expect(result.data).toEqual({});
      expect(Object.keys(result.data)).toHaveLength(0);
    });
  });

  describe('fetchConfigMapDetail - error cases', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(fetchConfigMapDetail('default', 'app-config')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle 404 for non-existent configmap', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      // Act & Assert
      await expect(
        fetchConfigMapDetail('default', 'non-existent')
      ).rejects.toThrow();
    });

    it('should handle 500 internal server error', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Act & Assert
      await expect(fetchConfigMapDetail('default', 'config')).rejects.toThrow();
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
      await expect(fetchConfigMapDetail('default', 'config')).rejects.toThrow(
        'Invalid JSON'
      );
    });
  });

  describe('fetchConfigMapDetail - parameter validation', () => {
    it('should construct correct URL with namespace and name', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'test', namespace: 'prod', data: {} }),
      });

      // Act
      await fetchConfigMapDetail('prod', 'test-config');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/configmaps/prod/test-config');
    });

    it('should handle namespace with hyphens', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'test', namespace: 'my-app-prod', data: {} }),
      });

      // Act
      await fetchConfigMapDetail('my-app-prod', 'config');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/configmaps/my-app-prod/config');
    });
  });

  describe('fetchConfigMapDetail - type safety', () => {
    it('should return type-safe configmap detail object', async () => {
      // Arrange
      const mockConfigMapDetail = {
        name: 'app-config',
        namespace: 'default',
        data: {
          key1: 'value1',
          key2: 'value2',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMapDetail,
      });

      // Act
      const result = await fetchConfigMapDetail('default', 'app-config');

      // Assert - TypeScript compile-time check
      const name: string = result.name;
      const namespace: string = result.namespace;
      const data: Record<string, string> = result.data;

      expect(name).toBe('app-config');
      expect(namespace).toBe('default');
      expect(data).toBeDefined();
    });
  });
});
