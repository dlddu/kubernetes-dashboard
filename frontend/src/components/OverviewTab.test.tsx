import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OverviewTab } from './OverviewTab';
import * as overviewApi from '../api/overview';

// Mock the overview API
vi.mock('../api/overview');

// Mock child components to focus on OverviewTab logic
interface MockOverviewData {
  nodes: { ready: number; total: number };
  unhealthyPods: number;
  averageCpu: number;
  averageMemory: number;
}

vi.mock('./SummaryCards', () => ({
  SummaryCards: ({ data }: { data: MockOverviewData | null }) => (
    <div data-testid="summary-cards">{data ? 'loaded' : 'empty'}</div>
  ),
}));

vi.mock('./UnhealthyPodPreview', () => ({
  UnhealthyPodPreview: () => <div data-testid="unhealthy-pod-preview">Preview</div>,
}));

vi.mock('./NodeQuickView', () => ({
  NodeQuickView: () => <div data-testid="node-quick-view">Nodes</div>,
}));

vi.mock('./PollingIndicator', () => ({
  PollingIndicator: ({ lastUpdated }: { lastUpdated?: Date | null; loading?: boolean; onRefresh?: () => void }) => (
    <div data-testid="polling-indicator">
      {lastUpdated ? lastUpdated.toISOString() : 'never'}
    </div>
  ),
}));

