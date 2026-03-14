import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Import the function under test — this will fail until the function is implemented
// (TDD Red Phase: tests fail before implementation exists)
import { reconcileKustomization } from './fluxcd';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('reconcileKustomization API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('happy path', () => {
    it('should call POST /api/fluxcd/kustomizations/{namespace}/{name}/reconcile', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Reconciliation triggered' }),
      });

      // Act
      await reconcileKustomization('flux-system', 'flux-system');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/fluxcd/kustomizations/flux-system/flux-system/reconcile',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should call correct URL with different namespace and name', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Reconciliation triggered' }),
      });

      // Act
      await reconcileKustomization('production', 'my-kustomization');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/fluxcd/kustomizations/production/my-kustomization/reconcile',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should resolve without a value on success (returns Promise<void>)', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Reconciliation triggered' }),
      });

      // Act
      const result = await reconcileKustomization('flux-system', 'flux-system');

      // Assert: Promise<void> resolves to undefined
      expect(result).toBeUndefined();
    });
  });

  describe('error cases', () => {
    it('should throw error on non-ok response', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Kustomization not found' }),
      });

      // Act & Assert
      await expect(reconcileKustomization('default', 'missing')).rejects.toThrow();
    });

    it('should throw error on 500 internal server error', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Failed to reconcile kustomization' }),
      });

      // Act & Assert
      await expect(
        reconcileKustomization('flux-system', 'flux-system')
      ).rejects.toThrow();
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
      await expect(reconcileKustomization('default', 'missing')).rejects.toThrow(
        'Kustomization not found'
      );
    });

    it('should throw on network error', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(
        reconcileKustomization('flux-system', 'flux-system')
      ).rejects.toThrow('Network error');
    });
  });
});
