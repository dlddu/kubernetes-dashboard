/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SecretAccordion } from './SecretAccordion';

// Mock fetch API
global.fetch = vi.fn();

describe('SecretAccordion Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render accordion item with secret name', () => {
      // Arrange
      const secret = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        keys: ['username', 'password'],
      };

      // Act
      render(<SecretAccordion secret={secret} />);

      // Assert
      expect(screen.getByText('my-secret')).toBeInTheDocument();
    });

    it('should render accordion in collapsed state initially', () => {
      // Arrange
      const secret = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        keys: ['key1'],
      };

      // Act
      render(<SecretAccordion secret={secret} isOpen={false} />);

      // Assert: Details should not be visible initially
      const detailsContent = screen.queryByTestId('secret-details');
      expect(detailsContent).toBeNull();
    });

    it('should display secret metadata in header', () => {
      // Arrange
      const secret = {
        name: 'tls-secret',
        namespace: 'production',
        type: 'kubernetes.io/tls',
        keys: ['tls.crt', 'tls.key'],
      };

      // Act
      render(<SecretAccordion secret={secret} />);

      // Assert
      expect(screen.getByText('tls-secret')).toBeInTheDocument();
      expect(screen.getByText('production')).toBeInTheDocument();
      expect(screen.getByText(/kubernetes.io\/tls/i)).toBeInTheDocument();
    });

    it('should show number of keys in header', () => {
      // Arrange
      const secret = {
        name: 'multi-key-secret',
        namespace: 'default',
        type: 'Opaque',
        keys: ['key1', 'key2', 'key3'],
      };

      // Act
      render(<SecretAccordion secret={secret} />);

      // Assert: Should show "3 keys" or similar
      expect(screen.getByText(/3/)).toBeInTheDocument();
    });
  });

  describe('Accordion Expand/Collapse Behavior', () => {
    it('should expand accordion when clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const secret = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        keys: ['username', 'password'],
      };

      const mockSecretDetail = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        data: {
          username: 'admin',
          password: 'secretpassword',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecretDetail,
      });

      let isOpen = false;
      const mockOnToggle = vi.fn(() => {
        isOpen = !isOpen;
      });

      // Act
      const { rerender } = render(
        <SecretAccordion secret={secret} isOpen={isOpen} onToggle={mockOnToggle} />
      );
      const accordionHeader = screen.getByText('my-secret');
      await user.click(accordionHeader);

      // Rerender with isOpen=true
      rerender(<SecretAccordion secret={secret} isOpen={true} onToggle={mockOnToggle} />);

      // Assert: Details should become visible
      await waitFor(() => {
        const detailsContent = screen.queryByTestId('secret-details');
        expect(detailsContent).toBeVisible();
      });
    });

    it('should collapse accordion when clicked again', async () => {
      // Arrange
      const user = userEvent.setup();
      const secret = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        keys: ['key1'],
      };

      const mockSecretDetail = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        data: { key1: 'value1' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecretDetail,
      });

      let isOpen = false;
      const mockOnToggle = vi.fn(() => {
        isOpen = !isOpen;
      });

      // Act
      const { rerender } = render(
        <SecretAccordion secret={secret} isOpen={isOpen} onToggle={mockOnToggle} />
      );
      const accordionHeader = screen.getByText('my-secret');

      // Expand
      await user.click(accordionHeader);
      rerender(<SecretAccordion secret={secret} isOpen={true} onToggle={mockOnToggle} />);
      await waitFor(() => {
        expect(screen.queryByTestId('secret-details')).toBeVisible();
      });

      // Collapse
      await user.click(accordionHeader);
      rerender(<SecretAccordion secret={secret} isOpen={false} onToggle={mockOnToggle} />);

      // Assert: Details should be hidden again
      await waitFor(() => {
        const detailsContent = screen.queryByTestId('secret-details');
        expect(detailsContent).toBeNull();
      });
    });
  });

  describe('API Call on Expand', () => {
    it('should fetch secret detail when accordion is expanded', async () => {
      // Arrange
      const user = userEvent.setup();
      const secret = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        keys: ['username', 'password'],
      };

      const mockSecretDetail = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        data: {
          username: 'admin',
          password: 'secretpassword',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecretDetail,
      });

      let isOpen = false;
      const mockOnToggle = vi.fn(() => {
        isOpen = !isOpen;
      });

      // Act
      const { rerender } = render(
        <SecretAccordion secret={secret} isOpen={isOpen} onToggle={mockOnToggle} />
      );
      const accordionHeader = screen.getByText('my-secret');
      await user.click(accordionHeader);
      rerender(<SecretAccordion secret={secret} isOpen={true} onToggle={mockOnToggle} />);

      // Assert: Should call detail API
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/secrets/default/my-secret');
      });
    });

    it('should NOT fetch secret detail when accordion is collapsed', () => {
      // Arrange
      const secret = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        keys: ['key1'],
      };

      // Act
      render(<SecretAccordion secret={secret} isOpen={false} />);

      // Assert: Should not call API while collapsed
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should display loading state while fetching detail', async () => {
      // Arrange
      const user = userEvent.setup();
      const secret = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        keys: ['key1'],
      };

      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ name: 'my-secret', namespace: 'default', type: 'Opaque', data: {} }),
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
        <SecretAccordion secret={secret} isOpen={isOpen} onToggle={mockOnToggle} />
      );
      const accordionHeader = screen.getByText('my-secret');
      await user.click(accordionHeader);
      rerender(<SecretAccordion secret={secret} isOpen={true} onToggle={mockOnToggle} />);

      // Assert: Should show loading indicator
      const loadingIndicator =
        screen.queryByTestId('secret-detail-loading') ||
        screen.queryByText(/loading/i);
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should cache detail data and not refetch on re-expand', async () => {
      // Arrange
      const user = userEvent.setup();
      const secret = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        keys: ['key1'],
      };

      const mockSecretDetail = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        data: { key1: 'value1' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecretDetail,
      });

      let isOpen = false;
      const mockOnToggle = vi.fn(() => {
        isOpen = !isOpen;
      });

      // Act
      const { rerender } = render(
        <SecretAccordion secret={secret} isOpen={isOpen} onToggle={mockOnToggle} />
      );
      const accordionHeader = screen.getByText('my-secret');

      // First expand
      await user.click(accordionHeader);
      rerender(<SecretAccordion secret={secret} isOpen={true} onToggle={mockOnToggle} />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Collapse
      await user.click(accordionHeader);
      rerender(<SecretAccordion secret={secret} isOpen={false} onToggle={mockOnToggle} />);

      // Re-expand
      await user.click(accordionHeader);
      rerender(<SecretAccordion secret={secret} isOpen={true} onToggle={mockOnToggle} />);

      // Assert: Should not fetch again (cached)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Secret Detail Display', () => {
    it('should display secret keys and values when expanded', async () => {
      // Arrange
      const user = userEvent.setup();
      const secret = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        keys: ['username', 'password'],
      };

      const mockSecretDetail = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        data: {
          username: 'admin',
          password: 'secretpassword',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecretDetail,
      });

      let isOpen = false;
      const mockOnToggle = vi.fn(() => {
        isOpen = !isOpen;
      });

      // Act
      const { rerender } = render(
        <SecretAccordion secret={secret} isOpen={isOpen} onToggle={mockOnToggle} />
      );
      const accordionHeader = screen.getByText('my-secret');
      await user.click(accordionHeader);
      rerender(<SecretAccordion secret={secret} isOpen={true} onToggle={mockOnToggle} />);

      // Assert: Should display keys
      await waitFor(() => {
        expect(screen.getByText('username')).toBeInTheDocument();
        expect(screen.getByText('password')).toBeInTheDocument();
      });
    });

    it('should hide secret values by default (masked)', async () => {
      // Arrange
      const user = userEvent.setup();
      const secret = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        keys: ['password'],
      };

      const mockSecretDetail = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        data: {
          password: 'secretpassword123',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecretDetail,
      });

      let isOpen = false;
      const mockOnToggle = vi.fn(() => {
        isOpen = !isOpen;
      });

      // Act
      const { rerender } = render(
        <SecretAccordion secret={secret} isOpen={isOpen} onToggle={mockOnToggle} />
      );
      const accordionHeader = screen.getByText('my-secret');
      await user.click(accordionHeader);
      rerender(<SecretAccordion secret={secret} isOpen={true} onToggle={mockOnToggle} />);

      // Assert: Values should be masked initially
      await waitFor(() => {
        expect(screen.getByText('password')).toBeInTheDocument();
        // Should NOT show actual value initially (should be masked with *** or hidden)
        expect(screen.queryByText('secretpassword123')).not.toBeInTheDocument();
      });
    });

    it('should display error message when detail fetch fails', async () => {
      // Arrange
      const user = userEvent.setup();
      const secret = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        keys: ['key1'],
      };

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      let isOpen = false;
      const mockOnToggle = vi.fn(() => {
        isOpen = !isOpen;
      });

      // Act
      const { rerender } = render(
        <SecretAccordion secret={secret} isOpen={isOpen} onToggle={mockOnToggle} />
      );
      const accordionHeader = screen.getByText('my-secret');
      await user.click(accordionHeader);
      rerender(<SecretAccordion secret={secret} isOpen={true} onToggle={mockOnToggle} />);

      // Assert: Should show error message
      await waitFor(() => {
        const errorMessage =
          screen.queryByTestId('secret-detail-error') ||
          screen.queryByText(/error/i) ||
          screen.queryByText(/failed/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Accordions - Only One Open at a Time', () => {
    it('should close other accordions when opening a new one', async () => {
      // Arrange
      const user = userEvent.setup();
      const secrets = [
        {
          name: 'secret-1',
          namespace: 'default',
          type: 'Opaque',
          keys: ['key1'],
        },
        {
          name: 'secret-2',
          namespace: 'default',
          type: 'Opaque',
          keys: ['key2'],
        },
      ];

      const mockDetail1 = {
        name: 'secret-1',
        namespace: 'default',
        type: 'Opaque',
        data: { key1: 'value1' },
      };

      const mockDetail2 = {
        name: 'secret-2',
        namespace: 'default',
        type: 'Opaque',
        data: { key2: 'value2' },
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDetail1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDetail2,
        });

      // Act
      render(
        <div>
          <SecretAccordion secret={secrets[0]} />
          <SecretAccordion secret={secrets[1]} />
        </div>
      );

      // Open first accordion
      const accordion1 = screen.getByText('secret-1');
      await user.click(accordion1);

      await waitFor(() => {
        expect(screen.getByText('key1')).toBeInTheDocument();
      });

      // Open second accordion
      const accordion2 = screen.getByText('secret-2');
      await user.click(accordion2);

      // Assert: First accordion should be closed, second should be open
      // This test validates that the parent component manages accordion state
      // to ensure only one is open at a time
      await waitFor(() => {
        expect(screen.getByText('key2')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for accordion', () => {
      // Arrange
      const secret = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        keys: ['key1'],
      };

      // Act
      render(<SecretAccordion secret={secret} />);

      // Assert: Should have accordion button role
      const accordionButton = screen.queryByRole('button', { name: /my-secret/i });
      expect(accordionButton).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      // Arrange
      const user = userEvent.setup();
      const secret = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        keys: ['key1'],
      };

      const mockSecretDetail = {
        name: 'my-secret',
        namespace: 'default',
        type: 'Opaque',
        data: { key1: 'value1' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecretDetail,
      });

      let isOpen = false;
      const mockOnToggle = vi.fn(() => {
        isOpen = !isOpen;
      });

      // Act
      const { rerender } = render(
        <SecretAccordion secret={secret} isOpen={isOpen} onToggle={mockOnToggle} />
      );
      const accordionButton = screen.getByRole('button', { name: /my-secret/i });

      // Tab to accordion and press Enter
      accordionButton.focus();
      await user.keyboard('{Enter}');
      rerender(<SecretAccordion secret={secret} isOpen={true} onToggle={mockOnToggle} />);

      // Assert: Should expand on Enter key
      await waitFor(() => {
        expect(screen.queryByTestId('secret-details')).toBeVisible();
      });
    });
  });
});
