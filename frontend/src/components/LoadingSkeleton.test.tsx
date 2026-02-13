import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSkeleton } from './LoadingSkeleton';

describe('LoadingSkeleton Component', () => {
  describe('Basic Rendering', () => {
    it('should render skeleton container', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render with default variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Variant - Card', () => {
    it('should render card variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('data-variant', 'card');
    });

    it('should have card-like dimensions', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/h-|min-h-/);
    });

    it('should have rounded corners for card', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/rounded/);
    });

    it('should contain multiple skeleton elements for card', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      const children = skeleton.querySelectorAll('[class*="skeleton"]');
      expect(children.length).toBeGreaterThan(0);
    });
  });

  describe('Variant - List', () => {
    it('should render list variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="list" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('data-variant', 'list');
    });

    it('should render multiple list items', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="list" count={3} />);

      // Assert
      const skeletonItems = screen.getAllByTestId(/skeleton-list-item/);
      expect(skeletonItems).toHaveLength(3);
    });

    it('should render default number of list items when count not specified', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="list" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should have consistent spacing between list items', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="list" count={2} />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/space-y|gap/);
    });
  });

  describe('Variant - Line', () => {
    it('should render line variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="line" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('data-variant', 'line');
    });

    it('should have line-like height', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="line" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/h-2|h-3|h-4/);
    });

    it('should have full or specified width', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="line" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/w-/);
    });

    it('should support custom width', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="line" width="50%" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveStyle({ width: '50%' });
    });
  });

  describe('Shimmer Animation', () => {
    it('should have shimmer animation class', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/animate-pulse|animate-shimmer|shimmer/);
    });

    it('should apply shimmer to card variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/animate-pulse|animate-shimmer|shimmer/);
    });

    it('should apply shimmer to list variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="list" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/animate-pulse|animate-shimmer|shimmer/);
    });

    it('should apply shimmer to line variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="line" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/animate-pulse|animate-shimmer|shimmer/);
    });

    it('should have gradient background for shimmer effect', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/bg-gray|bg-slate|bg-gradient/);
    });
  });

  describe('Accessibility - aria-busy', () => {
    it('should have aria-busy attribute', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('should have aria-busy for card variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('should have aria-busy for list variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="list" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('should have aria-busy for line variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="line" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('should have aria-label for screen readers', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('aria-label', expect.stringMatching(/loading/i));
    });

    it('should have role="status" for live region', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('role', 'status');
    });
  });

  describe('Customization Props', () => {
    it('should accept custom className', () => {
      // Arrange & Act
      render(<LoadingSkeleton className="custom-class" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveClass('custom-class');
    });

    it('should accept custom height', () => {
      // Arrange & Act
      render(<LoadingSkeleton height="200px" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveStyle({ height: '200px' });
    });

    it('should accept custom width', () => {
      // Arrange & Act
      render(<LoadingSkeleton width="80%" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveStyle({ width: '80%' });
    });

    it('should accept count prop for list variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="list" count={5} />);

      // Assert
      const skeletonItems = screen.getAllByTestId(/skeleton-list-item/);
      expect(skeletonItems).toHaveLength(5);
    });
  });

  describe('Visual Styling', () => {
    it('should have gray background color', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/bg-gray|bg-slate/);
    });

    it('should have appropriate opacity', () => {
      // Arrange & Act
      render(<LoadingSkeleton />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toMatch(/opacity|bg-gray-/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle count of 0 for list variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="list" count={0} />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should handle very large count for list variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant="list" count={100} />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should handle undefined variant', () => {
      // Arrange & Act
      render(<LoadingSkeleton variant={undefined} />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should handle empty width string', () => {
      // Arrange & Act
      render(<LoadingSkeleton width="" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should handle empty height string', () => {
      // Arrange & Act
      render(<LoadingSkeleton height="" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Multiple Skeletons', () => {
    it('should render multiple card skeletons', () => {
      // Arrange & Act
      render(
        <div>
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
        </div>
      );

      // Assert
      const skeletons = screen.getAllByTestId('loading-skeleton');
      expect(skeletons).toHaveLength(3);
    });

    it('should render mixed variant skeletons', () => {
      // Arrange & Act
      render(
        <div>
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="line" />
          <LoadingSkeleton variant="list" />
        </div>
      );

      // Assert
      const skeletons = screen.getAllByTestId('loading-skeleton');
      expect(skeletons).toHaveLength(3);
    });
  });

  describe('Responsive Design', () => {
    it('should support responsive width classes', () => {
      // Arrange & Act
      render(<LoadingSkeleton className="w-full md:w-1/2" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveClass('w-full', 'md:w-1/2');
    });

    it('should support responsive height classes', () => {
      // Arrange & Act
      render(<LoadingSkeleton className="h-20 md:h-32" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveClass('h-20', 'md:h-32');
    });
  });
});
