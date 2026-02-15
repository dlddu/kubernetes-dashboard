import { render, screen, renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OverviewProvider, useOverview } from './OverviewContext';
import { NamespaceProvider } from './NamespaceContext';
import { ReactNode } from 'react';

// Mock the overview API
vi.mock('../api/overview', () => ({
  fetchOverview: vi.fn(),
}));

// Mock the usePolling hook - do NOT call callback during render to avoid infinite loops
let capturedCallback: (() => void) | null = null;
const mockRefresh = vi.fn();
vi.mock('../hooks/usePolling', () => ({
  usePolling: vi.fn((callback: () => void) => {
    capturedCallback = callback;
    return {
      refresh: mockRefresh,
      lastUpdate: new Date(),
      isLoading: false,
    };
  }),
}));

import { fetchOverview } from '../api/overview';
import { usePolling } from '../hooks/usePolling';

// OverviewProvider requires NamespaceProvider
const wrapper = ({ children }: { children: ReactNode }) => (
  <NamespaceProvider>
    <OverviewProvider>{children}</OverviewProvider>
  </NamespaceProvider>
);

describe('OverviewContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    capturedCallback = null;
    // Re-setup usePolling mock after reset
    vi.mocked(usePolling).mockImplementation((callback: () => void) => {
      capturedCallback = callback;
      return {
        refresh: mockRefresh,
        lastUpdate: new Date(),
        isLoading: false,
      };
    });
  });

  describe('OverviewProvider - initialization', () => {
    it('should render without crashing', () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 0,
        avgCpuPercent: 0,
        avgMemoryPercent: 0,
      });

      // Act
      render(
        <NamespaceProvider>
          <OverviewProvider>
            <div data-testid="test-child">Test</div>
          </OverviewProvider>
        </NamespaceProvider>
      );

      // Assert
      const child = screen.getByTestId('test-child');
      expect(child).toBeInTheDocument();
    });

    it('should call fetchOverview on mount', () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 0,
        avgCpuPercent: 0,
        avgMemoryPercent: 0,
      });

      // Act
      renderHook(() => useOverview(), { wrapper });

      // Assert
      expect(fetchOverview).toHaveBeenCalled();
    });

    it('should pass usePolling a callback', () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 0,
        avgCpuPercent: 0,
        avgMemoryPercent: 0,
      });

      // Act
      renderHook(() => useOverview(), { wrapper });

      // Assert
      expect(usePolling).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('data fetching', () => {
    it('should provide overview data after successful fetch', async () => {
      // Arrange
      const mockData = {
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      };
      vi.mocked(fetchOverview).mockResolvedValue(mockData);

      // Act
      const { result } = renderHook(() => useOverview(), { wrapper });

      // Assert
      await waitFor(() => {
        expect(result.current.overviewData).toEqual(mockData);
      });
    });

    it('should set isLoading to false after data loads', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 0,
        avgCpuPercent: 0,
        avgMemoryPercent: 0,
      });

      // Act
      const { result } = renderHook(() => useOverview(), { wrapper });

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set error to null on successful fetch', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 0,
        avgCpuPercent: 0,
        avgMemoryPercent: 0,
      });

      // Act
      const { result } = renderHook(() => useOverview(), { wrapper });

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('error handling', () => {
    it('should set error when fetch fails', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockRejectedValue(new Error('Network error'));

      // Act
      const { result } = renderHook(() => useOverview(), { wrapper });

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('Network error');
      });
    });

    it('should set isLoading to false after error', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockRejectedValue(new Error('Network error'));

      // Act
      const { result } = renderHook(() => useOverview(), { wrapper });

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should keep overviewData null on error', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockRejectedValue(new Error('Network error'));

      // Act
      const { result } = renderHook(() => useOverview(), { wrapper });

      // Assert
      await waitFor(() => {
        expect(result.current.overviewData).toBeNull();
      });
    });
  });

  describe('useOverview - error handling', () => {
    it('should throw error when used outside OverviewProvider', () => {
      // Arrange
      const TestComponentWithoutProvider = () => {
        useOverview();
        return <div>Test</div>;
      };

      // Act & Assert
      expect(() => render(<TestComponentWithoutProvider />)).toThrow(
        'useOverview must be used within an OverviewProvider'
      );
    });
  });

  describe('context values', () => {
    it('should expose refresh function', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 0,
        avgCpuPercent: 0,
        avgMemoryPercent: 0,
      });

      // Act
      const { result } = renderHook(() => useOverview(), { wrapper });

      // Assert
      expect(typeof result.current.refresh).toBe('function');
    });

    it('should expose lastUpdate as Date', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 0,
        avgCpuPercent: 0,
        avgMemoryPercent: 0,
      });

      // Act
      const { result } = renderHook(() => useOverview(), { wrapper });

      // Assert
      expect(result.current.lastUpdate).toBeInstanceOf(Date);
    });
  });

  describe('namespace handling', () => {
    it('should call fetchOverview with undefined for all namespace', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 0,
        avgCpuPercent: 0,
        avgMemoryPercent: 0,
      });

      // Act - default namespace is 'all'
      renderHook(() => useOverview(), { wrapper });

      // Assert
      await waitFor(() => {
        expect(fetchOverview).toHaveBeenCalledWith(undefined);
      });
    });
  });
});
