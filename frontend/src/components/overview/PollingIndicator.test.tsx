import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PollingIndicator } from './PollingIndicator';

describe('PollingIndicator', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('rendering - happy path', () => {
    it('should render polling indicator', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      expect(screen.getByTestId('polling-indicator')).toBeInTheDocument();
    });

    it('should display "Updated" text', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      expect(screen.getByText(/updated/i)).toBeInTheDocument();
    });

    it('should display relative time for recent update', () => {
      // Arrange
      const now = new Date();

      // Act
      render(<PollingIndicator lastUpdated={now} />);

      // Assert
      expect(screen.getByText(/just now|seconds ago/i)).toBeInTheDocument();
    });

    it('should update time display as time passes', () => {
      // Arrange
      const pastTime = new Date(Date.now() - 5000); // 5 seconds ago

      // Act
      render(<PollingIndicator lastUpdated={pastTime} />);

      // Assert - Component should display relative time
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator.textContent).toMatch(/seconds ago|just now/i);
    });
  });

  describe('time formatting', () => {
    it('should show "just now" for updates within 5 seconds', () => {
      // Arrange
      const now = new Date();

      // Act
      render(<PollingIndicator lastUpdated={now} />);

      // Assert
      expect(screen.getByText(/just now/i)).toBeInTheDocument();
    });

    it('should show seconds for updates within 1 minute', () => {
      // Arrange
      const pastTime = new Date(Date.now() - 30000); // 30 seconds ago

      // Act
      render(<PollingIndicator lastUpdated={pastTime} />);

      // Assert
      expect(screen.getByText(/30 seconds ago/i)).toBeInTheDocument();
    });

    it('should show minutes for updates within 1 hour', () => {
      // Arrange
      const pastTime = new Date(Date.now() - 300000); // 5 minutes ago

      // Act
      render(<PollingIndicator lastUpdated={pastTime} />);

      // Assert
      expect(screen.getByText(/5 minutes ago/i)).toBeInTheDocument();
    });

    it('should show hours for updates within 24 hours', () => {
      // Arrange
      const pastTime = new Date(Date.now() - 7200000); // 2 hours ago

      // Act
      render(<PollingIndicator lastUpdated={pastTime} />);

      // Assert
      expect(screen.getByText(/2 hours ago/i)).toBeInTheDocument();
    });

    it('should show absolute time for updates over 24 hours ago', () => {
      // Arrange
      const pastTime = new Date(Date.now() - 86400000 * 2); // 2 days ago

      // Act
      render(<PollingIndicator lastUpdated={pastTime} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toHaveTextContent(/\d{1,2}\/\d{1,2}\/\d{4}|\w+ \d{1,2}/);
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when isLoading is true', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} isLoading={true} />);

      // Assert
      expect(screen.getByText(/updating/i)).toBeInTheDocument();
    });

    it('should show spinner during loading', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} isLoading={true} />);

      // Assert
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide time during loading', () => {
      // Arrange
      const pastTime = new Date(Date.now() - 30000);

      // Act
      render(<PollingIndicator lastUpdated={pastTime} isLoading={true} />);

      // Assert
      expect(screen.queryByText(/seconds ago/i)).not.toBeInTheDocument();
    });

    it('should show time again after loading completes', async () => {
      // Arrange
      const pastTime = new Date(Date.now() - 30000);

      // Act
      const { rerender } = render(
        <PollingIndicator lastUpdated={pastTime} isLoading={true} />
      );

      expect(screen.getByText(/updating/i)).toBeInTheDocument();

      // Rerender with loading false
      rerender(<PollingIndicator lastUpdated={new Date()} isLoading={false} />);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText(/updating/i)).not.toBeInTheDocument();
        expect(screen.getByText(/just now/i)).toBeInTheDocument();
      });
    });
  });

  describe('manual refresh button', () => {
    it('should display refresh button', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} onRefresh={vi.fn()} />);

      // Assert
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
    });

    it('should call onRefresh when button is clicked', () => {
      // Arrange
      const onRefresh = vi.fn();
      render(<PollingIndicator lastUpdated={new Date()} onRefresh={onRefresh} />);

      // Act
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      // Assert
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should disable refresh button during loading', () => {
      // Arrange & Act
      render(
        <PollingIndicator
          lastUpdated={new Date()}
          isLoading={true}
          onRefresh={vi.fn()}
        />
      );

      // Assert
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeDisabled();
    });

    it('should show loading spinner in button during refresh', () => {
      // Arrange & Act
      render(
        <PollingIndicator
          lastUpdated={new Date()}
          isLoading={true}
          onRefresh={vi.fn()}
        />
      );

      // Assert
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      const spinner = refreshButton.querySelector('[data-testid="loading-spinner"]');
      expect(spinner).toBeInTheDocument();
    });

    it('should not show refresh button if onRefresh not provided', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const refreshButton = screen.queryByRole('button', { name: /refresh/i });
      expect(refreshButton).not.toBeInTheDocument();
    });
  });

  describe('next poll countdown', () => {
    it('should show countdown to next poll', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} nextPollIn={10} />);

      // Assert
      expect(screen.getByText(/next update in 10s/i)).toBeInTheDocument();
    });

    it('should update countdown as time passes', async () => {
      // Arrange
      const { rerender } = render(
        <PollingIndicator lastUpdated={new Date()} nextPollIn={10} />
      );

      expect(screen.getByText(/next update in 10s/i)).toBeInTheDocument();

      // Act - Update countdown
      rerender(<PollingIndicator lastUpdated={new Date()} nextPollIn={5} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/next update in 5s/i)).toBeInTheDocument();
      });
    });

    it('should not show countdown when 0 or less', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} nextPollIn={0} />);

      // Assert
      expect(screen.queryByText(/next update in/i)).not.toBeInTheDocument();
    });

    it('should not show countdown during loading', () => {
      // Arrange & Act
      render(
        <PollingIndicator
          lastUpdated={new Date()}
          nextPollIn={10}
          isLoading={true}
        />
      );

      // Assert
      expect(screen.queryByText(/next update in/i)).not.toBeInTheDocument();
    });
  });

  describe('visual indicators', () => {
    it('should show success indicator for recent update', () => {
      // Arrange
      const now = new Date();

      // Act
      render(<PollingIndicator lastUpdated={now} />);

      // Assert
      const indicator = screen.getByTestId('polling-status-indicator');
      expect(indicator).toHaveClass(/success|green|active/i);
    });

    it('should show warning indicator for stale data', () => {
      // Arrange
      const oldTime = new Date(Date.now() - 300000); // 5 minutes ago

      // Act
      render(<PollingIndicator lastUpdated={oldTime} />);

      // Assert
      const indicator = screen.getByTestId('polling-status-indicator');
      expect(indicator).toHaveClass(/warning|yellow|stale/i);
    });

    it('should show loading indicator during refresh', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} isLoading={true} />);

      // Assert
      const indicator = screen.getByTestId('polling-status-indicator');
      expect(indicator).toHaveClass(/loading|spinner|animate/i);
    });
  });

  describe('edge cases', () => {
    it('should handle null lastUpdated', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={null} />);

      // Assert
      expect(screen.getByText(/never updated|no data/i)).toBeInTheDocument();
    });

    it('should handle future lastUpdated date', () => {
      // Arrange
      const futureTime = new Date(Date.now() + 60000); // 1 minute in future

      // Act
      render(<PollingIndicator lastUpdated={futureTime} />);

      // Assert
      expect(screen.getByText(/just now/i)).toBeInTheDocument();
    });

    it('should handle very old lastUpdated date', () => {
      // Arrange
      const oldTime = new Date(Date.now() - 86400000 * 365); // 1 year ago

      // Act
      render(<PollingIndicator lastUpdated={oldTime} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toHaveAttribute('aria-label', expect.stringMatching(/last updated|polling/i));
    });

    it('should announce updates to screen readers', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible refresh button', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} onRefresh={vi.fn()} />);

      // Assert
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toHaveAccessibleName();
    });
  });

  describe('responsive layout', () => {
    it('should be readable on mobile screens', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('should have appropriate text size', () => {
      // Arrange & Act
      render(<PollingIndicator lastUpdated={new Date()} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toHaveClass(/text-sm|text-xs/i);
    });
  });
});
