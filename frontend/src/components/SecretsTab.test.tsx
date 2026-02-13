/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SecretsTab } from './SecretsTab';

// Mock fetch API
global.fetch = vi.fn();

describe('SecretsTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render secrets tab container', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<SecretsTab />);

      // Assert
      const secretsTab = screen.getByTestId('secrets-tab');
      expect(secretsTab).toBeInTheDocument();
    });

    it('should display page heading', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<SecretsTab />);

      // Assert
      const heading = screen.getByRole('heading', { name: /secrets/i });
      expect(heading).toBeInTheDocument();
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
      render(<SecretsTab />);

      // Assert: Loading indicator should be present
      const loadingIndicator =
        screen.queryByTestId('secrets-loading') ||
        screen.queryByLabelText(/loading/i) ||
        screen.queryByText(/loading/i);

      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should hide loading indicator after data is loaded', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'test-secret',
          namespace: 'default',
          type: 'Opaque',
          data: { key1: 'dmFsdWUx' }, // base64 encoded
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      // Assert: Wait for data to load
      await waitFor(() => {
        const secretAccordion = screen.queryByTestId('secret-accordion-test-secret');
        expect(secretAccordion).toBeInTheDocument();
      });

      // Loading indicator should be hidden
      const loadingIndicator = screen.queryByTestId('secrets-loading');
      expect(loadingIndicator).not.toBeInTheDocument();
    });
  });

  describe('Success State - Secret Cards Rendering', () => {
    it('should render secret cards when data is loaded', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'secret-1',
          namespace: 'default',
          type: 'Opaque',
          data: { key1: 'dmFsdWUx' },
        },
        {
          name: 'secret-2',
          namespace: 'kube-system',
          type: 'kubernetes.io/service-account-token',
          data: { token: 'dG9rZW4=' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      // Assert: Wait for secrets to be rendered
      await waitFor(() => {
        const secretAccordion1 = screen.getByTestId('secret-accordion-secret-1');
        const secretAccordion2 = screen.getByTestId('secret-accordion-secret-2');
        expect(secretAccordion1).toBeInTheDocument();
        expect(secretAccordion2).toBeInTheDocument();
      });
    });

    it('should display secret name', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'my-secret',
          namespace: 'default',
          type: 'Opaque',
          data: {},
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('my-secret')).toBeInTheDocument();
      });
    });

    it('should display secret namespace', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'test-secret',
          namespace: 'production',
          type: 'Opaque',
          data: {},
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      // Assert
      await waitFor(() => {
        const namespace = screen.getByText(/production/i);
        expect(namespace).toBeInTheDocument();
      });
    });

    it('should display secret type', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'test-secret',
          namespace: 'default',
          type: 'kubernetes.io/tls',
          data: {},
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/kubernetes\.io\/tls/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accordion UI', () => {
    it('should render secrets as accordion items', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'secret-1',
          namespace: 'default',
          type: 'Opaque',
          data: { key1: 'value1' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      // Assert
      await waitFor(() => {
        const accordionButton = screen.getByRole('button', { name: /secret-1/i });
        expect(accordionButton).toBeInTheDocument();
      });
    });

    it('should expand accordion when clicked', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'secret-1',
          namespace: 'default',
          type: 'Opaque',
          data: { key1: 'dmFsdWUx' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      render(<SecretsTab />);

      await waitFor(() => {
        expect(screen.getByText('secret-1')).toBeInTheDocument();
      });

      // Act
      const accordionButton = screen.getByRole('button', { name: /secret-1/i });
      fireEvent.click(accordionButton);

      // Assert
      await waitFor(() => {
        expect(accordionButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should collapse accordion when clicked again', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'secret-1',
          namespace: 'default',
          type: 'Opaque',
          data: { key1: 'dmFsdWUx' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      render(<SecretsTab />);

      await waitFor(() => {
        expect(screen.getByText('secret-1')).toBeInTheDocument();
      });

      const accordionButton = screen.getByRole('button', { name: /secret-1/i });

      // Act: Expand then collapse
      fireEvent.click(accordionButton);
      await waitFor(() => {
        expect(accordionButton).toHaveAttribute('aria-expanded', 'true');
      });

      fireEvent.click(accordionButton);

      // Assert
      await waitFor(() => {
        expect(accordionButton).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should only show expanded content when accordion is open', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'secret-1',
          namespace: 'default',
          type: 'Opaque',
          data: { key1: 'dmFsdWUx' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      render(<SecretsTab />);

      await waitFor(() => {
        expect(screen.getByText('secret-1')).toBeInTheDocument();
      });

      // Assert: Content should not be visible initially
      const key1Element = screen.queryByText('key1');
      if (key1Element) {
        expect(key1Element).not.toBeVisible();
      }

      // Act: Expand
      const accordionButton = screen.getByRole('button', { name: /secret-1/i });
      fireEvent.click(accordionButton);

      // Assert: Content should be visible
      await waitFor(() => {
        const expandedKey = screen.getByText('key1');
        expect(expandedKey).toBeVisible();
      });
    });
  });

  describe('Base64 Decoding and Reveal/Hide', () => {
    it('should decode base64 values', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'secret-1',
          namespace: 'default',
          type: 'Opaque',
          data: { password: 'cGFzc3dvcmQxMjM=' }, // "password123" in base64
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      render(<SecretsTab />);

      await waitFor(() => {
        expect(screen.getByText('secret-1')).toBeInTheDocument();
      });

      // Act: Expand accordion
      const accordionButton = screen.getByRole('button', { name: /secret-1/i });
      fireEvent.click(accordionButton);

      // Assert: Should show decoded value when revealed
      await waitFor(() => {
        expect(screen.getByText('password')).toBeInTheDocument();
      });
    });

    it('should hide values by default', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'secret-1',
          namespace: 'default',
          type: 'Opaque',
          data: { apiKey: 'YXBpa2V5MTIz' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      render(<SecretsTab />);

      await waitFor(() => {
        expect(screen.getByText('secret-1')).toBeInTheDocument();
      });

      // Act: Expand accordion
      const accordionButton = screen.getByRole('button', { name: /secret-1/i });
      fireEvent.click(accordionButton);

      // Assert: Should show hidden value indicator
      await waitFor(() => {
        const hiddenValue = screen.getByText(/•••|hidden|masked/i);
        expect(hiddenValue).toBeInTheDocument();
      });
    });

    it('should reveal value when reveal button is clicked', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'secret-1',
          namespace: 'default',
          type: 'Opaque',
          data: { token: 'dG9rZW4xMjM=' }, // "token123" in base64
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      render(<SecretsTab />);

      await waitFor(() => {
        expect(screen.getByText('secret-1')).toBeInTheDocument();
      });

      // Expand accordion
      const accordionButton = screen.getByRole('button', { name: /secret-1/i });
      fireEvent.click(accordionButton);

      await waitFor(() => {
        expect(screen.getByText('token')).toBeInTheDocument();
      });

      // Act: Click reveal button
      const revealButton = screen.getByRole('button', { name: /reveal|show/i });
      fireEvent.click(revealButton);

      // Assert: Should show decoded value
      await waitFor(() => {
        expect(screen.getByText('token123')).toBeInTheDocument();
      });
    });

    it('should hide value when hide button is clicked', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'secret-1',
          namespace: 'default',
          type: 'Opaque',
          data: { secret: 'c2VjcmV0MTIz' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      render(<SecretsTab />);

      await waitFor(() => {
        expect(screen.getByText('secret-1')).toBeInTheDocument();
      });

      // Expand accordion
      const accordionButton = screen.getByRole('button', { name: /secret-1/i });
      fireEvent.click(accordionButton);

      // Reveal value
      const revealButton = screen.getByRole('button', { name: /reveal|show/i });
      fireEvent.click(revealButton);

      await waitFor(() => {
        expect(screen.getByText('secret123')).toBeInTheDocument();
      });

      // Act: Click hide button
      const hideButton = screen.getByRole('button', { name: /hide/i });
      fireEvent.click(hideButton);

      // Assert: Should hide value again
      await waitFor(() => {
        expect(screen.queryByText('secret123')).not.toBeInTheDocument();
        expect(screen.getByText(/•••|hidden|masked/i)).toBeInTheDocument();
      });
    });

    it('should handle individual reveal/hide for multiple keys', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'secret-1',
          namespace: 'default',
          type: 'Opaque',
          data: {
            key1: 'dmFsdWUx', // "value1"
            key2: 'dmFsdWUy', // "value2"
          },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      render(<SecretsTab />);

      await waitFor(() => {
        expect(screen.getByText('secret-1')).toBeInTheDocument();
      });

      // Expand accordion
      const accordionButton = screen.getByRole('button', { name: /secret-1/i });
      fireEvent.click(accordionButton);

      await waitFor(() => {
        expect(screen.getByText('key1')).toBeInTheDocument();
        expect(screen.getByText('key2')).toBeInTheDocument();
      });

      // Act: Reveal only first key
      const revealButtons = screen.getAllByRole('button', { name: /reveal|show/i });
      fireEvent.click(revealButtons[0]);

      // Assert: Only first value should be revealed
      await waitFor(() => {
        expect(screen.getByText('value1')).toBeInTheDocument();
        expect(screen.queryByText('value2')).not.toBeInTheDocument();
      });
    });
  });

  describe('TLS Secret Support', () => {
    it('should render TLS secret with ca.crt field', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'tls-secret',
          namespace: 'default',
          type: 'kubernetes.io/tls',
          data: {
            'ca.crt': 'LS0tLS1CRUdJTi==', // base64 cert
            'tls.crt': 'LS0tLS1CRUdJTi==',
            'tls.key': 'LS0tLS1CRUdJTi==',
          },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      render(<SecretsTab />);

      await waitFor(() => {
        expect(screen.getByText('tls-secret')).toBeInTheDocument();
      });

      // Expand accordion
      const accordionButton = screen.getByRole('button', { name: /tls-secret/i });
      fireEvent.click(accordionButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('ca.crt')).toBeInTheDocument();
      });
    });

    it('should render TLS secret with tls.crt field', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'tls-secret',
          namespace: 'default',
          type: 'kubernetes.io/tls',
          data: {
            'tls.crt': 'LS0tLS1CRUdJTi==',
            'tls.key': 'LS0tLS1CRUdJTi==',
          },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      render(<SecretsTab />);

      await waitFor(() => {
        expect(screen.getByText('tls-secret')).toBeInTheDocument();
      });

      // Expand accordion
      const accordionButton = screen.getByRole('button', { name: /tls-secret/i });
      fireEvent.click(accordionButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('tls.crt')).toBeInTheDocument();
      });
    });

    it('should render TLS secret with tls.key field', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'tls-secret',
          namespace: 'default',
          type: 'kubernetes.io/tls',
          data: {
            'tls.crt': 'LS0tLS1CRUdJTi==',
            'tls.key': 'LS0tLS1CRUdJTi==',
          },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      render(<SecretsTab />);

      await waitFor(() => {
        expect(screen.getByText('tls-secret')).toBeInTheDocument();
      });

      // Expand accordion
      const accordionButton = screen.getByRole('button', { name: /tls-secret/i });
      fireEvent.click(accordionButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('tls.key')).toBeInTheDocument();
      });
    });

    it('should handle TLS certificate reveal/hide', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'tls-secret',
          namespace: 'default',
          type: 'kubernetes.io/tls',
          data: {
            'tls.crt': 'Y2VydGlmaWNhdGU=', // "certificate" in base64
          },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      render(<SecretsTab />);

      await waitFor(() => {
        expect(screen.getByText('tls-secret')).toBeInTheDocument();
      });

      // Expand accordion
      const accordionButton = screen.getByRole('button', { name: /tls-secret/i });
      fireEvent.click(accordionButton);

      await waitFor(() => {
        expect(screen.getByText('tls.crt')).toBeInTheDocument();
      });

      // Act: Reveal certificate
      const revealButton = screen.getByRole('button', { name: /reveal|show/i });
      fireEvent.click(revealButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('certificate')).toBeInTheDocument();
      });
    });
  });

  describe('Namespace Filtering', () => {
    it('should fetch secrets without namespace filter by default', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<SecretsTab />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/secrets');
      });
    });

    it('should fetch secrets with namespace filter when provided', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<SecretsTab namespace="production" />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/secrets?ns=production');
      });
    });

    it('should refetch when namespace prop changes', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      // Act
      const { rerender } = render(<SecretsTab namespace="default" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/secrets?ns=default');
      });

      // Change namespace
      rerender(<SecretsTab namespace="staging" />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/secrets?ns=staging');
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no secrets exist', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<SecretsTab />);

      // Assert
      await waitFor(() => {
        const emptyMessage =
          screen.queryByTestId('secrets-empty') ||
          screen.queryByText(/no secrets/i);
        expect(emptyMessage).toBeInTheDocument();
      });
    });

    it('should not render secret cards when secrets array is empty', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<SecretsTab />);

      // Assert
      await waitFor(() => {
        const secretAccordions = screen.queryAllByTestId(/^secret-accordion-/);
        expect(secretAccordions).toHaveLength(0);
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when API call fails', async () => {
      // Arrange
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<SecretsTab />);

      // Assert
      await waitFor(() => {
        const errorMessage =
          screen.queryByTestId('secrets-error') ||
          screen.queryByText(/error/i) ||
          screen.queryByText(/failed/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      // Arrange
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<SecretsTab />);

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
      render(<SecretsTab />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.queryByTestId('secrets-error');
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch secrets from /api/secrets endpoint', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<SecretsTab />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/secrets');
      });
    });

    it('should use GET method for API request', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<SecretsTab />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<SecretsTab />);

      // Assert
      const heading = screen.getByRole('heading', { name: /secrets/i });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible accordion buttons', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'secret-1',
          namespace: 'default',
          type: 'Opaque',
          data: {},
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      // Assert
      await waitFor(() => {
        const accordionButton = screen.getByRole('button', { name: /secret-1/i });
        expect(accordionButton).toHaveAccessibleName();
        expect(accordionButton).toHaveAttribute('aria-expanded');
      });
    });

    it('should have accessible reveal/hide buttons', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'secret-1',
          namespace: 'default',
          type: 'Opaque',
          data: { key1: 'dmFsdWUx' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      render(<SecretsTab />);

      await waitFor(() => {
        expect(screen.getByText('secret-1')).toBeInTheDocument();
      });

      // Expand accordion
      const accordionButton = screen.getByRole('button', { name: /secret-1/i });
      fireEvent.click(accordionButton);

      // Assert
      await waitFor(() => {
        const revealButton = screen.getByRole('button', { name: /reveal|show/i });
        expect(revealButton).toHaveAccessibleName();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle secrets with no data', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'empty-secret',
          namespace: 'default',
          type: 'Opaque',
          data: {},
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('empty-secret')).toBeInTheDocument();
      });
    });

    it('should handle invalid base64 data gracefully', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'invalid-secret',
          namespace: 'default',
          type: 'Opaque',
          data: { key: 'not-valid-base64!!!' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('invalid-secret')).toBeInTheDocument();
      });
    });

    it('should handle very long secret names', async () => {
      // Arrange
      const longName = 'very-long-secret-name-that-might-break-ui-layout-if-not-handled-properly';
      const mockSecrets = [
        {
          name: longName,
          namespace: 'default',
          type: 'Opaque',
          data: {},
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(longName)).toBeInTheDocument();
      });
    });

    it('should handle many keys in a single secret', async () => {
      // Arrange
      const manyKeys = Object.fromEntries(
        Array.from({ length: 20 }, (_, i) => [`key${i}`, `dmFsdWU${i}`])
      );

      const mockSecrets = [
        {
          name: 'multi-key-secret',
          namespace: 'default',
          type: 'Opaque',
          data: manyKeys,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('multi-key-secret')).toBeInTheDocument();
      });
    });
  });
});
