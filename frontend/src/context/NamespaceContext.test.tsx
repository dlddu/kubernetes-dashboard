import { render, screen, renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NamespaceProvider, useNamespace } from './NamespaceContext';

describe('NamespaceContext', () => {
  describe('NamespaceProvider', () => {
    it('should render children without crashing', () => {
      // Arrange & Act
      render(
        <NamespaceProvider>
          <div>Test Child</div>
        </NamespaceProvider>
      );

      // Assert
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should provide default namespace value', () => {
      // Arrange
      const TestComponent = () => {
        const { selectedNamespace } = useNamespace();
        return <div>{selectedNamespace}</div>;
      };

      // Act
      render(
        <NamespaceProvider>
          <TestComponent />
        </NamespaceProvider>
      );

      // Assert
      expect(screen.getByText('all')).toBeInTheDocument();
    });
  });

  describe('useNamespace hook', () => {
    it('should return selectedNamespace and setSelectedNamespace', () => {
      // Arrange & Act
      const { result } = renderHook(() => useNamespace(), {
        wrapper: NamespaceProvider,
      });

      // Assert
      expect(result.current).toHaveProperty('selectedNamespace');
      expect(result.current).toHaveProperty('setSelectedNamespace');
      expect(typeof result.current.setSelectedNamespace).toBe('function');
    });

    it('should have "all" as default selected namespace', () => {
      // Arrange & Act
      const { result } = renderHook(() => useNamespace(), {
        wrapper: NamespaceProvider,
      });

      // Assert
      expect(result.current.selectedNamespace).toBe('all');
    });

    it('should update selected namespace when setSelectedNamespace is called', () => {
      // Arrange
      const { result } = renderHook(() => useNamespace(), {
        wrapper: NamespaceProvider,
      });

      // Act
      act(() => {
        result.current.setSelectedNamespace('default');
      });

      // Assert
      expect(result.current.selectedNamespace).toBe('default');
    });

    it('should update selected namespace multiple times', () => {
      // Arrange
      const { result } = renderHook(() => useNamespace(), {
        wrapper: NamespaceProvider,
      });

      // Act & Assert
      act(() => {
        result.current.setSelectedNamespace('kube-system');
      });
      expect(result.current.selectedNamespace).toBe('kube-system');

      act(() => {
        result.current.setSelectedNamespace('default');
      });
      expect(result.current.selectedNamespace).toBe('default');

      act(() => {
        result.current.setSelectedNamespace('all');
      });
      expect(result.current.selectedNamespace).toBe('all');
    });

    it('should persist namespace change across component re-renders', () => {
      // Arrange
      const TestComponent = () => {
        const { selectedNamespace, setSelectedNamespace } = useNamespace();
        return (
          <div>
            <span data-testid="namespace">{selectedNamespace}</span>
            <button onClick={() => setSelectedNamespace('test-namespace')}>
              Change
            </button>
          </div>
        );
      };

      // Act
      const { rerender } = render(
        <NamespaceProvider>
          <TestComponent />
        </NamespaceProvider>
      );

      // Assert initial state
      expect(screen.getByTestId('namespace')).toHaveTextContent('all');

      // Act - change namespace
      act(() => {
        screen.getByRole('button', { name: /change/i }).click();
      });

      // Assert after change
      expect(screen.getByTestId('namespace')).toHaveTextContent('test-namespace');

      // Act - force re-render
      rerender(
        <NamespaceProvider>
          <TestComponent />
        </NamespaceProvider>
      );

      // Assert persistence - state is maintained during rerender
      expect(screen.getByTestId('namespace')).toHaveTextContent('test-namespace');
    });

    it('should share namespace state across multiple consumers', () => {
      // Arrange
      const Consumer1 = () => {
        const { selectedNamespace } = useNamespace();
        return <div data-testid="consumer1">{selectedNamespace}</div>;
      };

      const Consumer2 = () => {
        const { selectedNamespace, setSelectedNamespace } = useNamespace();
        return (
          <div>
            <div data-testid="consumer2">{selectedNamespace}</div>
            <button onClick={() => setSelectedNamespace('shared-namespace')}>
              Update
            </button>
          </div>
        );
      };

      // Act
      render(
        <NamespaceProvider>
          <Consumer1 />
          <Consumer2 />
        </NamespaceProvider>
      );

      // Assert initial state
      expect(screen.getByTestId('consumer1')).toHaveTextContent('all');
      expect(screen.getByTestId('consumer2')).toHaveTextContent('all');

      // Act - update from consumer2
      act(() => {
        screen.getByRole('button', { name: /update/i }).click();
      });

      // Assert both consumers see the update
      expect(screen.getByTestId('consumer1')).toHaveTextContent('shared-namespace');
      expect(screen.getByTestId('consumer2')).toHaveTextContent('shared-namespace');
    });

    it('should throw error when used outside of NamespaceProvider', () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act & Assert
      expect(() => {
        renderHook(() => useNamespace());
      }).toThrow();

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should accept empty string as namespace value', () => {
      // Arrange
      const { result } = renderHook(() => useNamespace(), {
        wrapper: NamespaceProvider,
      });

      // Act
      act(() => {
        result.current.setSelectedNamespace('');
      });

      // Assert
      expect(result.current.selectedNamespace).toBe('');
    });

    it('should accept special characters in namespace value', () => {
      // Arrange
      const { result } = renderHook(() => useNamespace(), {
        wrapper: NamespaceProvider,
      });

      // Act
      act(() => {
        result.current.setSelectedNamespace('test-namespace-123');
      });

      // Assert
      expect(result.current.selectedNamespace).toBe('test-namespace-123');
    });
  });
});
