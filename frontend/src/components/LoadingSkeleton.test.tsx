import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSkeleton } from './LoadingSkeleton';

describe('LoadingSkeleton Component', () => {
  describe('Basic Rendering', () => {
    it('should render skeleton container', () => {
      // Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should apply default testId when not provided', () => {
      // Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('should apply custom testId when provided', () => {
      // Act
      render(<LoadingSkeleton variant="card" testId="custom-skeleton" />);

      // Assert
      expect(screen.getByTestId('custom-skeleton')).toBeInTheDocument();
    });
  });

  describe('Variant - Card', () => {
    it('should render card variant skeleton', () => {
      // Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should apply animate-pulse to card variant', () => {
      // Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toContain('animate-pulse');
    });

    it('should render single card skeleton when count is 1', () => {
      // Act
      render(<LoadingSkeleton variant="card" count={1} />);

      // Assert
      const skeletons = screen.getAllByTestId(/skeleton-item/);
      expect(skeletons).toHaveLength(1);
    });

    it('should render multiple card skeletons when count is specified', () => {
      // Act
      render(<LoadingSkeleton variant="card" count={3} />);

      // Assert
      const skeletons = screen.getAllByTestId(/skeleton-item/);
      expect(skeletons).toHaveLength(3);
    });

    it('should render default count of 3 when count not specified', () => {
      // Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeletons = screen.getAllByTestId(/skeleton-item/);
      expect(skeletons).toHaveLength(3);
    });
  });

  describe('Variant - List', () => {
    it('should render list variant skeleton', () => {
      // Act
      render(<LoadingSkeleton variant="list" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should apply animate-pulse to list variant', () => {
      // Act
      render(<LoadingSkeleton variant="list" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toContain('animate-pulse');
    });

    it('should render multiple list items when count is specified', () => {
      // Act
      render(<LoadingSkeleton variant="list" count={5} />);

      // Assert
      const skeletons = screen.getAllByTestId(/skeleton-item/);
      expect(skeletons).toHaveLength(5);
    });

    it('should render default count of 5 for list variant', () => {
      // Act
      render(<LoadingSkeleton variant="list" />);

      // Assert
      const skeletons = screen.getAllByTestId(/skeleton-item/);
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Variant - Table', () => {
    it('should render table variant skeleton', () => {
      // Act
      render(<LoadingSkeleton variant="table" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should apply animate-pulse to table variant', () => {
      // Act
      render(<LoadingSkeleton variant="table" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toContain('animate-pulse');
    });

    it('should render table rows based on count', () => {
      // Act
      render(<LoadingSkeleton variant="table" count={4} />);

      // Assert
      const skeletons = screen.getAllByTestId(/skeleton-item/);
      expect(skeletons).toHaveLength(4);
    });

    it('should render default count of 5 for table variant', () => {
      // Act
      render(<LoadingSkeleton variant="table" />);

      // Assert
      const skeletons = screen.getAllByTestId(/skeleton-item/);
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className when provided', () => {
      // Act
      render(<LoadingSkeleton variant="card" className="custom-class" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toContain('custom-class');
    });

    it('should merge custom className with default classes', () => {
      // Act
      render(<LoadingSkeleton variant="card" className="mt-4" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toContain('mt-4');
      expect(skeleton.className).toContain('animate-pulse');
    });

    it('should not have className when not provided', () => {
      // Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-busy="true" attribute', () => {
      // Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('should have aria-label="Loading..." attribute', () => {
      // Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading...');
    });

    it('should be accessible with screen reader', () => {
      // Act
      render(<LoadingSkeleton variant="list" />);

      // Assert
      const skeleton = screen.getByLabelText('Loading...');
      expect(skeleton).toBeInTheDocument();
    });

    it('should have proper accessibility attributes for all variants', () => {
      // Arrange
      const variants: Array<'card' | 'list' | 'table'> = ['card', 'list', 'table'];

      variants.forEach((variant) => {
        // Act
        const { unmount } = render(<LoadingSkeleton variant={variant} />);

        // Assert
        const skeleton = screen.getByTestId('loading-skeleton');
        expect(skeleton).toHaveAttribute('aria-busy', 'true');
        expect(skeleton).toHaveAttribute('aria-label', 'Loading...');

        unmount();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle count of 0', () => {
      // Act
      render(<LoadingSkeleton variant="card" count={0} />);

      // Assert
      const skeletons = screen.queryAllByTestId(/skeleton-item/);
      expect(skeletons).toHaveLength(0);
    });

    it('should handle large count values', () => {
      // Act
      render(<LoadingSkeleton variant="list" count={20} />);

      // Assert
      const skeletons = screen.getAllByTestId(/skeleton-item/);
      expect(skeletons).toHaveLength(20);
    });

    it('should render correctly without optional props', () => {
      // Act
      render(<LoadingSkeleton variant="card" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Props Validation', () => {
    it('should accept all valid variant values', () => {
      // Arrange
      const variants: Array<'card' | 'list' | 'table'> = ['card', 'list', 'table'];

      variants.forEach((variant) => {
        // Act
        const { unmount } = render(<LoadingSkeleton variant={variant} />);

        // Assert
        expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();

        unmount();
      });
    });

    it('should accept count as number', () => {
      // Act
      render(<LoadingSkeleton variant="card" count={7} />);

      // Assert
      const skeletons = screen.getAllByTestId(/skeleton-item/);
      expect(skeletons).toHaveLength(7);
    });

    it('should accept className as string', () => {
      // Act
      render(<LoadingSkeleton variant="card" className="test-class" />);

      // Assert
      const skeleton = screen.getByTestId('loading-skeleton');
      expect(skeleton.className).toContain('test-class');
    });

    it('should accept testId as string', () => {
      // Act
      render(<LoadingSkeleton variant="card" testId="my-skeleton" />);

      // Assert
      expect(screen.getByTestId('my-skeleton')).toBeInTheDocument();
    });
  });
});
