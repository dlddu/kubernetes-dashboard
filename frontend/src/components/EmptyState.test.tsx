import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState Component', () => {
  describe('Basic Rendering', () => {
    it('should render empty state container', () => {
      // Act
      render(<EmptyState message="No data available" />);

      // Assert
      const container = screen.getByTestId('empty-state');
      expect(container).toBeInTheDocument();
    });

    it('should apply default testId when not provided', () => {
      // Act
      render(<EmptyState message="No data" />);

      // Assert
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should apply custom testId when provided', () => {
      // Act
      render(<EmptyState message="No data" testId="custom-empty" />);

      // Assert
      expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
    });
  });

  describe('Message Display', () => {
    it('should display the provided message', () => {
      // Arrange
      const message = 'No items found';

      // Act
      render(<EmptyState message={message} />);

      // Assert
      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('should display long messages correctly', () => {
      // Arrange
      const longMessage = 'This is a very long message that should still be displayed correctly in the empty state component';

      // Act
      render(<EmptyState message={longMessage} />);

      // Assert
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle empty message string', () => {
      // Act
      render(<EmptyState message="" />);

      // Assert
      const container = screen.getByTestId('empty-state');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Variant - Default', () => {
    it('should render default variant', () => {
      // Act
      render(<EmptyState message="No data" variant="default" />);

      // Assert
      const container = screen.getByTestId('empty-state');
      expect(container).toBeInTheDocument();
    });

    it('should apply bg-gray-50 for default variant', () => {
      // Act
      render(<EmptyState message="No data" variant="default" />);

      // Assert
      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('bg-gray-50');
    });

    it('should use default variant when not specified', () => {
      // Act
      render(<EmptyState message="No data" />);

      // Assert
      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('bg-gray-50');
    });
  });

  describe('Variant - Success', () => {
    it('should render success variant', () => {
      // Act
      render(<EmptyState message="All pods healthy" variant="success" />);

      // Assert
      const container = screen.getByTestId('empty-state');
      expect(container).toBeInTheDocument();
    });

    it('should apply bg-green-50 for success variant', () => {
      // Act
      render(<EmptyState message="All healthy" variant="success" />);

      // Assert
      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('bg-green-50');
    });

    it('should not apply bg-gray-50 for success variant', () => {
      // Act
      render(<EmptyState message="All healthy" variant="success" />);

      // Assert
      const container = screen.getByTestId('empty-state');
      expect(container.className).not.toContain('bg-gray-50');
    });
  });

  describe('Custom Icon', () => {
    it('should render custom icon when provided', () => {
      // Arrange
      const CustomIcon = <div data-testid="custom-icon">Icon</div>;

      // Act
      render(<EmptyState message="No data" icon={CustomIcon} />);

      // Assert
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('should not render icon when not provided', () => {
      // Act
      render(<EmptyState message="No data" />);

      // Assert
      const container = screen.getByTestId('empty-state');
      expect(container.querySelector('[data-testid="custom-icon"]')).not.toBeInTheDocument();
    });

    it('should render icon before message', () => {
      // Arrange
      const CustomIcon = <div data-testid="custom-icon">📦</div>;

      // Act
      render(<EmptyState message="No data" icon={CustomIcon} />);

      // Assert
      const icon = screen.getByTestId('custom-icon');
      const message = screen.getByText('No data');
      expect(icon).toBeInTheDocument();
      expect(message).toBeInTheDocument();
    });

    it('should accept complex icon elements', () => {
      // Arrange
      const ComplexIcon = (
        <svg data-testid="svg-icon" width="24" height="24">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );

      // Act
      render(<EmptyState message="No data" icon={ComplexIcon} />);

      // Assert
      expect(screen.getByTestId('svg-icon')).toBeInTheDocument();
    });
  });

  describe('Action Button', () => {
    it('should render action button when provided', () => {
      // Arrange
      const mockAction = {
        label: 'Add Item',
        onClick: vi.fn(),
      };

      // Act
      render(<EmptyState message="No data" action={mockAction} />);

      // Assert
      const button = screen.getByRole('button', { name: 'Add Item' });
      expect(button).toBeInTheDocument();
    });

    it('should not render action button when not provided', () => {
      // Act
      render(<EmptyState message="No data" />);

      // Assert
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('should call onClick when action button is clicked', () => {
      // Arrange
      const mockOnClick = vi.fn();
      const action = {
        label: 'Create New',
        onClick: mockOnClick,
      };

      // Act
      render(<EmptyState message="No data" action={action} />);
      const button = screen.getByRole('button', { name: 'Create New' });
      fireEvent.click(button);

      // Assert
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick multiple times when clicked multiple times', () => {
      // Arrange
      const mockOnClick = vi.fn();
      const action = {
        label: 'Refresh',
        onClick: mockOnClick,
      };

      // Act
      render(<EmptyState message="No data" action={action} />);
      const button = screen.getByRole('button', { name: 'Refresh' });
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Assert
      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });

    it('should display correct action label', () => {
      // Arrange
      const action = {
        label: 'Load More',
        onClick: vi.fn(),
      };

      // Act
      render(<EmptyState message="No data" action={action} />);

      // Assert
      expect(screen.getByText('Load More')).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should render icon, message, and action together', () => {
      // Arrange
      const icon = <div data-testid="test-icon">📋</div>;
      const action = {
        label: 'Add New',
        onClick: vi.fn(),
      };

      // Act
      render(
        <EmptyState
          message="No items yet"
          icon={icon}
          action={action}
        />
      );

      // Assert
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('No items yet')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add New' })).toBeInTheDocument();
    });

    it('should work with success variant and all props', () => {
      // Arrange
      const icon = <div data-testid="success-icon">✓</div>;
      const action = {
        label: 'View Details',
        onClick: vi.fn(),
      };

      // Act
      render(
        <EmptyState
          message="All pods healthy"
          variant="success"
          icon={icon}
          action={action}
        />
      );

      // Assert
      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('bg-green-50');
      expect(screen.getByTestId('success-icon')).toBeInTheDocument();
      expect(screen.getByText('All pods healthy')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View Details' })).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className when provided', () => {
      // Act
      render(<EmptyState message="No data" className="custom-class" />);

      // Assert
      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('custom-class');
    });

    it('should merge custom className with default classes', () => {
      // Act
      render(<EmptyState message="No data" className="mt-10" />);

      // Assert
      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('mt-10');
      expect(container.className).toContain('bg-gray-50');
    });

    it('should merge custom className with success variant classes', () => {
      // Act
      render(
        <EmptyState
          message="All healthy"
          variant="success"
          className="p-8"
        />
      );

      // Assert
      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('p-8');
      expect(container.className).toContain('bg-green-50');
    });
  });

  describe('Accessibility', () => {
    it('should have role="status" attribute', () => {
      // Act
      render(<EmptyState message="No data" />);

      // Assert
      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
    });

    it('should be accessible with screen reader', () => {
      // Act
      render(<EmptyState message="No items available" />);

      // Assert
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
      expect(screen.getByText('No items available')).toBeInTheDocument();
    });

    it('should have accessible action button', () => {
      // Arrange
      const action = {
        label: 'Create Item',
        onClick: vi.fn(),
      };

      // Act
      render(<EmptyState message="No data" action={action} />);

      // Assert
      const button = screen.getByRole('button', { name: 'Create Item' });
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
    });

    it('should have proper accessibility for all variants', () => {
      // Arrange
      const variants: Array<'default' | 'success'> = ['default', 'success'];

      variants.forEach((variant) => {
        // Act
        const { unmount } = render(
          <EmptyState message="Test message" variant={variant} />
        );

        // Assert
        const status = screen.getByRole('status');
        expect(status).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message gracefully', () => {
      // Act
      render(<EmptyState message="" />);

      // Assert
      const container = screen.getByTestId('empty-state');
      expect(container).toBeInTheDocument();
    });

    it('should handle special characters in message', () => {
      // Arrange
      const message = 'No data <found> & available';

      // Act
      render(<EmptyState message={message} />);

      // Assert
      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('should handle null icon gracefully', () => {
      // Act
      render(<EmptyState message="No data" icon={null} />);

      // Assert
      const container = screen.getByTestId('empty-state');
      expect(container).toBeInTheDocument();
    });

    it('should handle long action labels', () => {
      // Arrange
      const action = {
        label: 'This is a very long action button label that should still work',
        onClick: vi.fn(),
      };

      // Act
      render(<EmptyState message="No data" action={action} />);

      // Assert
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('should accept message as string', () => {
      // Act
      render(<EmptyState message="Test message" />);

      // Assert
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should accept variant as "default" or "success"', () => {
      // Act
      const { rerender } = render(
        <EmptyState message="Test" variant="default" />
      );
      const defaultContainer = screen.getByTestId('empty-state');
      expect(defaultContainer.className).toContain('bg-gray-50');

      // Act
      rerender(<EmptyState message="Test" variant="success" />);
      const successContainer = screen.getByTestId('empty-state');
      expect(successContainer.className).toContain('bg-green-50');
    });

    it('should accept icon as ReactNode', () => {
      // Arrange
      const icon = <span data-testid="react-node-icon">🎯</span>;

      // Act
      render(<EmptyState message="Test" icon={icon} />);

      // Assert
      expect(screen.getByTestId('react-node-icon')).toBeInTheDocument();
    });

    it('should accept action with label and onClick', () => {
      // Arrange
      const mockOnClick = vi.fn();
      const action = {
        label: 'Test Action',
        onClick: mockOnClick,
      };

      // Act
      render(<EmptyState message="Test" action={action} />);
      const button = screen.getByRole('button', { name: 'Test Action' });
      fireEvent.click(button);

      // Assert
      expect(mockOnClick).toHaveBeenCalled();
    });

    it('should accept className as string', () => {
      // Act
      render(<EmptyState message="Test" className="test-class" />);

      // Assert
      const container = screen.getByTestId('empty-state');
      expect(container.className).toContain('test-class');
    });

    it('should accept testId as string', () => {
      // Act
      render(<EmptyState message="Test" testId="my-empty-state" />);

      // Assert
      expect(screen.getByTestId('my-empty-state')).toBeInTheDocument();
    });
  });
});
