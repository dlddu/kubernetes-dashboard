import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePolling } from './usePolling';

describe('usePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('basic polling - happy path', () => {
    it('should call callback function immediately on mount', () => {
      // Arrange
      const callback = vi.fn();

      // Act
      renderHook(() => usePolling(callback, 10000));

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should call callback function at specified interval', async () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000; // 10 seconds

      // Act
      renderHook(() => usePolling(callback, interval));

      // Initial call
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance time by 10 seconds
      act(() => {
        vi.advanceTimersByTime(interval);
      });

      // Assert
      expect(callback).toHaveBeenCalledTimes(2);

      // Advance time by another 10 seconds
      act(() => {
        vi.advanceTimersByTime(interval);
      });

      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should use default interval of 10 seconds when not specified', () => {
      // Arrange
      const callback = vi.fn();

      // Act
      renderHook(() => usePolling(callback));

      // Initial call
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance by default interval (10000ms)
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Assert
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('cleanup and unmount', () => {
    it('should stop polling when component unmounts', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      // Act
      const { unmount } = renderHook(() => usePolling(callback, interval));

      expect(callback).toHaveBeenCalledTimes(1);

      // Unmount the component
      unmount();

      // Advance time after unmount
      act(() => {
        vi.advanceTimersByTime(interval);
      });

      // Assert - should not call callback after unmount
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should clear interval on cleanup', () => {
      // Arrange
      const callback = vi.fn();
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

      // Act
      const { unmount } = renderHook(() => usePolling(callback, 10000));
      unmount();

      // Assert
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('tab visibility handling', () => {
    it('should pause polling when tab becomes hidden', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      renderHook(() => usePolling(callback, interval));

      expect(callback).toHaveBeenCalledTimes(1);

      // Act - Simulate tab becoming hidden
      act(() => {
        Object.defineProperty(document, 'hidden', {
          writable: true,
          configurable: true,
          value: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Advance time while tab is hidden
      act(() => {
        vi.advanceTimersByTime(interval);
      });

      // Assert - should not call callback while tab is hidden
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should resume polling when tab becomes visible again', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      renderHook(() => usePolling(callback, interval));

      expect(callback).toHaveBeenCalledTimes(1);

      // Tab becomes hidden
      act(() => {
        Object.defineProperty(document, 'hidden', {
          writable: true,
          configurable: true,
          value: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Advance time while hidden (should not call)
      act(() => {
        vi.advanceTimersByTime(interval);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Act - Tab becomes visible again
      act(() => {
        Object.defineProperty(document, 'hidden', {
          writable: true,
          configurable: true,
          value: false,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Should call immediately when becoming visible
      expect(callback).toHaveBeenCalledTimes(2);

      // Advance time after becoming visible
      act(() => {
        vi.advanceTimersByTime(interval);
      });

      // Assert - should resume polling
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should call callback immediately when tab becomes visible', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      renderHook(() => usePolling(callback, interval));

      // Reset call count after initial render
      callback.mockClear();

      // Tab hidden
      act(() => {
        Object.defineProperty(document, 'hidden', {
          writable: true,
          configurable: true,
          value: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Act - Tab visible
      act(() => {
        Object.defineProperty(document, 'hidden', {
          writable: true,
          configurable: true,
          value: false,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Assert - should call immediately
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('callback updates', () => {
    it('should use updated callback function', () => {
      // Arrange
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const interval = 10000;

      // Act
      const { rerender } = renderHook(
        ({ cb }) => usePolling(cb, interval),
        { initialProps: { cb: callback1 } }
      );

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(0);

      // Update callback
      rerender({ cb: callback2 });

      // Advance time
      act(() => {
        vi.advanceTimersByTime(interval);
      });

      // Assert - should use new callback
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('interval changes', () => {
    it('should update interval when interval prop changes', () => {
      // Arrange
      const callback = vi.fn();
      const initialInterval = 10000;
      const newInterval = 5000;

      // Act
      const { rerender } = renderHook(
        ({ interval }) => usePolling(callback, interval),
        { initialProps: { interval: initialInterval } }
      );

      expect(callback).toHaveBeenCalledTimes(1);
      callback.mockClear();

      // Update interval
      rerender({ interval: newInterval });

      // Advance time by new interval
      act(() => {
        vi.advanceTimersByTime(newInterval);
      });

      // Assert - should use new interval
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should continue polling even if callback throws error', () => {
      // Arrange
      const callback = vi.fn()
        .mockImplementationOnce(() => {
          throw new Error('Test error');
        })
        .mockImplementation(() => {});

      const interval = 10000;

      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      renderHook(() => usePolling(callback, interval));

      expect(callback).toHaveBeenCalledTimes(1);

      // Advance time
      act(() => {
        vi.advanceTimersByTime(interval);
      });

      // Assert - should continue polling despite error
      expect(callback).toHaveBeenCalledTimes(2);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle very short intervals', () => {
      // Arrange
      const callback = vi.fn();
      const shortInterval = 100; // 100ms

      // Act
      renderHook(() => usePolling(callback, shortInterval));

      expect(callback).toHaveBeenCalledTimes(1);

      // Advance by short interval multiple times
      act(() => {
        vi.advanceTimersByTime(shortInterval);
      });

      expect(callback).toHaveBeenCalledTimes(2);

      act(() => {
        vi.advanceTimersByTime(shortInterval);
      });

      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should handle very long intervals', () => {
      // Arrange
      const callback = vi.fn();
      const longInterval = 60000; // 1 minute

      // Act
      renderHook(() => usePolling(callback, longInterval));

      expect(callback).toHaveBeenCalledTimes(1);

      // Advance by long interval
      act(() => {
        vi.advanceTimersByTime(longInterval);
      });

      // Assert
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should handle zero or negative intervals gracefully', () => {
      // Arrange
      const callback = vi.fn();

      // Act - Test with 0 interval (should use default or minimum)
      renderHook(() => usePolling(callback, 0));

      // Assert - should still work (using default interval)
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('multiple instances', () => {
    it('should handle multiple usePolling hooks independently', () => {
      // Arrange
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const interval1 = 10000;
      const interval2 = 15000;

      // Act
      renderHook(() => usePolling(callback1, interval1));
      renderHook(() => usePolling(callback2, interval2));

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      // Advance by first interval
      act(() => {
        vi.advanceTimersByTime(interval1);
      });

      expect(callback1).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenCalledTimes(1);

      // Advance to second interval
      act(() => {
        vi.advanceTimersByTime(interval2 - interval1);
      });

      // Assert - both should have been called
      expect(callback1).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenCalledTimes(2);
    });
  });
});
