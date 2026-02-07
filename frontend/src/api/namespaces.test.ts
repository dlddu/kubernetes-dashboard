import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchNamespaces } from './namespaces';

// Mock fetch globally with proper typing
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('Namespaces API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch namespaces from backend', async () => {
    // Arrange
    const mockResponse = {
      namespaces: ['default', 'kube-system', 'kube-public'],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    const result = await fetchNamespaces();

    // Assert
    expect(mockFetch).toHaveBeenCalledWith('/api/namespaces');
    expect(result.namespaces).toEqual(['default', 'kube-system', 'kube-public']);
    expect(Array.isArray(result.namespaces)).toBe(true);
  });

  it('should handle empty namespace list', async () => {
    // Arrange
    const mockResponse = {
      namespaces: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    const result = await fetchNamespaces();

    // Assert
    expect(result.namespaces).toEqual([]);
    expect(Array.isArray(result.namespaces)).toBe(true);
  });

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

  it('should handle 404 responses', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    // Act & Assert
    await expect(fetchNamespaces()).rejects.toThrow();
  });

  it('should handle malformed JSON responses', async () => {
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

  it('should return namespaces in the order received from backend', async () => {
    // Arrange
    const mockResponse = {
      namespaces: ['zebra', 'alpha', 'beta'],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    const result = await fetchNamespaces();

    // Assert
    expect(result.namespaces).toEqual(['zebra', 'alpha', 'beta']);
  });
});
