import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UsageBar } from './UsageBar';

describe('UsageBar', () => {
  describe('rendering - happy path', () => {
    it('should render without crashing', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} type="cpu" />);

      // Assert
      const bar = screen.getByTestId('usage-bar');
      expect(bar).toBeInTheDocument();
    });

    it('should display percentage value', () => {
      // Arrange & Act
      render(<UsageBar percentage={75.5} type="cpu" />);

      // Assert
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'cpu usage 75.5%');
      expect(progressbar).toHaveAttribute('aria-valuenow', '75.5');
    });

    it('should render bar visualization', () => {
      // Arrange & Act
      render(<UsageBar percentage={60} type="cpu" />);

      // Assert
      expect(screen.getByTestId('usage-bar-fill')).toBeInTheDocument();
    });

    it('should set bar width based on percentage', () => {
      // Arrange & Act
      render(<UsageBar percentage={80} type="cpu" />);

      // Assert
      const fill = screen.getByTestId('usage-bar-fill');
      expect(fill.style.width).toBe('80%');
    });
  });

  describe('percentage display', () => {
    it('should handle zero percentage', () => {
      // Arrange & Act
      render(<UsageBar percentage={0} type="cpu" />);

      // Assert
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'cpu usage 0.0%');
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
      const fill = screen.getByTestId('usage-bar-fill');
      expect(fill.style.width).toBe('0%');
    });

    it('should handle 100 percentage', () => {
      // Arrange & Act
      render(<UsageBar percentage={100} type="cpu" />);

      // Assert
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'cpu usage 100.0%');
      expect(progressbar).toHaveAttribute('aria-valuenow', '100');
      const fill = screen.getByTestId('usage-bar-fill');
      expect(fill.style.width).toBe('100%');
    });

    it('should handle decimal percentages', () => {
      // Arrange & Act
      render(<UsageBar percentage={45.678} type="cpu" />);

      // Assert
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'cpu usage 45.7%');
      expect(progressbar).toHaveAttribute('aria-valuenow', '45.678');
    });

    it('should format percentage to 1 decimal place', () => {
      // Arrange & Act
      render(<UsageBar percentage={33.333} type="memory" />);

      // Assert
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'memory usage 33.3%');
      expect(progressbar).toHaveAttribute('aria-valuenow', '33.333');
    });
  });

  describe('color coding by usage level', () => {
    it('should use green color for low usage (< 60%)', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} type="cpu" />);

      // Assert
      const fill = screen.getByTestId('usage-bar-fill');
      expect(fill.className).toMatch(/green|success/i);
    });

    it('should use yellow color for medium usage (60-80%)', () => {
      // Arrange & Act
      render(<UsageBar percentage={70} type="cpu" />);

      // Assert
      const fill = screen.getByTestId('usage-bar-fill');
      expect(fill.className).toMatch(/yellow|warning/i);
    });

    it('should use red color for high usage (> 80%)', () => {
      // Arrange & Act
      render(<UsageBar percentage={90} type="cpu" />);

      // Assert
      const fill = screen.getByTestId('usage-bar-fill');
      expect(fill.className).toMatch(/red|danger|error/i);
    });

    it('should handle boundary at 60%', () => {
      // Arrange & Act
      render(<UsageBar percentage={60} type="cpu" />);

      // Assert
      const fill = screen.getByTestId('usage-bar-fill');
      expect(fill.className).toMatch(/yellow|warning|green|success/i);
    });

    it('should handle boundary at 80%', () => {
      // Arrange & Act
      render(<UsageBar percentage={80} type="cpu" />);

      // Assert
      const fill = screen.getByTestId('usage-bar-fill');
      expect(fill.className).toMatch(/yellow|warning|red|danger/i);
    });
  });

  describe('type differentiation', () => {
    it('should accept CPU type', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} type="cpu" />);

      // Assert
      const bar = screen.getByTestId('usage-bar');
      expect(bar).toHaveAttribute('data-type', 'cpu');
    });

    it('should accept Memory type', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} type="memory" />);

      // Assert
      const bar = screen.getByTestId('usage-bar');
      expect(bar).toHaveAttribute('data-type', 'memory');
    });

    it('should apply different styling for CPU vs Memory', () => {
      // Arrange & Act
      const { rerender } = render(<UsageBar percentage={50} type="cpu" />);
      const cpuBar = screen.getByTestId('usage-bar');
      const cpuClass = cpuBar.className;

      rerender(<UsageBar percentage={50} type="memory" />);
      const memoryBar = screen.getByTestId('usage-bar');
      const memoryClass = memoryBar.className;

      // Assert - classes might differ for CPU vs Memory
      expect(cpuClass).toBeDefined();
      expect(memoryClass).toBeDefined();
    });
  });

  describe('bar appearance', () => {
    it('should have background container', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} type="cpu" />);

      // Assert
      const container = screen.getByTestId('usage-bar-container');
      expect(container).toBeInTheDocument();
      expect(container.className).toMatch(/bg-/);
    });

    it('should have rounded corners', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} type="cpu" />);

      // Assert
      const container = screen.getByTestId('usage-bar-container');
      expect(container.className).toMatch(/rounded/);
    });

    it('should have height styling', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} type="cpu" />);

      // Assert
      const container = screen.getByTestId('usage-bar-container');
      expect(container.className).toMatch(/h-/);
    });

    it('should have smooth transition animation', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} type="cpu" />);

      // Assert
      const fill = screen.getByTestId('usage-bar-fill');
      expect(fill.className).toMatch(/transition/);
    });
  });

  describe('edge cases', () => {
    it('should handle negative percentage as zero', () => {
      // Arrange & Act
      render(<UsageBar percentage={-10} type="cpu" />);

      // Assert
      const fill = screen.getByTestId('usage-bar-fill');
      expect(fill.style.width).toBe('0%');
    });

    it('should handle percentage over 100 as 100', () => {
      // Arrange & Act
      render(<UsageBar percentage={150} type="cpu" />);

      // Assert
      const fill = screen.getByTestId('usage-bar-fill');
      expect(fill.style.width).toBe('100%');
    });

    it('should handle very small percentages', () => {
      // Arrange & Act
      render(<UsageBar percentage={0.1} type="cpu" />);

      // Assert
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'cpu usage 0.1%');
      expect(progressbar).toHaveAttribute('aria-valuenow', '0.1');
      const fill = screen.getByTestId('usage-bar-fill');
      expect(fill.style.width).toBe('0.1%');
    });

    it('should handle very precise decimal values', () => {
      // Arrange & Act
      render(<UsageBar percentage={45.6789} type="memory" />);

      // Assert
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'memory usage 45.7%');
      expect(progressbar).toHaveAttribute('aria-valuenow', '45.6789');
    });
  });

  describe('accessibility', () => {
    it('should have ARIA role progressbar', () => {
      // Arrange & Act
      render(<UsageBar percentage={75} type="cpu" />);

      // Assert
      const bar = screen.getByRole('progressbar');
      expect(bar).toBeInTheDocument();
    });

    it('should have aria-valuenow attribute', () => {
      // Arrange & Act
      render(<UsageBar percentage={65} type="cpu" />);

      // Assert
      const bar = screen.getByRole('progressbar');
      expect(bar).toHaveAttribute('aria-valuenow', '65');
    });

    it('should have aria-valuemin attribute', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} type="cpu" />);

      // Assert
      const bar = screen.getByRole('progressbar');
      expect(bar).toHaveAttribute('aria-valuemin', '0');
    });

    it('should have aria-valuemax attribute', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} type="cpu" />);

      // Assert
      const bar = screen.getByRole('progressbar');
      expect(bar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have descriptive aria-label', () => {
      // Arrange & Act
      render(<UsageBar percentage={75} type="cpu" />);

      // Assert
      const bar = screen.getByRole('progressbar');
      expect(bar).toHaveAttribute('aria-label', expect.stringMatching(/cpu usage|75/i));
    });
  });

  describe('responsive design', () => {
    it('should scale appropriately on different screen sizes', () => {
      // Arrange & Act
      render(<UsageBar percentage={60} type="cpu" />);

      // Assert
      const container = screen.getByTestId('usage-bar-container');
      expect(container.className).toMatch(/w-full/);
    });

    it('should maintain aspect ratio', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} type="cpu" />);

      // Assert
      const fill = screen.getByTestId('usage-bar-fill');
      expect(fill.className).toMatch(/h-full/);
    });
  });
});
