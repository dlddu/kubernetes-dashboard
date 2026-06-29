/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigMapAccordion } from './ConfigMapAccordion';

// Mock fetch API
global.fetch = vi.fn();

describe('ConfigMapAccordion Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render accordion item with configmap name', () => {
      // Arrange
      const configMap = {
        name: 'app-config',
        namespace: 'default',
        keys: ['app.properties', 'nginx.conf'],
      };

      // Act
      render(<ConfigMapAccordion configMap={configMap} />);

      // Assert
      expect(screen.getByText('app-config')).toBeInTheDocument();
    });

    it('should render accordion in collapsed state initially', () => {
      // Arrange
      const configMap = {
        name: 'app-config',
        namespace: 'default',
        keys: ['key1'],
      };

      // Act
      render(<ConfigMapAccordion configMap={configMap} isOpen={false} />);

      // Assert: Details should not be visible initially
      const detailsContent = screen.queryByTestId('configmap-details');
      expect(detailsContent).toBeNull();
    });

    it('should display configmap metadata in header', () => {
      // Arrange
      const configMap = {
        name: 'nginx-config',
        namespace: 'production',
        keys: ['nginx.conf'],
      };

      // Act
      render(<ConfigMapAccordion configMap={configMap} />);

      // Assert
      expect(screen.getByText('nginx-config')).toBeInTheDocument();
      expect(screen.getByText('production')).toBeInTheDocument();
    });

    it('should show number of keys in header', () => {
      // Arrange
      const configMap = {
        name: 'multi-key-config',
        namespace: 'default',
        keys: ['key1', 'key2', 'key3'],
      };

      // Act
      render(<ConfigMapAccordion configMap={configMap} />);

      // Assert: Should show "3 keys" or similar
      expect(screen.getByText(/3/)).toBeInTheDocument();
    });

    it('should NOT render a type field in header', () => {
      // Arrange
      const configMap = {
        name: 'app-config',
        namespace: 'default',
        keys: ['key1'],
      };

      // Act
      render(<ConfigMapAccordion configMap={configMap} />);

      // Assert: ConfigMaps have no type field
      expect(screen.queryByTestId('configmap-type')).not.toBeInTheDocument();
    });

    it('should NOT render a delete button', () => {
      // Arrange
      const configMap = {
        name: 'app-config',
        namespace: 'default',
        keys: ['key1'],
      };

      // Act
      render(<ConfigMapAccordion configMap={configMap} />);

      // Assert: ConfigMap viewer is read-only
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });
  });

  describe('API Call on Expand', () => {
    it('should fetch configmap detail when accordion is expanded', async () => {
      // Arrange
      const user = userEvent.setup();
      const configMap = {
        name: 'app-config',
        namespace: 'default',
        keys: ['app.properties'],
      };

      const mockConfigMapDetail = {
        name: 'app-config',
        namespace: 'default',
        data: {
          'app.properties': 'log.level=debug',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMapDetail,
      });

      let isOpen = false;
      const mockOnToggle = vi.fn(() => {
        isOpen = !isOpen;
      });

      // Act
      const { rerender } = render(
        <ConfigMapAccordion configMap={configMap} isOpen={isOpen} onToggle={mockOnToggle} />
      );
      const accordionHeader = screen.getByText('app-config');
      await user.click(accordionHeader);
      rerender(<ConfigMapAccordion configMap={configMap} isOpen={true} onToggle={mockOnToggle} />);

      // Assert: Should call detail API
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/configmaps/default/app-config');
      });
    });

    it('should NOT fetch configmap detail when accordion is collapsed', () => {
      // Arrange
      const configMap = {
        name: 'app-config',
        namespace: 'default',
        keys: ['key1'],
      };

      // Act
      render(<ConfigMapAccordion configMap={configMap} isOpen={false} />);

      // Assert: Should not call API while collapsed
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should display loading state while fetching detail', async () => {
      // Arrange
      const user = userEvent.setup();
      const configMap = {
        name: 'app-config',
        namespace: 'default',
        keys: ['key1'],
      };

      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ name: 'app-config', namespace: 'default', data: {} }),
                }),
              100
            )
          )
      );

      let isOpen = false;
      const mockOnToggle = vi.fn(() => {
        isOpen = !isOpen;
      });

      // Act
      const { rerender } = render(
        <ConfigMapAccordion configMap={configMap} isOpen={isOpen} onToggle={mockOnToggle} />
      );
      const accordionHeader = screen.getByText('app-config');
      await user.click(accordionHeader);
      rerender(<ConfigMapAccordion configMap={configMap} isOpen={true} onToggle={mockOnToggle} />);

      // Assert: Should show loading indicator
      const loadingIndicator =
        screen.queryByTestId('configmap-detail-loading') ||
        screen.queryByText(/loading/i);
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should cache detail data and not refetch on re-expand', async () => {
      // Arrange
      const user = userEvent.setup();
      const configMap = {
        name: 'app-config',
        namespace: 'default',
        keys: ['key1'],
      };

      const mockConfigMapDetail = {
        name: 'app-config',
        namespace: 'default',
        data: { key1: 'value1' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMapDetail,
      });

      let isOpen = false;
      const mockOnToggle = vi.fn(() => {
        isOpen = !isOpen;
      });

      // Act
      const { rerender } = render(
        <ConfigMapAccordion configMap={configMap} isOpen={isOpen} onToggle={mockOnToggle} />
      );
      const accordionHeader = screen.getByText('app-config');

      // First expand
      await user.click(accordionHeader);
      rerender(<ConfigMapAccordion configMap={configMap} isOpen={true} onToggle={mockOnToggle} />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Collapse
      await user.click(accordionHeader);
      rerender(<ConfigMapAccordion configMap={configMap} isOpen={false} onToggle={mockOnToggle} />);

      // Re-expand
      await user.click(accordionHeader);
      rerender(<ConfigMapAccordion configMap={configMap} isOpen={true} onToggle={mockOnToggle} />);

      // Assert: Should not fetch again (cached)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('ConfigMap Detail Display', () => {
    it('should display configmap keys and values inline when expanded', async () => {
      // Arrange
      const user = userEvent.setup();
      const configMap = {
        name: 'app-config',
        namespace: 'default',
        keys: ['app.properties', 'timeout'],
      };

      const mockConfigMapDetail = {
        name: 'app-config',
        namespace: 'default',
        data: {
          'app.properties': 'log.level=debug',
          timeout: '30s',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMapDetail,
      });

      let isOpen = false;
      const mockOnToggle = vi.fn(() => {
        isOpen = !isOpen;
      });

      // Act
      const { rerender } = render(
        <ConfigMapAccordion configMap={configMap} isOpen={isOpen} onToggle={mockOnToggle} />
      );
      const accordionHeader = screen.getByText('app-config');
      await user.click(accordionHeader);
      rerender(<ConfigMapAccordion configMap={configMap} isOpen={true} onToggle={mockOnToggle} />);

      // Assert: Should display keys AND values inline (no masking)
      await waitFor(() => {
        expect(screen.getByText('app.properties')).toBeInTheDocument();
        expect(screen.getByText('timeout')).toBeInTheDocument();
        expect(screen.getByText('log.level=debug')).toBeInTheDocument();
        expect(screen.getByText('30s')).toBeInTheDocument();
      });
    });

    it('should display error message when detail fetch fails', async () => {
      // Arrange
      const user = userEvent.setup();
      const configMap = {
        name: 'app-config',
        namespace: 'default',
        keys: ['key1'],
      };

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      let isOpen = false;
      const mockOnToggle = vi.fn(() => {
        isOpen = !isOpen;
      });

      // Act
      const { rerender } = render(
        <ConfigMapAccordion configMap={configMap} isOpen={isOpen} onToggle={mockOnToggle} />
      );
      const accordionHeader = screen.getByText('app-config');
      await user.click(accordionHeader);
      rerender(<ConfigMapAccordion configMap={configMap} isOpen={true} onToggle={mockOnToggle} />);

      // Assert: Should show error message
      await waitFor(() => {
        const errorMessage =
          screen.queryByTestId('configmap-detail-error') ||
          screen.queryByText(/error/i) ||
          screen.queryByText(/failed/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for accordion', () => {
      // Arrange
      const configMap = {
        name: 'app-config',
        namespace: 'default',
        keys: ['key1'],
      };

      // Act
      render(<ConfigMapAccordion configMap={configMap} />);

      // Assert: Should have accordion button role
      const accordionButton = screen.queryByRole('button', { name: /app-config/i });
      expect(accordionButton).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      // Arrange
      const user = userEvent.setup();
      const configMap = {
        name: 'app-config',
        namespace: 'default',
        keys: ['key1'],
      };

      const mockConfigMapDetail = {
        name: 'app-config',
        namespace: 'default',
        data: { key1: 'value1' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigMapDetail,
      });

      let isOpen = false;
      const mockOnToggle = vi.fn(() => {
        isOpen = !isOpen;
      });

      // Act
      const { rerender } = render(
        <ConfigMapAccordion configMap={configMap} isOpen={isOpen} onToggle={mockOnToggle} />
      );
      const accordionButton = screen.getByRole('button', { name: /app-config/i });

      accordionButton.focus();
      await user.keyboard('{Enter}');
      rerender(<ConfigMapAccordion configMap={configMap} isOpen={true} onToggle={mockOnToggle} />);

      // Assert: Should expand on Enter key
      await waitFor(() => {
        expect(screen.queryByTestId('configmap-details')).toBeVisible();
      });
    });
  });
});
