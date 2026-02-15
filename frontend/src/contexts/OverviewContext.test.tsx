import { render, screen, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { OverviewProvider, useOverview } from './OverviewContext';
import { NamespaceProvider } from './NamespaceContext';
import { ReactNode } from 'react';

// Mock the overview API
vi.mock('../api/overview', () => ({
  fetchOverview: vi.fn(),
}));

// Mock the PollingContext - OverviewProvider now uses usePollingContext directly
const mockRefresh = vi.fn();
const mockRegister = vi.fn();
const mockUnregister = vi.fn();
vi.mock('./PollingContext', () => ({
  usePollingContext: vi.fn(() => ({
    register: mockRegister,
    unregister: mockUnregister,
    refresh: mockRefresh,
    lastUpdate: new Date(),
    isLoading: false,
  })),
  PollingProvider: ({ children }: { children: ReactNode }) => children,
}));

import { fetchOverview } from '../api/overview';
import { usePollingContext } from './PollingContext';

// OverviewProvider requires NamespaceProvider and Router
const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={['/']}>
    <NamespaceProvider>
      <OverviewProvider>{children}</OverviewProvider>
    </NamespaceProvider>
  </MemoryRouter>
);

describe('OverviewContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Re-setup PollingContext mock after reset
    vi.mocked(usePollingContext).mockImplementation(() => ({
      register: mockRegister,
      unregister: mockUnregister,
      refresh: mockRefresh,
      lastUpdate: new Date(),
      isLoading: false,
    }));
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
        <MemoryRouter initialEntries={['/']}>
          <NamespaceProvider>
            <OverviewProvider>
              <div data-testid="test-child">Test</div>
            </OverviewProvider>
          </NamespaceProvider>
        </MemoryRouter>
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

    it('should register polling callback when on overview tab', () => {
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
      expect(mockRegister).toHaveBeenCalledWith('overview', expect.any(Function));
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
