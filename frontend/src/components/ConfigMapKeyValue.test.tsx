import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigMapKeyValue } from './ConfigMapKeyValue';

describe('ConfigMapKeyValue Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render key name', () => {
      // Arrange & Act
      render(<ConfigMapKeyValue configKey="app.properties" value="log.level=debug" />);

      // Assert
      expect(screen.getByText('app.properties')).toBeInTheDocument();
    });

    it('should display value inline by default (no masking)', () => {
      // Arrange & Act
      render(<ConfigMapKeyValue configKey="timeout" value="30s" />);

      // Assert: Value should be visible immediately
      expect(screen.getByText('30s')).toBeInTheDocument();
    });

    it('should NOT render a Reveal button', () => {
      // Arrange & Act
      render(<ConfigMapKeyValue configKey="timeout" value="30s" />);

      // Assert: ConfigMap values are not sensitive; no reveal/hide controls
      const revealButton =
        screen.queryByRole('button', { name: /reveal|show|hide/i }) ||
        screen.queryByTestId('reveal-button');
      expect(revealButton).not.toBeInTheDocument();
    });

    it('should render Copy button', () => {
      // Arrange & Act
      render(<ConfigMapKeyValue configKey="timeout" value="30s" />);

      // Assert
      const copyButton =
        screen.queryByRole('button', { name: /copy/i }) ||
        screen.queryByTestId('copy-button');
      expect(copyButton).toBeInTheDocument();
    });
  });

  describe('Value Display', () => {
    it('should display short values in full', () => {
      // Arrange & Act
      render(<ConfigMapKeyValue configKey="short-key" value="abc" />);

      // Assert
      expect(screen.getByText('abc')).toBeInTheDocument();
    });

    it('should display long values properly', () => {
      // Arrange
      const longValue = 'a'.repeat(200);

      // Act
      render(<ConfigMapKeyValue configKey="long-key" value={longValue} />);

      // Assert
      expect(screen.getByText(longValue)).toBeInTheDocument();
    });

    it('should display multiline values', () => {
      // Arrange
      const multilineValue = 'line1\nline2\nline3';

      // Act
      render(<ConfigMapKeyValue configKey="multiline" value={multilineValue} />);

      // Assert
      expect(screen.getByText(/line1/)).toBeInTheDocument();
    });

    it('should handle empty values', () => {
      // Arrange & Act
      render(<ConfigMapKeyValue configKey="empty-key" value="" />);

      // Assert: Should still render the key
      expect(screen.getByText('empty-key')).toBeInTheDocument();
    });

    it('should display special characters in values', () => {
      // Arrange
      const specialValue = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      // Act
      render(<ConfigMapKeyValue configKey="special" value={specialValue} />);

      // Assert
      expect(screen.getByText(specialValue)).toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('should copy value to clipboard when Copy button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });

      render(<ConfigMapKeyValue configKey="app.properties" value="log.level=debug" />);

      // Act
      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      // Assert: Should call clipboard API with the value
      expect(mockWriteText).toHaveBeenCalledWith('log.level=debug');
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

      render(<ConfigMapKeyValue configKey="timeout" value="30s" />);

      // Act
      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      // Assert: Should show "Copied" confirmation
      const copiedIndicator = screen.queryByTestId('copied-indicator');
      expect(copiedIndicator).toBeInTheDocument();
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

      render(<ConfigMapKeyValue configKey="timeout" value="30s" />);

      // Act
      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      // Assert: Should not crash
      expect(screen.getByText('timeout')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible Copy button label', () => {
      // Arrange & Act
      render(<ConfigMapKeyValue configKey="app.properties" value="log.level=debug" />);

      // Assert
      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toHaveAccessibleName();
    });
  });
});
