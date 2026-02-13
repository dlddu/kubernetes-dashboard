import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSecrets, fetchSecretDetail } from './secrets';

// Mock fetch globally with proper typing
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('Secrets API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchSecrets - happy path', () => {
    it('should fetch secrets list from backend', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'my-secret',
          namespace: 'default',
          type: 'Opaque',
          keys: ['username', 'password'],
        },
        {
          name: 'tls-secret',
          namespace: 'default',
          type: 'kubernetes.io/tls',
          keys: ['tls.crt', 'tls.key'],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      const result = await fetchSecrets();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/secrets');
      expect(result).toEqual(mockSecrets);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should fetch secrets with namespace filter', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'secret-1',
          namespace: 'kube-system',
          type: 'Opaque',
          keys: ['key1'],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      const result = await fetchSecrets('kube-system');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/secrets?ns=kube-system');
      expect(result).toEqual(mockSecrets);
    });

    it('should return array of secret info objects', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'test-secret',
          namespace: 'default',
          type: 'Opaque',
          keys: ['api-key', 'token'],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      const result = await fetchSecrets();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-secret');
      expect(result[0].namespace).toBe('default');
      expect(result[0].type).toBe('Opaque');
      expect(result[0].keys).toEqual(['api-key', 'token']);
    });

    it('should handle empty secrets list', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      const result = await fetchSecrets();

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should NOT include secret values in list response', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'my-secret',
          namespace: 'default',
          type: 'Opaque',
          keys: ['username', 'password'],
          // data field should NOT be present
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      const result = await fetchSecrets();

      // Assert
      expect(result[0]).not.toHaveProperty('data');
      expect(result[0]).not.toHaveProperty('value');
      expect(result[0]).toHaveProperty('keys');
    });
  });

  describe('fetchSecrets - error cases', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(fetchSecrets()).rejects.toThrow('Network error');
    });

    it('should handle non-200 responses', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Act & Assert
      await expect(fetchSecrets()).rejects.toThrow();
    });

    it('should handle 404 not found', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      // Act & Assert
      await expect(fetchSecrets()).rejects.toThrow();
    });

    it('should handle 403 forbidden', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      // Act & Assert
      await expect(fetchSecrets()).rejects.toThrow();
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
      await expect(fetchSecrets()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('fetchSecrets - edge cases', () => {
    it('should handle very long secrets list', async () => {
      // Arrange
      const mockSecrets = Array.from({ length: 100 }, (_, i) => ({
        name: `secret-${i}`,
        namespace: 'default',
        type: 'Opaque',
        keys: [`key-${i}`],
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      const result = await fetchSecrets();

      // Assert
      expect(result).toHaveLength(100);
      expect(result[0].name).toBe('secret-0');
      expect(result[99].name).toBe('secret-99');
    });

    it('should handle secrets with multiple keys', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'multi-key-secret',
          namespace: 'default',
          type: 'Opaque',
          keys: ['key1', 'key2', 'key3', 'key4', 'key5'],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      const result = await fetchSecrets();

      // Assert
      expect(result[0].keys).toHaveLength(5);
      expect(result[0].keys).toEqual(['key1', 'key2', 'key3', 'key4', 'key5']);
    });

    it('should handle different secret types', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'opaque-secret',
          namespace: 'default',
          type: 'Opaque',
          keys: ['data'],
        },
        {
          name: 'tls-secret',
          namespace: 'default',
          type: 'kubernetes.io/tls',
          keys: ['tls.crt', 'tls.key'],
        },
        {
          name: 'dockercfg-secret',
          namespace: 'default',
          type: 'kubernetes.io/dockerconfigjson',
          keys: ['.dockerconfigjson'],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      const result = await fetchSecrets();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].type).toBe('Opaque');
      expect(result[1].type).toBe('kubernetes.io/tls');
      expect(result[2].type).toBe('kubernetes.io/dockerconfigjson');
    });
  });

  describe('fetchSecretDetail - happy path', () => {
    it('should fetch secret detail from backend', async () => {
      // Arrange
      const mockSecretDetail = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        data: {
          username: 'admin',
          password: 'secretpassword',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecretDetail,
      });

      // Act
      const result = await fetchSecretDetail('default', 'my-secret');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/secrets/default/my-secret');
      expect(result).toEqual(mockSecretDetail);
    });

    it('should include decoded data values', async () => {
      // Arrange
      const mockSecretDetail = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        data: {
          'api-key': 'abc123xyz',
          token: 'token-value',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecretDetail,
      });

      // Act
      const result = await fetchSecretDetail('default', 'my-secret');

      // Assert
      expect(result.data).toBeDefined();
      expect(result.data['api-key']).toBe('abc123xyz');
      expect(result.data.token).toBe('token-value');
    });

    it('should handle secrets with TLS data', async () => {
      // Arrange
      const mockSecretDetail = {
        name: 'tls-secret',
        namespace: 'default',
        type: 'kubernetes.io/tls',
        data: {
          'tls.crt': '-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----',
          'tls.key': '-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecretDetail,
      });

      // Act
      const result = await fetchSecretDetail('default', 'tls-secret');

      // Assert
      expect(result.type).toBe('kubernetes.io/tls');
      expect(result.data['tls.crt']).toContain('BEGIN CERTIFICATE');
      expect(result.data['tls.key']).toContain('BEGIN PRIVATE KEY');
    });

    it('should handle empty data field', async () => {
      // Arrange
      const mockSecretDetail = {
        name: 'empty-secret',
        namespace: 'default',
        type: 'Opaque',
        data: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecretDetail,
      });

      // Act
      const result = await fetchSecretDetail('default', 'empty-secret');

      // Assert
      expect(result.data).toEqual({});
      expect(Object.keys(result.data)).toHaveLength(0);
    });
  });

  describe('fetchSecretDetail - error cases', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(fetchSecretDetail('default', 'my-secret')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle 404 for non-existent secret', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      // Act & Assert
      await expect(
        fetchSecretDetail('default', 'non-existent')
      ).rejects.toThrow();
    });

    it('should handle 403 forbidden', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      // Act & Assert
      await expect(fetchSecretDetail('default', 'secret')).rejects.toThrow();
    });

    it('should handle 500 internal server error', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Act & Assert
      await expect(fetchSecretDetail('default', 'secret')).rejects.toThrow();
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
      await expect(fetchSecretDetail('default', 'secret')).rejects.toThrow(
        'Invalid JSON'
      );
    });
  });

  describe('fetchSecretDetail - parameter validation', () => {
    it('should construct correct URL with namespace and name', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'test', namespace: 'prod', type: 'Opaque', data: {} }),
      });

      // Act
      await fetchSecretDetail('prod', 'test-secret');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/secrets/prod/test-secret');
    });

    it('should handle namespace with hyphens', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'test', namespace: 'my-app-prod', type: 'Opaque', data: {} }),
      });

      // Act
      await fetchSecretDetail('my-app-prod', 'secret');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/secrets/my-app-prod/secret');
    });

    it('should handle secret name with hyphens', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'my-secret-name', namespace: 'default', type: 'Opaque', data: {} }),
      });

      // Act
      await fetchSecretDetail('default', 'my-secret-name');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/secrets/default/my-secret-name');
    });
  });

  describe('fetchSecretDetail - type safety', () => {
    it('should return type-safe secret detail object', async () => {
      // Arrange
      const mockSecretDetail = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        data: {
          key1: 'value1',
          key2: 'value2',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecretDetail,
      });

      // Act
      const result = await fetchSecretDetail('default', 'my-secret');

      // Assert - TypeScript compile-time check
      const name: string = result.name;
      const namespace: string = result.namespace;
      const type: string = result.type;
      const data: Record<string, string> = result.data;

      expect(name).toBe('my-secret');
      expect(namespace).toBe('default');
      expect(type).toBe('Opaque');
      expect(data).toBeDefined();
    });
  });
});
