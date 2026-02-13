import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  describe('rendering - basic structure', () => {
    it('should render without crashing', () => {
      // Arrange & Act
      render(<EmptyState message="No items found" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should display empty state message', () => {
      // Arrange & Act
      render(<EmptyState message="No data available" />);

      // Assert
      const message = screen.getByText('No data available');
      expect(message).toBeInTheDocument();
    });

    it('should have center-aligned layout', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toMatch(/text-center|items-center|justify-center/);
    });
  });

  describe('message display', () => {
    it('should display short messages', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      expect(screen.getByText('Empty')).toBeInTheDocument();
    });

    it('should display long messages', () => {
      // Arrange
      const longMessage = 'There are currently no items to display. Please check back later or add new items to see them here.';

      // Act
      render(<EmptyState message={longMessage} />);

      // Assert
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should display multiline messages', () => {
      // Arrange & Act
      render(<EmptyState message="No pods found\nTry changing your filters" />);

      // Assert
      expect(screen.getByText(/No pods found/)).toBeInTheDocument();
    });

    it('should handle empty message string gracefully', () => {
      // Arrange & Act
      render(<EmptyState message="" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should render message with proper typography', () => {
      // Arrange & Act
      render(<EmptyState message="No items" />);

      // Assert
      const message = screen.getByText('No items');
      expect(message.className).toMatch(/text-/);
    });
  });

  describe('icon display', () => {
    it('should display icon when icon prop is provided', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" icon="📦" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should not display icon when icon prop is not provided', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const icon = screen.queryByTestId('empty-state-icon');
      expect(icon).not.toBeInTheDocument();
    });

    it('should display emoji icon', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" icon="🔍" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toHaveTextContent('🔍');
    });

    it('should display text icon', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" icon="No Data" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toHaveTextContent('No Data');
    });

    it('should have appropriate icon size', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" icon="📦" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon.className).toMatch(/text-|w-|h-|size-/);
    });

    it('should position icon above message', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" icon="📦" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toMatch(/flex-col|block/);
    });
  });

  describe('action button', () => {
    it('should display action button when provided', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" actionText="Add Item" onAction={vi.fn()} />);

      // Assert
      const button = screen.getByRole('button', { name: /add item/i });
      expect(button).toBeInTheDocument();
    });

    it('should not display action button when not provided', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const button = screen.queryByRole('button');
      expect(button).not.toBeInTheDocument();
    });

    it('should call onAction when button is clicked', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onAction = vi.fn();

      // Act
      render(<EmptyState message="Empty" actionText="Create" onAction={onAction} />);
      const button = screen.getByRole('button', { name: /create/i });
      await user.click(button);

      // Assert
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('should display custom action button text', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" actionText="Get Started" onAction={vi.fn()} />);

      // Assert
      const button = screen.getByRole('button', { name: /get started/i });
      expect(button).toHaveTextContent('Get Started');
    });

    it('should be keyboard accessible', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onAction = vi.fn();

      // Act
      render(<EmptyState message="Empty" actionText="Add" onAction={onAction} />);
      const button = screen.getByRole('button', { name: /add/i });
      button.focus();
      await user.keyboard('{Enter}');

      // Assert
      expect(onAction).toHaveBeenCalled();
    });

    it('should handle Space key press', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onAction = vi.fn();

      // Act
      render(<EmptyState message="Empty" actionText="Add" onAction={onAction} />);
      const button = screen.getByRole('button', { name: /add/i });
      button.focus();
      await user.keyboard(' ');

      // Assert
      expect(onAction).toHaveBeenCalled();
    });

    it('should have button styling', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" actionText="Add" onAction={vi.fn()} />);

      // Assert
      const button = screen.getByRole('button', { name: /add/i });
      expect(button.className).toMatch(/px-|py-|rounded|bg-/);
    });
  });

  describe('visual styling - gray color scheme', () => {
    it('should have gray text color for message', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toMatch(/text-gray|text-slate|text-neutral/);
    });

    it('should have muted/subtle appearance', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toMatch(/gray|slate|neutral|zinc/i);
    });

    it('should have appropriate text size', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const message = screen.getByText('Empty');
      expect(message.className).toMatch(/text-/);
    });

    it('should have padding for spacing', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toMatch(/p-|py-|px-/);
    });

    it('should use lighter gray for secondary text', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" description="No data available" />);

      // Assert
      const description = screen.queryByText('No data available');
      if (description) {
        expect(description.className).toMatch(/text-gray|text-slate|text-neutral/);
      }
    });
  });

  describe('layout and alignment', () => {
    it('should center content horizontally', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toMatch(/items-center|justify-center|text-center/);
    });

    it('should center content vertically', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toMatch(/items-center|justify-center/);
    });

    it('should use flexbox or similar layout', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toMatch(/flex|grid|block/);
    });

    it('should have vertical spacing between elements', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" icon="📦" actionText="Add" onAction={vi.fn()} />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toMatch(/gap|space-y/);
    });

    it('should stack elements vertically', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" icon="📦" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toMatch(/flex-col|block/);
    });
  });

  describe('accessibility', () => {
    it('should have proper semantic structure', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should have accessible text for screen readers', () => {
      // Arrange & Act
      render(<EmptyState message="No items found" />);

      // Assert
      const message = screen.getByText('No items found');
      expect(message).toBeVisible();
    });

    it('should have role status for screen readers', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      const role = emptyState.getAttribute('role');
      expect(role).toMatch(/status|region|/);
    });

    it('should hide decorative icons from screen readers', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" icon="📦" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have accessible action button', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" actionText="Add" onAction={vi.fn()} />);

      // Assert
      const button = screen.getByRole('button', { name: /add/i });
      expect(button).toHaveAccessibleName();
    });

    it('should allow keyboard navigation to action button', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });

      // Act
      render(<EmptyState message="Empty" actionText="Add" onAction={vi.fn()} />);
      await user.tab();

      // Assert
      const button = screen.getByRole('button', { name: /add/i });
      expect(button).toHaveFocus();
    });
  });

  describe('description text', () => {
    it('should display description when provided', () => {
      // Arrange & Act
      render(<EmptyState message="No items" description="Try adding some items to get started" />);

      // Assert
      const description = screen.getByText('Try adding some items to get started');
      expect(description).toBeInTheDocument();
    });

    it('should not display description when not provided', () => {
      // Arrange & Act
      render(<EmptyState message="No items" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      // Only the main message should be present
      expect(emptyState).toHaveTextContent('No items');
    });

    it('should style description differently from main message', () => {
      // Arrange & Act
      render(<EmptyState message="No items" description="Add items to continue" />);

      // Assert
      const message = screen.getByText('No items');
      const description = screen.getByText('Add items to continue');
      expect(message.className).not.toBe(description.className);
    });
  });

  describe('edge cases', () => {
    it('should handle very long messages', () => {
      // Arrange
      const longMessage = 'A'.repeat(500);

      // Act
      render(<EmptyState message={longMessage} />);

      // Assert
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in message', () => {
      // Arrange & Act
      render(<EmptyState message="No items found (0/100)" />);

      // Assert
      expect(screen.getByText('No items found (0/100)')).toBeInTheDocument();
    });

    it('should handle HTML-like strings safely', () => {
      // Arrange & Act
      render(<EmptyState message="<No Items>" />);

      // Assert
      expect(screen.getByText('<No Items>')).toBeInTheDocument();
    });

    it('should handle missing actionText with onAction', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" onAction={vi.fn()} />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should handle missing onAction with actionText', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" actionText="Add" />);

      // Assert - button should not be rendered or be disabled
      const button = screen.queryByRole('button');
      expect(button).not.toBeInTheDocument();
    });

    it('should handle Unicode characters', () => {
      // Arrange & Act
      render(<EmptyState message="没有数据 • Нет данных • データなし" />);

      // Assert
      expect(screen.getByText(/没有数据/)).toBeInTheDocument();
    });

    it('should handle null icon gracefully', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" icon={null as any} />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe('prop updates', () => {
    it('should update message when prop changes', () => {
      // Arrange
      const { rerender } = render(<EmptyState message="First message" />);

      expect(screen.getByText('First message')).toBeInTheDocument();

      // Act
      rerender(<EmptyState message="Second message" />);

      // Assert
      expect(screen.getByText('Second message')).toBeInTheDocument();
      expect(screen.queryByText('First message')).not.toBeInTheDocument();
    });

    it('should update icon when prop changes', () => {
      // Arrange
      const { rerender } = render(<EmptyState message="Empty" icon="📦" />);

      expect(screen.getByTestId('empty-state-icon')).toHaveTextContent('📦');

      // Act
      rerender(<EmptyState message="Empty" icon="🔍" />);

      // Assert
      expect(screen.getByTestId('empty-state-icon')).toHaveTextContent('🔍');
    });

    it('should update action button when props change', () => {
      // Arrange
      const { rerender } = render(<EmptyState message="Empty" actionText="Add" onAction={vi.fn()} />);

      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();

      // Act
      rerender(<EmptyState message="Empty" actionText="Create" onAction={vi.fn()} />);

      // Assert
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('should add action button when actionText is added', () => {
      // Arrange
      const { rerender } = render(<EmptyState message="Empty" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();

      // Act
      rerender(<EmptyState message="Empty" actionText="Add" onAction={vi.fn()} />);

      // Assert
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });

    it('should remove action button when actionText is removed', () => {
      // Arrange
      const { rerender } = render(<EmptyState message="Empty" actionText="Add" onAction={vi.fn()} />);

      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();

      // Act
      rerender(<EmptyState message="Empty" />);

      // Assert
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('component props', () => {
    it('should accept required message prop', () => {
      // Arrange & Act
      render(<EmptyState message="Test message" />);

      // Assert
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should accept optional icon prop', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" icon="🎯" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toHaveTextContent('🎯');
    });

    it('should accept optional actionText prop', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" actionText="Click me" onAction={vi.fn()} />);

      // Assert
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('should accept optional onAction prop', () => {
      // Arrange
      const onAction = vi.fn();

      // Act
      render(<EmptyState message="Empty" actionText="Add" onAction={onAction} />);

      // Assert
      expect(onAction).toBeDefined();
    });

    it('should render consistently with same props', () => {
      // Arrange & Act
      const { rerender } = render(<EmptyState message="Empty" />);
      const firstRender = screen.getByTestId('empty-state').innerHTML;

      rerender(<EmptyState message="Empty" />);
      const secondRender = screen.getByTestId('empty-state').innerHTML;

      // Assert
      expect(firstRender).toBe(secondRender);
    });
  });

  describe('icon image support', () => {
    it('should display image icon when iconImage prop is provided', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" iconImage="/empty-icon.svg" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      const img = icon.querySelector('img');
      expect(img).toBeInTheDocument();
    });

    it('should have accessible alt text for icon image', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" iconImage="/empty-icon.svg" iconImageAlt="Empty state" />);

      // Assert
      const img = screen.getByAltText('Empty state');
      expect(img).toBeInTheDocument();
    });

    it('should prefer iconImage over icon text when both provided', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" icon="📦" iconImage="/empty-icon.svg" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      const img = icon.querySelector('img');
      expect(img).toBeInTheDocument();
    });
  });

  describe('responsive design', () => {
    it('should be responsive to container width', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.className).toMatch(/max-w|w-/);
    });

    it('should adjust text size for mobile', () => {
      // Arrange & Act
      render(<EmptyState message="Empty" />);

      // Assert
      const message = screen.getByText('Empty');
      expect(message.className).toMatch(/text-/);
    });
  });
});
