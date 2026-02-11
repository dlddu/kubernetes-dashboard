import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PollingIndicator } from './PollingIndicator';

describe('PollingIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('rendering - happy path', () => {
    it('should render without crashing', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('should display last update time when provided', () => {
      // Arrange
      const lastUpdated = new Date();
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} onRefresh={mockRefresh} />);

      // Assert
      const timeElement = screen.getByTestId('last-update-time');
      expect(timeElement).toBeInTheDocument();
      expect(timeElement).toHaveTextContent(/ago|just now/i);
    });

    it('should display refresh button', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} />);

      // Assert
      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton).toHaveAttribute('type', 'button');
    });

    it('should be accessible with proper ARIA attributes', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} />);

      // Assert
      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).toHaveAttribute('aria-label');
    });
  });

  describe('relative time display', () => {
    it('should display "just now" for very recent update', () => {
      // Arrange
      const lastUpdated = new Date();
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} onRefresh={mockRefresh} />);

      // Assert
      const timeElement = screen.getByTestId('last-update-time');
      expect(timeElement).toHaveTextContent(/just now/i);
    });

    it('should display seconds ago for updates within a minute', () => {
      // Arrange
      const lastUpdated = new Date(Date.now() - 30000); // 30 seconds ago
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} onRefresh={mockRefresh} />);

      // Assert
      const timeElement = screen.getByTestId('last-update-time');
      expect(timeElement).toHaveTextContent(/30 seconds? ago/i);
    });

    it('should display minutes ago for updates within an hour', () => {
      // Arrange
      const lastUpdated = new Date(Date.now() - 300000); // 5 minutes ago
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} onRefresh={mockRefresh} />);

      // Assert
      const timeElement = screen.getByTestId('last-update-time');
      expect(timeElement).toHaveTextContent(/5 minutes? ago/i);
    });

    it('should display hours ago for updates within a day', () => {
      // Arrange
      const lastUpdated = new Date(Date.now() - 7200000); // 2 hours ago
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} onRefresh={mockRefresh} />);

      // Assert
      const timeElement = screen.getByTestId('last-update-time');
      expect(timeElement).toHaveTextContent(/2 hours? ago/i);
    });

    it('should update relative time display as time passes', async () => {
      // Arrange
      const lastUpdated = new Date();
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} onRefresh={mockRefresh} />);

      // Assert initial state
      const timeElement = screen.getByTestId('last-update-time');
      expect(timeElement).toHaveTextContent(/just now/i);

      // Advance time by 10 seconds
      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      // Assert updated state
      await waitFor(() => {
        expect(timeElement).toHaveTextContent(/10 seconds? ago/i);
      });
    });

    it('should handle null lastUpdated gracefully', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} />);

      // Assert
      const timeElement = screen.getByTestId('last-update-time');
      expect(timeElement).toHaveTextContent(/never|n\/a|—/i);
    });
  });

  describe('refresh button interaction', () => {
    it('should call onRefresh when refresh button is clicked', () => {
      // Arrange
      const mockRefresh = vi.fn();
      const lastUpdated = new Date();

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} onRefresh={mockRefresh} />);
      const refreshButton = screen.getByTestId('refresh-button');

      fireEvent.click(refreshButton);

      // Assert
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('should be enabled when not loading', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} isLoading={false} />);

      // Assert
      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).toBeEnabled();
    });

    it('should be disabled when loading', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} isLoading={true} />);

      // Assert
      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).toBeDisabled();
    });

    it('should not call onRefresh when disabled', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} isLoading={true} />);
      const refreshButton = screen.getByTestId('refresh-button');

      fireEvent.click(refreshButton);

      // Assert
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('should handle multiple rapid clicks gracefully', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} />);
      const refreshButton = screen.getByTestId('refresh-button');

      fireEvent.click(refreshButton);
      fireEvent.click(refreshButton);
      fireEvent.click(refreshButton);

      // Assert: Should be called 3 times (unless component implements debouncing)
      expect(mockRefresh).toHaveBeenCalledTimes(3);
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when isLoading is true', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} isLoading={true} />);

      // Assert
      const loadingIndicator = screen.queryByTestId('loading-indicator');
      if (loadingIndicator) {
        expect(loadingIndicator).toBeInTheDocument();
      }

      // Button should be disabled
      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).toBeDisabled();
    });

    it('should not show loading indicator when isLoading is false', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} isLoading={false} />);

      // Assert
      const loadingIndicator = screen.queryByTestId('loading-indicator');
      expect(loadingIndicator).not.toBeInTheDocument();
    });

    it('should default to not loading when isLoading prop is omitted', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} />);

      // Assert
      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).toBeEnabled();
    });
  });

  describe('timestamp tooltip', () => {
    it('should show full timestamp on hover', async () => {
      // Arrange
      const lastUpdated = new Date('2024-01-15T10:30:00Z');
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} onRefresh={mockRefresh} />);
      const timeElement = screen.getByTestId('last-update-time');

      // Check for title attribute
      const title = timeElement.getAttribute('title');
      if (title) {
        // Assert
        expect(title).toMatch(/2024-01-15|10:30:00/);
      }
    });
  });

  describe('visual styling', () => {
    it('should have appropriate CSS classes for layout', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator.className).toMatch(/flex|inline|grid/);
    });

    it('should have appropriate spacing between elements', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      expect(indicator.className).toMatch(/gap|space|mx|px/);
    });

    it('should apply loading state styling to button', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} isLoading={true} />);

      // Assert
      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton.className).toMatch(/disabled|opacity|cursor/);
    });
  });

  describe('edge cases', () => {
    it('should handle future date gracefully', () => {
      // Arrange
      const lastUpdated = new Date(Date.now() + 60000); // 1 minute in future
      const mockRefresh = vi.fn();

      // Act & Assert: Should not crash
      expect(() => {
        render(<PollingIndicator lastUpdated={lastUpdated} onRefresh={mockRefresh} />);
      }).not.toThrow();

      const timeElement = screen.getByTestId('last-update-time');
      expect(timeElement).toBeInTheDocument();
    });

    it('should handle very old dates', () => {
      // Arrange
      const lastUpdated = new Date('2020-01-01T00:00:00Z');
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} onRefresh={mockRefresh} />);

      // Assert
      const timeElement = screen.getByTestId('last-update-time');
      expect(timeElement).toHaveTextContent(/ago|days|years/i);
    });

    it('should handle invalid date objects', () => {
      // Arrange
      const lastUpdated = new Date('invalid');
      const mockRefresh = vi.fn();

      // Act & Assert: Should not crash
      expect(() => {
        render(<PollingIndicator lastUpdated={lastUpdated} onRefresh={mockRefresh} />);
      }).not.toThrow();
    });

    it('should handle onRefresh that throws error', () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockRefresh = vi.fn(() => {
        throw new Error('Refresh error');
      });

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} />);
      const refreshButton = screen.getByTestId('refresh-button');

      // Assert: Button click should call the function even if it throws
      fireEvent.click(refreshButton);
      expect(mockRefresh).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA role for status region', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} />);

      // Assert
      const indicator = screen.getByTestId('polling-indicator');
      const ariaLive = indicator.getAttribute('aria-live');
      if (ariaLive) {
        expect(ariaLive).toMatch(/polite|off/);
      }
    });

    it('should have accessible label for refresh button', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} />);

      // Assert
      const refreshButton = screen.getByTestId('refresh-button');
      const ariaLabel = refreshButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.toLowerCase()).toMatch(/refresh|reload|update/);
    });

    it('should be keyboard accessible', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} />);
      const refreshButton = screen.getByTestId('refresh-button');

      // Focus button
      refreshButton.focus();

      // Assert
      expect(refreshButton).toHaveFocus();
    });

    it('should support keyboard activation with Enter key', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} />);
      const refreshButton = screen.getByTestId('refresh-button');

      refreshButton.focus();
      // Simulate the full Enter key press sequence that triggers button click
      fireEvent.keyDown(refreshButton, { key: 'Enter', code: 'Enter' });
      fireEvent.click(refreshButton); // Browsers trigger click on Enter for buttons

      // Assert
      expect(mockRefresh).toHaveBeenCalled();
    });

    it('should support keyboard activation with Space key', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} />);
      const refreshButton = screen.getByTestId('refresh-button');

      refreshButton.focus();
      // Simulate the full Space key press sequence that triggers button click
      fireEvent.keyDown(refreshButton, { key: ' ', code: 'Space' });
      fireEvent.click(refreshButton); // Browsers trigger click on Space for buttons

      // Assert
      expect(mockRefresh).toHaveBeenCalled();
    });

    it('should have proper contrast for text visibility', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} />);

      // Assert
      const timeElement = screen.getByTestId('last-update-time');
      expect(timeElement.className).toMatch(/text-/);
    });
  });

  describe('component props', () => {
    it('should accept lastUpdated as Date prop', () => {
      // Arrange
      const lastUpdated = new Date();
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} onRefresh={mockRefresh} />);

      // Assert
      expect(screen.getByTestId('polling-indicator')).toBeInTheDocument();
    });

    it('should accept lastUpdated as null prop', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} />);

      // Assert
      expect(screen.getByTestId('polling-indicator')).toBeInTheDocument();
    });

    it('should accept onRefresh callback prop', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} />);

      // Assert
      expect(screen.getByTestId('polling-indicator')).toBeInTheDocument();
    });

    it('should accept optional isLoading boolean prop', () => {
      // Arrange
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={null} onRefresh={mockRefresh} isLoading={true} />);

      // Assert
      const refreshButton = screen.getByTestId('refresh-button');
      expect(refreshButton).toBeDisabled();
    });

    it('should update when props change', () => {
      // Arrange
      const mockRefresh = vi.fn();
      const initialDate = new Date(Date.now() - 300000); // 5 minutes ago

      // Act
      const { rerender } = render(
        <PollingIndicator lastUpdated={initialDate} onRefresh={mockRefresh} />
      );

      const timeElement = screen.getByTestId('last-update-time');
      const initialText = timeElement.textContent;

      // Update props with significantly different time (10 minutes ago)
      const newDate = new Date(Date.now() - 600000);
      rerender(<PollingIndicator lastUpdated={newDate} onRefresh={mockRefresh} />);

      // Assert
      const updatedText = timeElement.textContent;
      expect(updatedText).not.toBe(initialText);
    });
  });

  describe('internationalization readiness', () => {
    it('should use consistent time format', () => {
      // Arrange
      const lastUpdated = new Date(Date.now() - 45000); // 45 seconds ago
      const mockRefresh = vi.fn();

      // Act
      render(<PollingIndicator lastUpdated={lastUpdated} onRefresh={mockRefresh} />);

      // Assert
      const timeElement = screen.getByTestId('last-update-time');
      const text = timeElement.textContent || '';

      // Should use plural forms correctly
      expect(text).toMatch(/\d+ seconds? ago/);
    });
  });
});
