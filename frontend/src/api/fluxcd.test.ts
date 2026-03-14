import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchKustomizations } from './fluxcd';

// Mock fetch globally with proper typing
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('FluxCD API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchKustomizations - happy path', () => {
    it('should call correct URL without namespace', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      await fetchKustomizations();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/fluxcd/kustomizations');
    });

    it('should call correct URL with namespace parameter', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      await fetchKustomizations('default');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/fluxcd/kustomizations?ns=default');
    });

    it('should return array of KustomizationInfo', async () => {
      // Arrange
      const mockKustomizations = [
        {
          name: 'flux-system',
          namespace: 'flux-system',
          ready: true,
          suspended: false,
          sourceKind: 'GitRepository',
          sourceName: 'flux-system',
          revision: 'main@sha1:abc1234',
          interval: '1m0s',
          lastApplied: '2026-03-14T10:00:00Z',
          path: './clusters/my-cluster',
        },
        {
          name: 'apps',
          namespace: 'flux-system',
          ready: false,
          suspended: true,
          sourceKind: 'GitRepository',
          sourceName: 'apps-repo',
          revision: 'main@sha1:def5678',
          interval: '5m0s',
          lastApplied: '2026-03-14T09:00:00Z',
          path: './apps',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockKustomizations,
      });

      // Act
      const result = await fetchKustomizations();

      // Assert
      expect(result).toEqual(mockKustomizations);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no kustomizations exist', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      const result = await fetchKustomizations();

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should not include ns query param when namespace is undefined', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      await fetchKustomizations(undefined);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/fluxcd/kustomizations');
    });

    it('should not include ns query param when namespace is empty string', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      await fetchKustomizations('');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/fluxcd/kustomizations');
    });
  });

  describe('KustomizationInfo interface should have required fields', () => {
    it('should return type-safe KustomizationInfo objects', async () => {
      // Arrange
      const mockKustomization = {
        name: 'flux-system',
        namespace: 'flux-system',
        ready: true,
        suspended: false,
        sourceKind: 'GitRepository',
        sourceName: 'flux-system',
        revision: 'main@sha1:abc1234',
        interval: '1m0s',
        lastApplied: '2026-03-14T10:00:00Z',
        path: './clusters/my-cluster',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockKustomization],
      });

      // Act
      const result = await fetchKustomizations();

      // Assert - TypeScript compile-time field checks
      const item = result[0];
      const name: string = item.name;
      const namespace: string = item.namespace;
      const ready: boolean = item.ready;
      const suspended: boolean = item.suspended;
      const sourceKind: string = item.sourceKind;
      const sourceName: string = item.sourceName;
      const revision: string = item.revision;
      const interval: string = item.interval;
      const lastApplied: string = item.lastApplied;
      const path: string = item.path;

      expect(name).toBe('flux-system');
      expect(namespace).toBe('flux-system');
      expect(ready).toBe(true);
      expect(suspended).toBe(false);
      expect(sourceKind).toBe('GitRepository');
      expect(sourceName).toBe('flux-system');
      expect(revision).toBe('main@sha1:abc1234');
      expect(interval).toBe('1m0s');
      expect(lastApplied).toBe('2026-03-14T10:00:00Z');
      expect(path).toBe('./clusters/my-cluster');
    });

    it('should handle kustomization with suspended=true', async () => {
      // Arrange
      const mockKustomization = {
        name: 'paused-app',
        namespace: 'production',
        ready: false,
        suspended: true,
        sourceKind: 'GitRepository',
        sourceName: 'apps-repo',
        revision: '',
        interval: '10m0s',
        lastApplied: '',
        path: './apps/paused',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockKustomization],
      });

      // Act
      const result = await fetchKustomizations();

      // Assert
      expect(result[0].suspended).toBe(true);
      expect(result[0].ready).toBe(false);
    });
  });

  describe('fetchKustomizations - error cases', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(fetchKustomizations()).rejects.toThrow('Network error');
    });

    it('should handle non-200 responses', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Act & Assert
      await expect(fetchKustomizations()).rejects.toThrow();
    });

    it('should handle 403 forbidden', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      // Act & Assert
      await expect(fetchKustomizations()).rejects.toThrow();
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
      await expect(fetchKustomizations()).rejects.toThrow('Invalid JSON');
    });
  });
});
