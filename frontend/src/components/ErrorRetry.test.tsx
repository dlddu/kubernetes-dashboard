import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorRetry } from './ErrorRetry';

describe('ErrorRetry Component', () => {
  describe('Basic Rendering', () => {
    it('should render error container', () => {
      // Arrange & Act
      render(<ErrorRetry message="Failed to load data" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should display error message', () => {
      // Arrange & Act
      render(
        <ErrorRetry message="Network connection failed" onRetry={vi.fn()} />
      );

      // Assert
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });

    it('should display retry button', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error occurred" onRetry={vi.fn()} />);

      // Assert
      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toBeInTheDocument();
    });

    it('should display error icon', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorIcon = screen.getByTestId('error-icon');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should render retry button with correct text', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('should call onRetry when retry button is clicked', () => {
      // Arrange
      const onRetryMock = vi.fn();
      render(<ErrorRetry message="Error" onRetry={onRetryMock} />);

      // Act
      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      // Assert
      expect(onRetryMock).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry multiple times when clicked multiple times', () => {
      // Arrange
      const onRetryMock = vi.fn();
      render(<ErrorRetry message="Error" onRetry={onRetryMock} />);

      // Act
      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);

      // Assert
      expect(onRetryMock).toHaveBeenCalledTimes(3);
    });

    it('should not crash if onRetry is called with no props', () => {
      // Arrange
      const onRetryMock = vi.fn();
      render(<ErrorRetry message="Error" onRetry={onRetryMock} />);

      // Act
      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      // Assert
      expect(onRetryMock).toHaveBeenCalledWith();
    });
  });

  describe('Message Display', () => {
    it('should display short error messages', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should display long error messages', () => {
      // Arrange
      const longMessage =
        'Failed to connect to the Kubernetes API server. Please check your network connection and try again.';

      // Act
      render(<ErrorRetry message={longMessage} onRetry={vi.fn()} />);

      // Assert
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should display multiline error messages', () => {
      // Arrange
      const multilineMessage = 'Error occurred.\nPlease try again.';

      // Act
      render(<ErrorRetry message={multilineMessage} onRetry={vi.fn()} />);

      // Assert
      const errorMessage = screen.getByText(/Error occurred/);
      expect(errorMessage).toBeInTheDocument();
    });

    it('should handle empty error message', () => {
      // Arrange & Act
      render(<ErrorRetry message="" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should display error message with HTML special characters', () => {
      // Arrange & Act
      render(
        <ErrorRetry message="Error: <Network> failed & retry" onRetry={vi.fn()} />
      );

      // Assert
      expect(screen.getByText(/Error: <Network> failed & retry/)).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should have centered layout', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.className).toMatch(/flex|items-center|justify-center/);
    });

    it('should have vertical layout (icon, message, button)', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.className).toMatch(/flex-col/);
    });

    it('should have spacing between elements', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.className).toMatch(/space-y|gap/);
    });

    it('should have padding', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.className).toMatch(/p-|px-|py-/);
    });

    it('should center text', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorMessage = screen.getByText('Error');
      expect(errorMessage.className).toMatch(/text-center/);
    });
  });

  describe('Icon Styling', () => {
    it('should render error icon with red color', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorIcon = screen.getByTestId('error-icon');
      expect(errorIcon.className).toMatch(/text-red|text-error/);
    });

    it('should have appropriate icon size', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorIcon = screen.getByTestId('error-icon');
      expect(errorIcon.className).toMatch(/w-|h-/);
    });

    it('should render icon as SVG element', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorIcon = screen.getByTestId('error-icon');
      expect(errorIcon.tagName).toBe('svg');
    });
  });

  describe('Button Styling', () => {
    it('should style retry button as primary action', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton.className).toMatch(/bg-blue|bg-primary/);
    });

    it('should have rounded button corners', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton.className).toMatch(/rounded/);
    });

    it('should have padding on button', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton.className).toMatch(/px-|py-/);
    });

    it('should have hover effect on button', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton.className).toMatch(/hover:/);
    });

    it('should have white text on button', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton.className).toMatch(/text-white/);
    });
  });

  describe('Accessibility', () => {
    it('should have alert role for error container', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should have aria-live="assertive" for errors', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have button role on retry button', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should have accessible button label', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={vi.fn()} />);

      // Assert
      const retryButton = screen.getByTestId('retry-button');
      const buttonText = retryButton.textContent;
      expect(buttonText).toMatch(/retry|try again/i);
    });

    it('should support keyboard navigation on button', () => {
      // Arrange
      const onRetryMock = vi.fn();
      render(<ErrorRetry message="Error" onRetry={onRetryMock} />);

      // Act
      const retryButton = screen.getByTestId('retry-button');
      retryButton.focus();
      fireEvent.keyDown(retryButton, { key: 'Enter', code: 'Enter' });

      // Assert
      expect(document.activeElement).toBe(retryButton);
    });

    it('should have aria-describedby linking message to button', () => {
      // Arrange & Act
      render(<ErrorRetry message="Connection failed" onRetry={vi.fn()} />);

      // Assert
      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toHaveAttribute('aria-describedby');
    });
  });

  describe('Custom Props', () => {
    it('should accept custom retry button text', () => {
      // Arrange & Act
      render(
        <ErrorRetry
          message="Error"
          onRetry={vi.fn()}
          retryButtonText="다시 시도"
        />
      );

      // Assert
      expect(screen.getByText('다시 시도')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      // Arrange & Act
      render(
        <ErrorRetry
          message="Error"
          onRetry={vi.fn()}
          className="custom-error-class"
        />
      );

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.className).toContain('custom-error-class');
    });

    it('should merge custom className with default classes', () => {
      // Arrange & Act
      render(
        <ErrorRetry message="Error" onRetry={vi.fn()} className="my-8" />
      );

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.className).toContain('my-8');
      expect(errorContainer.className).toMatch(/flex/);
    });
  });

  describe('Optional Title', () => {
    it('should display title when provided', () => {
      // Arrange & Act
      render(
        <ErrorRetry
          title="Error Loading Data"
          message="Failed to fetch pods"
          onRetry={vi.fn()}
        />
      );

      // Assert
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    });

    it('should not display title when not provided', () => {
      // Arrange & Act
      render(<ErrorRetry message="Failed to fetch pods" onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.textContent).not.toContain('Error Loading Data');
    });

    it('should style title as heading', () => {
      // Arrange & Act
      render(
        <ErrorRetry title="Error" message="Failed" onRetry={vi.fn()} />
      );

      // Assert
      const heading = screen.getByRole('heading', { name: 'Error' });
      expect(heading).toBeInTheDocument();
    });

    it('should have larger font size for title', () => {
      // Arrange & Act
      render(
        <ErrorRetry title="Error" message="Failed" onRetry={vi.fn()} />
      );

      // Assert
      const heading = screen.getByRole('heading', { name: 'Error' });
      expect(heading.className).toMatch(/text-lg|text-xl|font-semibold|font-bold/);
    });
  });

  describe('Component State', () => {
    it('should maintain state after retry click', () => {
      // Arrange
      const onRetryMock = vi.fn();
      render(<ErrorRetry message="Error" onRetry={onRetryMock} />);

      // Act
      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      // Assert
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(onRetryMock).toHaveBeenCalled();
    });

    it('should re-render when message prop changes', () => {
      // Arrange
      const { rerender } = render(
        <ErrorRetry message="First error" onRetry={vi.fn()} />
      );
      expect(screen.getByText('First error')).toBeInTheDocument();

      // Act
      rerender(<ErrorRetry message="Second error" onRetry={vi.fn()} />);

      // Assert
      expect(screen.getByText('Second error')).toBeInTheDocument();
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });

    it('should re-render when onRetry prop changes', () => {
      // Arrange
      const firstRetry = vi.fn();
      const { rerender } = render(
        <ErrorRetry message="Error" onRetry={firstRetry} />
      );

      // Act
      const secondRetry = vi.fn();
      rerender(<ErrorRetry message="Error" onRetry={secondRetry} />);

      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      // Assert
      expect(firstRetry).not.toHaveBeenCalled();
      expect(secondRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Types', () => {
    it('should handle network errors', () => {
      // Arrange & Act
      render(
        <ErrorRetry message="Network request failed" onRetry={vi.fn()} />
      );

      // Assert
      expect(screen.getByText('Network request failed')).toBeInTheDocument();
    });

    it('should handle API errors', () => {
      // Arrange & Act
      render(
        <ErrorRetry message="API returned 500 error" onRetry={vi.fn()} />
      );

      // Assert
      expect(screen.getByText('API returned 500 error')).toBeInTheDocument();
    });

    it('should handle timeout errors', () => {
      // Arrange & Act
      render(<ErrorRetry message="Request timeout" onRetry={vi.fn()} />);

      // Assert
      expect(screen.getByText('Request timeout')).toBeInTheDocument();
    });

    it('should handle generic errors', () => {
      // Arrange & Act
      render(
        <ErrorRetry message="Something went wrong" onRetry={vi.fn()} />
      );

      // Assert
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null onRetry gracefully', () => {
      // Arrange & Act
      // @ts-expect-error: Testing null onRetry
      render(<ErrorRetry message="Error" onRetry={null} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should handle undefined message', () => {
      // Arrange & Act
      // @ts-expect-error: Testing undefined message
      render(<ErrorRetry message={undefined} onRetry={vi.fn()} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should prevent default form submission behavior', () => {
      // Arrange
      const onRetryMock = vi.fn();
      render(<ErrorRetry message="Error" onRetry={onRetryMock} />);

      // Act
      const retryButton = screen.getByTestId('retry-button');
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      retryButton.dispatchEvent(clickEvent);

      // Assert
      expect(onRetryMock).toHaveBeenCalled();
    });
  });

  describe('Visual Consistency', () => {
    it('should render consistently with same props', () => {
      // Arrange
      const { rerender } = render(
        <ErrorRetry message="Error" onRetry={vi.fn()} />
      );
      const firstRender = screen.getByTestId('error-retry').innerHTML;

      // Act
      rerender(<ErrorRetry message="Error" onRetry={vi.fn()} />);
      const secondRender = screen.getByTestId('error-retry').innerHTML;

      // Assert
      expect(firstRender).toBe(secondRender);
    });

    it('should maintain layout with different message lengths', () => {
      // Arrange & Act
      const { container } = render(
        <ErrorRetry message="Short" onRetry={vi.fn()} />
      );
      const shortLayout = container.querySelector('[data-testid="error-retry"]');

      const { container: container2 } = render(
        <ErrorRetry
          message="This is a very long error message that should still display correctly"
          onRetry={vi.fn()}
        />
      );
      const longLayout = container2.querySelector('[data-testid="error-retry"]');

      // Assert: Both should have same layout classes
      expect(shortLayout?.className).toMatch(/flex/);
      expect(longLayout?.className).toMatch(/flex/);
    });
  });
});
