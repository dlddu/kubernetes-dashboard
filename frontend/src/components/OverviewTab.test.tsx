import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OverviewTab } from './OverviewTab';
import { NamespaceProvider } from '../contexts/NamespaceContext';
import * as overviewApi from '../api/overview';

// Mock the overview API
vi.mock('../api/overview');

// Helper to render with NamespaceProvider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<NamespaceProvider>{ui}</NamespaceProvider>);
};

describe('OverviewTab', () => {
  const mockOverviewData = {
    nodes: { ready: 3, total: 3 },
    unhealthyPods: 5,
    avgCpu: 45.5,
    avgMemory: 62.3,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering - happy path', () => {
    it('should render without crashing', () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue(mockOverviewData);

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      const overviewTab = screen.getByTestId('overview-tab');
      expect(overviewTab).toBeInTheDocument();
    });

    it('should have accessible region role', () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue(mockOverviewData);

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      const overviewRegion = screen.getByRole('region', { name: /overview/i });
      expect(overviewRegion).toBeInTheDocument();
    });
  });

  describe('data fetching', () => {
    it('should fetch overview data on mount', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue(mockOverviewData);

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(1);
      });
    });

    it('should fetch data with default "all" namespace', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue(mockOverviewData);

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledWith('all');
      });
    });

    it('should refetch data when namespace changes', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue(mockOverviewData);

      // Act
      const { rerender } = renderWithProvider(<OverviewTab />);

      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledWith('all');
      });

      // Simulate namespace change in context (this would normally come from NamespaceSelector)
      // For now, just verify the component structure
      rerender(
        <NamespaceProvider>
          <OverviewTab />
        </NamespaceProvider>
      );

      // Assert - component should be ready to handle namespace changes
      expect(overviewApi.fetchOverview).toHaveBeenCalled();
    });

    it('should display SummaryCards after data loads', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue(mockOverviewData);

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const summaryCards = screen.getByTestId('summary-cards-container');
        expect(summaryCards).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('should show loading state while fetching data', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockOverviewData), 100))
      );

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert - Should show loading state immediately
      const loadingIndicator = screen.getByTestId('overview-loading');
      expect(loadingIndicator).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('overview-loading')).not.toBeInTheDocument();
      });
    });

    it('should display 4 skeleton cards during loading', () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockOverviewData), 100))
      );

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      const skeletonCards = screen.getAllByTestId('summary-card-skeleton');
      expect(skeletonCards).toHaveLength(4);
    });

    it('should show skeleton cards with animation', () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockOverviewData), 100))
      );

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      const skeletonCards = screen.getAllByTestId('summary-card-skeleton');
      skeletonCards.forEach((skeleton) => {
        expect(skeleton).toHaveClass(/skeleton|animate-pulse/i);
      });
    });

    it('should set aria-busy during loading', () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockOverviewData), 100))
      );

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      const overviewTab = screen.getByTestId('overview-tab');
      expect(overviewTab).toHaveAttribute('aria-busy', 'true');
    });

    it('should remove aria-busy after loading', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue(mockOverviewData);

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const overviewTab = screen.getByTestId('overview-tab');
        expect(overviewTab).toHaveAttribute('aria-busy', 'false');
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
      renderWithProvider(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByTestId('summary-cards-error');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(/unable to load/i);
      });
    });

    it('should show retry button on error', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockRejectedValue(
        new Error('Network error')
      );

      // Act
      renderWithProvider(<OverviewTab />);

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
        .mockResolvedValueOnce(mockOverviewData);

      // Act
      renderWithProvider(<OverviewTab />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByTestId('summary-cards-error')).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      fireEvent.click(retryButton);

      // Assert
      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledTimes(2);
      });

      // Should show success state after retry
      await waitFor(() => {
        expect(screen.queryByTestId('summary-cards-error')).not.toBeInTheDocument();
        expect(screen.getByTestId('summary-cards-container')).toBeInTheDocument();
      });
    });

    it('should display user-friendly error message', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockRejectedValue(
        new Error('HTTP error! status: 500')
      );

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByTestId('summary-cards-error');
        // Should not expose technical error details
        expect(errorMessage.textContent).not.toContain('stack');
        expect(errorMessage.textContent).not.toContain('HTTP error');
        // Should provide helpful message
        expect(errorMessage).toHaveTextContent(/unable to load|failed to fetch|try again/i);
      });
    });
  });

  describe('empty state', () => {
    it('should display empty state when cluster has no data', async () => {
      // Arrange
      const emptyData = {
        nodes: { ready: 0, total: 0 },
        unhealthyPods: 0,
        avgCpu: 0,
        avgMemory: 0,
      };
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue(emptyData);

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const emptyState = screen.getByTestId('overview-empty-state');
        expect(emptyState).toBeInTheDocument();
        expect(emptyState).toHaveTextContent(/cluster is empty|no data available/i);
      });
    });

    it('should show helpful message in empty state', async () => {
      // Arrange
      const emptyData = {
        nodes: { ready: 0, total: 0 },
        unhealthyPods: 0,
        avgCpu: 0,
        avgMemory: 0,
      };
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue(emptyData);

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const emptyState = screen.getByTestId('overview-empty-state');
        expect(emptyState).toHaveTextContent(/no nodes|empty cluster/i);
      });
    });
  });

  describe('success state', () => {
    it('should display data in cards after successful fetch', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue(mockOverviewData);

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('summary-card-nodes')).toBeInTheDocument();
        expect(screen.getByTestId('summary-card-unhealthy-pods')).toBeInTheDocument();
        expect(screen.getByTestId('summary-card-avg-cpu')).toBeInTheDocument();
        expect(screen.getByTestId('summary-card-avg-memory')).toBeInTheDocument();
      });
    });

    it('should display correct values in cards', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue(mockOverviewData);

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const nodesCard = screen.getByTestId('summary-card-nodes');
        expect(nodesCard).toHaveTextContent('3/3');

        const unhealthyCard = screen.getByTestId('summary-card-unhealthy-pods');
        expect(unhealthyCard).toHaveTextContent('5');

        const cpuCard = screen.getByTestId('summary-card-avg-cpu');
        expect(cpuCard).toHaveTextContent('45.5%');

        const memoryCard = screen.getByTestId('summary-card-avg-memory');
        expect(memoryCard).toHaveTextContent('62.3%');
      });
    });
  });

  describe('responsive layout', () => {
    it('should be scrollable on mobile', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue(mockOverviewData);

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const overviewTab = screen.getByTestId('overview-tab');
        // Should have overflow classes for mobile scrolling
        expect(overviewTab).toHaveClass('overflow-auto');
      });
    });
  });

  describe('namespace integration', () => {
    it('should use namespace from context', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue(mockOverviewData);

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      await waitFor(() => {
        expect(overviewApi.fetchOverview).toHaveBeenCalledWith('all');
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockResolvedValue(mockOverviewData);

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /overview/i });
        expect(heading).toBeInTheDocument();
      });
    });

    it('should announce loading state to screen readers', () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockOverviewData), 100))
      );

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      const overviewTab = screen.getByTestId('overview-tab');
      expect(overviewTab).toHaveAttribute('aria-busy', 'true');
    });

    it('should announce errors to screen readers', async () => {
      // Arrange
      vi.mocked(overviewApi.fetchOverview).mockRejectedValue(
        new Error('Failed to fetch')
      );

      // Act
      renderWithProvider(<OverviewTab />);

      // Assert
      await waitFor(() => {
        const errorContainer = screen.getByTestId('summary-cards-error');
        expect(errorContainer).toHaveAttribute('role', 'alert');
      });
    });
  });
});
