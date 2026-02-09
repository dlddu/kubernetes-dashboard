import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UsageBar } from './UsageBar';

describe('UsageBar', () => {
  describe('rendering - happy path', () => {
    it('should render usage bar with percentage', () => {
      // Arrange & Act
      render(<UsageBar percentage={45.5} label="CPU" />);

      // Assert
      expect(screen.getByTestId('usage-bar')).toBeInTheDocument();
      expect(screen.getByText(/45\.5%/)).toBeInTheDocument();
    });

    it('should display label', () => {
      // Arrange & Act
      render(<UsageBar percentage={60} label="Memory" />);

      // Assert
      expect(screen.getByText(/Memory/i)).toBeInTheDocument();
    });

    it('should show visual bar representation', () => {
      // Arrange & Act
      render(<UsageBar percentage={75} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toBeInTheDocument();
    });

    it('should set bar width according to percentage', () => {
      // Arrange & Act
      render(<UsageBar percentage={60} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveStyle({ width: '60%' });
    });
  });

  describe('color coding based on usage level', () => {
    it('should show green color for low usage (< 50%)', () => {
      // Arrange & Act
      render(<UsageBar percentage={30} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveClass(/bg-green|success|low/i);
    });

    it('should show yellow color for medium usage (50-80%)', () => {
      // Arrange & Act
      render(<UsageBar percentage={65} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveClass(/bg-yellow|warning|medium/i);
    });

    it('should show red color for high usage (> 80%)', () => {
      // Arrange & Act
      render(<UsageBar percentage={90} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveClass(/bg-red|error|danger|high/i);
    });

    it('should show yellow at exactly 50%', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveClass(/bg-yellow|warning|medium/i);
    });

    it('should show red at exactly 80%', () => {
      // Arrange & Act
      render(<UsageBar percentage={80} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveClass(/bg-yellow|warning|medium/i);
    });

    it('should show red at exactly 81%', () => {
      // Arrange & Act
      render(<UsageBar percentage={81} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveClass(/bg-red|error|danger|high/i);
    });
  });

  describe('edge cases', () => {
    it('should handle 0% usage', () => {
      // Arrange & Act
      render(<UsageBar percentage={0} label="CPU" />);

      // Assert
      expect(screen.getByText(/0%/)).toBeInTheDocument();
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveStyle({ width: '0%' });
    });

    it('should handle 100% usage', () => {
      // Arrange & Act
      render(<UsageBar percentage={100} label="CPU" />);

      // Assert
      expect(screen.getByText(/100%/)).toBeInTheDocument();
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveStyle({ width: '100%' });
    });

    it('should handle fractional percentages', () => {
      // Arrange & Act
      render(<UsageBar percentage={33.333} label="CPU" />);

      // Assert
      expect(screen.getByText(/33\.3/)).toBeInTheDocument();
    });

    it('should round percentage to 1 decimal place', () => {
      // Arrange & Act
      render(<UsageBar percentage={45.5678} label="CPU" />);

      // Assert
      expect(screen.getByText(/45\.6%/)).toBeInTheDocument();
    });

    it('should handle very small percentages', () => {
      // Arrange & Act
      render(<UsageBar percentage={0.1} label="CPU" />);

      // Assert
      expect(screen.getByText(/0\.1%/)).toBeInTheDocument();
    });

    it('should cap percentage display at 100% even if value exceeds', () => {
      // Arrange & Act
      render(<UsageBar percentage={105} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveStyle({ width: '100%' });
    });
  });

  describe('different labels', () => {
    it('should display CPU label correctly', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} label="CPU" />);

      // Assert
      expect(screen.getByText('CPU')).toBeInTheDocument();
    });

    it('should display Memory label correctly', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} label="Memory" />);

      // Assert
      expect(screen.getByText('Memory')).toBeInTheDocument();
    });

    it('should display custom labels', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} label="Disk Usage" />);

      // Assert
      expect(screen.getByText('Disk Usage')).toBeInTheDocument();
    });
  });

  describe('visual styling', () => {
    it('should have background container', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} label="CPU" />);

      // Assert
      const container = screen.getByTestId('usage-bar-container');
      expect(container).toHaveClass(/bg-gray|bg-slate|rounded/i);
    });

    it('should have rounded corners', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveClass(/rounded/i);
    });

    it('should have smooth transition for width changes', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar-fill');
      expect(bar).toHaveClass(/transition/i);
    });

    it('should have appropriate height', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} label="CPU" />);

      // Assert
      const container = screen.getByTestId('usage-bar-container');
      expect(container).toHaveClass(/h-|height/i);
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA role', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar');
      expect(bar).toHaveAttribute('role', 'progressbar');
    });

    it('should have aria-valuenow attribute', () => {
      // Arrange & Act
      render(<UsageBar percentage={67.5} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar');
      expect(bar).toHaveAttribute('aria-valuenow', '67.5');
    });

    it('should have aria-valuemin attribute', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar');
      expect(bar).toHaveAttribute('aria-valuemin', '0');
    });

    it('should have aria-valuemax attribute', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar');
      expect(bar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have aria-label with label and percentage', () => {
      // Arrange & Act
      render(<UsageBar percentage={75} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar');
      expect(bar).toHaveAttribute('aria-label', 'CPU usage: 75%');
    });

    it('should have accessible text for screen readers', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} label="CPU" />);

      // Assert
      const bar = screen.getByTestId('usage-bar');
      expect(bar).toHaveAccessibleName();
    });
  });

  describe('responsive behavior', () => {
    it('should be readable on small screens', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} label="CPU" />);

      // Assert
      const container = screen.getByTestId('usage-bar');
      expect(container).toBeInTheDocument();
    });

    it('should maintain aspect ratio on different screen sizes', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} label="CPU" />);

      // Assert
      const container = screen.getByTestId('usage-bar-container');
      expect(container).toHaveClass(/w-full|width-full/i);
    });
  });

  describe('optional props', () => {
    it('should accept custom className', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} label="CPU" className="custom-class" />);

      // Assert
      const bar = screen.getByTestId('usage-bar');
      expect(bar).toHaveClass('custom-class');
    });

    it('should support showLabel prop to hide label', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} label="CPU" showLabel={false} />);

      // Assert
      expect(screen.queryByText('CPU')).not.toBeInTheDocument();
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });

    it('should support showPercentage prop to hide percentage', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} label="CPU" showPercentage={false} />);

      // Assert
      expect(screen.getByText('CPU')).toBeInTheDocument();
      expect(screen.queryByText(/50%/)).not.toBeInTheDocument();
    });
  });
});
