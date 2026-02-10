import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UsageBar } from './UsageBar';

describe('UsageBar', () => {
  describe('rendering - happy path', () => {
    it('should render without crashing', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should display as progress bar with accessible role', () => {
      // Arrange & Act
      render(<UsageBar percentage={75} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should be findable by test id', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} />);

      // Assert
      const usageBar = screen.getByTestId('usage-bar');
      expect(usageBar).toBeInTheDocument();
    });
  });

  describe('percentage display', () => {
    it('should set aria-valuenow to percentage value', () => {
      // Arrange & Act
      render(<UsageBar percentage={45.5} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '45.5');
    });

    it('should set aria-valuemin to 0', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    });

    it('should set aria-valuemax to 100', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should display correct percentage text', () => {
      // Arrange & Act
      render(<UsageBar percentage={62.3} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveTextContent(/62\.3%/);
    });

    it('should handle integer percentages', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('should handle decimal percentages', () => {
      // Arrange & Act
      render(<UsageBar percentage={45.567} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      const ariaValue = progressBar.getAttribute('aria-valuenow');
      expect(parseFloat(ariaValue!)).toBeCloseTo(45.567, 2);
    });
  });

  describe('visual styling', () => {
    it('should apply width based on percentage', () => {
      // Arrange & Act
      render(<UsageBar percentage={75} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      const fillElement = progressBar.querySelector('[style*="width"]');

      if (fillElement) {
        const style = fillElement.getAttribute('style');
        expect(style).toContain('75%');
      }
    });

    it('should show different colors for different usage levels', () => {
      // Test low usage (green)
      const { rerender } = render(<UsageBar percentage={30} />);
      let progressBar = screen.getByRole('progressbar');
      expect(progressBar.className).toContain(/green|success/i);

      // Test medium usage (yellow/warning)
      rerender(<UsageBar percentage={70} />);
      progressBar = screen.getByRole('progressbar');
      expect(progressBar.className).toContain(/yellow|warning/i);

      // Test high usage (red/danger)
      rerender(<UsageBar percentage={90} />);
      progressBar = screen.getByRole('progressbar');
      expect(progressBar.className).toContain(/red|danger|error/i);
    });
  });

  describe('edge cases', () => {
    it('should handle 0% usage', () => {
      // Arrange & Act
      render(<UsageBar percentage={0} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(progressBar).toHaveTextContent(/0%/);
    });

    it('should handle 100% usage', () => {
      // Arrange & Act
      render(<UsageBar percentage={100} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
      expect(progressBar).toHaveTextContent(/100%/);
    });

    it('should handle very small percentages', () => {
      // Arrange & Act
      render(<UsageBar percentage={0.1} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0.1');
    });

    it('should handle high precision decimals', () => {
      // Arrange & Act
      render(<UsageBar percentage={45.56789} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      const ariaValue = progressBar.getAttribute('aria-valuenow');
      expect(parseFloat(ariaValue!)).toBeCloseTo(45.56789, 4);
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      // Arrange & Act
      render(<UsageBar percentage={60} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow');
      expect(progressBar).toHaveAttribute('aria-valuemin');
      expect(progressBar).toHaveAttribute('aria-valuemax');
    });

    it('should be announced to screen readers', () => {
      // Arrange & Act
      render(<UsageBar percentage={60} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('role', 'progressbar');
    });

    it('should provide accessible label with aria-label', () => {
      // Arrange & Act
      render(<UsageBar percentage={60} label="CPU Usage" />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', expect.stringMatching(/cpu usage/i));
    });
  });

  describe('optional props', () => {
    it('should render without label prop', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should render with label prop', () => {
      // Arrange & Act
      render(<UsageBar percentage={50} label="Memory Usage" />);

      // Assert
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', expect.stringMatching(/memory usage/i));
    });
  });
});
