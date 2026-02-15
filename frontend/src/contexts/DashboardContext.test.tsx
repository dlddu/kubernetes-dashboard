import { render, screen, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardProvider, useDashboard } from './DashboardContext';
import { NamespaceProvider } from './NamespaceContext';
import { ReactNode } from 'react';

// Mock the overview API
vi.mock('../api/overview', () => ({
  fetchOverview: vi.fn(),
}));

import { fetchOverview } from '../api/overview';

// DashboardProvider requires NamespaceProvider
const wrapper = ({ children }: { children: ReactNode }) => (
  <NamespaceProvider>
    <DashboardProvider>{children}</DashboardProvider>
  </NamespaceProvider>
);

describe('DashboardContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('DashboardProvider - initialization', () => {
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
          <DashboardProvider>
            <div data-testid="test-child">Test</div>
          </DashboardProvider>
        </NamespaceProvider>
      );

      // Assert
      const child = screen.getByTestId('test-child');
      expect(child).toBeInTheDocument();
    });

    it('should expose loadDashboard function', () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 0,
        avgCpuPercent: 0,
        avgMemoryPercent: 0,
      });

      // Act
      const { result } = renderHook(() => useDashboard(), { wrapper });

      // Assert
      expect(typeof result.current.loadDashboard).toBe('function');
    });
  });

  describe('data fetching', () => {
    it('should provide overview data after loadDashboard is called', async () => {
      // Arrange
      const mockData = {
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      };
      vi.mocked(fetchOverview).mockResolvedValue(mockData);

      // Act
      const { result } = renderHook(() => useDashboard(), { wrapper });
      await result.current.loadDashboard();

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
      const { result } = renderHook(() => useDashboard(), { wrapper });
      await result.current.loadDashboard();

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
      const { result } = renderHook(() => useDashboard(), { wrapper });
      await result.current.loadDashboard();

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
      const { result } = renderHook(() => useDashboard(), { wrapper });
      await result.current.loadDashboard();

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
      const { result } = renderHook(() => useDashboard(), { wrapper });
      await result.current.loadDashboard();

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should keep overviewData null on error', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockRejectedValue(new Error('Network error'));

      // Act
      const { result } = renderHook(() => useDashboard(), { wrapper });
      await result.current.loadDashboard();

      // Assert
      await waitFor(() => {
        expect(result.current.overviewData).toBeNull();
      });
    });
  });

  describe('useDashboard - error handling', () => {
    it('should throw error when used outside DashboardProvider', () => {
      // Arrange
      const TestComponentWithoutProvider = () => {
        useDashboard();
        return <div>Test</div>;
      };

      // Act & Assert
      expect(() => render(<TestComponentWithoutProvider />)).toThrow(
        'useDashboard must be used within a DashboardProvider'
      );
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
      const { result } = renderHook(() => useDashboard(), { wrapper });
      await result.current.loadDashboard();

      // Assert
      await waitFor(() => {
        expect(fetchOverview).toHaveBeenCalledWith(undefined);
      });
    });
  });
});
