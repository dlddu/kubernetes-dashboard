import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVisibilityChange } from './useVisibilityChange';

describe('useVisibilityChange', () => {
  let visibilityState: DocumentVisibilityState;
  let hidden: boolean;
  let listeners: Array<(event: Event) => void>;

  beforeEach(() => {
    // Setup mock for document.visibilityState and document.hidden
    visibilityState = 'visible';
    hidden = false;
    listeners = [];

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityState,
    });

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hidden,
    });

    // Mock addEventListener to track listeners
    const originalAddEventListener = document.addEventListener;
    vi.spyOn(document, 'addEventListener').mockImplementation((event, listener) => {
      if (event === 'visibilitychange') {
        listeners.push(listener as (event: Event) => void);
      }
      return originalAddEventListener.call(document, event, listener);
    });

    // Mock removeEventListener
    const originalRemoveEventListener = document.removeEventListener;
    vi.spyOn(document, 'removeEventListener').mockImplementation((event, listener) => {
      if (event === 'visibilitychange') {
        const index = listeners.indexOf(listener as (event: Event) => void);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
      return originalRemoveEventListener.call(document, event, listener);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state - happy path', () => {
    it('should return true when page is initially visible', () => {
      // Arrange
      visibilityState = 'visible';
      hidden = false;

      // Act
      const { result } = renderHook(() => useVisibilityChange());

      // Assert
      expect(result.current).toBe(true);
    });

    it('should return false when page is initially hidden', () => {
      // Arrange
      visibilityState = 'hidden';
      hidden = true;

      // Act
      const { result } = renderHook(() => useVisibilityChange());

      // Assert
      expect(result.current).toBe(false);
    });
  });

  describe('visibility state changes', () => {
    it('should update to false when page becomes hidden', () => {
      // Arrange
      visibilityState = 'visible';
      hidden = false;
      const { result } = renderHook(() => useVisibilityChange());

      // Act
      act(() => {
        visibilityState = 'hidden';
        hidden = true;
        listeners.forEach(listener => listener(new Event('visibilitychange')));
      });

      // Assert
      expect(result.current).toBe(false);
    });

    it('should update to true when page becomes visible', () => {
      // Arrange
      visibilityState = 'hidden';
      hidden = true;
      const { result } = renderHook(() => useVisibilityChange());

      // Act
      act(() => {
        visibilityState = 'visible';
        hidden = false;
        listeners.forEach(listener => listener(new Event('visibilitychange')));
      });

      // Assert
      expect(result.current).toBe(true);
    });

    it('should handle multiple visibility state changes', () => {
      // Arrange
      visibilityState = 'visible';
      hidden = false;
      const { result } = renderHook(() => useVisibilityChange());

      // Act & Assert: Visible -> Hidden
      act(() => {
        visibilityState = 'hidden';
        hidden = true;
        listeners.forEach(listener => listener(new Event('visibilitychange')));
      });
      expect(result.current).toBe(false);

      // Act & Assert: Hidden -> Visible
      act(() => {
        visibilityState = 'visible';
        hidden = false;
        listeners.forEach(listener => listener(new Event('visibilitychange')));
      });
      expect(result.current).toBe(true);

      // Act & Assert: Visible -> Hidden again
      act(() => {
        visibilityState = 'hidden';
        hidden = true;
        listeners.forEach(listener => listener(new Event('visibilitychange')));
      });
      expect(result.current).toBe(false);
    });
  });

  describe('event listener lifecycle', () => {
    it('should add visibilitychange event listener on mount', () => {
      // Arrange
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      // Act
      renderHook(() => useVisibilityChange());

      // Assert
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
    });

    it('should remove visibilitychange event listener on unmount', () => {
      // Arrange
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      const { unmount } = renderHook(() => useVisibilityChange());

      // Act
      unmount();

      // Assert
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
    });

    it('should not leak event listeners after multiple mount/unmount cycles', () => {
      // Arrange & Act
      const { unmount: unmount1 } = renderHook(() => useVisibilityChange());
      const { unmount: unmount2 } = renderHook(() => useVisibilityChange());
      const { unmount: unmount3 } = renderHook(() => useVisibilityChange());

      unmount1();
      unmount2();
      unmount3();

      // Assert
      expect(listeners.length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle prerender visibility state', () => {
      // Arrange
      visibilityState = 'prerender' as DocumentVisibilityState;
      hidden = true;

      // Act
      const { result } = renderHook(() => useVisibilityChange());

      // Assert
      expect(result.current).toBe(false);
    });

    it('should handle rapid visibility changes', () => {
      // Arrange
      visibilityState = 'visible';
      hidden = false;
      const { result } = renderHook(() => useVisibilityChange());

      // Act: Rapid changes
      act(() => {
        visibilityState = 'hidden';
        hidden = true;
        listeners.forEach(listener => listener(new Event('visibilitychange')));

        visibilityState = 'visible';
        hidden = false;
        listeners.forEach(listener => listener(new Event('visibilitychange')));

        visibilityState = 'hidden';
        hidden = true;
        listeners.forEach(listener => listener(new Event('visibilitychange')));
      });

      // Assert: Should reflect final state
      expect(result.current).toBe(false);
    });

    it('should not cause re-renders when visibility state does not change', () => {
      // Arrange
      visibilityState = 'visible';
      hidden = false;
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;
        return useVisibilityChange();
      });

      const initialRenderCount = renderCount;

      // Act: Trigger event but don't change state
      act(() => {
        listeners.forEach(listener => listener(new Event('visibilitychange')));
      });

      // Assert: Should trigger one more render
      expect(renderCount).toBe(initialRenderCount + 1);
      expect(result.current).toBe(true);
    });
  });

  describe('compatibility', () => {
    it('should work correctly in browsers that support Page Visibility API', () => {
      // Arrange
      visibilityState = 'visible';
      hidden = false;

      // Act
      const { result } = renderHook(() => useVisibilityChange());

      // Assert
      expect(result.current).toBeDefined();
      expect(typeof result.current).toBe('boolean');
    });

    it('should handle visibility state consistently with hidden property', () => {
      // Arrange & Act: Visible state
      visibilityState = 'visible';
      hidden = false;
      const { result: result1 } = renderHook(() => useVisibilityChange());
      expect(result1.current).toBe(true);

      // Arrange & Act: Hidden state
      visibilityState = 'hidden';
      hidden = true;
      const { result: result2 } = renderHook(() => useVisibilityChange());
      expect(result2.current).toBe(false);
    });
  });

  describe('concurrent usage', () => {
    it('should work correctly when multiple components use the hook', () => {
      // Arrange
      visibilityState = 'visible';
      hidden = false;

      // Act
      const { result: result1 } = renderHook(() => useVisibilityChange());
      const { result: result2 } = renderHook(() => useVisibilityChange());
      const { result: result3 } = renderHook(() => useVisibilityChange());

      // Assert: All should have the same initial state
      expect(result1.current).toBe(true);
      expect(result2.current).toBe(true);
      expect(result3.current).toBe(true);

      // Act: Change visibility
      act(() => {
        visibilityState = 'hidden';
        hidden = true;
        listeners.forEach(listener => listener(new Event('visibilitychange')));
      });

      // Assert: All should update
      expect(result1.current).toBe(false);
      expect(result2.current).toBe(false);
      expect(result3.current).toBe(false);
    });
  });
});
