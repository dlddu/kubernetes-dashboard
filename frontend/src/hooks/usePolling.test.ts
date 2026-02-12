import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePolling } from './usePolling';

describe('usePolling', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic polling functionality', () => {
    it('should call callback function on mount', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);

      // Act
      renderHook(() => usePolling(callback));

      // Assert
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    it('should call callback every 10 seconds', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);

      // Act
      renderHook(() => usePolling(callback));

      // Wait for initial call
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Advance timer by 10 seconds
      vi.advanceTimersByTime(10000);

      // Assert
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      });
    });

    it('should call callback multiple times at 10 second intervals', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);

      // Act
      renderHook(() => usePolling(callback));

      // Wait for initial call
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Advance timer by 10 seconds twice
      vi.advanceTimersByTime(10000);
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      });

      vi.advanceTimersByTime(10000);

      // Assert
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(3);
      });
    });

    it('should not call callback before 10 seconds', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);

      // Act
      renderHook(() => usePolling(callback));

      // Wait for initial call
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Advance timer by 9 seconds (less than interval)
      vi.advanceTimersByTime(9000);

      // Assert - should still be at 1 call
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('manual refresh', () => {
    it('should return a refresh function', () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => usePolling(callback));

      // Assert
      expect(result.current.refresh).toBeInstanceOf(Function);
    });

    it('should call callback immediately when refresh is called', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => usePolling(callback));

      // Wait for initial call
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Call refresh manually
      result.current.refresh();

      // Assert
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      });
    });

    it('should reset the 10 second timer after manual refresh', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => usePolling(callback));

      // Wait for initial call
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Advance 5 seconds
      vi.advanceTimersByTime(5000);

      // Manual refresh
      result.current.refresh();

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      });

      // Advance 9 seconds (total 14s from initial, but 9s from manual refresh)
      vi.advanceTimersByTime(9000);

      // Should still be 2 calls
      expect(callback).toHaveBeenCalledTimes(2);

      // Advance 1 more second (10s from manual refresh)
      vi.advanceTimersByTime(1000);

      // Assert - should now be 3 calls
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(3);
      });
    });

    it('should allow multiple manual refreshes', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => usePolling(callback));

      // Wait for initial call
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Multiple manual refreshes
      result.current.refresh();
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      });

      result.current.refresh();
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(3);
      });

      result.current.refresh();

      // Assert
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(4);
      });
    });
  });

  describe('visibility change behavior', () => {
    it('should stop polling when tab becomes hidden', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);

      // Act
      renderHook(() => usePolling(callback));

      // Wait for initial call
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Simulate tab becoming hidden
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Advance timer by 10 seconds
      vi.advanceTimersByTime(10000);

      // Assert - polling should be paused, no new calls
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should resume polling when tab becomes visible again', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);

      // Act
      renderHook(() => usePolling(callback));

      // Wait for initial call
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Simulate tab becoming hidden
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Advance timer while hidden (should not poll)
      vi.advanceTimersByTime(10000);
      expect(callback).toHaveBeenCalledTimes(1);

      // Simulate tab becoming visible
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Assert - should immediately fetch on visibility restore
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      });
    });

    it('should continue polling after visibility restored', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);

      // Act
      renderHook(() => usePolling(callback));

      // Wait for initial call
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Hide and restore tab
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      });

      // Advance timer by 10 seconds
      vi.advanceTimersByTime(10000);

      // Assert - polling should continue normally
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(3);
      });
    });

    it('should not poll multiple times when visibility changes rapidly', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);

      // Act
      renderHook(() => usePolling(callback));

      // Wait for initial call
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Rapid visibility changes
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Assert - each visibility restore triggers a callback
      // Initial call (1) + two visibility restores (2) = 3 calls
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('cleanup on unmount', () => {
    it('should stop polling when component unmounts', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);

      // Act
      const { unmount } = renderHook(() => usePolling(callback));

      // Wait for initial call
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Unmount
      unmount();

      // Advance timer
      vi.advanceTimersByTime(10000);

      // Assert - should not call callback after unmount
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should clean up visibility change listener on unmount', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      // Act
      const { unmount } = renderHook(() => usePolling(callback));

      // Assert - should have added listener
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );

      // Unmount
      unmount();

      // Assert - should have removed listener
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );

      // Cleanup
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('callback error handling', () => {
    it('should continue polling even if callback throws error', async () => {
      // Arrange
      const callback = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(undefined);

      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      renderHook(() => usePolling(callback));

      // Wait for initial call (which will fail)
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Advance timer by 10 seconds
      vi.advanceTimersByTime(10000);

      // Assert - should continue polling despite error
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      });

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should not crash when callback returns null', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(null);

      // Act
      renderHook(() => usePolling(callback));

      // Wait for initial call
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Advance timer
      vi.advanceTimersByTime(10000);

      // Assert
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('last update time', () => {
    it('should return last update timestamp', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => usePolling(callback));

      // Wait for initial call
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Assert
      expect(result.current.lastUpdate).toBeInstanceOf(Date);
    });

    it('should update last update time after each poll', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => usePolling(callback));

      // Wait for initial call
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      const firstUpdate = result.current.lastUpdate;

      // Advance timer
      vi.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      });

      const secondUpdate = result.current.lastUpdate;

      // Assert - timestamps should be different
      expect(secondUpdate.getTime()).toBeGreaterThan(firstUpdate.getTime());
    });

    it('should update last update time on manual refresh', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => usePolling(callback));

      // Wait for initial call
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      const firstUpdate = result.current.lastUpdate;

      // Advance time slightly
      vi.advanceTimersByTime(2000);

      // Manual refresh
      result.current.refresh();

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      });

      const secondUpdate = result.current.lastUpdate;

      // Assert
      expect(secondUpdate.getTime()).toBeGreaterThan(firstUpdate.getTime());
    });
  });

  describe('loading state', () => {
    it('should return loading state', async () => {
      // Arrange
      const callback = vi.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // Act
      const { result } = renderHook(() => usePolling(callback));

      // Assert - should be loading during callback execution
      expect(result.current.isLoading).toBe(true);
    });

    it('should set loading to false after callback completes', async () => {
      // Arrange
      const callback = vi.fn().mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => usePolling(callback));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set loading to true during manual refresh', async () => {
      // Arrange
      let resolveCallback: (() => void) | undefined;
      const callback = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveCallback = resolve;
          })
      );

      // Act
      const { result } = renderHook(() => usePolling(callback));

      // Wait for initial load to start
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Resolve initial callback
      resolveCallback?.();

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Manual refresh
      result.current.refresh();

      // Assert - should be loading during callback execution
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Cleanup - resolve the callback
      resolveCallback?.();
    });

    it('should set loading to false even if callback fails', async () => {
      // Arrange
      const callback = vi.fn().mockRejectedValue(new Error('Network error'));

      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const { result } = renderHook(() => usePolling(callback));

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe('callback dependency changes', () => {
    it('should use updated callback function', async () => {
      // Arrange
      const callback1 = vi.fn().mockResolvedValue(undefined);
      const callback2 = vi.fn().mockResolvedValue(undefined);

      // Act
      const { rerender } = renderHook(({ cb }) => usePolling(cb), {
        initialProps: { cb: callback1 },
      });

      // Wait for initial call
      await waitFor(() => {
        expect(callback1).toHaveBeenCalledTimes(1);
      });

      // Rerender with new callback
      rerender({ cb: callback2 });

      // Advance timer
      vi.advanceTimersByTime(10000);

      // Assert - should use new callback
      await waitFor(() => {
        expect(callback2).toHaveBeenCalled();
      });
    });
  });
});
