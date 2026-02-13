import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSkeleton } from './LoadingSkeleton';

describe('LoadingSkeleton Component', () => {
  describe('Basic Rendering', () => {
    it('should render loading skeleton container', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should have accessible loading role', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByRole('status');
      expect(skeleton).toBeInTheDocument();
    });

    it('should have aria-live="polite" for screen readers', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-busy="true" while loading', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('should have screen reader text for accessibility', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
    });
  });

  describe('Variant Types', () => {
    it('should render card variant with default behavior', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeletonItem = screen.getByTestId('skeleton-item');
      expect(skeletonItem.className).toMatch(/rounded|border|shadow/);
    });

    it('should render text variant for text content', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="text" />);

      // Assert
      const skeletonItem = screen.getByTestId('skeleton-item');
      expect(skeletonItem.className).toMatch(/h-4|h-5|rounded/);
    });

    it('should render list variant for list items', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="list" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/space-y|gap/);
    });

    it('should render table variant for table rows', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="table" />);

      // Assert
      const skeletonItem = screen.getByTestId('skeleton-item');
      expect(skeletonItem.className).toMatch(/w-full/);
    });

    it('should default to card variant when no variant specified', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Count Prop', () => {
    it('should render single skeleton by default', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeletons = screen.getAllByTestId('skeleton-item');
      expect(skeletons).toHaveLength(1);
    });

    it('should render multiple skeletons based on count prop', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="card" count={3} />);

      // Assert
      const skeletons = screen.getAllByTestId('skeleton-item');
      expect(skeletons).toHaveLength(3);
    });

    it('should render 5 skeletons when count is 5', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="list" count={5} />);

      // Assert
      const skeletons = screen.getAllByTestId('skeleton-item');
      expect(skeletons).toHaveLength(5);
    });

    it('should handle count of 0', () => {
      // Arrange & Act
      render(<LoadingSkeleton count={0} />);

      // Assert
      const skeletons = screen.queryAllByTestId('skeleton-item');
      expect(skeletons).toHaveLength(0);
    });

    it('should handle large count values', () => {
      // Arrange & Act
      render(<LoadingSkeleton count={10} />);

      // Assert
      const skeletons = screen.getAllByTestId('skeleton-item');
      expect(skeletons).toHaveLength(10);
    });
  });

  describe('Animation', () => {
    it('should have pulse animation', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/animate-pulse/);
    });

    it('should apply shimmer effect to skeleton items', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeletonItem = screen.getByTestId('skeleton-item');
      expect(skeletonItem.className).toMatch(/bg-gray|bg-slate/);
    });
  });

  describe('Card Variant Styling', () => {
    it('should have padding for card variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeletonItem = screen.getByTestId('skeleton-item');
      expect(skeletonItem.className).toMatch(/p-|px-|py-/);
    });

    it('should have rounded corners for card variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeletonItem = screen.getByTestId('skeleton-item');
      expect(skeletonItem.className).toMatch(/rounded/);
    });

    it('should have border for card variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeletonItem = screen.getByTestId('skeleton-item');
      expect(skeletonItem.className).toMatch(/border/);
    });

    it('should have appropriate height for card variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeletonItem = screen.getByTestId('skeleton-item');
      expect(skeletonItem.className).toMatch(/h-|min-h-/);
    });
  });

  describe('Text Variant Styling', () => {
    it('should render multiple text lines', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="text" count={3} />);

      // Assert
      const textLines = screen.getAllByTestId('skeleton-item');
      expect(textLines).toHaveLength(3);
    });

    it('should have full width for text lines', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="text" />);

      // Assert
      const textLine = screen.getByTestId('skeleton-item');
      expect(textLine.className).toMatch(/w-full|w-/);
    });

    it('should have consistent height for text lines', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="text" />);

      // Assert
      const textLine = screen.getByTestId('skeleton-item');
      expect(textLine.className).toMatch(/h-4|h-5/);
    });

    it('should have spacing between text lines', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="text" count={3} />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/space-y|gap/);
    });
  });

  describe('List Variant Styling', () => {
    it('should render list items with spacing', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="list" count={4} />);

      // Assert
      const listItems = screen.getAllByTestId('skeleton-item');
      expect(listItems).toHaveLength(4);

      const container = screen.getByTestId('loading-skeleton');
      expect(container.className).toMatch(/space-y|gap/);
    });

    it('should have full width for list items', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="list" />);

      // Assert
      const listItem = screen.getByTestId('skeleton-item');
      expect(listItem.className).toMatch(/w-full/);
    });

    it('should have adequate height for list items', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="list" />);

      // Assert
      const listItem = screen.getByTestId('skeleton-item');
      expect(listItem.className).toMatch(/h-|py-|min-h-/);
    });
  });

  describe('Table Variant Styling', () => {
    it('should render table rows', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="table" count={5} />);

      // Assert
      const tableRows = screen.getAllByTestId('skeleton-item');
      expect(tableRows).toHaveLength(5);
    });

    it('should have full width for table rows', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="table" />);

      // Assert
      const tableRow = screen.getByTestId('skeleton-item');
      expect(tableRow.className).toMatch(/w-full/);
    });

    it('should have border between table rows', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="table" count={3} />);

      // Assert
      const tableRows = screen.getAllByTestId('skeleton-item');
      tableRows.forEach((row) => {
        expect(row.className).toMatch(/border/);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('role', 'status');
      expect(skeleton).toHaveAttribute('aria-live', 'polite');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('should announce loading state to screen readers', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
    });

    it('should support custom aria-label', () => {
      // Arrange & Act
      render(<LoadingSkeleton ariaLabel="Loading pods data" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading pods data');
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className prop', () => {
      // Arrange & Act
      render(<LoadingSkeleton className="custom-skeleton-class" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toContain('custom-skeleton-class');
    });

    it('should merge custom className with default classes', () => {
      // Arrange & Act
      render(<LoadingSkeleton className="mt-8" variant="card" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toContain('mt-8');
      expect(skeleton.className).toMatch(/animate-pulse/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative count gracefully', () => {
      // Arrange & Act
      render(<LoadingSkeleton count={-1} />);

      // Assert
      const skeletons = screen.queryAllByTestId('skeleton-item');
      expect(skeletons).toHaveLength(0);
    });

    it('should handle non-integer count values', () => {
      // Arrange & Act
      render(<LoadingSkeleton count={3.7} />);

      // Assert
      const skeletons = screen.getAllByTestId('skeleton-item');
      expect(skeletons).toHaveLength(3);
    });

    it('should handle undefined variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant={undefined} />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should handle invalid variant string', () => {
      // Arrange & Act
      // @ts-expect-error: Testing invalid variant
      render(<LoadingSkeleton variant="invalid" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('should accept variant prop', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="text" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should accept count prop', () => {
      // Arrange & Act
      render(<LoadingSkeleton count={3} />);

      // Assert
      const skeletons = screen.getAllByTestId('skeleton-item');
      expect(skeletons).toHaveLength(3);
    });

    it('should accept className prop', () => {
      // Arrange & Act
      render(<LoadingSkeleton className="my-custom-class" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toContain('my-custom-class');
    });

    it('should accept ariaLabel prop', () => {
      // Arrange & Act
      render(<LoadingSkeleton ariaLabel="Custom loading message" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('aria-label', 'Custom loading message');
    });

    it('should re-render when props change', () => {
      // Arrange
      const { rerender } = render(<LoadingSkeleton count={2} />);
      expect(screen.getAllByTestId('skeleton-item')).toHaveLength(2);

      // Act
      rerender(<LoadingSkeleton count={5} />);

      // Assert
      expect(screen.getAllByTestId('skeleton-item')).toHaveLength(5);
    });
  });

  describe('Visual Consistency', () => {
    it('should have consistent background color', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="card" count={3} />);

      // Assert
      const skeletons = screen.getAllByTestId('skeleton-item');
      const firstColor = skeletons[0].className.match(/bg-\w+/);
      skeletons.forEach((skeleton) => {
        expect(skeleton.className).toMatch(firstColor?.[0] ?? /bg-/);
      });
    });

    it('should maintain aspect ratio for cards', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeletonItem = screen.getByTestId('skeleton-item');
      expect(skeletonItem.className).toMatch(/h-|aspect-/);
    });
  });

  describe('Performance', () => {
    it('should render efficiently with many items', () => {
      // Arrange & Act
      const startTime = performance.now();
      render(<LoadingSkeleton count={20} />);
      const endTime = performance.now();

      // Assert
      const skeletons = screen.getAllByTestId('skeleton-item');
      expect(skeletons).toHaveLength(20);
      expect(endTime - startTime).toBeLessThan(100); // Should render in < 100ms
    });
  });
});
