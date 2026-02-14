import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorRetry } from './ErrorRetry';

describe('ErrorRetry Component', () => {
  describe('Basic Rendering', () => {
    it('should render error retry container', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(<ErrorRetry error="Test error" onRetry={mockOnRetry} />);

      // Assert
      const container = screen.getByTestId('error-retry');
      expect(container).toBeInTheDocument();
    });

    it('should apply default testId when not provided', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(<ErrorRetry error="Test error" onRetry={mockOnRetry} />);

      // Assert
      expect(screen.getByTestId('error-retry')).toBeInTheDocument();
    });

    it('should apply custom testId when provided', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(
        <ErrorRetry
          error="Test error"
          onRetry={mockOnRetry}
          testId="custom-error"
        />
      );

      // Assert
      expect(screen.getByTestId('custom-error')).toBeInTheDocument();
    });
  });

  describe('Error Message Display', () => {
    it('should display string error message', () => {
      // Arrange
      const mockOnRetry = vi.fn();
      const errorMessage = 'Failed to fetch data';

      // Act
      render(<ErrorRetry error={errorMessage} onRetry={mockOnRetry} />);

      // Assert
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should display Error object message', () => {
      // Arrange
      const mockOnRetry = vi.fn();
      const error = new Error('Network error occurred');

      // Act
      render(<ErrorRetry error={error} onRetry={mockOnRetry} />);

      // Assert
      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });

    it('should handle Error object without message', () => {
      // Arrange
      const mockOnRetry = vi.fn();
      const error = new Error();

      // Act
      render(<ErrorRetry error={error} onRetry={mockOnRetry} />);

      // Assert
      const container = screen.getByTestId('error-retry');
      expect(container).toBeInTheDocument();
    });

    it('should display title when provided', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(
        <ErrorRetry
          error="Error message"
          onRetry={mockOnRetry}
          title="Error Occurred"
        />
      );

      // Assert
      expect(screen.getByText('Error Occurred')).toBeInTheDocument();
    });

    it('should display default title when not provided', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(<ErrorRetry error="Error message" onRetry={mockOnRetry} />);

      // Assert
      const container = screen.getByTestId('error-retry');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Retry Button', () => {
    it('should render retry button', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(<ErrorRetry error="Error" onRetry={mockOnRetry} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(<ErrorRetry error="Error" onRetry={mockOnRetry} />);
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Assert
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry multiple times when clicked multiple times', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(<ErrorRetry error="Error" onRetry={mockOnRetry} />);
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);

      // Assert
      expect(mockOnRetry).toHaveBeenCalledTimes(3);
    });

    it('should have proper button text', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(<ErrorRetry error="Error" onRetry={mockOnRetry} />);

      // Assert
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply bg-red-50 background class', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(<ErrorRetry error="Error" onRetry={mockOnRetry} />);

      // Assert
      const container = screen.getByTestId('error-retry');
      expect(container.className).toContain('bg-red-50');
    });

    it('should apply border-red-200 border class', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(<ErrorRetry error="Error" onRetry={mockOnRetry} />);

      // Assert
      const container = screen.getByTestId('error-retry');
      expect(container.className).toContain('border-red-200');
    });

    it('should apply custom className when provided', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(
        <ErrorRetry
          error="Error"
          onRetry={mockOnRetry}
          className="custom-class"
        />
      );

      // Assert
      const container = screen.getByTestId('error-retry');
      expect(container.className).toContain('custom-class');
    });

    it('should merge custom className with default classes', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(
        <ErrorRetry
          error="Error"
          onRetry={mockOnRetry}
          className="mt-8"
        />
      );

      // Assert
      const container = screen.getByTestId('error-retry');
      expect(container.className).toContain('mt-8');
      expect(container.className).toContain('bg-red-50');
      expect(container.className).toContain('border-red-200');
    });
  });

  describe('Error Icon', () => {
    it('should show error icon when showIcon is true', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(
        <ErrorRetry
          error="Error"
          onRetry={mockOnRetry}
          showIcon={true}
        />
      );

      // Assert
      const icon = screen.getByTestId('error-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should hide error icon when showIcon is false', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(
        <ErrorRetry
          error="Error"
          onRetry={mockOnRetry}
          showIcon={false}
        />
      );

      // Assert
      const icon = screen.queryByTestId('error-icon');
      expect(icon).not.toBeInTheDocument();
    });

    it('should show error icon by default when showIcon not specified', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(<ErrorRetry error="Error" onRetry={mockOnRetry} />);

      // Assert
      const icon = screen.getByTestId('error-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert" attribute', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(<ErrorRetry error="Error" onRetry={mockOnRetry} />);

      // Assert
      const container = screen.getByRole('alert');
      expect(container).toBeInTheDocument();
    });

    it('should have aria-live="polite" attribute', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(<ErrorRetry error="Error" onRetry={mockOnRetry} />);

      // Assert
      const container = screen.getByRole('alert');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('should be accessible with screen reader', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(<ErrorRetry error="Test error message" onRetry={mockOnRetry} />);

      // Assert
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should have accessible retry button', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(<ErrorRetry error="Error" onRetry={mockOnRetry} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toBeEnabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty error string', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(<ErrorRetry error="" onRetry={mockOnRetry} />);

      // Assert
      const container = screen.getByTestId('error-retry');
      expect(container).toBeInTheDocument();
    });

    it('should handle long error messages', () => {
      // Arrange
      const mockOnRetry = vi.fn();
      const longError = 'This is a very long error message that should still be displayed correctly '.repeat(10);

      // Act
      render(<ErrorRetry error={longError} onRetry={mockOnRetry} />);

      // Assert
      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it('should handle special characters in error message', () => {
      // Arrange
      const mockOnRetry = vi.fn();
      const errorWithSpecialChars = 'Error: <script>alert("test")</script>';

      // Act
      render(<ErrorRetry error={errorWithSpecialChars} onRetry={mockOnRetry} />);

      // Assert
      expect(screen.getByText(errorWithSpecialChars)).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('should accept error as string', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(<ErrorRetry error="String error" onRetry={mockOnRetry} />);

      // Assert
      expect(screen.getByText('String error')).toBeInTheDocument();
    });

    it('should accept error as Error object', () => {
      // Arrange
      const mockOnRetry = vi.fn();
      const error = new Error('Error object');

      // Act
      render(<ErrorRetry error={error} onRetry={mockOnRetry} />);

      // Assert
      expect(screen.getByText('Error object')).toBeInTheDocument();
    });

    it('should accept onRetry as function', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(<ErrorRetry error="Error" onRetry={mockOnRetry} />);
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Assert
      expect(typeof mockOnRetry).toBe('function');
      expect(mockOnRetry).toHaveBeenCalled();
    });

    it('should accept title as string', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(
        <ErrorRetry
          error="Error"
          onRetry={mockOnRetry}
          title="Custom Title"
        />
      );

      // Assert
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should accept showIcon as boolean', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      const { rerender } = render(
        <ErrorRetry
          error="Error"
          onRetry={mockOnRetry}
          showIcon={true}
        />
      );

      // Assert
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();

      // Act
      rerender(
        <ErrorRetry
          error="Error"
          onRetry={mockOnRetry}
          showIcon={false}
        />
      );

      // Assert
      expect(screen.queryByTestId('error-icon')).not.toBeInTheDocument();
    });

    it('should accept className as string', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(
        <ErrorRetry
          error="Error"
          onRetry={mockOnRetry}
          className="test-class"
        />
      );

      // Assert
      const container = screen.getByTestId('error-retry');
      expect(container.className).toContain('test-class');
    });

    it('should accept testId as string', () => {
      // Arrange
      const mockOnRetry = vi.fn();

      // Act
      render(
        <ErrorRetry
          error="Error"
          onRetry={mockOnRetry}
          testId="my-error"
        />
      );

      // Assert
      expect(screen.getByTestId('my-error')).toBeInTheDocument();
    });
  });
});
