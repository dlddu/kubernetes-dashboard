import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState Component', () => {
  describe('Basic Rendering', () => {
    it('should render empty state container', () => {
      // Arrange & Act
      render(<EmptyState message="No items found" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should display empty state message', () => {
      // Arrange & Act
      render(<EmptyState message="No pods available" />);

      // Assert
      expect(screen.getByText('No pods available')).toBeInTheDocument();
    });

    it('should display icon', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should render icon as SVG element', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon.tagName).toBe('svg');
    });
  });

  describe('Message Display', () => {
    it('should display short messages', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      expect(screen.getByText('Empty')).toBeInTheDocument();
    });

    it('should display long messages', () => {
      // Arrange
      const longMessage =
        'No unhealthy pods found. All pods are currently running successfully.';

      // Act
      render(<EmptyState message={longMessage} />);

      // Assert
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should display multiline messages', () => {
      // Arrange
      const multilineMessage = 'No items found.\nTry adjusting your filters.';

      // Act
      render(<EmptyState message={multilineMessage} />);

      // Assert
      expect(screen.getByText(/No items found/)).toBeInTheDocument();
    });

    it('should handle empty message string', () => {
      // Arrange & Act
      render(<EmptyState message="" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should display message with HTML special characters', () => {
      // Arrange & Act
      render(<EmptyState message="No <items> found & available" />);

      // Assert
      expect(screen.getByText(/No <items> found & available/)).toBeInTheDocument();
    });
  });

  describe('Icon Types', () => {
    it('should display default icon when no icon prop provided', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should display inbox icon for default/general empty state', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" icon="inbox" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should display checkmark icon for success empty state', () => {
      // Arrange & Act
      render(<EmptyState message="All healthy" icon="checkmark" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should display search icon for no results state', () => {
      // Arrange & Act
      render(<EmptyState message="No results" icon="search" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should display folder icon for empty collection', () => {
      // Arrange & Act
      render(<EmptyState message="No files" icon="folder" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should have centered layout', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toMatch(/flex|items-center|justify-center/);
    });

    it('should have vertical layout (icon above message)', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toMatch(/flex-col/);
    });

    it('should have spacing between icon and message', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toMatch(/space-y|gap/);
    });

    it('should have padding', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toMatch(/p-|px-|py-/);
    });

    it('should center text', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const message = screen.getByText('Empty');
      expect(message.className).toMatch(/text-center/);
    });
  });

  describe('Icon Styling', () => {
    it('should have gray color for neutral empty state', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon.className).toMatch(/text-gray|text-slate/);
    });

    it('should have green color for success empty state', () => {
      // Arrange & Act
      render(<EmptyState message="All healthy" icon="checkmark" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon.className).toMatch(/text-green|text-success/);
    });

    it('should have appropriate icon size', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon.className).toMatch(/w-|h-/);
    });

    it('should have large icon for better visibility', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon.className).toMatch(/w-12|w-16|w-20|h-12|h-16|h-20/);
    });
  });

  describe('Message Styling', () => {
    it('should have gray text color', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const message = screen.getByText('Empty');
      expect(message.className).toMatch(/text-gray/);
    });

    it('should have medium font size', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const message = screen.getByText('Empty');
      expect(message.className).toMatch(/text-sm|text-base|text-lg/);
    });

    it('should have adequate line height for readability', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const message = screen.getByText('Empty');
      expect(message.className).toMatch(/leading/);
    });
  });

  describe('Optional Title', () => {
    it('should display title when provided', () => {
      // Arrange & Act
      render(<EmptyState title="No Data" message="Nothing to display" />);

      // Assert
      expect(screen.getByText('No Data')).toBeInTheDocument();
    });

    it('should not display title when not provided', () => {
      // Arrange & Act
      render(<EmptyState message="Nothing to display" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.textContent).not.toContain('No Data');
    });

    it('should style title as heading', () => {
      // Arrange & Act
      render(<EmptyState title="No Items" message="Empty list" />);

      // Assert
      const heading = screen.getByRole('heading', { name: 'No Items' });
      expect(heading).toBeInTheDocument();
    });

    it('should have larger font size for title than message', () => {
      // Arrange & Act
      render(<EmptyState title="No Items" message="Empty" />);

      // Assert
      const title = screen.getByRole('heading', { name: 'No Items' });
      expect(title.className).toMatch(/text-lg|text-xl|font-semibold|font-bold/);
    });

    it('should display title above message', () => {
      // Arrange & Act
      render(<EmptyState title="No Items" message="Empty list" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      const titleIndex = emptyState.textContent?.indexOf('No Items');
      const messageIndex = emptyState.textContent?.indexOf('Empty list');

      expect(titleIndex).toBeLessThan(messageIndex!);
    });
  });

  describe('Accessibility', () => {
    it('should have status role for empty state container', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const emptyState = screen.getByRole('status');
      expect(emptyState).toBeInTheDocument();
    });

    it('should have aria-live="polite" for dynamic updates', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible label for screen readers', () => {
      // Arrange & Act
      render(<EmptyState message="No unhealthy pods" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveAttribute('aria-label');
    });

    it('should support custom aria-label', () => {
      // Arrange & Act
      render(
        <EmptyState message="Empty" ariaLabel="No pods found in this namespace" />
      );

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveAttribute(
        'aria-label',
        'No pods found in this namespace'
      );
    });

    it('should be readable by screen readers', () => {
      // Arrange & Act
      render(<EmptyState message="No unhealthy pods found" />);

      // Assert
      const message = screen.getByText('No unhealthy pods found');
      expect(message).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className prop', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" className="custom-empty-class" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toContain('custom-empty-class');
    });

    it('should merge custom className with default classes', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" className="my-8" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toContain('my-8');
      expect(emptyState.className).toMatch(/flex/);
    });
  });

  describe('Optional Action Button', () => {
    it('should display action button when provided', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" actionText="Add Item" />);

      // Assert
      const actionButton = screen.getByRole('button', { name: 'Add Item' });
      expect(actionButton).toBeInTheDocument();
    });

    it('should not display action button when not provided', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('should call onAction when action button is clicked', () => {
      // Arrange
      const onActionMock = vi.fn();
      render(
        <EmptyState
          message="Empty"
          actionText="Add Item"
          onAction={onActionMock}
        />
      );

      // Act
      const actionButton = screen.getByRole('button', { name: 'Add Item' });
      fireEvent.click(actionButton);

      // Assert
      expect(onActionMock).toHaveBeenCalledTimes(1);
    });

    it('should style action button as primary', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" actionText="Add Item" />);

      // Assert
      const actionButton = screen.getByRole('button', { name: 'Add Item' });
      expect(actionButton.className).toMatch(/bg-blue|bg-primary/);
    });

    it('should have padding on action button', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" actionText="Add Item" />);

      // Assert
      const actionButton = screen.getByRole('button', { name: 'Add Item' });
      expect(actionButton.className).toMatch(/px-|py-/);
    });
  });

  describe('Description Support', () => {
    it('should display description when provided', () => {
      // Arrange & Act
      render(
        <EmptyState
          message="No items"
          description="Try creating a new item to get started"
        />
      );

      // Assert
      expect(
        screen.getByText('Try creating a new item to get started')
      ).toBeInTheDocument();
    });

    it('should not display description when not provided', () => {
      // Arrange & Act
      render(<EmptyState message="No items" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.textContent).toBe('No items');
    });

    it('should display description below message', () => {
      // Arrange & Act
      render(
        <EmptyState message="No items" description="Additional info" />
      );

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      const messageIndex = emptyState.textContent?.indexOf('No items');
      const descIndex = emptyState.textContent?.indexOf('Additional info');

      expect(messageIndex).toBeLessThan(descIndex!);
    });

    it('should style description with smaller text', () => {
      // Arrange & Act
      render(
        <EmptyState message="No items" description="Additional info" />
      );

      // Assert
      const description = screen.getByText('Additional info');
      expect(description.className).toMatch(/text-sm|text-xs/);
    });

    it('should style description with muted color', () => {
      // Arrange & Act
      render(
        <EmptyState message="No items" description="Additional info" />
      );

      // Assert
      const description = screen.getByText('Additional info');
      expect(description.className).toMatch(/text-gray/);
    });
  });

  describe('Component State', () => {
    it('should re-render when message prop changes', () => {
      // Arrange
      const { rerender } = render(<EmptyState message="First message" />);
      expect(screen.getByText('First message')).toBeInTheDocument();

      // Act
      rerender(<EmptyState message="Second message" />);

      // Assert
      expect(screen.getByText('Second message')).toBeInTheDocument();
      expect(screen.queryByText('First message')).not.toBeInTheDocument();
    });

    it('should re-render when icon prop changes', () => {
      // Arrange
      const { rerender } = render(
        <EmptyState message="Empty" icon="inbox" />
      );
      const firstIcon = screen.getByTestId('empty-state-icon');
      const firstIconClass = firstIcon.className;

      // Act
      rerender(<EmptyState message="Empty" icon="checkmark" />);

      // Assert
      const secondIcon = screen.getByTestId('empty-state-icon');
      expect(secondIcon.className).not.toBe(firstIconClass);
    });
  });

  describe('Use Cases', () => {
    it('should render for no unhealthy pods scenario', () => {
      // Arrange & Act
      render(
        <EmptyState
          icon="checkmark"
          message="모든 Pod가 정상 Running 상태입니다"
        />
      );

      // Assert
      expect(
        screen.getByText('모든 Pod가 정상 Running 상태입니다')
      ).toBeInTheDocument();
    });

    it('should render for no search results scenario', () => {
      // Arrange & Act
      render(
        <EmptyState
          icon="search"
          message="No results found"
          description="Try adjusting your search terms"
        />
      );

      // Assert
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(
        screen.getByText('Try adjusting your search terms')
      ).toBeInTheDocument();
    });

    it('should render for empty namespace scenario', () => {
      // Arrange & Act
      render(
        <EmptyState
          icon="folder"
          message="No resources in this namespace"
          description="Select a different namespace or create new resources"
        />
      );

      // Assert
      expect(
        screen.getByText('No resources in this namespace')
      ).toBeInTheDocument();
    });

    it('should render for all healthy state scenario', () => {
      // Arrange & Act
      render(
        <EmptyState
          icon="checkmark"
          title="All Systems Operational"
          message="No issues detected"
        />
      );

      // Assert
      expect(screen.getByText('All Systems Operational')).toBeInTheDocument();
      expect(screen.getByText('No issues detected')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined message gracefully', () => {
      // Arrange & Act
      // @ts-expect-error: Testing undefined message
      render(<EmptyState message={undefined} />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should handle null icon prop', () => {
      // Arrange & Act
      // @ts-expect-error: Testing null icon
      render(<EmptyState message="Empty" icon={null} />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should handle invalid icon type', () => {
      // Arrange & Act
      // @ts-expect-error: Testing invalid icon
      render(<EmptyState message="Empty" icon="invalid-icon" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe('Visual Consistency', () => {
    it('should render consistently with same props', () => {
      // Arrange
      const { rerender } = render(<EmptyState message="Empty" />);
      const firstRender = screen.getByTestId('empty-state').innerHTML;

      // Act
      rerender(<EmptyState message="Empty" />);
      const secondRender = screen.getByTestId('empty-state').innerHTML;

      // Assert
      expect(firstRender).toBe(secondRender);
    });

    it('should maintain layout with different message lengths', () => {
      // Arrange & Act
      const { container } = render(<EmptyState message="Short" />);
      const shortLayout = container.querySelector('[data-testid="empty-state"]');

      const { container: container2 } = render(
        <EmptyState message="This is a very long message that should still display correctly and maintain proper layout" />
      );
      const longLayout = container2.querySelector('[data-testid="empty-state"]');

      // Assert: Both should have same layout classes
      expect(shortLayout?.className).toMatch(/flex/);
      expect(longLayout?.className).toMatch(/flex/);
    });
  });
});
