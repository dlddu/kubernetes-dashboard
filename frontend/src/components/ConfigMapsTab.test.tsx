/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ConfigMapsTab } from './ConfigMapsTab';

// Mock usePolling to avoid timer side effects in tests
vi.mock('../hooks/usePolling', () => ({
  usePolling: vi.fn(() => ({
    refresh: vi.fn(),
    lastUpdate: new Date(),
    isLoading: false,
  })),
}));

// Mock fetch API
global.fetch = vi.fn();

describe('ConfigMapsTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render configmaps tab container', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ConfigMapsTab />);

      // Assert
      const configMapsTab = screen.getByTestId('configmaps-tab');
      expect(configMapsTab).toBeInTheDocument();
    });

    it('should display page heading', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ConfigMapsTab />);

      // Assert
      const heading = screen.getByRole('heading', { name: 'ConfigMaps', level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should not display its own namespace selector', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ConfigMapsTab />);

      // Assert
      const namespaceSelector = screen.queryByTestId('namespace-selector');
      expect(namespaceSelector).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator while fetching data', () => {
      // Arrange: Mock a delayed response
      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: async () => [] }), 100)
          )
      );

      // Act
      render(<ConfigMapsTab />);

      // Assert
      const loadingIndicator =
        screen.queryByTestId('configmaps-loading') ||
        screen.queryByLabelText(/loading/i) ||
        screen.queryByText(/loading/i);

      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should hide loading indicator after data is loaded', async () => {
      // Arrange
      const mockConfigMaps = [
        {
          name: 'test-config',
          namespace: 'default',
          keys: ['app.properties', 'nginx.conf'],
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMaps,
      });

      // Act
      render(<ConfigMapsTab />);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText('test-config')).toBeInTheDocument();
      });

      const loadingIndicator = screen.queryByTestId('configmaps-loading');
      expect(loadingIndicator).not.toBeInTheDocument();
    });
  });

  describe('Success State - ConfigMaps List Rendering', () => {
    it('should render configmaps list when data is loaded', async () => {
      // Arrange
      const mockConfigMaps = [
        {
          name: 'config-1',
          namespace: 'default',
          keys: ['key1'],
        },
        {
          name: 'config-2',
          namespace: 'kube-system',
          keys: ['nginx.conf'],
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMaps,
      });

      // Act
      render(<ConfigMapsTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('config-1')).toBeInTheDocument();
        expect(screen.getByText('config-2')).toBeInTheDocument();
      });
    });

    it('should display configmap name', async () => {
      // Arrange
      const mockConfigMaps = [
        {
          name: 'my-app-config',
          namespace: 'default',
          keys: ['app.properties'],
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMaps,
      });

      // Act
      render(<ConfigMapsTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('my-app-config')).toBeInTheDocument();
      });
    });

    it('should display configmap namespace', async () => {
      // Arrange
      const mockConfigMaps = [
        {
          name: 'test-config',
          namespace: 'production',
          keys: ['data'],
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMaps,
      });

      // Act
      render(<ConfigMapsTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('production')).toBeInTheDocument();
      });
    });

    it('should display number of keys', async () => {
      // Arrange
      const mockConfigMaps = [
        {
          name: 'multi-key-config',
          namespace: 'default',
          keys: ['key1', 'key2', 'key3'],
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMaps,
      });

      // Act
      render(<ConfigMapsTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/3/)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no configmaps exist', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ConfigMapsTab />);

      // Assert
      await waitFor(() => {
        const emptyMessage =
          screen.queryByTestId('no-configmaps-message') ||
          screen.queryByText(/no configmaps found/i);
        expect(emptyMessage).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when API call fails', async () => {
      // Arrange
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<ConfigMapsTab />);

      // Assert
      await waitFor(() => {
        const errorMessage =
          screen.queryByTestId('configmaps-error') ||
          screen.queryByText(/error/i) ||
          screen.queryByText(/failed/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      // Arrange
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<ConfigMapsTab />);

      // Assert
      await waitFor(() => {
        const retryButton =
          screen.queryByTestId('retry-button') ||
          screen.queryByRole('button', { name: /retry|try again/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('should handle HTTP error responses', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      // Act
      render(<ConfigMapsTab />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.queryByTestId('configmaps-error');
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('Namespace Filtering', () => {
    it('should fetch configmaps without namespace filter by default', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ConfigMapsTab />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/configmaps');
      });
    });

    it('should support namespace filtering via props', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ConfigMapsTab namespace="kube-system" />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/configmaps?ns=kube-system');
      });
    });

    it('should refetch configmaps when namespace prop changes', async () => {
      // Arrange
      const mockConfigMaps = [
        {
          name: 'config-1',
          namespace: 'default',
          keys: ['key1'],
        },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockConfigMaps,
        });

      // Act
      const { rerender } = render(<ConfigMapsTab />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/configmaps');
      });

      rerender(<ConfigMapsTab namespace="default" />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/configmaps?ns=default');
      });
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with proper heading', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<ConfigMapsTab />);

      // Assert
      const configMapsTab = screen.getByTestId('configmaps-tab');
      expect(configMapsTab).toBeInTheDocument();

      const heading = screen.getByRole('heading', { name: 'ConfigMaps', level: 1 });
      expect(heading).toBeInTheDocument();
    });
  });
});
