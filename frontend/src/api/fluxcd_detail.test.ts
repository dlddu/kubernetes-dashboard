import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Import the function under test — this will fail until the function is implemented
// (TDD Red Phase: tests fail before implementation exists)
import { fetchKustomizationDetail } from './fluxcd';

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const mockKustomizationDetail = {
  name: 'flux-system',
  namespace: 'flux-system',
  suspended: false,
  spec: {
    interval: '1m0s',
    path: './clusters/my-cluster',
    prune: true,
    sourceRef: {
      kind: 'GitRepository',
      name: 'flux-system',
      namespace: 'flux-system',
    },
    dependsOn: [],
  },
  status: {
    lastAppliedRevision: 'main@sha1:abc1234567890abcdef',
    conditions: [
      {
        type: 'Ready',
        status: 'True',
        reason: 'ReconciliationSucceeded',
        message: 'Applied revision: main@sha1:abc1234567890abcdef',
        lastTransitionTime: '2026-03-14T10:00:00Z',
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('fetchKustomizationDetail API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('happy path', () => {
    it('should call correct URL with namespace and name', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockKustomizationDetail,
      });

      // Act
      await fetchKustomizationDetail('flux-system', 'flux-system');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/fluxcd/kustomizations/flux-system/flux-system'
      );
    });

    it('should call correct URL with different namespace and name', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockKustomizationDetail,
      });

      // Act
      await fetchKustomizationDetail('production', 'my-kustomization');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/fluxcd/kustomizations/production/my-kustomization'
      );
    });

    it('should return KustomizationDetailInfo on success', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockKustomizationDetail,
      });

      // Act
      const result = await fetchKustomizationDetail('flux-system', 'flux-system');

      // Assert
      expect(result).toEqual(mockKustomizationDetail);
    });

    it('should return object with name and namespace fields', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockKustomizationDetail,
      });

      // Act
      const result = await fetchKustomizationDetail('flux-system', 'flux-system');

      // Assert
      expect(result.name).toBe('flux-system');
      expect(result.namespace).toBe('flux-system');
    });

    it('should return object with spec sub-object', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockKustomizationDetail,
      });

      // Act
      const result = await fetchKustomizationDetail('flux-system', 'flux-system');

      // Assert
      expect(result.spec).toBeDefined();
      expect(result.spec.path).toBe('./clusters/my-cluster');
      expect(result.spec.interval).toBe('1m0s');
      expect(result.spec.prune).toBe(true);
      expect(result.spec.sourceRef.kind).toBe('GitRepository');
    });

    it('should return object with status sub-object', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockKustomizationDetail,
      });

      // Act
      const result = await fetchKustomizationDetail('flux-system', 'flux-system');

      // Assert
      expect(result.status).toBeDefined();
      expect(result.status.lastAppliedRevision).toBe('main@sha1:abc1234567890abcdef');
      expect(Array.isArray(result.status.conditions)).toBe(true);
    });

    it('should return suspended boolean field', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockKustomizationDetail, suspended: true }),
      });

      // Act
      const result = await fetchKustomizationDetail('flux-system', 'flux-system');

      // Assert
      expect(result.suspended).toBe(true);
    });

    it('should include hyphened namespace and name in URL without encoding', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockKustomizationDetail,
      });

      // Act
      await fetchKustomizationDetail('my-namespace', 'my-kustomization-abc12');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/fluxcd/kustomizations/my-namespace/my-kustomization-abc12'
      );
    });
  });

  describe('error cases', () => {
    it('should throw on 404 not found response', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Kustomization not found' }),
      });

      // Act & Assert
      await expect(fetchKustomizationDetail('default', 'missing')).rejects.toThrow();
    });

    it('should throw on 500 internal server error', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Failed to fetch kustomization' }),
      });

      // Act & Assert
      await expect(fetchKustomizationDetail('flux-system', 'flux-system')).rejects.toThrow();
    });

    it('should throw on network error', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(
        fetchKustomizationDetail('flux-system', 'flux-system')
      ).rejects.toThrow('Network error');
    });

    it('should throw on invalid JSON response', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      // Act & Assert
      await expect(
        fetchKustomizationDetail('flux-system', 'flux-system')
      ).rejects.toThrow('Invalid JSON');
    });

    it('should propagate server error message on non-ok response', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Kustomization not found' }),
      });

      // Act & Assert
      await expect(fetchKustomizationDetail('default', 'missing')).rejects.toThrow(
        'Kustomization not found'
      );
    });
  });
});
