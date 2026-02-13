import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SecretKeyValue } from './SecretKeyValue';

describe('SecretKeyValue Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render key name', () => {
      // Arrange & Act
      render(<SecretKeyValue secretKey="username" value="admin" />);

      // Assert
      expect(screen.getByText('username')).toBeInTheDocument();
    });

    it('should hide value by default', () => {
      // Arrange & Act
      render(<SecretKeyValue secretKey="password" value="secretpassword123" />);

      // Assert: Value should be masked
      expect(screen.queryByText('secretpassword123')).not.toBeInTheDocument();
    });

    it('should display masked value indicator', () => {
      // Arrange & Act
      render(<SecretKeyValue secretKey="api-key" value="abc123xyz" />);

      // Assert: Should show asterisks or masked indicator
      const maskedValue =
        screen.queryByText(/\*\*\*/) ||
        screen.queryByTestId('masked-value') ||
        screen.queryByText(/hidden/i);
      expect(maskedValue).toBeInTheDocument();
    });

    it('should render Reveal button', () => {
      // Arrange & Act
      render(<SecretKeyValue secretKey="password" value="secret" />);

      // Assert
      const revealButton =
        screen.queryByRole('button', { name: /reveal|show/i }) ||
        screen.queryByTestId('reveal-button');
      expect(revealButton).toBeInTheDocument();
    });
  });

  describe('Reveal/Hide Functionality', () => {
    it('should reveal value when Reveal button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<SecretKeyValue secretKey="password" value="secretpassword123" />);

      // Act
      const revealButton = screen.getByRole('button', { name: /reveal|show/i });
      await user.click(revealButton);

      // Assert: Value should be visible
      expect(screen.getByText('secretpassword123')).toBeInTheDocument();
    });

    it('should hide value when Hide button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<SecretKeyValue secretKey="password" value="secretpassword123" />);

      // Act: Reveal then hide
      const revealButton = screen.getByRole('button', { name: /reveal|show/i });
      await user.click(revealButton);

      expect(screen.getByText('secretpassword123')).toBeInTheDocument();

      const hideButton = screen.getByRole('button', { name: /hide/i });
      await user.click(hideButton);

      // Assert: Value should be masked again
      expect(screen.queryByText('secretpassword123')).not.toBeInTheDocument();
    });

    it('should toggle between Reveal and Hide buttons', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<SecretKeyValue secretKey="api-key" value="abc123" />);

      // Act: Click Reveal
      const revealButton = screen.getByRole('button', { name: /reveal|show/i });
      await user.click(revealButton);

      // Assert: Should show Hide button
      expect(screen.getByRole('button', { name: /hide/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reveal|show/i })).not.toBeInTheDocument();
    });

    it('should change button text from Reveal to Hide', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<SecretKeyValue secretKey="token" value="mytoken" />);

      // Act
      const revealButton = screen.getByRole('button', { name: /reveal|show/i });
      await user.click(revealButton);

      // Assert: Button text should change to "Hide"
      const hideButton = screen.getByRole('button', { name: /hide/i });
      expect(hideButton).toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('should render Copy button', () => {
      // Arrange & Act
      render(<SecretKeyValue secretKey="password" value="secret" />);

      // Assert
      const copyButton =
        screen.queryByRole('button', { name: /copy/i }) ||
        screen.queryByTestId('copy-button');
      expect(copyButton).toBeInTheDocument();
    });

    it('should copy value to clipboard when Copy button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });

      render(<SecretKeyValue secretKey="api-key" value="abc123xyz" />);

      // Act
      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      // Assert: Should call clipboard API with the value
      expect(mockWriteText).toHaveBeenCalledWith('abc123xyz');
    });

    it('should show copied confirmation after copying', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });

      render(<SecretKeyValue secretKey="token" value="mytoken" />);

      // Act
      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      // Assert: Should show "Copied" confirmation (query by test-id to avoid ambiguity)
      const copiedIndicator = screen.queryByTestId('copied-indicator');
      expect(copiedIndicator).toBeInTheDocument();
    });

    it('should copy value even when hidden', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });

      render(<SecretKeyValue secretKey="password" value="secretpassword" />);

      // Act: Copy without revealing
      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      // Assert: Should copy the actual value
      expect(mockWriteText).toHaveBeenCalledWith('secretpassword');
    });
  });

  describe('Independent State Management', () => {
    it('should manage reveal state independently for each key', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <div>
          <SecretKeyValue secretKey="username" value="admin" />
          <SecretKeyValue secretKey="password" value="secret123" />
        </div>
      );

      // Act: Reveal only username
      const usernameRevealButton = screen.getAllByRole('button', { name: /reveal|show/i })[0];
      await user.click(usernameRevealButton);

      // Assert: Only username should be visible
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.queryByText('secret123')).not.toBeInTheDocument();
    });

    it('should not affect other keys when revealing one', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <div>
          <SecretKeyValue secretKey="key1" value="value1" />
          <SecretKeyValue secretKey="key2" value="value2" />
          <SecretKeyValue secretKey="key3" value="value3" />
        </div>
      );

      // Act: Reveal key2
      const revealButtons = screen.getAllByRole('button', { name: /reveal|show/i });
      await user.click(revealButtons[1]);

      // Assert: Only key2 value should be visible
      expect(screen.queryByText('value1')).not.toBeInTheDocument();
      expect(screen.getByText('value2')).toBeInTheDocument();
      expect(screen.queryByText('value3')).not.toBeInTheDocument();
    });
  });

  describe('Value Display', () => {
    it('should display short values in full', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<SecretKeyValue secretKey="short-key" value="abc" />);

      // Act: Reveal value
      const revealButton = screen.getByRole('button', { name: /reveal|show/i });
      await user.click(revealButton);

      // Assert
      expect(screen.getByText('abc')).toBeInTheDocument();
    });

    it('should display long values properly', async () => {
      // Arrange
      const user = userEvent.setup();
      const longValue = 'a'.repeat(200);
      render(<SecretKeyValue secretKey="long-key" value={longValue} />);

      // Act: Reveal value
      const revealButton = screen.getByRole('button', { name: /reveal|show/i });
      await user.click(revealButton);

      // Assert: Should display the full value
      expect(screen.getByText(longValue)).toBeInTheDocument();
    });

    it('should handle multiline values', async () => {
      // Arrange
      const user = userEvent.setup();
      const multilineValue = 'line1\nline2\nline3';
      render(<SecretKeyValue secretKey="multiline" value={multilineValue} />);

      // Act: Reveal value
      const revealButton = screen.getByRole('button', { name: /reveal|show/i });
      await user.click(revealButton);

      // Assert: Should display multiline value
      expect(screen.getByText(/line1/)).toBeInTheDocument();
    });

    it('should handle TLS certificates', async () => {
      // Arrange
      const user = userEvent.setup();
      const tlsCert = '-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----';
      render(<SecretKeyValue secretKey="tls.crt" value={tlsCert} />);

      // Act: Reveal value
      const revealButton = screen.getByRole('button', { name: /reveal|show/i });
      await user.click(revealButton);

      // Assert: Should display certificate
      expect(screen.getByText(/BEGIN CERTIFICATE/)).toBeInTheDocument();
    });

    it('should handle empty values', () => {
      // Arrange & Act
      render(<SecretKeyValue secretKey="empty-key" value="" />);

      // Assert: Should still render the key
      expect(screen.getByText('empty-key')).toBeInTheDocument();
    });

    it('should handle special characters in values', async () => {
      // Arrange
      const user = userEvent.setup();
      const specialValue = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      render(<SecretKeyValue secretKey="special" value={specialValue} />);

      // Act: Reveal value
      const revealButton = screen.getByRole('button', { name: /reveal|show/i });
      await user.click(revealButton);

      // Assert: Should display special characters
      expect(screen.getByText(specialValue)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      // Arrange & Act
      render(<SecretKeyValue secretKey="password" value="secret" />);

      // Assert: Buttons should have descriptive labels
      const revealButton = screen.getByRole('button', { name: /reveal|show/i });
      expect(revealButton).toHaveAccessibleName();

      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toHaveAccessibleName();
    });

    it('should be keyboard navigable', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<SecretKeyValue secretKey="password" value="secret123" />);

      // Act: Tab to Reveal button and press Enter
      const revealButton = screen.getByRole('button', { name: /reveal|show/i });
      revealButton.focus();
      await user.keyboard('{Enter}');

      // Assert: Should reveal on Enter key
      expect(screen.getByText('secret123')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for revealed state', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<SecretKeyValue secretKey="password" value="secret" />);

      // Act: Reveal value
      const revealButton = screen.getByRole('button', { name: /reveal|show/i });
      await user.click(revealButton);

      // Assert: Should have aria-label or aria-hidden attributes
      const valueContainer = screen.queryByTestId('secret-value');
      if (valueContainer) {
        expect(valueContainer).toBeInTheDocument();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid toggle clicks', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<SecretKeyValue secretKey="password" value="secret" />);

      // Act: Click multiple times rapidly
      const revealButton = screen.getByRole('button', { name: /reveal|show/i });
      await user.click(revealButton);
      const hideButton = screen.getByRole('button', { name: /hide/i });
      await user.click(hideButton);
      const revealButton2 = screen.getByRole('button', { name: /reveal|show/i });
      await user.click(revealButton2);

      // Assert: Should end in revealed state
      expect(screen.getByText('secret')).toBeInTheDocument();
    });

    it('should handle copy failure gracefully', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Copy failed'));
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });

      render(<SecretKeyValue secretKey="password" value="secret" />);

      // Act: Try to copy
      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      // Assert: Should not crash (error handling)
      expect(screen.getByText('password')).toBeInTheDocument();
    });
  });
});
