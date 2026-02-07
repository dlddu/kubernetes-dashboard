import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePolling } from './usePolling';

describe('usePolling Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Ensure document is visible by default
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      writable: true,
      value: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('basic functionality', () => {
    it('should call callback immediately on mount', () => {
      // Arrange
      const callback = vi.fn();

      // Act
      renderHook(() => usePolling(callback, 10000));

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should call callback at specified interval', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000; // 10 seconds

      // Act
      renderHook(() => usePolling(callback, interval));

      // Initial call
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance time by 10 seconds
      vi.advanceTimersByTime(interval);
      expect(callback).toHaveBeenCalledTimes(2);

      // Advance time by another 10 seconds
      vi.advanceTimersByTime(interval);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should use default interval of 10 seconds when not specified', () => {
      // Arrange
      const callback = vi.fn();

      // Act
      renderHook(() => usePolling(callback));

      // Initial call
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance time by 10 seconds (default interval)
      vi.advanceTimersByTime(10000);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should cleanup interval on unmount', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      // Act
      const { unmount } = renderHook(() => usePolling(callback, interval));

      expect(callback).toHaveBeenCalledTimes(1);

      // Unmount before next interval
      unmount();

      // Advance time
      vi.advanceTimersByTime(interval);

      // Assert - should not call callback after unmount
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('visibility change handling', () => {
    it('should stop polling when tab becomes hidden', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      renderHook(() => usePolling(callback, interval));

      // Initial call
      expect(callback).toHaveBeenCalledTimes(1);

      // Act - Tab becomes hidden
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Advance time
      vi.advanceTimersByTime(interval);

      // Assert - should not call callback when hidden
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should resume polling when tab becomes visible again', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      renderHook(() => usePolling(callback, interval));

      expect(callback).toHaveBeenCalledTimes(1);

      // Hide tab
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Advance time while hidden
      vi.advanceTimersByTime(interval);
      expect(callback).toHaveBeenCalledTimes(1);

      // Act - Show tab again
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Should call immediately when visible
      expect(callback).toHaveBeenCalledTimes(2);

      // Continue polling
      vi.advanceTimersByTime(interval);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should call callback immediately when tab becomes visible', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      renderHook(() => usePolling(callback, interval));

      // Reset mock to ignore initial call
      callback.mockClear();

      // Hide tab
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Act - Show tab
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Assert - should call immediately
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('callback updates', () => {
    it('should use latest callback when callback changes', () => {
      // Arrange
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const interval = 10000;

      const { rerender } = renderHook(
        ({ cb }) => usePolling(cb, interval),
        { initialProps: { cb: callback1 } }
      );

      expect(callback1).toHaveBeenCalledTimes(1);
      callback1.mockClear();

      // Act - Update callback
      rerender({ cb: callback2 });

      // Advance time
      vi.advanceTimersByTime(interval);

      // Assert - should call new callback
      expect(callback1).toHaveBeenCalledTimes(0);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should not reset interval when callback changes', () => {
      // Arrange
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const interval = 10000;

      const { rerender } = renderHook(
        ({ cb }) => usePolling(cb, interval),
        { initialProps: { cb: callback1 } }
      );

      // Advance halfway through interval
      vi.advanceTimersByTime(5000);

      // Act - Update callback
      rerender({ cb: callback2 });

      // Advance remaining time
      vi.advanceTimersByTime(5000);

      // Assert - should call at correct time
      expect(callback1).toHaveBeenCalledTimes(1); // initial only
      expect(callback2).toHaveBeenCalledTimes(1); // after interval
    });
  });

  describe('interval updates', () => {
    it('should update polling interval when interval changes', () => {
      // Arrange
      const callback = vi.fn();
      const initialInterval = 10000;
      const newInterval = 5000;

      const { rerender } = renderHook(
        ({ interval }) => usePolling(callback, interval),
        { initialProps: { interval: initialInterval } }
      );

      callback.mockClear();

      // Act - Update interval (triggers immediate call + restarts interval)
      rerender({ interval: newInterval });

      // Advance by new interval
      vi.advanceTimersByTime(newInterval);

      // Assert - should call twice: once on interval change (immediate), once after interval
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('should handle callback that throws error', () => {
      // Arrange
      const callback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const interval = 10000;

      // Act & Assert - should not crash
      expect(() => {
        renderHook(() => usePolling(callback, interval));
      }).not.toThrow();

      // Should still call on next interval
      vi.advanceTimersByTime(interval);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should handle very short intervals', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 100; // 100ms

      // Act
      renderHook(() => usePolling(callback, interval));

      // Advance multiple times
      vi.advanceTimersByTime(1000); // 1 second

      // Assert - should have called ~10 times (1 initial + 10 intervals)
      expect(callback).toHaveBeenCalledTimes(11);
    });

    it('should handle very long intervals', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 300000; // 5 minutes

      // Act
      renderHook(() => usePolling(callback, interval));

      // Initial call
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance less than interval
      vi.advanceTimersByTime(60000); // 1 minute
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance to complete interval
      vi.advanceTimersByTime(240000); // 4 more minutes
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should handle async callbacks', async () => {
      // Arrange
      const callback = vi.fn(async () => {
        await Promise.resolve();
      });
      const interval = 10000;

      // Act
      renderHook(() => usePolling(callback, interval));

      // Assert - initial call
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });

      // Advance time
      vi.advanceTimersByTime(interval);

      // Assert - second call after interval
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      }, { timeout: 1000 });
    });
  });

  describe('cleanup behavior', () => {
    it('should remove visibility change listener on unmount', () => {
      // Arrange
      const callback = vi.fn();
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      // Act
      const { unmount } = renderHook(() => usePolling(callback, 10000));
      unmount();

      // Assert
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
    });

    it('should not call callback after component unmounts', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      // Act
      const { unmount } = renderHook(() => usePolling(callback, interval));

      callback.mockClear();
      unmount();

      // Trigger visibility change after unmount
      document.dispatchEvent(new Event('visibilitychange'));

      // Advance time
      vi.advanceTimersByTime(interval * 2);

      // Assert
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
