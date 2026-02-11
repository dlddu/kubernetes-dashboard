import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { PollingIndicator } from './PollingIndicator';

describe('PollingIndicator', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering - basic structure', () => {
    it('should render without crashing', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('should display last update time', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} />);

      // Assert
      const lastUpdateTime = screen.getByTestId('last-update-time');
      expect(lastUpdateTime).toBeInTheDocument();
    });

    it('should display refresh button', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} />);

      // Assert
      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton.tagName).toBe('BUTTON');
    });

    it('should have refresh button with accessible label', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} />);

      // Assert
      const refreshButton = screen.getByRole('button', { name: /refresh|reload/i });
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('last update time display', () => {
    it('should show "just now" when last updated within 5 seconds', () => {
      // Arrange
      const onRefresh = vi.fn();
      const lastUpdate = new Date();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} lastUpdate={lastUpdate} />);

      // Assert
      const timeDisplay = screen.getByTestId('last-update-time');
      expect(timeDisplay.textContent).toMatch(/just now/i);
    });

    it('should show "N seconds ago" when last updated over 5 seconds ago', () => {
      // Arrange
      const onRefresh = vi.fn();
      const lastUpdate = new Date(Date.now() - 15000); // 15 seconds ago

      // Act
      render(<PollingIndicator onRefresh={onRefresh} lastUpdate={lastUpdate} />);

      // Assert
      const timeDisplay = screen.getByTestId('last-update-time');
      expect(timeDisplay.textContent).toMatch(/15\s*seconds?\s*ago/i);
    });

    it('should show "N minutes ago" when last updated over 60 seconds ago', () => {
      // Arrange
      const onRefresh = vi.fn();
      const lastUpdate = new Date(Date.now() - 120000); // 2 minutes ago

      // Act
      render(<PollingIndicator onRefresh={onRefresh} lastUpdate={lastUpdate} />);

      // Assert
      const timeDisplay = screen.getByTestId('last-update-time');
      expect(timeDisplay.textContent).toMatch(/2\s*minutes?\s*ago/i);
    });

    it('should update time display automatically every second', async () => {
      // Arrange
      const onRefresh = vi.fn();
      const lastUpdate = new Date(Date.now() - 5000); // 5 seconds ago

      // Act
      render(<PollingIndicator onRefresh={onRefresh} lastUpdate={lastUpdate} />);

      // Initial check
      let timeDisplay = screen.getByTestId('last-update-time');
      const initialText = timeDisplay.textContent;

      // Advance time by 10 seconds
      vi.advanceTimersByTime(10000);

      // Assert - display should update to show more time passed
      await waitFor(() => {
        timeDisplay = screen.getByTestId('last-update-time');
        expect(timeDisplay.textContent).not.toBe(initialText);
      });
    });

    it('should handle missing lastUpdate prop gracefully', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} />);

      // Assert - should show some default text
      const timeDisplay = screen.getByTestId('last-update-time');
      expect(timeDisplay).toBeInTheDocument();
    });

    it('should use singular form for 1 second ago', () => {
      // Arrange
      const onRefresh = vi.fn();
      const lastUpdate = new Date(Date.now() - 1000); // 1 second ago

      // Act
      render(<PollingIndicator onRefresh={onRefresh} lastUpdate={lastUpdate} />);

      // Assert
      const timeDisplay = screen.getByTestId('last-update-time');
      expect(timeDisplay.textContent).toMatch(/1\s*second\s*ago/i);
    });

    it('should use singular form for 1 minute ago', () => {
      // Arrange
      const onRefresh = vi.fn();
      const lastUpdate = new Date(Date.now() - 60000); // 1 minute ago

      // Act
      render(<PollingIndicator onRefresh={onRefresh} lastUpdate={lastUpdate} />);

      // Assert
      const timeDisplay = screen.getByTestId('last-update-time');
      expect(timeDisplay.textContent).toMatch(/1\s*minute\s*ago/i);
    });
  });

  describe('manual refresh button', () => {
    it('should call onRefresh when refresh button is clicked', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} />);
      const refreshButton = screen.getByTestId('refresh-button');
      await user.click(refreshButton);

      // Assert
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should disable refresh button while loading', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} isLoading={true} />);

      // Assert
      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).toBeDisabled();
    });

    it('should enable refresh button when not loading', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} isLoading={false} />);

      // Assert
      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).toBeEnabled();
    });

    it('should not call onRefresh when disabled button is clicked', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} isLoading={true} />);
      const refreshButton = screen.getByTestId('refresh-button');

      // Try to click disabled button
      await user.click(refreshButton).catch(() => {});

      // Assert
      expect(onRefresh).not.toHaveBeenCalled();
    });

    it('should be keyboard accessible', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} />);
      const refreshButton = screen.getByTestId('refresh-button');

      // Focus and press Enter
      refreshButton.focus();
      await user.keyboard('{Enter}');

      // Assert
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  describe('loading indicator', () => {
    it('should display loading indicator when isLoading is true', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} isLoading={true} />);

      // Assert
      const syncingIndicator = screen.getByTestId('syncing-indicator');
      expect(syncingIndicator).toBeInTheDocument();
    });

    it('should hide loading indicator when isLoading is false', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} isLoading={false} />);

      // Assert
      const syncingIndicator = screen.queryByTestId('syncing-indicator');
      expect(syncingIndicator).not.toBeInTheDocument();
    });

    it('should show loading text when syncing', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} isLoading={true} />);

      // Assert
      const loadingText = screen.getByText(/syncing|updating|loading/i);
      expect(loadingText).toBeInTheDocument();
    });

    it('should have aria-busy attribute when loading', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} isLoading={true} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toHaveAttribute('aria-busy', 'true');
    });

    it('should not have aria-busy when not loading', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} isLoading={false} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toHaveAttribute('aria-busy', 'false');
    });
  });

  describe('accessibility', () => {
    it('should have proper aria-label on container', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toHaveAttribute('aria-label');
      const ariaLabel = indicator.getAttribute('aria-label');
      expect(ariaLabel?.toLowerCase()).toMatch(/auto.?refresh|polling|update/i);
    });

    it('should have aria-live region for time updates', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible refresh button', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} />);

      // Assert
      const refreshButton = screen.getByRole('button');
      expect(refreshButton).toHaveAttribute('aria-label');
    });

    it('should announce loading state to screen readers', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} isLoading={true} />);

      // Assert
      const syncingIndicator = screen.getByTestId('syncing-indicator');
      expect(syncingIndicator).toHaveAttribute('role', 'status');
    });

    it('should have proper focus management', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} />);

      // Tab to refresh button
      await user.tab();

      // Assert
      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).toHaveFocus();
    });
  });

  describe('styling and layout', () => {
    it('should have proper CSS classes', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator.className).toBeTruthy();
    });

    it('should display items in horizontal layout', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator.className).toMatch(/flex|inline-flex/);
    });

    it('should have proper spacing between elements', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator.className).toMatch(/gap|space/);
    });

    it('should have spinner animation for loading indicator', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} isLoading={true} />);

      // Assert
      const syncingIndicator = screen.getByTestId('syncing-indicator');
      const spinner = syncingIndicator.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('tooltip / title attribute', () => {
    it('should show full timestamp on hover via title attribute', () => {
      // Arrange
      const onRefresh = vi.fn();
      const lastUpdate = new Date(2024, 0, 15, 14, 30, 45); // Jan 15, 2024 14:30:45

      // Act
      render(<PollingIndicator onRefresh={onRefresh} lastUpdate={lastUpdate} />);

      // Assert
      const timeDisplay = screen.getByTestId('last-update-time');
      const title = timeDisplay.getAttribute('title');
      expect(title).toBeTruthy();
      expect(title).toMatch(/2024|14:30:45/);
    });
  });

  describe('edge cases', () => {
    it('should handle very old timestamps', () => {
      // Arrange
      const onRefresh = vi.fn();
      const lastUpdate = new Date(Date.now() - 3600000); // 1 hour ago

      // Act
      render(<PollingIndicator onRefresh={onRefresh} lastUpdate={lastUpdate} />);

      // Assert
      const timeDisplay = screen.getByTestId('last-update-time');
      expect(timeDisplay.textContent).toMatch(/60\s*minutes?\s*ago|1\s*hour/i);
    });

    it('should handle invalid date gracefully', () => {
      // Arrange
      const onRefresh = vi.fn();
      const lastUpdate = new Date('invalid');

      // Act
      render(<PollingIndicator onRefresh={onRefresh} lastUpdate={lastUpdate} />);

      // Assert - should not crash
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('should handle missing onRefresh prop', () => {
      // Act & Assert - should render without crashing
      expect(() => {
        render(<PollingIndicator onRefresh={undefined as unknown as () => void} />);
      }).not.toThrow();
    });

    it('should allow rapid refresh clicks', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onRefresh = vi.fn();

      // Act
      render(<PollingIndicator onRefresh={onRefresh} />);
      const refreshButton = screen.getByTestId('refresh-button');

      // Rapid clicks
      await user.click(refreshButton);
      await user.click(refreshButton);
      await user.click(refreshButton);

      // Assert
      expect(onRefresh).toHaveBeenCalledTimes(3);
    });
  });

  describe('prop updates', () => {
    it('should update when lastUpdate prop changes', () => {
      // Arrange
      const onRefresh = vi.fn();
      const initialUpdate = new Date(Date.now() - 5000);

      // Act
      const { rerender } = render(
        <PollingIndicator onRefresh={onRefresh} lastUpdate={initialUpdate} />
      );

      const initialText = screen.getByTestId('last-update-time').textContent;

      // Update lastUpdate
      const newUpdate = new Date();
      rerender(<PollingIndicator onRefresh={onRefresh} lastUpdate={newUpdate} />);

      // Assert
      const updatedText = screen.getByTestId('last-update-time').textContent;
      expect(updatedText).not.toBe(initialText);
    });

    it('should update when isLoading prop changes', () => {
      // Arrange
      const onRefresh = vi.fn();

      // Act
      const { rerender } = render(
        <PollingIndicator onRefresh={onRefresh} isLoading={false} />
      );

      expect(screen.queryByTestId('syncing-indicator')).not.toBeInTheDocument();

      // Update isLoading
      rerender(<PollingIndicator onRefresh={onRefresh} isLoading={true} />);

      // Assert
      expect(screen.getByTestId('syncing-indicator')).toBeInTheDocument();
    });
  });
});
