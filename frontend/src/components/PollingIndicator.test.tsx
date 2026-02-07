import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PollingIndicator } from './PollingIndicator';

describe('PollingIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering - happy path', () => {
    it('should render without crashing', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('should display last updated time', () => {
      // Arrange
      const lastUpdated = new Date('2024-01-15T10:30:00');

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} />);

      // Assert
      expect(screen.getByText(/last updated/i)).toBeInTheDocument();
    });

    it('should format time in readable format', () => {
      // Arrange
      const now = new Date();
      const lastUpdated = new Date(now.getTime() - 30000); // 30 seconds ago

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} />);

      // Assert
      expect(screen.getByText(/30 seconds ago|just now/i)).toBeInTheDocument();
    });
  });

  describe('time formatting', () => {
    it('should show "just now" for very recent updates', () => {
      // Arrange
      const lastUpdated = new Date();

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} />);

      // Assert
      expect(screen.getByText(/just now/i)).toBeInTheDocument();
    });

    it('should show seconds ago for updates within a minute', () => {
      // Arrange
      const now = new Date();
      const lastUpdated = new Date(now.getTime() - 45000); // 45 seconds ago

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} />);

      // Assert
      expect(screen.getByText(/45 seconds ago/i)).toBeInTheDocument();
    });

    it('should show minutes ago for updates within an hour', () => {
      // Arrange
      const now = new Date();
      const lastUpdated = new Date(now.getTime() - 300000); // 5 minutes ago

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} />);

      // Assert
      expect(screen.getByText(/5 minutes ago/i)).toBeInTheDocument();
    });

    it('should show hours ago for updates within a day', () => {
      // Arrange
      const now = new Date();
      const lastUpdated = new Date(now.getTime() - 7200000); // 2 hours ago

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} />);

      // Assert
      expect(screen.getByText(/2 hours ago/i)).toBeInTheDocument();
    });

    it('should show date for updates older than a day', () => {
      // Arrange
      const lastUpdated = new Date('2024-01-15T10:30:00');

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} />);

      // Assert
      expect(screen.getByText(/Jan 15|January 15|2024-01-15/i)).toBeInTheDocument();
    });

    it('should handle singular "1 second ago"', () => {
      // Arrange
      const now = new Date();
      const lastUpdated = new Date(now.getTime() - 1000); // 1 second ago

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} />);

      // Assert - < 5 seconds shows "Just now"
      expect(screen.getByText(/just now/i)).toBeInTheDocument();
    });

    it('should handle singular "1 minute ago"', () => {
      // Arrange
      const now = new Date();
      const lastUpdated = new Date(now.getTime() - 60000); // 1 minute ago

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} />);

      // Assert
      expect(screen.getByText(/1 minute ago/i)).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when isLoading is true', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} isLoading={true} />);

      // Assert
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should not show loading indicator when isLoading is false', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} isLoading={false} />);

      // Assert
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    it('should display "Updating..." text when loading', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} isLoading={true} />);

      // Assert
      expect(screen.getByText(/updating/i)).toBeInTheDocument();
    });

    it('should show animated spinner when loading', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} isLoading={true} />);

      // Assert
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner.classList.contains('animate-spin')).toBe(true);
    });
  });

  describe('visual styling', () => {
    it('should use muted text color', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator.className).toMatch(/text-gray|text-muted/);
    });

    it('should use small text size', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator.className).toMatch(/text-sm|text-xs/);
    });

    it('should display icon next to text', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });

    it('should align items horizontally', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator.className).toMatch(/flex/);
    });
  });

  describe('edge cases', () => {
    it('should handle null lastUpdated', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={null} />);

      // Assert
      expect(screen.getByText(/never updated|no data/i)).toBeInTheDocument();
    });

    it('should handle undefined lastUpdated', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={undefined} />);

      // Assert
      expect(screen.getByText(/never updated|no data/i)).toBeInTheDocument();
    });

    it('should handle future date gracefully', () => {
      // Arrange
      const future = new Date(Date.now() + 60000); // 1 minute in future

      // Act
      render(<PollingIndicator lastUpdated={future} />);

      // Assert
      expect(screen.getByText(/just now/i)).toBeInTheDocument();
    });

    it('should handle invalid date', () => {
      // Arrange
      const invalidDate = new Date('invalid');

      // Act
      render(<PollingIndicator lastUpdated={invalidDate} />);

      // Assert
      expect(screen.getByText(/never updated|no data|invalid/i)).toBeInTheDocument();
    });
  });

  describe('real-time updates', () => {
    it('should update displayed time as time passes', () => {
      // Arrange
      vi.useFakeTimers();
      const lastUpdated = new Date();

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} />);

      // Initial render
      expect(screen.getByText(/just now/i)).toBeInTheDocument();

      // Advance time by 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      // Assert - should update to show elapsed time
      expect(screen.getByText(/30 seconds ago/i)).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should auto-refresh every second', () => {
      // Arrange
      vi.useFakeTimers();
      const lastUpdated = new Date();

      // Act
      const { rerender } = render(<PollingIndicator lastUpdated={lastUpdated} />);

      // Advance time
      vi.advanceTimersByTime(1000);
      rerender(<PollingIndicator lastUpdated={lastUpdated} />);

      // Assert - time should have updated
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('accessibility', () => {
    it('should have appropriate ARIA label', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toHaveAttribute('aria-label', expect.stringMatching(/last updated/i));
    });

    it('should mark as live region for screen readers', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toHaveAttribute('aria-live', 'polite');
    });

    it('should have semantic time element', () => {
      // Arrange
      const lastUpdated = new Date('2024-01-15T10:30:00');

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} />);

      // Assert
      const timeElement = screen.getByRole('time');
      expect(timeElement).toBeInTheDocument();
    });

    it('should include ISO datetime in time element', () => {
      // Arrange
      const lastUpdated = new Date('2024-01-15T10:30:00');

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} />);

      // Assert
      const timeElement = screen.getByRole('time');
      expect(timeElement).toHaveAttribute('datetime', lastUpdated.toISOString());
    });
  });

  describe('responsive design', () => {
    it('should be mobile-friendly', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator.className).toMatch(/text-xs|text-sm/);
    });

    it('should not wrap on small screens', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator.className).toMatch(/whitespace-nowrap/);
    });
  });
});