describe('OverviewTab', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering - happy path', () => {
    it('should render without crashing', () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCpu: 50.0,
        averageMemory: 60.0,
      });

      // Act
      render(<OverviewTab />);

      // Assert - Component should render
      const overviewTab = screen.getByTestId('overview-tab');
      expect(overviewTab).toBeInTheDocument();
    });

    it('should render all child components', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCpu: 50.0,
        averageMemory: 60.0,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('summary-cards')).toBeInTheDocument();
        expect(screen.getByTestId('unhealthy-pod-preview')).toBeInTheDocument();
        expect(screen.getByTestId('node-quick-view')).toBeInTheDocument();
        expect(screen.getByTestId('polling-indicator')).toBeInTheDocument();
      });
    });
  });

  describe('data fetching', () => {
    it('should fetch overview data on mount', async () => {
      // Arrange
      const mockData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 2,
        averageCpu: 45.5,
        averageMemory: 60.2,
      };

      vi.mocked(overviewApi.fetchOverview).mockResolvedValue(mockData);

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(1);
      });
    });

    it('should pass fetched data to child components', async () => {
      // Arrange
      const mockData = {
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 5,
        averageCpu: 75.0,
        averageMemory: 80.0,
      };

      vi.mocked(overviewApi.fetchOverview).mockResolvedValue(mockData);

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const summaryCards = screen.getByTestId('summary-cards');
        expect(summaryCards).toHaveTextContent('loaded');
      });
    });
  });

  describe('loading state', () => {
    it('should show loading skeleton while fetching data', () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          nodes: { ready: 3, total: 3 },
          unhealthyPods: 0,
          averageCpu: 50.0,
          averageMemory: 60.0,
        }), 100))
      );

      // Act
      render(<OverviewTab />);

      // Assert - Should show 4 skeleton cards
      const skeletons = screen.getAllByTestId(/skeleton-card/);
      expect(skeletons).toHaveLength(4);
    });

    it('should hide loading state after data loads', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCpu: 50.0,
        averageMemory: 60.0,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const skeletons = screen.queryAllByTestId(/skeleton-card/);
        expect(skeletons).toHaveLength(0);
      });
    });

    it('should display skeleton cards in 2-column grid on mobile', () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockImplementation(
        () => new Promise(() => {}) // Never resolves to keep loading state
      );

      // Act
      render(<OverviewTab />);

      // Assert
      const container = screen.getByTestId('skeleton-container');
      expect(container).toHaveClass(/grid|grid-cols-2/);
    });
  });

  describe('error handling', () => {
    it('should display error message when fetch fails', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockRejectedValue(
        new Error('Failed to fetch overview')
      );

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByText(/error loading overview|failed to load/i);
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
        const retryButton = screen.getByRole('button', { name: /retry|try again/i });
        expect(retryButton).toBeInTheDocument();
        expect(retryButton).toBeEnabled();
      });
    });

    it('should retry fetching when retry button is clicked', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          nodes: { ready: 3, total: 3 },
          unhealthyPods: 0,
          averageCpu: 50.0,
          averageMemory: 60.0,
        });

      // Act
      render(<OverviewTab />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/error loading overview/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      retryButton.click();

      // Assert
      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('empty state', () => {
    it('should show empty state when cluster has no data', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 0, total: 0 },
        unhealthyPods: 0,
        averageCpu: 0,
        averageMemory: 0,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const emptyMessage = screen.getByText('Cluster is empty');
        expect(emptyMessage).toBeInTheDocument();
      });
    });

    it('should display helpful message in empty state', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 0, total: 0 },
        unhealthyPods: 0,
        averageCpu: 0,
        averageMemory: 0,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const message = screen.getByText('No nodes found in the cluster');
        expect(message).toBeInTheDocument();
      });
    });
  });

  describe('auto-refresh polling', () => {
    it('should refresh data every 10 seconds', async () => {
      // Arrange
      vi.useFakeTimers();
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCpu: 50.0,
        averageMemory: 60.0,
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

    it('should stop polling when tab is hidden', async () => {
      // Arrange
      vi.useFakeTimers();
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCpu: 50.0,
        averageMemory: 60.0,
      });

      render(<OverviewTab />);

      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(1);
      });

      // Act - Hide tab
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Advance time
      vi.advanceTimersByTime(10000);

      // Assert - Should not fetch while hidden
      expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should resume polling when tab becomes visible', async () => {
      // Arrange
      vi.useFakeTimers();
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCpu: 50.0,
        averageMemory: 60.0,
      });

      render(<OverviewTab />);

      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(1);
      });

      // Hide tab
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Act - Show tab
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: false,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Assert - Should fetch immediately when becoming visible
      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(2);
      });

      vi.useRealTimers();
    });
  });

  describe('responsive layout', () => {
    it('should render in 2-column grid on mobile viewport', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCpu: 50.0,
        averageMemory: 60.0,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const overviewTab = screen.getByTestId('overview-tab');
        expect(overviewTab.className).toMatch(/grid-cols-2/);
      });
    });

    it('should be scrollable on mobile', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCpu: 50.0,
        averageMemory: 60.0,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const overviewTab = screen.getByTestId('overview-tab');
        expect(overviewTab.className).toMatch(/overflow-y-auto/);
      });
    });
  });

  describe('namespace filtering', () => {
    it('should fetch data for specific namespace when filter is applied', async () => {
      // Arrange
      const mockData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 1,
        averageCpu: 50.0,
        averageMemory: 60.0,
      };

      vi.mocked(overviewApi.fetchOverview).mockResolvedValue(mockData);

      // Act
      render(<OverviewTab namespace="default" />);

      // Assert
      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledWith('default');
      });
    });

    it('should refetch data when namespace changes', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCpu: 50.0,
        averageMemory: 60.0,
      });

      // Act
      const { rerender } = render(<OverviewTab namespace="default" />);

      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledWith('default');
      });

      // Change namespace
      rerender(<OverviewTab namespace="production" />);

      // Assert
      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledWith('production');
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCpu: 50.0,
        averageMemory: 60.0,
      });

      // Act
      render(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const overviewTab = screen.getByTestId('overview-tab');
        expect(overviewTab).toHaveAttribute('role', 'tabpanel');
        expect(overviewTab).toHaveAttribute('aria-label', 'Overview tab');
      });
    });

    it('should announce loading state to screen readers', () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // Act
      render(<OverviewTab />);

      // Assert
      const loadingIndicator = screen.getByRole('status', { name: /loading/i });
      expect(loadingIndicator).toBeInTheDocument();
      expect(loadingIndicator).toHaveAttribute('aria-live', 'polite');
    });
  });
});
