import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UsageBar } from './UsageBar';

describe('UsageBar', () => {
  describe('rendering - happy path', () => {
    it('should render without crashing', () => {
      // Arrange & Act
      render(<UsageBar value={50} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should display as progress bar with correct role', () => {
      // Arrange & Act
      render(<UsageBar value={75} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('role', 'progressbar');
    });

    it('should have data-testid for testing', () => {
      // Arrange & Act
      render(<UsageBar value={50} />);

      // Assert
      const usageBar = screen.getByTestId('usage-bar');
      expect(usageBar).toBeInTheDocument();
    });
  });

  describe('value display', () => {
    it('should set aria-valuenow to the provided value', () => {
      // Arrange & Act
      render(<UsageBar value={42} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '42');
    });

    it('should set aria-valuemin to 0', () => {
      // Arrange & Act
      render(<UsageBar value={50} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    });

    it('should set aria-valuemax to 100', () => {
      // Arrange & Act
      render(<UsageBar value={50} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should display visual progress bar with correct width', () => {
      // Arrange & Act
      render(<UsageBar value={65} />);

      // Assert
      const progressFill = screen.getByTestId('usage-bar-fill');
      expect(progressFill).toBeInTheDocument();
      expect(progressFill).toHaveStyle({ width: '65%' });
    });
  });

  describe('edge cases', () => {
    it('should handle 0% value', () => {
      // Arrange & Act
      render(<UsageBar value={0} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');

      const progressFill = screen.getByTestId('usage-bar-fill');
      expect(progressFill).toHaveStyle({ width: '0%' });
    });

    it('should handle 100% value', () => {
      // Arrange & Act
      render(<UsageBar value={100} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');

      const progressFill = screen.getByTestId('usage-bar-fill');
      expect(progressFill).toHaveStyle({ width: '100%' });
    });

    it('should handle decimal values', () => {
      // Arrange & Act
      render(<UsageBar value={45.7} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '45.7');
    });

    it('should clamp values above 100 to 100', () => {
      // Arrange & Act
      render(<UsageBar value={150} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      const ariaValue = parseFloat(progressBar.getAttribute('aria-valuenow') || '0');
      expect(ariaValue).toBeLessThanOrEqual(100);
    });

    it('should clamp negative values to 0', () => {
      // Arrange & Act
      render(<UsageBar value={-10} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      const ariaValue = parseFloat(progressBar.getAttribute('aria-valuenow') || '0');
      expect(ariaValue).toBeGreaterThanOrEqual(0);
    });
  });

  describe('styling', () => {
    it('should apply low usage color for values < 60', () => {
      // Arrange & Act
      render(<UsageBar value={30} />);

      // Assert
      const progressFill = screen.getByTestId('usage-bar-fill');
      expect(progressFill).toHaveClass(/green|success/i);
    });

    it('should apply medium usage color for values 60-80', () => {
      // Arrange & Act
      render(<UsageBar value={70} />);

      // Assert
      const progressFill = screen.getByTestId('usage-bar-fill');
      expect(progressFill).toHaveClass(/yellow|warning/i);
    });

    it('should apply high usage color for values > 80', () => {
      // Arrange & Act
      render(<UsageBar value={90} />);

      // Assert
      const progressFill = screen.getByTestId('usage-bar-fill');
      expect(progressFill).toHaveClass(/red|danger|error/i);
    });

    it('should have rounded corners', () => {
      // Arrange & Act
      render(<UsageBar value={50} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass(/rounded/);
    });

    it('should have background color for unfilled portion', () => {
      // Arrange & Act
      render(<UsageBar value={40} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass(/bg-/);
    });
  });

  describe('accessibility', () => {
    it('should have accessible label', () => {
      // Arrange & Act
      render(<UsageBar value={50} label="CPU Usage" />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'CPU Usage');
    });

    it('should default to generic label when not provided', () => {
      // Arrange & Act
      render(<UsageBar value={50} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      const ariaLabel = progressBar.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/usage|progress/i);
    });

    it('should be keyboard focusable', () => {
      // Arrange & Act
      render(<UsageBar value={50} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('animation', () => {
    it('should have smooth transition animation', () => {
      // Arrange & Act
      render(<UsageBar value={50} />);

      // Assert
      const progressFill = screen.getByTestId('usage-bar-fill');
      expect(progressFill).toHaveClass(/transition/);
    });
  });
});
