import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SummaryCards } from './SummaryCards';
import { useOverview } from '../contexts/OverviewContext';

// Mock the OverviewContext
vi.mock('../contexts/OverviewContext', () => ({
  useOverview: vi.fn(),
}));

describe('SummaryCards', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering - happy path', () => {
    it('should render without crashing', () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 2, total: 3 },
          unhealthyPods: 1,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

      // Assert
      const container = screen.getByTestId('summary-cards-container');
      expect(container).toBeInTheDocument();
    });

    it('should display four summary cards', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 2, total: 3 },
          unhealthyPods: 1,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

      // Assert
      await waitFor(() => {
        const cards = screen.getAllByRole('article');
        expect(cards).toHaveLength(4);
      });
    });

    it('should display Nodes card with correct data', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 2, total: 3 },
          unhealthyPods: 1,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

      // Assert
      await waitFor(() => {
        const nodesCard = screen.getByTestId('summary-card-nodes');
        expect(nodesCard).toBeInTheDocument();
        expect(screen.getByText('Nodes')).toBeInTheDocument();
        expect(within(nodesCard).getByTestId('summary-card-value')).toHaveTextContent('2 / 3');
      });
    });

    it('should display Unhealthy Pods card with correct data', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 2, total: 3 },
          unhealthyPods: 1,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

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
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 2, total: 3 },
          unhealthyPods: 1,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

      // Assert
      await waitFor(() => {
        const cpuCard = screen.getByTestId('summary-card-avg-cpu');
        expect(cpuCard).toBeInTheDocument();
        expect(screen.getByText('Avg CPU')).toBeInTheDocument();
        expect(within(cpuCard).getByTestId('summary-card-value')).toHaveTextContent('45.5%');

        const usageBar = cpuCard.querySelector('[data-testid="usage-bar"]');
        expect(usageBar).toBeInTheDocument();
      });
    });

    it('should display Avg Memory card with percentage and UsageBar', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 2, total: 3 },
          unhealthyPods: 1,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

      // Assert
      await waitFor(() => {
        const memoryCard = screen.getByTestId('summary-card-avg-memory');
        expect(memoryCard).toBeInTheDocument();
        expect(screen.getByText('Avg Memory')).toBeInTheDocument();
        expect(within(memoryCard).getByTestId('summary-card-value')).toHaveTextContent('62.3%');

        const usageBar = memoryCard.querySelector('[data-testid="usage-bar"]');
        expect(usageBar).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('should show skeleton cards while loading', () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: null,
        isLoading: true,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

      // Assert
      const skeletons = screen.getAllByTestId('summary-card-skeleton');
      expect(skeletons).toHaveLength(4);
    });

    it('should show loading indicator with proper accessibility', () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: null,
        isLoading: true,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

      // Assert
      const container = screen.getByTestId('summary-cards-container');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('should hide skeleton cards after data loads', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 2, total: 3 },
          unhealthyPods: 1,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

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
      vi.mocked(useOverview).mockReturnValue({
        overviewData: null,
        isLoading: false,
        error: new Error('Failed to fetch overview data'),
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByTestId('summary-cards-error');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: null,
        isLoading: false,
        error: new Error('Network error'),
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

      // Assert
      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry|try again/i });
        expect(retryButton).toBeInTheDocument();
        expect(retryButton).toBeEnabled();
      });
    });

    it('should retry fetching when retry button is clicked', async () => {
      // Arrange
      const mockRefresh = vi.fn();
      vi.mocked(useOverview).mockReturnValue({
        overviewData: null,
        isLoading: false,
        error: new Error('Network error'),
        refresh: mockRefresh,
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

      await waitFor(() => {
        expect(screen.getByTestId('summary-cards-error')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      fireEvent.click(retryButton);

      // Assert
      expect(mockRefresh).toHaveBeenCalled();
    });

    it('should display user-friendly error message', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: null,
        isLoading: false,
        error: new Error('Failed to fetch'),
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

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
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 2, total: 3 },
          unhealthyPods: 1,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

      // Assert
      await waitFor(() => {
        const container = screen.getByTestId('summary-cards-container');
        expect(container.className).toMatch(/grid/);
      });
    });

    it('should use 2-column grid on mobile', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 2, total: 3 },
          unhealthyPods: 1,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

      // Assert
      await waitFor(() => {
        const container = screen.getByTestId('summary-cards-container');
        // Should have grid-cols-2 for mobile
        expect(container.className).toMatch(/grid-cols-2/);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle zero values correctly', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 0, total: 0 },
          unhealthyPods: 0,
          avgCpuPercent: 0,
          avgMemoryPercent: 0,
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
        const cpuCard = screen.getByTestId('summary-card-avg-cpu');
        expect(within(cpuCard).getByTestId('summary-card-value')).toHaveTextContent('0.0%');
      });
    });

    it('should handle high values correctly', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 100, total: 100 },
          unhealthyPods: 999,
          avgCpuPercent: 99.9,
          avgMemoryPercent: 99.9,
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('999')).toBeInTheDocument();
        const cpuCard = screen.getByTestId('summary-card-avg-cpu');
        expect(within(cpuCard).getByTestId('summary-card-value')).toHaveTextContent('99.9%');
      });
    });

    it('should handle all nodes ready', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 10, total: 10 },
          unhealthyPods: 0,
          avgCpuPercent: 30.0,
          avgMemoryPercent: 40.0,
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/10.*10/)).toBeInTheDocument();
      });
    });

    it('should handle some nodes not ready', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 5, total: 10 },
          unhealthyPods: 3,
          avgCpuPercent: 60.0,
          avgMemoryPercent: 70.0,
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<SummaryCards />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/5.*10/)).toBeInTheDocument();
      });
    });
  });
});
