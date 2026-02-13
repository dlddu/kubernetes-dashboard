/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState Component', () => {
  describe('Basic Rendering', () => {
    it('should render empty state container', () => {
      // Arrange & Act
      render(<EmptyState />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should display default empty state message', () => {
      // Arrange & Act
      render(<EmptyState />);

      // Assert
      const message = screen.getByText(/no data|nothing to show|empty/i);
      expect(message).toBeInTheDocument();
    });

    it('should display custom message when provided', () => {
      // Arrange & Act
      render(<EmptyState message="No pods found" />);

      // Assert
      const message = screen.getByText('No pods found');
      expect(message).toBeInTheDocument();
    });

    it('should display icon for empty state', () => {
      // Arrange & Act
      render(<EmptyState />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Message Display', () => {
    it('should display no deployments message', () => {
      // Arrange & Act
      render(<EmptyState message="No deployments found" />);

      // Assert
      const message = screen.getByText(/no deployments found/i);
      expect(message).toBeInTheDocument();
    });

    it('should display no nodes message', () => {
      // Arrange & Act
      render(<EmptyState message="No nodes available" />);

      // Assert
      const message = screen.getByText(/no nodes available/i);
      expect(message).toBeInTheDocument();
    });

    it('should display no secrets message', () => {
      // Arrange & Act
      render(<EmptyState message="No secrets configured" />);

      // Assert
      const message = screen.getByText(/no secrets configured/i);
      expect(message).toBeInTheDocument();
    });

    it('should display multiline message', () => {
      // Arrange & Act
      render(
        <EmptyState message="No data available. Try creating a new resource." />
      );

      // Assert
      const message = screen.getByText(/no data available/i);
      expect(message).toBeInTheDocument();
    });
  });

  describe('Icon Variants', () => {
    it('should display default empty icon', () => {
      // Arrange & Act
      render(<EmptyState />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should display search icon for no results', () => {
      // Arrange & Act
      render(<EmptyState icon="search" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toHaveClass(/search/);
    });

    it('should display folder icon for empty list', () => {
      // Arrange & Act
      render(<EmptyState icon="folder" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toHaveClass(/folder/);
    });

    it('should display checkmark icon for success state', () => {
      // Arrange & Act
      render(<EmptyState icon="check" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toHaveClass(/check/);
    });
  });

  describe('Description Text', () => {
    it('should display description when provided', () => {
      // Arrange & Act
      render(
        <EmptyState
          message="No items found"
          description="Try adjusting your filters or search criteria"
        />
      );

      // Assert
      const description = screen.getByText(/try adjusting your filters/i);
      expect(description).toBeInTheDocument();
    });

    it('should not display description when not provided', () => {
      // Arrange & Act
      render(<EmptyState message="No items found" />);

      // Assert
      const description = screen.queryByTestId('empty-state-description');
      expect(description).not.toBeInTheDocument();
    });

    it('should style description with muted color', () => {
      // Arrange & Act
      render(
        <EmptyState
          message="No items"
          description="Additional information"
        />
      );

      // Assert
      const description = screen.getByText(/additional information/i);
      expect(description).toHaveClass(/text-gray|text-slate|text-muted/);
    });
  });

  describe('Action Button', () => {
    it('should display action button when provided', () => {
      // Arrange & Act
      render(
        <EmptyState
          message="No items"
          actionLabel="Create New"
          onAction={() => {}}
        />
      );

      // Assert
      const button = screen.getByRole('button', { name: /create new/i });
      expect(button).toBeInTheDocument();
    });

    it('should not display action button when not provided', () => {
      // Arrange & Act
      render(<EmptyState message="No items" />);

      // Assert
      const button = screen.queryByRole('button');
      expect(button).not.toBeInTheDocument();
    });

    it('should call onAction when action button is clicked', () => {
      // Arrange
      const handleAction = vi.fn();
      render(
        <EmptyState
          message="No items"
          actionLabel="Add Item"
          onAction={handleAction}
        />
      );

      // Act
      const button = screen.getByRole('button', { name: /add item/i });
      fireEvent.click(button);

      // Assert
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Layout and Styling', () => {
    it('should center content vertically and horizontally', () => {
      // Arrange & Act
      render(<EmptyState />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveClass(/flex|items-center|justify-center|text-center/);
    });

    it('should use flexbox column layout', () => {
      // Arrange & Act
      render(<EmptyState />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveClass(/flex-col/);
    });

    it('should have vertical spacing between elements', () => {
      // Arrange & Act
      render(
        <EmptyState
          message="No items"
          description="Description"
          actionLabel="Action"
          onAction={() => {}}
        />
      );

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveClass(/space-y|gap-/);
    });

    it('should have padding for comfortable spacing', () => {
      // Arrange & Act
      render(<EmptyState />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveClass(/p-|py-|px-/);
    });
  });

  describe('Icon Styling', () => {
    it('should display large icon size', () => {
      // Arrange & Act
      render(<EmptyState />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toHaveClass(/w-12|w-16|w-20|h-12|h-16|h-20/);
    });

    it('should use muted color for icon', () => {
      // Arrange & Act
      render(<EmptyState />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toHaveClass(/text-gray|text-slate/);
    });

    it('should place icon above message', () => {
      // Arrange & Act
      render(<EmptyState message="No items" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      const icon = screen.getByTestId('empty-state-icon');
      const message = screen.getByText(/no items/i);

      expect(emptyState.contains(icon)).toBe(true);
      expect(emptyState.contains(message)).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have role of status for empty state', () => {
      // Arrange & Act
      render(<EmptyState />);

      // Assert
      const emptyState = screen.getByRole('status');
      expect(emptyState).toBeInTheDocument();
    });

    it('should have aria-live attribute', () => {
      // Arrange & Act
      render(<EmptyState />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible name for icon', () => {
      // Arrange & Act
      render(<EmptyState />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toHaveAttribute('aria-label');
    });

    it('should make icon decorative with aria-hidden', () => {
      // Arrange & Act
      render(<EmptyState />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      // Arrange & Act
      render(<EmptyState className="custom-empty" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveClass('custom-empty');
    });

    it('should merge custom className with defaults', () => {
      // Arrange & Act
      render(<EmptyState className="mt-10" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveClass('mt-10');
      expect(emptyState).toHaveClass(/flex/);
    });
  });

  describe('Positive Empty State', () => {
    it('should display positive message for all healthy pods', () => {
      // Arrange & Act
      render(
        <EmptyState
          message="All pods are healthy"
          icon="check"
          variant="success"
        />
      );

      // Assert
      const message = screen.getByText(/all pods are healthy/i);
      expect(message).toBeInTheDocument();
    });

    it('should style success variant with green color', () => {
      // Arrange & Act
      render(<EmptyState variant="success" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toHaveClass(/text-green|text-emerald/);
    });

    it('should display checkmark icon for success variant', () => {
      // Arrange & Act
      render(<EmptyState variant="success" />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive across different screen sizes', () => {
      // Arrange & Act
      render(<EmptyState message="No items" />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should adjust icon size on mobile', () => {
      // Arrange & Act
      render(<EmptyState />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toHaveClass(/w-|h-/);
    });

    it('should maintain center alignment on all viewports', () => {
      // Arrange & Act
      render(<EmptyState />);

      // Assert
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveClass(/items-center|justify-center/);
    });
  });

  describe('Typography', () => {
    it('should use large font size for main message', () => {
      // Arrange & Act
      render(<EmptyState message="No items" />);

      // Assert
      const message = screen.getByText(/no items/i);
      expect(message).toHaveClass(/text-lg|text-xl|font-/);
    });

    it('should use smaller font for description', () => {
      // Arrange & Act
      render(
        <EmptyState
          message="No items"
          description="Additional context"
        />
      );

      // Assert
      const description = screen.getByText(/additional context/i);
      expect(description).toHaveClass(/text-sm|text-xs/);
    });

    it('should use medium font weight for message', () => {
      // Arrange & Act
      render(<EmptyState message="No items" />);

      // Assert
      const message = screen.getByText(/no items/i);
      expect(message).toHaveClass(/font-medium|font-semibold/);
    });
  });
});
