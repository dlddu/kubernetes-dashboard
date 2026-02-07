import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OverviewTab } from './OverviewTab';
import * as overviewApi from '../api/overview';

// Mock the overview API
vi.mock('../api/overview');

describe('OverviewTab', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering - happy path', () => {
    it('should render without crashing', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 5 },
        unhealthyPods: 2,
        avgCpuUsage: 45.5,
        avgMemoryUsage: 62.3,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const overview = screen.getByTestId('overview-tab');
        expect(overview).toBeInTheDocument();
      });
    });

    it('should display overview data after loading', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 5 },
        unhealthyPods: 2,
        avgCpuUsage: 45.5,
        avgMemoryUsage: 62.3,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('nodes-card')).toHaveTextContent('3 / 5');
        expect(screen.getByTestId('pods-card')).toHaveTextContent('2');
      });
    });

    it('should fetch overview data on mount', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 5 },
        unhealthyPods: 2,
        avgCpuUsage: 45.5,
        avgMemoryUsage: 62.3,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('loading state', () => {
    it('should show skeleton cards while loading', () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          nodes: { ready: 3, total: 5 },
          unhealthyPods: 2,
          avgCpuUsage: 45.5,
          avgMemoryUsage: 62.3,
        }), 100))
      );

      // Act
      render(<OverviewTab />);

      // Assert - Should show 4 skeleton cards
      const skeletons = screen.getAllByTestId('skeleton-card');
      expect(skeletons).toHaveLength(4);
    });

    it('should show skeleton for each card type', () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // Act
      render(<OverviewTab />);

      // Assert
      expect(screen.getByTestId('nodes-skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('pods-skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('cpu-skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('memory-skeleton')).toBeInTheDocument();
    });

    it('should hide skeleton after data loads', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 5 },
        unhealthyPods: 2,
        avgCpuUsage: 45.5,
        avgMemoryUsage: 62.3,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        expect(screen.queryByTestId('skeleton-card')).not.toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should display error message when fetch fails', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockRejectedValue(
        new Error('Failed to fetch overview data')
      );

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByText(/error loading overview/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockRejectedValue(
        new Error('Network error')
      );

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
        expect(retryButton).toBeEnabled();
      });
    });

    it('should retry fetching when retry button is clicked', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          nodes: { ready: 3, total: 5 },
          unhealthyPods: 2,
          avgCpuUsage: 45.5,
          avgMemoryUsage: 62.3,
        });

      // Act
      render(<OverviewTab />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/error loading overview/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Assert
      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(2);
        expect(screen.queryByText(/error loading overview/i)).not.toBeInTheDocument();
      });
    });

    it('should clear error message after successful retry', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          nodes: { ready: 3, total: 5 },
          unhealthyPods: 2,
          avgCpuUsage: 45.5,
          avgMemoryUsage: 62.3,
        });

      // Act
      render(<OverviewTab />);

      await waitFor(() => {
        expect(screen.getByText(/error loading overview/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText(/error loading overview/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('polling functionality', () => {
    it('should auto-refresh data every 10 seconds', async () => {
      // Arrange
      vi.useFakeTimers();
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 5 },
        unhealthyPods: 2,
        avgCpuUsage: 45.5,
        avgMemoryUsage: 62.3,
      });

      // Act
      render(<OverviewTab />);

      // Initial fetch
      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(1);
      });

      // Advance time by 10 seconds
      vi.advanceTimersByTime(10000);

      // Assert
      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(2);
      });

      vi.useRealTimers();
    });

    it('should stop polling when component unmounts', async () => {
      // Arrange
      vi.useFakeTimers();
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 5 },
        unhealthyPods: 2,
        avgCpuUsage: 45.5,
        avgMemoryUsage: 62.3,
      });

      // Act
      const { unmount } = render(<OverviewTab />);

      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(1);
      });

      // Unmount component
      unmount();

      // Advance time
      vi.advanceTimersByTime(10000);

      // Assert - should not fetch after unmount
      expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('empty state', () => {
    it('should show empty state when cluster has no nodes', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 0, total: 0 },
        unhealthyPods: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const emptyMessage = screen.getByText(/cluster is empty/i);
        expect(emptyMessage).toBeInTheDocument();
      });
    });

    it('should show message about no resources when cluster is empty', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 0, total: 0 },
        unhealthyPods: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/no nodes or pods/i)).toBeInTheDocument();
      });
    });
  });

  describe('responsive layout', () => {
    it('should render grid layout for cards', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 5 },
        unhealthyPods: 2,
        avgCpuUsage: 45.5,
        avgMemoryUsage: 62.3,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const grid = screen.getByTestId('cards-grid');
        expect(grid).toBeInTheDocument();
        expect(grid).toHaveClass(/grid/i);
      });
    });

    it('should have 2-column grid on mobile', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 5 },
        unhealthyPods: 2,
        avgCpuUsage: 45.5,
        avgMemoryUsage: 62.3,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const grid = screen.getByTestId('cards-grid');
        // Should have grid-cols-2 for mobile
        expect(grid.className).toMatch(/grid-cols-2/);
      });
    });

    it('should display all 4 summary cards', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 5 },
        unhealthyPods: 2,
        avgCpuUsage: 45.5,
        avgMemoryUsage: 62.3,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('nodes-card')).toBeInTheDocument();
        expect(screen.getByTestId('pods-card')).toBeInTheDocument();
        expect(screen.getByTestId('cpu-card')).toBeInTheDocument();
        expect(screen.getByTestId('memory-card')).toBeInTheDocument();
      });
    });
  });

  describe('data display', () => {
    it('should display node statistics correctly', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 8, total: 10 },
        unhealthyPods: 3,
        avgCpuUsage: 65.5,
        avgMemoryUsage: 72.3,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('nodes-card')).toHaveTextContent('8 / 10');
      });
    });

    it('should display unhealthy pods count', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 5, total: 5 },
        unhealthyPods: 7,
        avgCpuUsage: 45.5,
        avgMemoryUsage: 62.3,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('pods-card')).toHaveTextContent('7');
      });
    });

    it('should display CPU usage percentage', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 5, total: 5 },
        unhealthyPods: 0,
        avgCpuUsage: 88.5,
        avgMemoryUsage: 62.3,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('cpu-card')).toHaveTextContent('88.5%');
      });
    });

    it('should display Memory usage percentage', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 5, total: 5 },
        unhealthyPods: 0,
        avgCpuUsage: 45.5,
        avgMemoryUsage: 91.2,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('memory-card')).toHaveTextContent('91.2%');
      });
    });
  });
});
