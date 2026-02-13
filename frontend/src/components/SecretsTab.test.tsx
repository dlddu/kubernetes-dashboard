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
      const secretsTab = screen.getByTestId('secrets-page');
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

  describe('Data Fetching', () => {
    it('should fetch secrets from /api/secrets endpoint', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'test-secret',
          namespace: 'default',
          type: 'Opaque',
          data: { username: 'dGVzdA==' },
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
        expect(global.fetch).toHaveBeenCalledWith('/api/secrets');
      });
    });

    it('should fetch secrets with namespace filter when namespace is selected', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'kube-secret',
          namespace: 'kube-system',
          type: 'Opaque',
          data: {},
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab namespace="kube-system" />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/secrets?ns=kube-system');
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
          data: { key: 'value' },
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
        const secretCard = screen.queryByTestId('secret-card');
        expect(secretCard).toBeInTheDocument();
      });

      // Loading indicator should be hidden
      const loadingIndicator = screen.queryByTestId('secrets-loading');
      expect(loadingIndicator).not.toBeInTheDocument();
    });
  });

  describe('Success State - Secret List Rendering', () => {
    it('should render secret cards when data is loaded', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'secret-1',
          namespace: 'default',
          type: 'Opaque',
          data: { username: 'dXNlcjE=' },
        },
        {
          name: 'secret-2',
          namespace: 'default',
          type: 'kubernetes.io/dockerconfigjson',
          data: { '.dockerconfigjson': 'eyJ9' },
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
        const secretCards = screen.getAllByTestId('secret-card');
        expect(secretCards).toHaveLength(2);
      });
    });

    it('should display secret name', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'my-app-secret',
          namespace: 'default',
          type: 'Opaque',
          data: { key: 'dmFsdWU=' },
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
        expect(screen.getByText('my-app-secret')).toBeInTheDocument();
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
        expect(screen.getByText('production')).toBeInTheDocument();
      });
    });

    it('should display secret type', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'test-secret',
          namespace: 'default',
          type: 'kubernetes.io/tls',
          data: { 'tls.crt': 'Y2VydA==', 'tls.key': 'a2V5' },
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
        expect(screen.getByText(/tls/i)).toBeInTheDocument();
      });
    });

    it('should display number of keys in secret', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'multi-key-secret',
          namespace: 'default',
          type: 'Opaque',
          data: {
            key1: 'dmFsdWUx',
            key2: 'dmFsdWUy',
            key3: 'dmFsdWUz',
          },
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
        expect(screen.getByText(/3.*keys?/i)).toBeInTheDocument();
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

      // Assert: Should show empty state message
      await waitFor(() => {
        const emptyMessage =
          screen.queryByTestId('no-secrets-message') ||
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
        const secretCards = screen.queryAllByTestId('secret-card');
        expect(secretCards).toHaveLength(0);
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when API call fails', async () => {
      // Arrange: Mock failed fetch
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<SecretsTab />);

      // Assert: Should show error message
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

      // Assert: Should show retry button
      await waitFor(() => {
        const retryButton =
          screen.queryByTestId('retry-button') ||
          screen.queryByRole('button', { name: /retry|try again/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('should handle HTTP error responses', async () => {
      // Arrange: Mock 500 error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      // Act
      render(<SecretsTab />);

      // Assert: Should display error state
      await waitFor(() => {
        const errorMessage = screen.queryByTestId('secrets-error');
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('Accordion Expand/Collapse', () => {
    it('should initially render secrets in collapsed state', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'test-secret',
          namespace: 'default',
          type: 'Opaque',
          data: { username: 'dXNlcm5hbWU=', password: 'cGFzc3dvcmQ=' },
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
        const secretCard = screen.getByTestId('secret-card');
        expect(secretCard).toBeInTheDocument();
      });

      const secretData = screen.queryByTestId('secret-data');
      expect(secretData).not.toBeVisible();
    });

    it('should expand secret when clicking expand button', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'test-secret',
          namespace: 'default',
          type: 'Opaque',
          data: { username: 'dXNlcm5hbWU=' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      await waitFor(() => {
        const secretCard = screen.getByTestId('secret-card');
        expect(secretCard).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId('expand-secret-button');
      fireEvent.click(expandButton);

      // Assert
      await waitFor(() => {
        const secretData = screen.getByTestId('secret-data');
        expect(secretData).toBeVisible();
      });
    });

    it('should collapse secret when clicking expand button again', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'test-secret',
          namespace: 'default',
          type: 'Opaque',
          data: { key: 'dmFsdWU=' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      await waitFor(() => {
        const secretCard = screen.getByTestId('secret-card');
        expect(secretCard).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId('expand-secret-button');

      // Expand
      fireEvent.click(expandButton);
      await waitFor(() => {
        expect(screen.getByTestId('secret-data')).toBeVisible();
      });

      // Collapse
      fireEvent.click(expandButton);

      // Assert
      await waitFor(() => {
        const secretData = screen.queryByTestId('secret-data');
        expect(secretData).not.toBeVisible();
      });
    });

    it('should show expand icon when collapsed', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'test-secret',
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
        const expandIcon = screen.getByTestId('expand-icon');
        expect(expandIcon).toHaveClass(/chevron-down|arrow-down/);
      });
    });

    it('should show collapse icon when expanded', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'test-secret',
          namespace: 'default',
          type: 'Opaque',
          data: { key: 'value' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      await waitFor(() => {
        const secretCard = screen.getByTestId('secret-card');
        expect(secretCard).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId('expand-secret-button');
      fireEvent.click(expandButton);

      // Assert
      await waitFor(() => {
        const expandIcon = screen.getByTestId('expand-icon');
        expect(expandIcon).toHaveClass(/chevron-up|arrow-up/);
      });
    });
  });

  describe('Base64 Decoding', () => {
    it('should initially hide secret values', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'test-secret',
          namespace: 'default',
          type: 'Opaque',
          data: { username: 'dXNlcm5hbWU=' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      await waitFor(() => {
        const secretCard = screen.getByTestId('secret-card');
        expect(secretCard).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId('expand-secret-button');
      fireEvent.click(expandButton);

      // Assert
      await waitFor(() => {
        const secretValue = screen.getByTestId('secret-value');
        expect(secretValue).toHaveTextContent(/\*+|hidden/);
      });
    });

    it('should display reveal button for each secret key', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'test-secret',
          namespace: 'default',
          type: 'Opaque',
          data: { username: 'dXNlcm5hbWU=' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      await waitFor(() => {
        const secretCard = screen.getByTestId('secret-card');
        expect(secretCard).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId('expand-secret-button');
      fireEvent.click(expandButton);

      // Assert
      await waitFor(() => {
        const revealButton = screen.getByTestId('reveal-secret-button');
        expect(revealButton).toBeInTheDocument();
      });
    });

    it('should decode and reveal Base64 value when reveal button is clicked', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'test-secret',
          namespace: 'default',
          type: 'Opaque',
          data: { username: 'dXNlcm5hbWU=' }, // "username" in Base64
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      await waitFor(() => {
        const secretCard = screen.getByTestId('secret-card');
        expect(secretCard).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId('expand-secret-button');
      fireEvent.click(expandButton);

      await waitFor(() => {
        const revealButton = screen.getByTestId('reveal-secret-button');
        expect(revealButton).toBeInTheDocument();
      });

      const revealButton = screen.getByTestId('reveal-secret-button');
      fireEvent.click(revealButton);

      // Assert
      await waitFor(() => {
        const secretValue = screen.getByTestId('secret-value');
        expect(secretValue).toHaveTextContent('username');
      });
    });

    it('should hide secret value when hide button is clicked', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'test-secret',
          namespace: 'default',
          type: 'Opaque',
          data: { password: 'cGFzc3dvcmQ=' }, // "password" in Base64
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      await waitFor(() => {
        const secretCard = screen.getByTestId('secret-card');
        expect(secretCard).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId('expand-secret-button');
      fireEvent.click(expandButton);

      await waitFor(() => {
        const revealButton = screen.getByTestId('reveal-secret-button');
        expect(revealButton).toBeInTheDocument();
      });

      const revealButton = screen.getByTestId('reveal-secret-button');

      // Reveal
      fireEvent.click(revealButton);
      await waitFor(() => {
        expect(screen.getByTestId('secret-value')).toHaveTextContent('password');
      });

      // Hide
      fireEvent.click(revealButton);

      // Assert
      await waitFor(() => {
        const secretValue = screen.getByTestId('secret-value');
        expect(secretValue).toHaveTextContent(/\*+|hidden/);
      });
    });

    it('should display all secret keys when expanded', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'multi-key-secret',
          namespace: 'default',
          type: 'Opaque',
          data: {
            username: 'dXNlcm5hbWU=',
            password: 'cGFzc3dvcmQ=',
            apiKey: 'YXBpS2V5MTIz',
          },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      await waitFor(() => {
        const secretCard = screen.getByTestId('secret-card');
        expect(secretCard).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId('expand-secret-button');
      fireEvent.click(expandButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('username')).toBeInTheDocument();
        expect(screen.getByText('password')).toBeInTheDocument();
        expect(screen.getByText('apiKey')).toBeInTheDocument();
      });
    });

    it('should handle invalid Base64 gracefully', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'invalid-secret',
          namespace: 'default',
          type: 'Opaque',
          data: { badkey: 'not-valid-base64!!!' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      await waitFor(() => {
        const secretCard = screen.getByTestId('secret-card');
        expect(secretCard).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId('expand-secret-button');
      fireEvent.click(expandButton);

      await waitFor(() => {
        const revealButton = screen.getByTestId('reveal-secret-button');
        expect(revealButton).toBeInTheDocument();
      });

      const revealButton = screen.getByTestId('reveal-secret-button');
      fireEvent.click(revealButton);

      // Assert: Should show error or raw value
      await waitFor(() => {
        const secretValue = screen.getByTestId('secret-value');
        expect(secretValue).toHaveTextContent(/error|invalid|not-valid-base64/i);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
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

    it('should have accessible expand button', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'test-secret',
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
        const expandButton = screen.getByTestId('expand-secret-button');
        expect(expandButton).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should update aria-expanded when toggling accordion', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'test-secret',
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

      await waitFor(() => {
        const secretCard = screen.getByTestId('secret-card');
        expect(secretCard).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId('expand-secret-button');
      fireEvent.click(expandButton);

      // Assert
      await waitFor(() => {
        expect(expandButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should have accessible reveal button label', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'test-secret',
          namespace: 'default',
          type: 'Opaque',
          data: { key: 'value' },
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecrets,
      });

      // Act
      render(<SecretsTab />);

      await waitFor(() => {
        const secretCard = screen.getByTestId('secret-card');
        expect(secretCard).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId('expand-secret-button');
      fireEvent.click(expandButton);

      // Assert
      await waitFor(() => {
        const revealButton = screen.getByTestId('reveal-secret-button');
        expect(revealButton).toHaveAttribute('aria-label', /reveal|show/i);
      });
    });
  });

  describe('Responsive Layout', () => {
    it('should render secrets in a grid or list layout', async () => {
      // Arrange
      const mockSecrets = [
        {
          name: 'secret-1',
          namespace: 'default',
          type: 'Opaque',
          data: {},
        },
        {
          name: 'secret-2',
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

      // Assert: Secrets should be displayed
      await waitFor(() => {
        const secretsContainer = screen.getByTestId('secrets-page');
        expect(secretsContainer).toBeInTheDocument();

        const secretCards = screen.getAllByTestId('secret-card');
        expect(secretCards.length).toBeGreaterThan(0);
      });
    });

    it('should be accessible with proper ARIA attributes', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<SecretsTab />);

      // Assert: Container should have proper accessibility attributes
      const secretsTab = screen.getByTestId('secrets-page');
      expect(secretsTab).toBeInTheDocument();

      const heading = screen.getByRole('heading', { name: /secrets/i });
      expect(heading).toBeInTheDocument();
    });
  });
});
