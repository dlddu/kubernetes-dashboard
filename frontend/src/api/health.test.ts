import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchHealth } from './health';

// Mock fetch globally
globalThis.fetch = vi.fn();

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

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    const result = await fetchHealth();

    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/health');
    expect(result.status).toBe('ok');
    expect(result.message).toBeDefined();
  });

  it('should handle network errors gracefully', async () => {
    // Arrange
    (globalThis.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    // Act & Assert
    await expect(fetchHealth()).rejects.toThrow('Network error');
  });

  it('should handle non-200 responses', async () => {
    // Arrange
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    // Act & Assert
    await expect(fetchHealth()).rejects.toThrow();
  });
});
