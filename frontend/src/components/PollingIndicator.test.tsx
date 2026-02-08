import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PollingIndicator } from './PollingIndicator';

describe('PollingIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering - happy path', () => {
    it('should render without crashing', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('should display "Updated" text', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      expect(screen.getByText(/updated|last updated/i)).toBeInTheDocument();
    });
  });

  describe('timestamp display', () => {
    it('should show "just now" for recent updates', () => {
      // Arrange
      const now = new Date();

      // Act
      render(<PollingIndicator lastUpdated={now} />);

      // Assert
      expect(screen.getByText(/just now/i)).toBeInTheDocument();
    });

    it('should show seconds ago for updates within last minute', () => {
      // Arrange
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);

      // Act
      render(<PollingIndicator lastUpdated={thirtySecondsAgo} />);

      // Assert
      expect(screen.getByText(/30 seconds ago/i)).toBeInTheDocument();
    });

    it('should show minutes ago for older updates', () => {
      // Arrange
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

      // Act
      render(<PollingIndicator lastUpdated={twoMinutesAgo} />);

      // Assert
      expect(screen.getByText(/2 minutes ago/i)).toBeInTheDocument();
    });

    it('should show hours ago for very old updates', () => {
      // Arrange
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      // Act
      render(<PollingIndicator lastUpdated={twoHoursAgo} />);

      // Assert
      expect(screen.getByText(/2 hours ago/i)).toBeInTheDocument();
    });

    it('should update timestamp display over time', () => {
      // Arrange
      vi.useFakeTimers();
      const now = new Date();

      // Act
      render(<PollingIndicator lastUpdated={now} />);

      expect(screen.getByText(/just now/i)).toBeInTheDocument();

      // Advance time by 30 seconds
      vi.advanceTimersByTime(30 * 1000);

      // Assert - should update to show seconds
      expect(screen.getByText(/30 seconds ago/i)).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when loading', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} loading={true} />);

      // Assert
      const loadingIndicator = screen.getByTestId('loading-spinner');
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should display "Updating..." text when loading', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} loading={true} />);

      // Assert
      expect(screen.getByText(/updating|refreshing/i)).toBeInTheDocument();
    });

    it('should hide timestamp when loading', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} loading={true} />);

      // Assert
      expect(screen.queryByText(/ago/i)).not.toBeInTheDocument();
    });

    it('should animate loading spinner', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} loading={true} />);

      // Assert
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveClass(/animate-spin|rotate/);
    });
  });

  describe('manual refresh button', () => {
    it('should display refresh button', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const refreshButton = screen.getByRole('button', { name: /refresh|reload/i });
      expect(refreshButton).toBeInTheDocument();
    });

    it('should call onRefresh when refresh button is clicked', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={new Date()} onRefresh={onRefresh} />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      // Assert
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should disable refresh button while loading', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} loading={true} />);

      // Assert
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeDisabled();
    });

    it('should show refresh icon', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      const icon = refreshButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('auto-refresh countdown', () => {
    it('should display next refresh countdown', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} nextRefreshIn={8} />);

      // Assert
      expect(screen.getByText(/next refresh in 8s|refreshing in 8s/i)).toBeInTheDocument();
    });

    it('should update countdown display', () => {
      // Arrange
      vi.useFakeTimers();

      // Act
      const { rerender } = render(<PollingIndicator lastUpdated={new Date()} nextRefreshIn={10} />);

      expect(screen.getByText(/10s/)).toBeInTheDocument();

      // Update prop
      rerender(<PollingIndicator lastUpdated={new Date()} nextRefreshIn={5} />);

      // Assert
      expect(screen.getByText(/5s/)).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should not show countdown when less than 1 second', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} nextRefreshIn={0} />);

      // Assert
      expect(screen.queryByText(/next refresh/i)).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle null lastUpdated', () => {
      // Act
      render(<PollingIndicator lastUpdated={null} />);

      // Assert
      expect(screen.getByText(/never updated|no data/i)).toBeInTheDocument();
    });

    it('should handle undefined lastUpdated', () => {
      // Act
      render(<PollingIndicator />);

      // Assert
      expect(screen.getByText(/never updated|no data/i)).toBeInTheDocument();
    });

    it('should handle future timestamp gracefully', () => {
      // Arrange
      const future = new Date(Date.now() + 60 * 1000);

      // Act
      render(<PollingIndicator lastUpdated={future} />);

      // Assert
      expect(screen.getByText(/just now/i)).toBeInTheDocument();
    });

    it('should handle very old timestamps', () => {
      // Arrange
      const veryOld = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      // Act
      render(<PollingIndicator lastUpdated={veryOld} />);

      // Assert
      expect(screen.getByText(/7 days ago/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toHaveAttribute('aria-label', 'Polling indicator');
    });

    it('should announce loading state to screen readers', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} loading={true} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toHaveAttribute('aria-busy', 'true');
      expect(indicator).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible refresh button', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toHaveAttribute('aria-label', 'Refresh data');
    });
  });

  describe('styling', () => {
    it('should have compact styling', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toHaveClass(/text-sm|text-xs/);
    });

    it('should have muted text color', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toHaveClass(/text-gray/);
    });

    it('should align items horizontally', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toHaveClass(/flex|inline-flex/);
    });
  });

  describe('responsive behavior', () => {
    it('should be visible on mobile', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).not.toHaveClass(/hidden/);
    });

    it('should adjust layout on small screens', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} nextRefreshIn={10} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator.className).toMatch(/flex/);
    });
  });

  describe('integration with polling', () => {
    it('should show paused state when tab is hidden', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} paused={true} />);

      // Assert
      expect(screen.getByText(/paused|stopped/i)).toBeInTheDocument();
    });

    it('should not show countdown when paused', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} nextRefreshIn={10} paused={true} />);

      // Assert
      expect(screen.queryByText(/next refresh/i)).not.toBeInTheDocument();
    });

    it('should show resume message when paused', () => {
      // Act
      render(<PollingIndicator lastUpdated={new Date()} paused={true} />);

      // Assert
      expect(screen.getByText(/will resume|paused/i)).toBeInTheDocument();
    });
  });
});
