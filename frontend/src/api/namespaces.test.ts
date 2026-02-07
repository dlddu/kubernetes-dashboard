import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchNamespaces } from './namespaces';

// Mock fetch globally with proper typing
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('Namespaces API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch namespaces list from backend', async () => {
    // Arrange
    const mockResponse = {
      items: [
        { name: 'default', status: 'Active' },
        { name: 'kube-system', status: 'Active' },
        { name: 'kube-public', status: 'Active' },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    const result = await fetchNamespaces();

    // Assert
    expect(mockFetch).toHaveBeenCalledWith('/api/namespaces');
    expect(result.items).toHaveLength(3);
    expect(result.items[0]).toEqual({ name: 'default', status: 'Active' });
  });

  it('should return empty array when no namespaces exist', async () => {
    // Arrange
    const mockResponse = {
      items: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    const result = await fetchNamespaces();

    // Assert
    expect(result.items).toEqual([]);
    expect(result.items).toHaveLength(0);
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

  it('should handle malformed JSON response', async () => {
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

  it('should include namespace name and status in response', async () => {
    // Arrange
    const mockResponse = {
      items: [
        { name: 'production', status: 'Active' },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    const result = await fetchNamespaces();

    // Assert
    expect(result.items[0]).toHaveProperty('name');
    expect(result.items[0]).toHaveProperty('status');
    expect(result.items[0].name).toBe('production');
    expect(result.items[0].status).toBe('Active');
  });
});
