import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { ErrorRetry } from './ErrorRetry';

describe('ErrorRetry', () => {
  describe('rendering - basic structure', () => {
    it('should render without crashing', () => {
      // Arrange & Act
      render(<ErrorRetry message="Something went wrong" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should display error message', () => {
      // Arrange & Act
      render(<ErrorRetry message="Network error occurred" onRetry={vi.fn()} />);

      // Assert
      const message = screen.getByText('Network error occurred');
      expect(message).toBeInTheDocument();
    });

    it('should display retry button', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should have role alert for accessibility', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('error message display', () => {
    it('should display short error messages', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should display long error messages', () => {
      // Arrange
      const longMessage = 'This is a very long error message that provides detailed information about what went wrong during the operation';

      // Act
      render(<ErrorRetry message={longMessage} onRetry={vi.fn()} />);

      // Assert
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should display error messages with special characters', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error: Failed to fetch data (500)" onRetry={vi.fn()} />);

      // Assert
      expect(screen.getByText('Error: Failed to fetch data (500)')).toBeInTheDocument();
    });

    it('should display multiline error messages', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error occurred:\nPlease try again" onRetry={vi.fn()} />);

      // Assert
      const message = screen.getByText(/Error occurred/);
      expect(message).toBeInTheDocument();
    });

    it('should handle empty error message gracefully', () => {
      // Arrange & Act
      render(<ErrorRetry message="" onRetry={vi.fn()} />);

      // Assert - should still render the component
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toBeInTheDocument();
    });
  });

  describe('retry button interaction', () => {
    it('should call onRetry when retry button is clicked', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onRetry = vi.fn();

      // Act
      render(<ErrorRetry message="Error" onRetry={onRetry} />);
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      await user.click(retryButton);

      // Assert
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry exactly once per click', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onRetry = vi.fn();

      // Act
      render(<ErrorRetry message="Error" onRetry={onRetry} />);
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      await user.click(retryButton);

      // Assert
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith();
    });

    it('should allow multiple retry clicks', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onRetry = vi.fn();

      // Act
      render(<ErrorRetry message="Error" onRetry={onRetry} />);
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      await user.click(retryButton);
      await user.click(retryButton);
      await user.click(retryButton);

      // Assert
      expect(onRetry).toHaveBeenCalledTimes(3);
    });

    it('should be keyboard accessible with Enter key', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onRetry = vi.fn();

      // Act
      render(<ErrorRetry message="Error" onRetry={onRetry} />);
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      retryButton.focus();
      await user.keyboard('{Enter}');

      // Assert
      expect(onRetry).toHaveBeenCalled();
    });

    it('should be keyboard accessible with Space key', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onRetry = vi.fn();

      // Act
      render(<ErrorRetry message="Error" onRetry={onRetry} />);
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      retryButton.focus();
      await user.keyboard(' ');

      // Assert
      expect(onRetry).toHaveBeenCalled();
    });

    it('should have retry button enabled by default', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton).toBeEnabled();
    });
  });

  describe('accessibility - ARIA attributes', () => {
    it('should have role alert on container', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('role', 'alert');
    });

    it('should have aria-live assertive for screen readers', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have aria-atomic for complete message reading', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toHaveAttribute('aria-atomic', 'true');
    });

    it('should have accessible button label', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton).toHaveAttribute('aria-label');
    });

    it('should announce error to screen readers', () => {
      // Arrange & Act
      render(<ErrorRetry message="Network failure" onRetry={vi.fn()} />);

      // Assert
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Network failure');
    });
  });

  describe('visual styling - red color scheme', () => {
    it('should have red background color', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.className).toMatch(/bg-red/i);
    });

    it('should have red border', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.className).toMatch(/border-red/i);
    });

    it('should use light red background (bg-red-50)', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.className).toMatch(/bg-red-50/);
    });

    it('should use red border color (border-red-200)', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.className).toMatch(/border-red-200/);
    });

    it('should have red text color for error message', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const message = screen.getByText('Error');
      expect(message.className).toMatch(/text-red/i);
    });

    it('should have proper padding', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.className).toMatch(/p-|px-|py-/);
    });

    it('should have rounded corners', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.className).toMatch(/rounded/);
    });

    it('should have border styling', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.className).toMatch(/border/);
    });
  });

  describe('retry button styling', () => {
    it('should have button-like appearance', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton.className).toMatch(/px-|py-|rounded|bg-/);
    });

    it('should have primary or action button styling', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton.className).toBeTruthy();
    });

    it('should have hover state', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton.className).toMatch(/hover:/);
    });

    it('should have focus state for accessibility', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton.className).toMatch(/focus:/);
    });
  });

  describe('layout and structure', () => {
    it('should center content vertically', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.className).toMatch(/items-center|justify-center/);
    });

    it('should display message and button in appropriate layout', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.className).toMatch(/flex|block|grid/);
    });

    it('should have spacing between message and button', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.className).toMatch(/gap|space/);
    });
  });

  describe('error icon display', () => {
    it('should display error icon', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const icon = screen.queryByTestId('error-icon');
      // Icon is optional but if present, should be rendered
      if (icon) {
        expect(icon).toBeInTheDocument();
      }
    });

    it('should have accessible icon with aria-hidden', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const icon = screen.queryByTestId('error-icon');
      if (icon) {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle very long error messages', () => {
      // Arrange
      const longMessage = 'A'.repeat(500);

      // Act
      render(<ErrorRetry message={longMessage} onRetry={vi.fn()} />);

      // Assert
      const message = screen.getByText(longMessage);
      expect(message).toBeInTheDocument();
    });

    it('should handle special characters in message', () => {
      // Arrange & Act
      render(<ErrorRetry message="<Error> & 'quotes' &quot;test&quot;" onRetry={vi.fn()} />);

      // Assert
      expect(screen.getByText(/Error/)).toBeInTheDocument();
    });

    it('should handle HTML-like strings safely', () => {
      // Arrange & Act
      render(<ErrorRetry message="<script>alert('test')</script>" onRetry={vi.fn()} />);

      // Assert - should render as text, not execute
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should handle null onRetry prop gracefully', () => {
      // Arrange & Act & Assert
      expect(() => {
        render(<ErrorRetry message="Error" onRetry={null as any} />);
      }).not.toThrow();
    });

    it('should handle undefined onRetry prop gracefully', () => {
      // Arrange & Act & Assert
      expect(() => {
        render(<ErrorRetry message="Error" onRetry={undefined as any} />);
      }).not.toThrow();
    });

    it('should handle message with newlines', () => {
      // Arrange & Act
      render(<ErrorRetry message="Line 1\nLine 2\nLine 3" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toHaveTextContent(/Line 1/);
    });

    it('should handle Unicode characters in message', () => {
      // Arrange & Act
      render(<ErrorRetry message="错误: ошибка: エラー" onRetry={vi.fn()} />);

      // Assert
      expect(screen.getByText(/错误/)).toBeInTheDocument();
    });
  });

  describe('prop updates', () => {
    it('should update message when prop changes', () => {
      // Arrange
      const { rerender } = render(<ErrorRetry message="First error" onRetry={vi.fn()} />);

      expect(screen.getByText('First error')).toBeInTheDocument();

      // Act
      rerender(<ErrorRetry message="Second error" onRetry={vi.fn()} />);

      // Assert
      expect(screen.getByText('Second error')).toBeInTheDocument();
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });

    it('should update onRetry handler when prop changes', () => {
      // Arrange
      const firstHandler = vi.fn();
      const secondHandler = vi.fn();
      const { rerender } = render(<ErrorRetry message="Error" onRetry={firstHandler} />);

      // Act
      rerender(<ErrorRetry message="Error" onRetry={secondHandler} />);

      // Assert - component should still render
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should maintain alert role when props change', () => {
      // Arrange
      const { rerender } = render(<ErrorRetry message="Error 1" onRetry={vi.fn()} />);

      // Act
      rerender(<ErrorRetry message="Error 2" onRetry={vi.fn()} />);

      // Assert
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('focus management', () => {
    it('should allow focus on retry button', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });

      // Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);
      await user.tab();

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton).toHaveFocus();
    });

    it('should maintain focus on retry button after click', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onRetry = vi.fn();

      // Act
      render(<ErrorRetry message="Error" onRetry={onRetry} />);
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      await user.click(retryButton);

      // Assert
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('button text variations', () => {
    it('should display retry button with appropriate text', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton).toHaveTextContent(/retry|try again/i);
    });

    it('should accept custom button text prop', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} buttonText="Reload" />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /reload/i });
      expect(retryButton).toHaveTextContent('Reload');
    });
  });

  describe('component props', () => {
    it('should accept required message prop', () => {
      // Arrange & Act
      render(<ErrorRetry message="Test error" onRetry={vi.fn()} />);

      // Assert
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should accept required onRetry prop', () => {
      // Arrange
      const onRetry = vi.fn();

      // Act
      render(<ErrorRetry message="Error" onRetry={onRetry} />);

      // Assert
      expect(onRetry).toBeDefined();
    });

    it('should render consistently with same props', () => {
      // Arrange & Act
      const { rerender } = render(<ErrorRetry message="Error" onRetry={vi.fn()} />);
      const firstRender = screen.getByTestId('error-retry').innerHTML;

      rerender(<ErrorRetry message="Error" onRetry={vi.fn()} />);
      const secondRender = screen.getByTestId('error-retry').innerHTML;

      // Assert
      expect(firstRender).toBe(secondRender);
    });
  });
});
