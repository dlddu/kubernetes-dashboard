import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchHealth } from './health';

// Mock fetch globally with proper typing
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('Health API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch health status from backend', async () => {
    // Arrange
    const mockResponse = {
      status: 'ok',
      message: 'Backend is healthy',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    const result = await fetchHealth();

    // Assert
    expect(mockFetch).toHaveBeenCalledWith('/api/health');
    expect(result.status).toBe('ok');
    expect(result.message).toBeDefined();
  });

  it('should handle network errors gracefully', async () => {
    // Arrange
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    // Act & Assert
    await expect(fetchHealth()).rejects.toThrow('Network error');
  });

  it('should handle non-200 responses', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    // Act & Assert
    await expect(fetchHealth()).rejects.toThrow();
  });
});
