import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, ReactNode } from 'react';
import { PollingProvider, usePollingContext } from './PollingContext';

const createWrapper = (interval?: number) =>
  ({ children }: { children: ReactNode }) =>
    createElement(PollingProvider, { interval }, children);

describe('PollingContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('usePollingContext', () => {
    it('should throw when used outside PollingProvider', () => {
      expect(() => renderHook(() => usePollingContext())).toThrow(
        'usePollingContext must be used within a PollingProvider'
      );
    });

    it('should provide context values', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => usePollingContext(), { wrapper });

      expect(result.current.register).toBeInstanceOf(Function);
      expect(result.current.unregister).toBeInstanceOf(Function);
      expect(result.current.refresh).toBeInstanceOf(Function);
      expect(result.current.lastUpdate).toBeInstanceOf(Date);
      expect(typeof result.current.isLoading).toBe('boolean');
    });
  });

  describe('callback registration', () => {
    it('should execute callback immediately on registration', async () => {
      const wrapper = createWrapper();
      const callback = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => usePollingContext(), { wrapper });

      act(() => {
        result.current.register('test', callback);
      });

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call unregistered callback on interval tick', async () => {
      const wrapper = createWrapper();
      const callback = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => usePollingContext(), { wrapper });

      act(() => {
        result.current.register('test', callback);
      });

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      act(() => {
        result.current.unregister('test');
      });

      vi.advanceTimersByTime(10000);

      // Should still be 1 (initial only)
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('single interval for multiple callbacks', () => {
    it('should call all registered callbacks on each interval tick', async () => {
      const wrapper = createWrapper();
      const callback1 = vi.fn().mockResolvedValue(undefined);
      const callback2 = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => usePollingContext(), { wrapper });

      act(() => {
        result.current.register('cb1', callback1);
        result.current.register('cb2', callback2);
      });

      // Both called immediately on registration
      await waitFor(() => {
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
      });

      // Advance to next interval
      vi.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(callback1).toHaveBeenCalledTimes(2);
        expect(callback2).toHaveBeenCalledTimes(2);
      });
    });

    it('should continue if one callback fails', async () => {
      const wrapper = createWrapper();
      const failingCallback = vi.fn().mockRejectedValue(new Error('fail'));
      const successCallback = vi.fn().mockResolvedValue(undefined);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => usePollingContext(), { wrapper });

      act(() => {
        result.current.register('fail', failingCallback);
        result.current.register('success', successCallback);
      });

      await waitFor(() => {
        expect(failingCallback).toHaveBeenCalledTimes(1);
        expect(successCallback).toHaveBeenCalledTimes(1);
      });

      vi.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(failingCallback).toHaveBeenCalledTimes(2);
        expect(successCallback).toHaveBeenCalledTimes(2);
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('refresh', () => {
    it('should trigger all registered callbacks', async () => {
      const wrapper = createWrapper();
      const callback1 = vi.fn().mockResolvedValue(undefined);
      const callback2 = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => usePollingContext(), { wrapper });

      act(() => {
        result.current.register('cb1', callback1);
        result.current.register('cb2', callback2);
      });

      await waitFor(() => {
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
      });

      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(callback1).toHaveBeenCalledTimes(2);
        expect(callback2).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('visibility handling', () => {
    it('should stop polling when tab is hidden', async () => {
      const wrapper = createWrapper();
      const callback = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => usePollingContext(), { wrapper });

      act(() => {
        result.current.register('test', callback);
      });

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      vi.advanceTimersByTime(10000);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should resume polling when tab becomes visible', async () => {
      const wrapper = createWrapper();
      const callback = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => usePollingContext(), { wrapper });

      act(() => {
        result.current.register('test', callback);
      });

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Hide
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Show
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(2);
      });
    });
  });
});
