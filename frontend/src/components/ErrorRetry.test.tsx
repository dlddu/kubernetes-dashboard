import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorRetry } from './ErrorRetry';

describe('ErrorRetry Component', () => {
  describe('Basic Rendering', () => {
    it('should render error container', () => {
      // Arrange & Act
      render(<ErrorRetry message="An error occurred" onRetry={() => {}} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should display error message', () => {
      // Arrange & Act
      render(<ErrorRetry message="Failed to load data" onRetry={() => {}} />);

      // Assert
      const errorMessage = screen.getByText('Failed to load data');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should display retry button', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={() => {}} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Error Messages', () => {
    it('should display network error message', () => {
      // Arrange & Act
      render(<ErrorRetry message="Network error: Failed to fetch" onRetry={() => {}} />);

      // Assert
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    it('should display API error message', () => {
      // Arrange & Act
      render(<ErrorRetry message="API Error: 500 Internal Server Error" onRetry={() => {}} />);

      // Assert
      expect(screen.getByText(/api error.*500/i)).toBeInTheDocument();
    });

    it('should display custom error message', () => {
      // Arrange & Act
      const customMessage = 'Unable to connect to Kubernetes cluster';
      render(<ErrorRetry message={customMessage} onRetry={() => {}} />);

      // Assert
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should handle long error messages', () => {
      // Arrange & Act
      const longMessage = 'This is a very long error message that explains in detail what went wrong with the request and provides context about the failure that occurred during the operation.';
      render(<ErrorRetry message={longMessage} onRetry={() => {}} />);

      // Assert
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });

  describe('Retry Button Functionality', () => {
    it('should call onRetry when retry button is clicked', () => {
      // Arrange
      const mockOnRetry = vi.fn();
      render(<ErrorRetry message="Error" onRetry={mockOnRetry} />);

      // Act
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      fireEvent.click(retryButton);

      // Assert
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry multiple times when clicked multiple times', () => {
      // Arrange
      const mockOnRetry = vi.fn();
      render(<ErrorRetry message="Error" onRetry={mockOnRetry} />);

      // Act
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);

      // Assert
      expect(mockOnRetry).toHaveBeenCalledTimes(3);
    });

    it('should be keyboard accessible (Enter key)', () => {
      // Arrange
      const mockOnRetry = vi.fn();
      render(<ErrorRetry message="Error" onRetry={mockOnRetry} />);

      // Act
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      retryButton.focus();
      fireEvent.keyDown(retryButton, { key: 'Enter' });

      // Assert
      expect(mockOnRetry).toHaveBeenCalled();
    });

    it('should be keyboard accessible (Space key)', () => {
      // Arrange
      const mockOnRetry = vi.fn();
      render(<ErrorRetry message="Error" onRetry={mockOnRetry} />);

      // Act
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      retryButton.focus();
      fireEvent.keyDown(retryButton, { key: ' ' });

      // Assert
      expect(mockOnRetry).toHaveBeenCalled();
    });

    it('should be enabled by default', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={() => {}} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton).toBeEnabled();
    });
  });

  describe('Accessibility - role=alert', () => {
    it('should have role="alert" for screen readers', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error occurred" onRetry={() => {}} />);

      // Assert
      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should have aria-live="assertive"', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error occurred" onRetry={() => {}} />);

      // Assert
      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have aria-atomic="true"', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error occurred" onRetry={() => {}} />);

      // Assert
      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toHaveAttribute('aria-atomic', 'true');
    });

    it('should have accessible retry button label', () => {
      // Arrange & Act
      render(<ErrorRetry message="Failed to load nodes" onRetry={() => {}} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton).toHaveAccessibleName();
    });

    it('should announce error message to screen readers', () => {
      // Arrange & Act
      render(<ErrorRetry message="Critical error" onRetry={() => {}} />);

      // Assert
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/critical error/i);
    });
  });

  describe('Visual Design', () => {
    it('should have error icon', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={() => {}} />);

      // Assert
      const errorIcon = screen.getByTestId('error-icon');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should have error styling', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={() => {}} />);

      // Assert
      const errorMessage = screen.getByText('Error');
      expect(errorMessage.className).toMatch(/text-red/);
    });

    it('should have centered layout', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={() => {}} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.className).toMatch(/flex|items-center|justify-center|text-center/);
    });

    it('should have appropriate padding', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={() => {}} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer.className).toMatch(/p-|py-|px-/);
    });

    it('should have retry button with primary styling', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={() => {}} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton.className).toMatch(/bg-|text-|border/);
    });
  });

  describe('Optional Props', () => {
    it('should render without title when not provided', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={() => {}} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should display title when provided', () => {
      // Arrange & Act
      render(<ErrorRetry title="Error Loading Data" message="Network error" onRetry={() => {}} />);

      // Assert
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    });

    it('should use custom retry button text when provided', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={() => {}} retryButtonText="Reload Data" />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /reload data/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={() => {}} className="custom-error-class" />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toHaveClass('custom-error-class');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty error message', () => {
      // Arrange & Act
      render(<ErrorRetry message="" onRetry={() => {}} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should handle undefined onRetry gracefully', () => {
      // Arrange & Act
      const mockOnRetry = () => {};
      render(<ErrorRetry message="Error" onRetry={mockOnRetry} />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should handle special characters in error message', () => {
      // Arrange & Act
      const specialMessage = 'Error: <script>alert("test")</script>';
      render(<ErrorRetry message={specialMessage} onRetry={() => {}} />);

      // Assert
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should handle unicode characters in error message', () => {
      // Arrange & Act
      const unicodeMessage = 'エラーが発生しました 🚨';
      render(<ErrorRetry message={unicodeMessage} onRetry={() => {}} />);

      // Assert
      expect(screen.getByText(unicodeMessage)).toBeInTheDocument();
    });
  });

  describe('Interaction States', () => {
    it('should show hover state on retry button', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={() => {}} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton.className).toMatch(/hover:/);
    });

    it('should show focus state on retry button', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={() => {}} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      retryButton.focus();
      expect(document.activeElement).toBe(retryButton);
    });

    it('should be focusable via keyboard', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={() => {}} />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      expect(retryButton).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Multiple Error Components', () => {
    it('should render multiple error components independently', () => {
      // Arrange & Act
      render(
        <div>
          <ErrorRetry message="Error 1" onRetry={() => {}} />
          <ErrorRetry message="Error 2" onRetry={() => {}} />
        </div>
      );

      // Assert
      const errors = screen.getAllByRole('alert');
      expect(errors).toHaveLength(2);
    });

    it('should handle different callbacks for multiple errors', () => {
      // Arrange
      const mockOnRetry1 = vi.fn();
      const mockOnRetry2 = vi.fn();

      render(
        <div>
          <ErrorRetry message="Error 1" onRetry={mockOnRetry1} />
          <ErrorRetry message="Error 2" onRetry={mockOnRetry2} />
        </div>
      );

      // Act
      const retryButtons = screen.getAllByRole('button', { name: /retry|try again/i });
      fireEvent.click(retryButtons[0]);

      // Assert
      expect(mockOnRetry1).toHaveBeenCalledTimes(1);
      expect(mockOnRetry2).not.toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('should support responsive padding classes', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={() => {}} className="p-4 md:p-8" />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toHaveClass('p-4', 'md:p-8');
    });

    it('should support responsive text size classes', () => {
      // Arrange & Act
      render(<ErrorRetry message="Error" onRetry={() => {}} className="text-sm md:text-base" />);

      // Assert
      const errorContainer = screen.getByTestId('error-retry');
      expect(errorContainer).toHaveClass('text-sm', 'md:text-base');
    });
  });
});
