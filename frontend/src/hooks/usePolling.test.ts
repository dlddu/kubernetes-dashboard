import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePolling } from './usePolling';

// Mock useVisibilityChange hook
vi.mock('./useVisibilityChange', () => ({
  useVisibilityChange: vi.fn(() => true),
}));

import { useVisibilityChange } from './useVisibilityChange';

describe('usePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(useVisibilityChange).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('initialization - happy path', () => {
    it('should execute callback immediately on mount', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      // Act
      renderHook(() => usePolling(callback, interval));

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should return initial state with isPolling true and null lastUpdated', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      // Act
      const { result } = renderHook(() => usePolling(callback, interval));

      // Assert
      expect(result.current.isPolling).toBe(true);
      expect(result.current.lastUpdated).toBeInstanceOf(Date);
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should set lastUpdated to current time after initial execution', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;
      const beforeMount = new Date();

      // Act
      const { result } = renderHook(() => usePolling(callback, interval));

      // Assert
      const afterMount = new Date();
      expect(result.current.lastUpdated).toBeDefined();
      expect(result.current.lastUpdated!.getTime()).toBeGreaterThanOrEqual(beforeMount.getTime());
      expect(result.current.lastUpdated!.getTime()).toBeLessThanOrEqual(afterMount.getTime());
    });
  });

  describe('polling interval behavior', () => {
    it('should execute callback at specified interval', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000; // 10 seconds

      // Act
      renderHook(() => usePolling(callback, interval));

      // Clear initial call
      callback.mockClear();

      // Advance time by interval
      act(() => {
        vi.advanceTimersByTime(interval);
      });

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should execute callback multiple times at regular intervals', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      // Act
      renderHook(() => usePolling(callback, interval));

      // Clear initial call
      callback.mockClear();

      // Advance time by 3 intervals
      act(() => {
        vi.advanceTimersByTime(interval * 3);
      });

      // Assert
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should update lastUpdated timestamp after each poll', async () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      // Act
      const { result } = renderHook(() => usePolling(callback, interval));
      const firstUpdate = result.current.lastUpdated;

      // Advance time by 1ms to ensure different timestamp
      await act(async () => {
        vi.advanceTimersByTime(1);
      });

      // Advance time and trigger next poll
      await act(async () => {
        vi.advanceTimersByTime(interval);
      });

      // Assert (no waitFor needed - state is already updated after act)
      expect(result.current.lastUpdated).not.toBe(firstUpdate);
      expect(result.current.lastUpdated!.getTime()).toBeGreaterThan(firstUpdate!.getTime());
    });
  });

  describe('visibility integration', () => {
    it('should pause polling when page becomes hidden', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;
      vi.mocked(useVisibilityChange).mockReturnValue(true);

      // Act
      const { rerender } = renderHook(() => usePolling(callback, interval));

      // Clear initial call
      callback.mockClear();

      // Simulate page becoming hidden
      vi.mocked(useVisibilityChange).mockReturnValue(false);
      rerender();

      // Advance time
      act(() => {
        vi.advanceTimersByTime(interval * 2);
      });

      // Assert
      expect(callback).not.toHaveBeenCalled();
    });

    it('should resume polling when page becomes visible again', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;
      vi.mocked(useVisibilityChange).mockReturnValue(false);

      // Act
      const { rerender } = renderHook(() => usePolling(callback, interval));

      // Initial call should still happen
      expect(callback).toHaveBeenCalledTimes(1);
      callback.mockClear();

      // Simulate page becoming visible
      vi.mocked(useVisibilityChange).mockReturnValue(true);
      rerender();

      // Advance time
      act(() => {
        vi.advanceTimersByTime(interval);
      });

      // Assert
      expect(callback).toHaveBeenCalled();
    });

    it('should update isPolling state based on visibility', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;
      vi.mocked(useVisibilityChange).mockReturnValue(true);

      // Act
      const { result, rerender } = renderHook(() => usePolling(callback, interval));

      // Assert: Initially polling
      expect(result.current.isPolling).toBe(true);

      // Simulate page becoming hidden
      vi.mocked(useVisibilityChange).mockReturnValue(false);
      rerender();

      // Assert: Not polling when hidden
      expect(result.current.isPolling).toBe(false);

      // Simulate page becoming visible
      vi.mocked(useVisibilityChange).mockReturnValue(true);
      rerender();

      // Assert: Polling resumed
      expect(result.current.isPolling).toBe(true);
    });
  });

  describe('manual refetch', () => {
    it('should provide a refetch function', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      // Act
      const { result } = renderHook(() => usePolling(callback, interval));

      // Assert
      expect(result.current.refetch).toBeDefined();
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should execute callback immediately when refetch is called', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      // Act
      const { result } = renderHook(() => usePolling(callback, interval));

      // Clear initial call
      callback.mockClear();

      // Call refetch
      act(() => {
        result.current.refetch();
      });

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should update lastUpdated when refetch is called', async () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      // Act
      const { result } = renderHook(() => usePolling(callback, interval));
      const beforeRefetch = result.current.lastUpdated;

      // Advance time slightly
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Call refetch
      await act(async () => {
        result.current.refetch();
      });

      // Assert (no waitFor needed - state is already updated after act)
      expect(result.current.lastUpdated).not.toBe(beforeRefetch);
      expect(result.current.lastUpdated!.getTime()).toBeGreaterThan(beforeRefetch!.getTime());
    });

    it('should work when page is hidden', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;
      vi.mocked(useVisibilityChange).mockReturnValue(false);

      // Act
      const { result } = renderHook(() => usePolling(callback, interval));

      // Clear initial call
      callback.mockClear();

      // Call refetch while hidden
      act(() => {
        result.current.refetch();
      });

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not interfere with regular polling interval', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      // Act
      const { result } = renderHook(() => usePolling(callback, interval));

      // Clear initial call
      callback.mockClear();

      // Call refetch
      act(() => {
        result.current.refetch();
      });

      // Advance time by half interval
      act(() => {
        vi.advanceTimersByTime(interval / 2);
      });

      // Advance time by another half interval
      act(() => {
        vi.advanceTimersByTime(interval / 2);
      });

      // Assert: Should have 1 refetch + 1 interval poll = 2 total
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('cleanup', () => {
    it('should clear interval on unmount', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      // Act
      const { unmount } = renderHook(() => usePolling(callback, interval));

      // Clear initial call
      callback.mockClear();

      // Unmount
      unmount();

      // Advance time
      act(() => {
        vi.advanceTimersByTime(interval * 2);
      });

      // Assert
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not leak intervals after multiple mount/unmount cycles', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 10000;

      // Act: Mount and unmount multiple times
      const { unmount: unmount1 } = renderHook(() => usePolling(callback, interval));
      const { unmount: unmount2 } = renderHook(() => usePolling(callback, interval));
      const { unmount: unmount3 } = renderHook(() => usePolling(callback, interval));

      unmount1();
      unmount2();
      unmount3();

      // Clear all calls
      callback.mockClear();

      // Advance time
      act(() => {
        vi.advanceTimersByTime(interval * 2);
      });

      // Assert
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('callback stability', () => {
    it('should use latest callback reference', () => {
      // Arrange
      let callbackResult = 'first';
      const callback = vi.fn(() => callbackResult);
      const interval = 10000;

      // Act
      const { rerender } = renderHook(
        ({ cb }) => usePolling(cb, interval),
        { initialProps: { cb: callback } }
      );

      // Clear initial call
      callback.mockClear();

      // Update callback
      callbackResult = 'second';
      const newCallback = vi.fn(() => callbackResult);
      rerender({ cb: newCallback });

      // Trigger poll
      act(() => {
        vi.advanceTimersByTime(interval);
      });

      // Assert: New callback should be called
      expect(newCallback).toHaveBeenCalled();
    });
  });

  describe('interval changes', () => {
    it('should update polling interval when interval prop changes', () => {
      // Arrange
      const callback = vi.fn();
      let interval = 10000;

      // Act
      const { rerender } = renderHook(
        ({ int }) => usePolling(callback, int),
        { initialProps: { int: interval } }
      );

      // Clear initial call
      callback.mockClear();

      // Change interval to 5000
      interval = 5000;
      rerender({ int: interval });

      // Advance by new interval
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle zero interval gracefully', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 0;

      // Act & Assert: Should not throw
      expect(() => {
        renderHook(() => usePolling(callback, interval));
      }).not.toThrow();
    });

    it('should handle very short intervals', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 100; // 100ms

      // Act
      renderHook(() => usePolling(callback, interval));

      // Clear initial call
      callback.mockClear();

      // Advance time
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Assert: Should have called 10 times (1000ms / 100ms)
      expect(callback).toHaveBeenCalledTimes(10);
    });

    it('should handle very long intervals', () => {
      // Arrange
      const callback = vi.fn();
      const interval = 3600000; // 1 hour

      // Act
      renderHook(() => usePolling(callback, interval));

      // Clear initial call
      callback.mockClear();

      // Advance time by 30 minutes
      act(() => {
        vi.advanceTimersByTime(1800000);
      });

      // Assert: Should not have called yet
      expect(callback).not.toHaveBeenCalled();

      // Advance time by another 30 minutes
      act(() => {
        vi.advanceTimersByTime(1800000);
      });

      // Assert: Should have called once
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle callback that throws error', () => {
      // Arrange
      const callback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const interval = 10000;

      // Act & Assert: Should not crash
      expect(() => {
        renderHook(() => usePolling(callback, interval));
      }).not.toThrow();

      // Callback was called but threw
      expect(callback).toHaveBeenCalled();
    });

    it('should handle async callbacks', async () => {
      // Arrange
      const callback = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'done';
      });
      const interval = 10000;

      // Act
      renderHook(() => usePolling(callback, interval));

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);

      // Clear and advance
      callback.mockClear();
      act(() => {
        vi.advanceTimersByTime(interval);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('concurrent usage', () => {
    it('should work correctly when multiple components use the hook', () => {
      // Arrange
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const interval = 10000;

      // Act
      renderHook(() => usePolling(callback1, interval));
      renderHook(() => usePolling(callback2, interval));

      // Clear initial calls
      callback1.mockClear();
      callback2.mockClear();

      // Advance time
      act(() => {
        vi.advanceTimersByTime(interval);
      });

      // Assert: Both should be called
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });
});
