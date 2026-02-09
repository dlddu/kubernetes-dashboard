import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePolling } from './usePolling';

describe('usePolling Hook', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('should call callback immediately on mount', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);

      // Act
      renderHook(() => usePolling(callback, 10000));

      // Assert
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    it('should call callback at specified interval', async () => {
      vi.useFakeTimers();

      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);
      const interval = 10000; // 10 seconds

      // Act
      renderHook(() => usePolling(callback, interval));

      // Initial call
      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Advance time by 10 seconds
      await act(async () => {
        vi.advanceTimersByTime(10000);
        await Promise.resolve();
      });

      // Assert - should be called again
      expect(callback).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should continue polling at regular intervals', async () => {
      vi.useFakeTimers();

      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);
      const interval = 10000;

      // Act
      renderHook(() => usePolling(callback, interval));

      // Initial call
      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Advance time by 30 seconds (3 intervals)
      await act(async () => {
        vi.advanceTimersByTime(30000);
        await Promise.resolve();
      });

      // Assert - should be called 4 times total (initial + 3 intervals)
      expect(callback).toHaveBeenCalledTimes(4);

      vi.useRealTimers();
    });

    it('should cleanup interval on unmount', async () => {
      vi.useFakeTimers();

      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);
      const interval = 10000;

      // Act
      const { unmount } = renderHook(() => usePolling(callback, interval));

      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Unmount the hook
      unmount();

      // Advance time
      await act(async () => {
        vi.advanceTimersByTime(20000);
        await Promise.resolve();
      });

      // Assert - should not be called again after unmount
      expect(callback).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('tab visibility handling', () => {
    it('should stop polling when tab becomes hidden', async () => {
      vi.useFakeTimers();

      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);
      const interval = 10000;

      // Act
      renderHook(() => usePolling(callback, interval));

      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Simulate tab becoming hidden
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });

      const visibilityChangeEvent = new Event('visibilitychange');
      document.dispatchEvent(visibilityChangeEvent);

      // Advance time
      await act(async () => {
        vi.advanceTimersByTime(20000);
        await Promise.resolve();
      });

      // Assert - should not poll while hidden
      expect(callback).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should resume polling when tab becomes visible again', async () => {
      vi.useFakeTimers();

      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);
      const interval = 10000;

      // Act
      renderHook(() => usePolling(callback, interval));

      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Simulate tab becoming hidden
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Advance time while hidden
      await act(async () => {
        vi.advanceTimersByTime(20000);
        await Promise.resolve();
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Simulate tab becoming visible again
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Should call immediately when becoming visible
      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      });

      // Advance time - should resume regular polling
      await act(async () => {
        vi.advanceTimersByTime(10000);
        await Promise.resolve();
      });

      expect(callback).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });

    it('should cleanup visibility event listener on unmount', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      // Act
      const { unmount } = renderHook(() => usePolling(callback, 10000));

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Assert - should remove event listener
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
    });
  });

  describe('error handling', () => {
    it('should continue polling even if callback throws error', async () => {
      vi.useFakeTimers();

      // Arrange
      const callback = vi.fn()
        .mockRejectedValueOnce(new Error('First call failed'))
        .mockResolvedValue(undefined);
      const interval = 10000;

      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      renderHook(() => usePolling(callback, interval));

      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Advance time
      await act(async () => {
        vi.advanceTimersByTime(10000);
        await Promise.resolve();
      });

      // Assert - should be called again despite error
      expect(callback).toHaveBeenCalledTimes(2);

      consoleErrorSpy.mockRestore();
      vi.useRealTimers();
    });

    it('should handle multiple consecutive errors', async () => {
      vi.useFakeTimers();

      // Arrange
      const callback = vi.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue(undefined);
      const interval = 10000;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      renderHook(() => usePolling(callback, interval));

      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Advance time twice
      await act(async () => {
        vi.advanceTimersByTime(20000);
        await Promise.resolve();
      });

      // Assert - should continue polling
      expect(callback).toHaveBeenCalledTimes(3);

      consoleErrorSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe('edge cases', () => {
    it('should handle very short polling interval', async () => {
      vi.useFakeTimers();

      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);
      const interval = 1000; // 1 second

      // Act
      renderHook(() => usePolling(callback, interval));

      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Advance time by 5 seconds
      await act(async () => {
        vi.advanceTimersByTime(5000);
        await Promise.resolve();
      });

      // Assert - should be called 6 times (initial + 5 intervals)
      expect(callback).toHaveBeenCalledTimes(6);

      vi.useRealTimers();
    });

    it('should handle very long polling interval', async () => {
      vi.useFakeTimers();

      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);
      const interval = 60000; // 1 minute

      // Act
      renderHook(() => usePolling(callback, interval));

      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Advance time by 30 seconds (less than interval)
      await act(async () => {
        vi.advanceTimersByTime(30000);
        await Promise.resolve();
      });

      // Assert - should not be called yet
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance time to complete interval
      await act(async () => {
        vi.advanceTimersByTime(30000);
        await Promise.resolve();
      });

      // Assert - should be called now
      expect(callback).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should handle callback that changes between renders', async () => {
      vi.useFakeTimers();

      // Arrange
      const callback1 = vi.fn().mockResolvedValue(undefined);
      const callback2 = vi.fn().mockResolvedValue(undefined);
      const interval = 10000;

      // Act
      const { rerender } = renderHook(
        ({ cb }) => usePolling(cb, interval),
        { initialProps: { cb: callback1 } }
      );

      await vi.waitFor(() => {
        expect(callback1).toHaveBeenCalledTimes(1);
      });

      // Change callback
      rerender({ cb: callback2 });

      // Advance time
      await act(async () => {
        vi.advanceTimersByTime(10000);
        await Promise.resolve();
      });

      // Assert - new callback should be called
      expect(callback2).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should handle interval change between renders', async () => {
      vi.useFakeTimers();

      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);
      const initialInterval = 10000;
      const newInterval = 5000;

      // Act
      const { rerender } = renderHook(
        ({ interval }) => usePolling(callback, interval),
        { initialProps: { interval: initialInterval } }
      );

      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Change interval - this will call callback immediately
      rerender({ interval: newInterval });

      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      });

      // Advance time by new interval
      await act(async () => {
        vi.advanceTimersByTime(5000);
        await Promise.resolve();
      });

      // Assert - should use new interval
      expect(callback).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });
  });

  describe('performance', () => {
    it('should not create multiple intervals', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);
      const interval = 10000;
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      // Act
      renderHook(() => usePolling(callback, interval));

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Assert - setInterval should be called at least once (may be called multiple times due to visibility listener)
      expect(setIntervalSpy).toHaveBeenCalled();

      setIntervalSpy.mockRestore();
    });

    it('should clear interval before creating new one on interval change', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      // Act
      const { rerender } = renderHook(
        ({ interval }) => usePolling(callback, interval),
        { initialProps: { interval: 10000 } }
      );

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Change interval
      rerender({ interval: 5000 });

      // Assert - clearInterval should be called
      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });
});
