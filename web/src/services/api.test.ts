/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkHealth } from './api';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkHealth', () => {
    it('should call /api/health endpoint', async () => {
      // Arrange
      const mockResponse = {
        status: 'healthy',
      };

      (mockFetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await checkHealth();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/health');
      expect(result).toEqual(mockResponse);
    });

    it('should return healthy status when API responds successfully', async () => {
      // Arrange
      const mockResponse = {
        status: 'healthy',
      };

      (mockFetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await checkHealth();

      // Assert
      expect(result.status).toBe('healthy');
    });

    it('should throw error when API request fails', async () => {
      // Arrange
      (mockFetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Act & Assert
      await expect(checkHealth()).rejects.toThrow();
    });

    it('should throw error when network request fails', async () => {
      // Arrange
      (mockFetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(checkHealth()).rejects.toThrow('Network error');
    });

    it('should parse JSON response correctly', async () => {
      // Arrange
      const mockResponse = {
        status: 'healthy',
        timestamp: '2026-02-06T00:00:00Z',
      };

      (mockFetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await checkHealth();

      // Assert
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
    });
  });
});
