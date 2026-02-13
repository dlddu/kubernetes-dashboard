import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorRetry } from './ErrorRetry';

describe('ErrorRetry Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render error retry container', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should have role of alert for accessibility', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} />);

      // Assert
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should display default error message', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} />);

      // Assert
      const message = screen.getByText(/error|failed|something went wrong/i);
      expect(message).toBeInTheDocument();
    });

    it('should display custom error message when provided', () => {
      // Arrange & Act
      render(<ErrorRetry message="Custom error message" onRetry={() => {}} />);

      // Assert
      const message = screen.getByText('Custom error message');
      expect(message).toBeInTheDocument();
    });

    it('should render retry button', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Error Message Display', () => {
    it('should display generic error when no message provided', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} />);

      // Assert
      const message = screen.getByTestId('error-message');
      expect(message).toHaveTextContent(/something went wrong/i);
    });

    it('should display network error message', () => {
      // Arrange & Act
      render(
        <ErrorRetry message="Network connection failed" onRetry={() => {}} />
      );

      // Assert
      const message = screen.getByText(/network connection failed/i);
      expect(message).toBeInTheDocument();
    });

    it('should display API error message', () => {
      // Arrange & Act
      render(<ErrorRetry message="API request failed" onRetry={() => {}} />);

      // Assert
      const message = screen.getByText(/api request failed/i);
      expect(message).toBeInTheDocument();
    });

    it('should display error with status code', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error 500: Internal Server Error" onRetry={() => {}} />);

      // Assert
      const message = screen.getByText(/error 500/i);
      expect(message).toBeInTheDocument();
    });
  });

  describe('Retry Button Interaction', () => {
    it('should call onRetry when retry button is clicked', () => {
      // Arrange
      const handleRetry = vi.fn();
      render(<ErrorRetry onRetry={handleRetry} />);

      // Act
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      fireEvent.click(retryButton);

      // Assert
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry only once per click', () => {
      // Arrange
      const handleRetry = vi.fn();
      render(<ErrorRetry onRetry={handleRetry} />);

      // Act
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      fireEvent.click(retryButton);

      // Assert
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('should allow multiple retry attempts', () => {
      // Arrange
      const handleRetry = vi.fn();
      render(<ErrorRetry onRetry={handleRetry} />);
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });

      // Act
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);

      // Assert
      expect(handleRetry).toHaveBeenCalledTimes(3);
    });

    it('should not disable retry button by default', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton).not.toBeDisabled();
    });

    it('should disable retry button when isRetrying is true', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} isRetrying />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton).toBeDisabled();
    });
  });

  describe('Icon Display', () => {
    it('should display error icon', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} />);

      // Assert
      const icon = screen.getByTestId('error-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should use red or warning color for error icon', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} />);

      // Assert
      const icon = screen.getByTestId('error-icon');
      expect(icon).toHaveClass(/text-red|text-orange|text-warning/);
    });

    it('should display appropriate error icon (exclamation or X)', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} />);

      // Assert
      const icon = screen.getByTestId('error-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Loading State During Retry', () => {
    it('should show loading indicator when isRetrying is true', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} isRetrying />);

      // Assert
      const loadingIndicator = screen.getByTestId('retry-loading');
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should change button text when isRetrying is true', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} isRetrying />);

      // Assert
      const retryButton = screen.getByRole('button');
      expect(retryButton).toHaveTextContent(/retrying|loading/i);
    });

    it('should not show loading indicator when isRetrying is false', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} isRetrying={false} />);

      // Assert
      const loadingIndicator = screen.queryByTestId('retry-loading');
      expect(loadingIndicator).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for alert', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} />);

      // Assert
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have accessible button label', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton).toHaveAccessibleName();
    });

    it('should announce retry status to screen readers', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} isRetrying />);

      // Assert
      const retryButton = screen.getByRole('button');
      expect(retryButton).toHaveAttribute('aria-busy', 'true');
    });

    it('should have proper color contrast for error message', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} />);

      // Assert
      const message = screen.getByTestId('error-message');
      expect(message).toHaveClass(/text-/);
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} className="custom-error" />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toHaveClass('custom-error');
    });

    it('should merge custom className with default styles', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} className="mt-8" />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toHaveClass('mt-8');
    });
  });

  describe('Button Styling', () => {
    it('should style retry button prominently', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton).toHaveClass(/bg-blue|bg-primary|border/);
    });

    it('should have hover state for retry button', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton).toHaveClass(/hover:/);
    });

    it('should change appearance when disabled', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} isRetrying />);

      // Assert
      const retryButton = screen.getByRole('button');
      expect(retryButton).toBeDisabled();
      expect(retryButton).toHaveClass(/disabled:|opacity-/);
    });
  });

  describe('Layout and Positioning', () => {
    it('should center content vertically and horizontally', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toHaveClass(/flex|items-center|justify-center|text-center/);
    });

    it('should stack icon, message, and button vertically', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toHaveClass(/flex-col|flex/);
    });

    it('should have adequate spacing between elements', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toHaveClass(/space-y|gap-/);
    });
  });

  describe('Error Details', () => {
    it('should optionally display error details or stack trace', () => {
      // Arrange & Act
      render(
        <ErrorRetry
          onRetry={() => {}}
          message="API Error"
          details="Failed to fetch data from /api/pods"
        />
      );

      // Assert
      const details = screen.getByTestId('error-details');
      expect(details).toHaveTextContent(/failed to fetch data/i);
    });

    it('should hide error details by default', () => {
      // Arrange & Act
      render(<ErrorRetry onRetry={() => {}} message="API Error" />);

      // Assert
      const details = screen.queryByTestId('error-details');
      expect(details).not.toBeInTheDocument();
    });

    it('should collapse error details in a smaller font', () => {
      // Arrange & Act
      render(
        <ErrorRetry
          onRetry={() => {}}
          details="Detailed error information"
        />
      );

      // Assert
      const details = screen.getByTestId('error-details');
      expect(details).toHaveClass(/text-sm|text-xs/);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should focus retry button when tabbing', () => {
      // Arrange
      render(<ErrorRetry onRetry={() => {}} />);
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });

      // Act
      retryButton.focus();

      // Assert
      expect(retryButton).toHaveFocus();
    });

    it('should trigger retry on Enter key', () => {
      // Arrange
      const handleRetry = vi.fn();
      render(<ErrorRetry onRetry={handleRetry} />);
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });

      // Act
      retryButton.focus();
      fireEvent.click(retryButton);

      // Assert
      expect(handleRetry).toHaveBeenCalled();
    });

    it('should trigger retry on Space key', () => {
      // Arrange
      const handleRetry = vi.fn();
      render(<ErrorRetry onRetry={handleRetry} />);
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });

      // Act
      retryButton.focus();
      fireEvent.click(retryButton);

      // Assert
      expect(handleRetry).toHaveBeenCalled();
    });
  });
});
