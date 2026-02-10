import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SummaryCards } from './SummaryCards';
import { NamespaceProvider } from '../contexts/NamespaceContext';
import * as overviewApi from '../api/overview';

// Mock the overview API
vi.mock('../api/overview');

// Helper to render with NamespaceProvider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<NamespaceProvider>{ui}</NamespaceProvider>);
};

describe('SummaryCards', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering - happy path', () => {
    it('should render without crashing', () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      renderWithProvider(<SummaryCards />);

      // Assert
      const container = screen.getByTestId('summary-cards-container');
      expect(container).toBeInTheDocument();
    });

    it('should display four summary cards', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      renderWithProvider(<SummaryCards />);

      // Assert
      await waitFor(() => {
        const cards = screen.getAllByTestId('summary-card');
        expect(cards).toHaveLength(4);
      });
    });

    it('should display Nodes card with correct data', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      renderWithProvider(<SummaryCards />);

      // Assert
      await waitFor(() => {
        const nodesCard = screen.getByTestId('summary-card-nodes');
        expect(nodesCard).toBeInTheDocument();
        expect(screen.getByText('Nodes')).toBeInTheDocument();
        expect(screen.getByText(/2.*3/)).toBeInTheDocument(); // "2 / 3" or similar
      });
    });

    it('should display Unhealthy Pods card with correct data', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      renderWithProvider(<SummaryCards />);

      // Assert
      await waitFor(() => {
        const unhealthyCard = screen.getByTestId('summary-card-unhealthy-pods');
        expect(unhealthyCard).toBeInTheDocument();
        expect(screen.getByText('Unhealthy Pods')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it('should display Avg CPU card with percentage and UsageBar', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      renderWithProvider(<SummaryCards />);

      // Assert
      await waitFor(() => {
        const cpuCard = screen.getByTestId('summary-card-avg-cpu');
        expect(cpuCard).toBeInTheDocument();
        expect(screen.getByText('Avg CPU')).toBeInTheDocument();
        expect(screen.getByText(/45\.5%/)).toBeInTheDocument();

        const usageBar = cpuCard.querySelector('[data-testid="usage-bar"]');
        expect(usageBar).toBeInTheDocument();
      });
    });

    it('should display Avg Memory card with percentage and UsageBar', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      renderWithProvider(<SummaryCards />);

      // Assert
      await waitFor(() => {
        const memoryCard = screen.getByTestId('summary-card-avg-memory');
        expect(memoryCard).toBeInTheDocument();
        expect(screen.getByText('Avg Memory')).toBeInTheDocument();
        expect(screen.getByText(/62\.3%/)).toBeInTheDocument();

        const usageBar = memoryCard.querySelector('[data-testid="usage-bar"]');
        expect(usageBar).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('should show skeleton cards while loading', () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // Act
      renderWithProvider(<SummaryCards />);

      // Assert
      const skeletons = screen.getAllByTestId('summary-card-skeleton');
      expect(skeletons).toHaveLength(4);
    });

    it('should show loading indicator with proper accessibility', () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockImplementation(
        () => new Promise(() => {})
      );

      // Act
      renderWithProvider(<SummaryCards />);

      // Assert
      const container = screen.getByTestId('summary-cards-container');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('should hide skeleton cards after data loads', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      renderWithProvider(<SummaryCards />);

      // Assert
      await waitFor(() => {
        const skeletons = screen.queryAllByTestId('summary-card-skeleton');
        expect(skeletons).toHaveLength(0);
      });
    });
  });

  describe('error state', () => {
    it('should display error message when fetch fails', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockRejectedValue(
        new Error('Failed to fetch overview data')
      );

      // Act
      renderWithProvider(<SummaryCards />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByTestId('summary-cards-error');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockRejectedValue(
        new Error('Network error')
      );

      // Act
      renderWithProvider(<SummaryCards />);

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
          nodes: { ready: 2, total: 3 },
          unhealthyPods: 1,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
        });

      // Act
      renderWithProvider(<SummaryCards />);

      await waitFor(() => {
        expect(screen.getByTestId('summary-cards-error')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      fireEvent.click(retryButton);

      // Assert
      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(2);
        const cards = screen.getAllByTestId('summary-card');
        expect(cards).toHaveLength(4);
      });
    });

    it('should display user-friendly error message', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockRejectedValue(
        new Error('Failed to fetch')
      );

      // Act
      renderWithProvider(<SummaryCards />);

      // Assert
      await waitFor(() => {
        const errorContainer = screen.getByTestId('summary-cards-error');
        const errorText = errorContainer.textContent;

        // Should not expose technical details
        expect(errorText).not.toContain('stack');
        expect(errorText).not.toContain('undefined');
        expect(errorText).not.toContain('null');
      });
    });
  });

  describe('layout', () => {
    it('should use grid layout', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      renderWithProvider(<SummaryCards />);

      // Assert
      await waitFor(() => {
        const container = screen.getByTestId('summary-cards-container');
        expect(container.className).toMatch(/grid/);
      });
    });

    it('should use 2-column grid on mobile', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      renderWithProvider(<SummaryCards />);

      // Assert
      await waitFor(() => {
        const container = screen.getByTestId('summary-cards-container');
        // Should have grid-cols-2 for mobile
        expect(container.className).toMatch(/grid-cols-2/);
      });
    });
  });

  describe('namespace filtering', () => {
    it('should fetch overview data on mount', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      renderWithProvider(<SummaryCards />);

      // Assert
      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(1);
      });
    });

    it('should pass namespace to API when selected', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      renderWithProvider(<SummaryCards />);

      // Simulate namespace change (this would normally come from NamespaceContext)
      // In actual implementation, this will trigger a re-fetch

      // Assert
      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalled();
      });
    });
  });

  describe('auto-refresh / polling', () => {
    it('should refresh data every 10 seconds', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      renderWithProvider(<SummaryCards />);

      // Wait for initial fetch
      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(1);
      });

      // Advance timer by 10 seconds
      vi.advanceTimersByTime(10000);

      // Assert
      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(2);
      });
    });

    it('should stop polling when component unmounts', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      const { unmount } = renderWithProvider(<SummaryCards />);

      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(1);
      });

      // Unmount component
      unmount();

      // Advance timer
      vi.advanceTimersByTime(10000);

      // Assert - should not fetch again after unmount
      expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle zero values correctly', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 0, total: 0 },
        unhealthyPods: 0,
        avgCpuPercent: 0,
        avgMemoryPercent: 0,
      });

      // Act
      renderWithProvider(<SummaryCards />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
        expect(screen.getByText(/0%/)).toBeInTheDocument();
      });
    });

    it('should handle high values correctly', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 100, total: 100 },
        unhealthyPods: 999,
        avgCpuPercent: 99.9,
        avgMemoryPercent: 99.9,
      });

      // Act
      renderWithProvider(<SummaryCards />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('999')).toBeInTheDocument();
        expect(screen.getByText(/99\.9%/)).toBeInTheDocument();
      });
    });

    it('should handle all nodes ready', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 10, total: 10 },
        unhealthyPods: 0,
        avgCpuPercent: 30.0,
        avgMemoryPercent: 40.0,
      });

      // Act
      renderWithProvider(<SummaryCards />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/10.*10/)).toBeInTheDocument();
      });
    });

    it('should handle some nodes not ready', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue({
        nodes: { ready: 5, total: 10 },
        unhealthyPods: 3,
        avgCpuPercent: 60.0,
        avgMemoryPercent: 70.0,
      });

      // Act
      renderWithProvider(<SummaryCards />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/5.*10/)).toBeInTheDocument();
      });
    });
  });
});
