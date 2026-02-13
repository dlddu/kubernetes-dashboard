import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState Component', () => {
  describe('Basic Rendering', () => {
    it('should render empty state container', () => {
      // Arrange & Act
      render(<EmptyState message="No data available" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should display message', () => {
      // Arrange & Act
      render(<EmptyState message="No pods found" />);

      // Assert
      const message = screen.getByText('No pods found');
      expect(message).toBeInTheDocument();
    });

    it('should render without crashing when only message provided', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe('Icon/Illustration Display', () => {
    it('should display default icon when no icon provided', () => {
      // Arrange & Act
      render(<EmptyState message="No data" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should display custom icon when provided', () => {
      // Arrange
      const CustomIcon = () => <div data-testid="custom-icon">Custom</div>;

      // Act
      render(<EmptyState message="No data" icon={<CustomIcon />} />);

      // Assert
      const customIcon = screen.getByTestId('custom-icon');
      expect(customIcon).toBeInTheDocument();
    });

    it('should display illustration when provided', () => {
      // Arrange & Act
      render(<EmptyState message="No data" illustration="/path/to/illustration.svg" />);

      // Assert
      const illustration = screen.getByRole('img');
      expect(illustration).toHaveAttribute('src', '/path/to/illustration.svg');
    });

    it('should hide icon when showIcon is false', () => {
      // Arrange & Act
      render(<EmptyState message="No data" showIcon={false} />);

      // Assert
      const icon = screen.queryByTestId('empty-state-icon');
      expect(icon).not.toBeInTheDocument();
    });
  });

  describe('Description Message', () => {
    it('should display description when provided', () => {
      // Arrange & Act
      render(
        <EmptyState
          message="No nodes available"
          description="There are no nodes in the cluster at the moment"
        />
      );

      // Assert
      const description = screen.getByText(/there are no nodes in the cluster/i);
      expect(description).toBeInTheDocument();
    });

    it('should render without description when not provided', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should handle multiline descriptions', () => {
      // Arrange & Act
      const multilineDesc = 'Line 1\nLine 2\nLine 3';
      render(<EmptyState message="Empty" description={multilineDesc} />);

      // Assert
      expect(screen.getByText(/line 1/i)).toBeInTheDocument();
    });

    it('should display long descriptions properly', () => {
      // Arrange & Act
      const longDesc = 'This is a very long description that explains in detail why there is no data to display and what the user can do about it.';
      render(<EmptyState message="Empty" description={longDesc} />);

      // Assert
      expect(screen.getByText(longDesc)).toBeInTheDocument();
    });
  });

  describe('Action Button (Optional)', () => {
    it('should not render action button when not provided', () => {
      // Arrange & Act
      render(<EmptyState message="No data" />);

      // Assert
      const actionButton = screen.queryByRole('button');
      expect(actionButton).not.toBeInTheDocument();
    });

    it('should display action button when provided', () => {
      // Arrange & Act
      render(
        <EmptyState
          message="No data"
          actionButtonText="Create New"
          onAction={() => {}}
        />
      );

      // Assert
      const actionButton = screen.getByRole('button', { name: /create new/i });
      expect(actionButton).toBeInTheDocument();
    });

    it('should call onAction when action button is clicked', () => {
      // Arrange
      const mockOnAction = vi.fn();
      render(
        <EmptyState
          message="No data"
          actionButtonText="Add Item"
          onAction={mockOnAction}
        />
      );

      // Act
      const actionButton = screen.getByRole('button', { name: /add item/i });
      fireEvent.click(actionButton);

      // Assert
      expect(mockOnAction).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible (Enter key)', () => {
      // Arrange
      const mockOnAction = vi.fn();
      render(
        <EmptyState
          message="No data"
          actionButtonText="Add"
          onAction={mockOnAction}
        />
      );

      // Act
      const actionButton = screen.getByRole('button', { name: /add/i });
      actionButton.focus();
      fireEvent.keyDown(actionButton, { key: 'Enter' });

      // Assert
      expect(mockOnAction).toHaveBeenCalled();
    });

    it('should be keyboard accessible (Space key)', () => {
      // Arrange
      const mockOnAction = vi.fn();
      render(
        <EmptyState
          message="No data"
          actionButtonText="Add"
          onAction={mockOnAction}
        />
      );

      // Act
      const actionButton = screen.getByRole('button', { name: /add/i });
      actionButton.focus();
      fireEvent.keyDown(actionButton, { key: ' ' });

      // Assert
      expect(mockOnAction).toHaveBeenCalled();
    });

    it('should have primary button styling', () => {
      // Arrange & Act
      render(
        <EmptyState
          message="No data"
          actionButtonText="Create"
          onAction={() => {}}
        />
      );

      // Assert
      const actionButton = screen.getByRole('button', { name: /create/i });
      expect(actionButton.className).toMatch(/bg-|text-|border/);
    });
  });

  describe('Visual Design', () => {
    it('should have centered layout', () => {
      // Arrange & Act
      render(<EmptyState message="No data" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toMatch(/flex|items-center|justify-center|text-center/);
    });

    it('should have appropriate padding', () => {
      // Arrange & Act
      render(<EmptyState message="No data" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toMatch(/p-|py-|px-/);
    });

    it('should have muted text color for message', () => {
      // Arrange & Act
      render(<EmptyState message="No data" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toMatch(/text-gray|text-slate|text-muted/);
    });

    it('should have larger icon size', () => {
      // Arrange & Act
      render(<EmptyState message="No data" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon.className).toMatch(/w-|h-|size-/);
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate role', () => {
      // Arrange & Act
      render(<EmptyState message="No data available" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveAttribute('role', 'status');
    });

    it('should have aria-label for context', () => {
      // Arrange & Act
      render(<EmptyState message="No nodes found" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveAttribute('aria-label', expect.stringMatching(/empty|no data/i));
    });

    it('should have accessible message text', () => {
      // Arrange & Act
      render(<EmptyState message="No items to display" />);

      // Assert
      const message = screen.getByText(/no items to display/i);
      expect(message).toBeInTheDocument();
    });

    it('should have alt text for illustration', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" illustration="/img.svg" />);

      // Assert
      const illustration = screen.getByRole('img');
      expect(illustration).toHaveAttribute('alt');
    });

    it('should have accessible action button', () => {
      // Arrange & Act
      render(
        <EmptyState
          message="Empty"
          actionButtonText="Create"
          onAction={() => {}}
        />
      );

      // Assert
      const actionButton = screen.getByRole('button', { name: /create/i });
      expect(actionButton).toHaveAccessibleName();
    });
  });

  describe('Customization Props', () => {
    it('should accept custom className', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" className="custom-empty-class" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveClass('custom-empty-class');
    });

    it('should accept custom title', () => {
      // Arrange & Act
      render(<EmptyState title="No Data Found" message="Try a different filter" />);

      // Assert
      expect(screen.getByText('No Data Found')).toBeInTheDocument();
    });

    it('should render title above message', () => {
      // Arrange & Act
      render(<EmptyState title="Empty List" message="No items" />);

      // Assert
      const title = screen.getByText('Empty List');
      const message = screen.getByText('No items');
      expect(title).toBeInTheDocument();
      expect(message).toBeInTheDocument();
    });
  });

  describe('Common Use Cases', () => {
    it('should render empty pod list state', () => {
      // Arrange & Act
      render(
        <EmptyState
          title="All Pods Healthy"
          message="No unhealthy pods found"
          description="All pods in the cluster are running normally"
        />
      );

      // Assert
      expect(screen.getByText('All Pods Healthy')).toBeInTheDocument();
      expect(screen.getByText('No unhealthy pods found')).toBeInTheDocument();
    });

    it('should render empty node list state', () => {
      // Arrange & Act
      render(
        <EmptyState
          message="No nodes available"
          description="Add nodes to your cluster to get started"
          actionButtonText="Add Node"
          onAction={() => {}}
        />
      );

      // Assert
      expect(screen.getByText('No nodes available')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add node/i })).toBeInTheDocument();
    });

    it('should render empty secrets list state', () => {
      // Arrange & Act
      render(
        <EmptyState
          message="No secrets found"
          description="Create a secret to store sensitive data"
        />
      );

      // Assert
      expect(screen.getByText('No secrets found')).toBeInTheDocument();
    });

    it('should render filtered empty state', () => {
      // Arrange & Act
      render(
        <EmptyState
          message="No results found"
          description="Try adjusting your filters or search criteria"
          actionButtonText="Clear Filters"
          onAction={() => {}}
        />
      );

      // Assert
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message string', () => {
      // Arrange & Act
      render(<EmptyState message="" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should handle special characters in message', () => {
      // Arrange & Act
      const specialMessage = 'No <data> available & nothing to show!';
      render(<EmptyState message={specialMessage} />);

      // Assert
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should handle unicode characters', () => {
      // Arrange & Act
      const unicodeMessage = 'データがありません 📭';
      render(<EmptyState message={unicodeMessage} />);

      // Assert
      expect(screen.getByText(unicodeMessage)).toBeInTheDocument();
    });

    it('should handle undefined onAction with action button text', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" actionButtonText="Click" onAction={undefined as any} />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should handle missing actionButtonText with onAction', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" onAction={() => {}} />);

      // Assert
      const actionButton = screen.queryByRole('button');
      expect(actionButton).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should support responsive padding', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" className="p-4 md:p-8 lg:p-12" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveClass('p-4', 'md:p-8', 'lg:p-12');
    });

    it('should support responsive text sizes', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" className="text-sm md:text-base lg:text-lg" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveClass('text-sm', 'md:text-base', 'lg:text-lg');
    });
  });

  describe('Multiple EmptyState Components', () => {
    it('should render multiple empty states independently', () => {
      // Arrange & Act
      render(
        <div>
          <EmptyState message="Empty 1" />
          <EmptyState message="Empty 2" />
        </div>
      );

      // Assert
      const emptyStates = screen.getAllByTestId('empty-state');
      expect(emptyStates).toHaveLength(2);
    });

    it('should handle different actions for multiple empty states', () => {
      // Arrange
      const mockAction1 = vi.fn();
      const mockAction2 = vi.fn();

      render(
        <div>
          <EmptyState message="Empty 1" actionButtonText="Action 1" onAction={mockAction1} />
          <EmptyState message="Empty 2" actionButtonText="Action 2" onAction={mockAction2} />
        </div>
      );

      // Act
      const actionButtons = screen.getAllByRole('button');
      fireEvent.click(actionButtons[0]);

      // Assert
      expect(mockAction1).toHaveBeenCalledTimes(1);
      expect(mockAction2).not.toHaveBeenCalled();
    });
  });
});
