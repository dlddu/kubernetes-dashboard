import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UsageBar } from './UsageBar';

describe('UsageBar', () => {
  describe('rendering - happy path', () => {
    it('should render without crashing', () => {
      // Act
      render(<UsageBar percentage={50} label="CPU" />);

      // Assert
      const usageBar = screen.getByTestId('usage-bar');
      expect(usageBar).toBeInTheDocument();
    });

    it('should display percentage value', () => {
      // Act
      render(<UsageBar percentage={45.5} label="CPU" />);

      // Assert
      expect(screen.getByText('45.5%')).toBeInTheDocument();
    });

    it('should display label', () => {
      // Act
      render(<UsageBar percentage={50} label="CPU Usage" />);

      // Assert
      expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    });
  });

  describe('visual bar representation', () => {
    it('should render progress bar with correct width', () => {
      // Act
      render(<UsageBar percentage={60} label="CPU" />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '60');
      const fill = screen.getByTestId('usage-bar-fill');
      expect(fill).toHaveStyle({ width: '60%' });
    });

    it('should show different color for low usage', () => {
      // Act
      render(<UsageBar percentage={30} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveClass(/bg-green|bg-blue/i);
    });

    it('should show warning color for medium usage', () => {
      // Act
      render(<UsageBar percentage={70} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveClass(/bg-yellow|bg-orange/i);
    });

    it('should show danger color for high usage', () => {
      // Act
      render(<UsageBar percentage={90} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveClass(/bg-red|bg-danger/i);
    });
  });

  describe('color thresholds', () => {
    it('should use success color below 60%', () => {
      // Act
      render(<UsageBar percentage={59} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveClass(/bg-green|bg-blue/i);
    });

    it('should use warning color between 60% and 80%', () => {
      // Act
      render(<UsageBar percentage={75} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveClass(/bg-yellow|bg-orange/i);
    });

    it('should use danger color above 80%', () => {
      // Act
      render(<UsageBar percentage={85} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveClass(/bg-red|bg-danger/i);
    });
  });

  describe('edge cases', () => {
    it('should handle 0% usage', () => {
      // Act
      render(<UsageBar percentage={0} label="CPU" />);

      // Assert
      expect(screen.getByText('0%')).toBeInTheDocument();
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should handle 100% usage', () => {
      // Act
      render(<UsageBar percentage={100} label="CPU" />);

      // Assert
      expect(screen.getByText('100%')).toBeInTheDocument();
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });

    it('should handle decimal percentages', () => {
      // Act
      render(<UsageBar percentage={45.67} label="CPU" />);

      // Assert
      expect(screen.getByText('45.7%')).toBeInTheDocument();
    });

    it('should handle very small percentages', () => {
      // Act
      render(<UsageBar percentage={0.1} label="CPU" />);

      // Assert
      expect(screen.getByText('0.1%')).toBeInTheDocument();
    });

    it('should clamp values above 100%', () => {
      // Act
      render(<UsageBar percentage={150} label="CPU" />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
      const fill = screen.getByTestId('usage-bar-fill');
      const width = fill.style.width;
      expect(parseFloat(width)).toBeLessThanOrEqual(100);
    });

    it('should handle negative values gracefully', () => {
      // Act
      render(<UsageBar percentage={-10} label="CPU" />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      // Act
      render(<UsageBar percentage={60} label="CPU Usage" />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '60');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', 'CPU Usage');
    });

    it('should be announced to screen readers', () => {
      // Act
      render(<UsageBar percentage={75} label="Memory" />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('styling', () => {
    it('should have rounded corners', () => {
      // Act
      render(<UsageBar percentage={50} label="CPU" />);

      // Assert
      const container = screen.getByTestId('usage-bar');
      expect(container).toHaveClass(/rounded/);
    });

    it('should have background color', () => {
      // Act
      render(<UsageBar percentage={50} label="CPU" />);

      // Assert
      const container = screen.getByTestId('usage-bar');
      expect(container).toHaveClass(/bg-gray/);
    });

    it('should have proper height', () => {
      // Act
      render(<UsageBar percentage={50} label="CPU" />);

      // Assert
      const container = screen.getByTestId('usage-bar');
      expect(container).toHaveClass(/h-2|h-3|h-4/);
    });
  });

  describe('animation', () => {
    it('should have smooth transition', () => {
      // Act
      render(<UsageBar percentage={50} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveClass(/transition/);
    });

    it('should update width smoothly when percentage changes', () => {
      // Arrange
      const { rerender } = render(<UsageBar percentage={30} label="CPU" />);

      let progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '30');

      // Act
      rerender(<UsageBar percentage={70} label="CPU" />);

      // Assert
      progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '70');
    });
  });

  describe('optional props', () => {
    it('should work without label', () => {
      // Act
      render(<UsageBar percentage={50} />);

      // Assert
      const usageBar = screen.getByTestId('usage-bar');
      expect(usageBar).toBeInTheDocument();
    });

    it('should support custom className', () => {
      // Act
      render(<UsageBar percentage={50} label="CPU" className="custom-class" />);

      // Assert
      const usageBar = screen.getByTestId('usage-bar');
      expect(usageBar).toHaveClass('custom-class');
    });

    it('should support showing text inside bar', () => {
      // Act
      render(<UsageBar percentage={50} label="CPU" showText={true} />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveTextContent('50%');
    });
  });
});
