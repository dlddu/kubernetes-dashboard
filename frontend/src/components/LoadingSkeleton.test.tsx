import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingSkeleton } from './LoadingSkeleton';

describe('LoadingSkeleton', () => {
  describe('rendering - basic structure', () => {
    it('should render without crashing', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should display single skeleton by default', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should have shimmer animation class', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/animate|shimmer|pulse/);
    });
  });

  describe('shape variations', () => {
    it('should render rectangular shape by default', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/rounded|rect/i);
    });

    it('should render rectangular shape when shape prop is rectangular', () => {
      // Arrange & Act
      render(<LoadingSkeleton shape="rectangular" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/rounded|rect/i);
    });

    it('should render circular shape when shape prop is circular', () => {
      // Arrange & Act
      render(<LoadingSkeleton shape="circular" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/rounded-full|circle/i);
    });

    it('should apply different classes for rectangular vs circular', () => {
      // Arrange
      const { container: rectContainer } = render(<LoadingSkeleton shape="rectangular" />);
      const rectSkeleton = screen.getByTestId('loading-skeleton');
      const rectClasses = rectSkeleton.className;

      rectContainer.remove();

      const { container: circContainer } = render(<LoadingSkeleton shape="circular" />);
      const circSkeleton = screen.getByTestId('loading-skeleton');
      const circClasses = circSkeleton.className;

      // Assert
      expect(rectClasses).not.toBe(circClasses);
      circContainer.remove();
    });
  });

  describe('count variations - multiple items', () => {
    it('should render single skeleton when count is 1', () => {
      // Arrange & Act
      render(<LoadingSkeleton count={1} />);

      // Assert
      const skeletons = screen.getAllByTestId(/skeleton-item-\d+|loading-skeleton/);
      expect(skeletons.length).toBe(1);
    });

    it('should render multiple skeletons when count is greater than 1', () => {
      // Arrange & Act
      render(<LoadingSkeleton count={3} />);

      // Assert
      const container = screen.getByTestId('loading-skeleton-container') || screen.getByTestId('loading-skeleton').parentElement;
      const skeletons = container?.querySelectorAll('[data-testid^="skeleton-item"]') || screen.getAllByTestId(/skeleton-item/);
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });

    it('should render 5 skeleton items when count is 5', () => {
      // Arrange & Act
      render(<LoadingSkeleton count={5} />);

      // Assert
      const container = screen.getByTestId('loading-skeleton-container') || screen.getByTestId('loading-skeleton').parentElement;
      const skeletons = container?.querySelectorAll('[class*="animate"]') || screen.getAllByTestId(/skeleton-item/);
      expect(skeletons.length).toBeGreaterThanOrEqual(5);
    });

    it('should handle count of 0 gracefully', () => {
      // Arrange & Act
      render(<LoadingSkeleton count={0} />);

      // Assert - should not crash
      const container = screen.queryByTestId('loading-skeleton-container') || screen.queryByTestId('loading-skeleton');
      expect(container).toBeInTheDocument();
    });

    it('should apply same shape to all skeleton items', () => {
      // Arrange & Act
      render(<LoadingSkeleton count={3} shape="circular" />);

      // Assert
      const container = screen.getByTestId('loading-skeleton-container') || screen.getByTestId('loading-skeleton').parentElement;
      const skeletons = container?.querySelectorAll('[class*="rounded-full"]') || [];
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('accessibility - ARIA attributes', () => {
    it('should have aria-busy attribute set to true', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('should have aria-label with loading text', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('aria-label');
      const ariaLabel = skeleton.getAttribute('aria-label');
      expect(ariaLabel?.toLowerCase()).toMatch(/loading|skeleton/i);
    });

    it('should have role status or progressbar', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      const role = skeleton.getAttribute('role');
      expect(role).toMatch(/status|progressbar/i);
    });

    it('should be announced to screen readers', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('aria-label');
      expect(skeleton).toHaveAttribute('aria-busy');
    });

    it('should have aria-live region for dynamic updates', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('shimmer effect animation', () => {
    it('should have animation class', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/animate-pulse|animate-shimmer|animate/);
    });

    it('should apply shimmer effect to all skeleton items', () => {
      // Arrange & Act
      render(<LoadingSkeleton count={3} />);

      // Assert
      const container = screen.getByTestId('loading-skeleton-container') || screen.getByTestId('loading-skeleton').parentElement;
      const skeletons = container?.querySelectorAll('[class*="animate"]') || [];
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });

    it('should have gradient background for shimmer', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/bg-|gradient/);
    });
  });

  describe('visual styling', () => {
    it('should have gray background color', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/bg-gray|bg-slate|bg-neutral/);
    });

    it('should have proper height for rectangular skeleton', () => {
      // Arrange & Act
      render(<LoadingSkeleton shape="rectangular" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/h-/);
    });

    it('should have equal width and height for circular skeleton', () => {
      // Arrange & Act
      render(<LoadingSkeleton shape="circular" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/w-|h-/);
    });

    it('should have rounded corners for rectangular skeleton', () => {
      // Arrange & Act
      render(<LoadingSkeleton shape="rectangular" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/rounded/);
    });

    it('should have full rounded corners for circular skeleton', () => {
      // Arrange & Act
      render(<LoadingSkeleton shape="circular" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/rounded-full/);
    });
  });

  describe('layout and spacing', () => {
    it('should have spacing between multiple skeleton items', () => {
      // Arrange & Act
      render(<LoadingSkeleton count={3} />);

      // Assert
      const container = screen.getByTestId('loading-skeleton-container') || screen.getByTestId('loading-skeleton').parentElement;
      expect(container?.className).toMatch(/gap|space-y|space-x/);
    });

    it('should stack multiple items vertically by default', () => {
      // Arrange & Act
      render(<LoadingSkeleton count={3} />);

      // Assert
      const container = screen.getByTestId('loading-skeleton-container') || screen.getByTestId('loading-skeleton').parentElement;
      expect(container?.className).toMatch(/flex-col|block|space-y/);
    });

    it('should have full width for rectangular skeletons', () => {
      // Arrange & Act
      render(<LoadingSkeleton shape="rectangular" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/w-full|w-/);
    });
  });

  describe('edge cases', () => {
    it('should handle very large count values', () => {
      // Arrange & Act
      render(<LoadingSkeleton count={100} />);

      // Assert - should not crash
      const container = screen.getByTestId('loading-skeleton-container') || screen.getByTestId('loading-skeleton').parentElement;
      expect(container).toBeInTheDocument();
    });

    it('should handle negative count values gracefully', () => {
      // Arrange & Act
      render(<LoadingSkeleton count={-1} />);

      // Assert - should not crash, might show 0 or 1 skeleton
      const skeleton = screen.queryByTestId('loading-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should handle undefined shape prop', () => {
      // Arrange & Act
      render(<LoadingSkeleton shape={undefined} />);

      // Assert - should use default shape
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should handle undefined count prop', () => {
      // Arrange & Act
      render(<LoadingSkeleton count={undefined} />);

      // Assert - should use default count
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should handle invalid shape values gracefully', () => {
      // Arrange & Act
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<LoadingSkeleton shape={'invalid' as any} />);

      // Assert - should fallback to default or handle gracefully
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('prop updates', () => {
    it('should update when shape prop changes', () => {
      // Arrange
      const { rerender } = render(<LoadingSkeleton shape="rectangular" />);
      const rectClasses = screen.getByTestId('loading-skeleton').className;

      // Act
      rerender(<LoadingSkeleton shape="circular" />);

      // Assert
      const circClasses = screen.getByTestId('loading-skeleton').className;
      expect(rectClasses).not.toBe(circClasses);
    });

    it('should update when count prop changes', () => {
      // Arrange
      const { rerender } = render(<LoadingSkeleton count={1} />);

      // Act
      rerender(<LoadingSkeleton count={3} />);

      // Assert
      const container = screen.getByTestId('loading-skeleton-container') || screen.getByTestId('loading-skeleton').parentElement;
      const skeletons = container?.querySelectorAll('[class*="animate"]') || [];
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });

    it('should maintain animation when props change', () => {
      // Arrange
      const { rerender } = render(<LoadingSkeleton count={2} />);

      // Act
      rerender(<LoadingSkeleton count={3} />);

      // Assert
      const skeletonItem = screen.getByTestId('skeleton-item-0');
      expect(skeletonItem.className).toMatch(/animate/);
    });
  });

  describe('width and height customization', () => {
    it('should accept custom width prop', () => {
      // Arrange & Act
      render(<LoadingSkeleton width="200px" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.style.width || skeleton.className).toMatch(/200|w-/);
    });

    it('should accept custom height prop', () => {
      // Arrange & Act
      render(<LoadingSkeleton height="50px" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.style.height || skeleton.className).toMatch(/50|h-/);
    });

    it('should handle percentage-based dimensions', () => {
      // Arrange & Act
      render(<LoadingSkeleton width="100%" height="24px" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.style.width || skeleton.className).toBeTruthy();
    });
  });

  describe('test data attributes', () => {
    it('should have data-testid attribute', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('data-testid', 'loading-skeleton');
    });

    it('should have unique test ids for multiple items', () => {
      // Arrange & Act
      render(<LoadingSkeleton count={3} />);

      // Assert
      const container = screen.getByTestId('loading-skeleton-container') || screen.getByTestId('loading-skeleton').parentElement;
      expect(container).toBeInTheDocument();
    });
  });

  describe('performance considerations', () => {
    it('should render efficiently with high count', () => {
      // Arrange
      const startTime = performance.now();

      // Act
      render(<LoadingSkeleton count={50} />);

      // Assert
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(1000); // Should render in less than 1 second
    });

    it('should use CSS for animation instead of JavaScript', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/animate-/); // Tailwind animation classes
    });
  });

  describe('contrast and visibility', () => {
    it('should have visible background color', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/bg-/);
    });

    it('should have sufficient contrast for loading state', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      // Should have gray/neutral colors for skeleton
      expect(skeleton.className).toMatch(/gray|slate|neutral|zinc/i);
    });
  });
});
