import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NodeQuickView } from './NodeQuickView';
import userEvent from '@testing-library/user-event';

interface ErrorWithStatus extends Error {
  status?: number;
}

// Mock the OverviewContext
vi.mock('../contexts/OverviewContext', () => ({
  useOverview: vi.fn(),
}));

// Mock the UsageBar component
vi.mock('./UsageBar', () => ({
  UsageBar: ({ percentage, label }: { percentage: number; label?: string }) => (
    <div
      data-testid="usage-bar"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ? `${label}: ${percentage}%` : `${percentage}%`}
    >
      {percentage.toFixed(1)}%
    </div>
  ),
}));

import { useOverview } from '../contexts/OverviewContext';

describe('NodeQuickView', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering - happy path', () => {
    it('should render without crashing', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 2, total: 3 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            {
              name: 'node-1',
              status: 'Ready',
              role: '',
              cpuPercent: 45.5,
              memoryPercent: 62.3,
            },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const component = screen.getByTestId('node-quick-view');
        expect(component).toBeInTheDocument();
      });
    });

    it('should be accessible as section', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 2, total: 3 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            {
              name: 'node-1',
              status: 'Ready',
              role: '',
              cpuPercent: 45.5,
              memoryPercent: 62.3,
            },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const section = screen.getByRole('region', { name: /nodes/i });
        expect(section).toBeInTheDocument();
      });
    });

    it('should display component title', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 2, total: 3 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            {
              name: 'node-1',
              status: 'Ready',
              role: '',
              cpuPercent: 45.5,
              memoryPercent: 62.3,
            },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /nodes/i });
        expect(heading).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('should display loading indicator while fetching', () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: null,
        isLoading: true,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      const loadingIndicator = screen.getByTestId('loading-indicator');
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should show loading text', () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: null,
        isLoading: true,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      const loadingText = screen.getByText(/loading/i);
      expect(loadingText).toBeInTheDocument();
    });

    it('should be accessible during loading', () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: null,
        isLoading: true,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      const component = screen.getByTestId('node-quick-view');
      expect(component).toHaveAttribute('aria-busy', 'true');
    });

    it('should display skeleton UI during loading', () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: null,
        isLoading: true,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      const loadingIndicator = screen.getByTestId('loading-indicator');
      expect(loadingIndicator).toBeInTheDocument();
      const spinner = loadingIndicator.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('displaying nodes - maximum 5 items', () => {
    it('should display up to 5 nodes', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 8, total: 10 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: Array.from({ length: 10 }, (_, i) => ({
            name: `node-${i + 1}`,
            status: 'Ready',
            role: '',
            cpuPercent: 40.0 + i,
            memoryPercent: 50.0 + i,
          })),
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const nodeItems = screen.getAllByTestId('node-item');
        expect(nodeItems.length).toBeLessThanOrEqual(5);
      });
    });

    it('should display 1 node when only 1 exists', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 1, total: 1 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            {
              name: 'node-1',
              status: 'Ready',
              role: '',
              cpuPercent: 45.5,
              memoryPercent: 62.3,
            },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const nodeItems = screen.getAllByTestId('node-item');
        expect(nodeItems.length).toBe(1);
      });
    });

    it('should display 3 nodes when 3 exist', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 3, total: 3 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            { name: 'node-1', status: 'Ready', role: '', cpuPercent: 40.0, memoryPercent: 50.0 },
            { name: 'node-2', status: 'Ready', role: '', cpuPercent: 45.0, memoryPercent: 55.0 },
            { name: 'node-3', status: 'Ready', role: '', cpuPercent: 50.0, memoryPercent: 60.0 },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const nodeItems = screen.getAllByTestId('node-item');
        expect(nodeItems.length).toBe(3);
      });
    });

    it('should limit to 5 nodes even when more exist', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 10, total: 10 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: Array.from({ length: 10 }, (_, i) => ({
            name: `node-${i + 1}`,
            status: 'Ready',
            role: '',
            cpuPercent: 40.0 + i,
            memoryPercent: 50.0 + i,
          })),
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const nodeItems = screen.getAllByTestId('node-item');
        expect(nodeItems.length).toBe(5);
      });
    });
  });

  describe('node item structure', () => {
    it('should display node name for each item', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 1, total: 1 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            {
              name: 'node-master-1',
              status: 'Ready',
              role: '',
              cpuPercent: 45.5,
              memoryPercent: 62.3,
            },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const nodeName = screen.getByTestId('node-name');
        expect(nodeName).toBeInTheDocument();
        expect(nodeName.textContent).toBe('node-master-1');
      });
    });

    it('should display node status for each item', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 1, total: 1 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            {
              name: 'node-1',
              status: 'Ready',
              role: '',
              cpuPercent: 45.5,
              memoryPercent: 62.3,
            },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const nodeStatus = screen.getByTestId('node-status');
        expect(nodeStatus).toBeInTheDocument();
        expect(nodeStatus.textContent).toMatch(/ready/i);
      });
    });

    it('should display CPU usage bar for Ready nodes', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 1, total: 1 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            {
              name: 'node-1',
              status: 'Ready',
              role: '',
              cpuPercent: 45.5,
              memoryPercent: 62.3,
            },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const cpuBars = screen.getAllByRole('progressbar');
        expect(cpuBars.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should display Memory usage bar for Ready nodes', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 1, total: 1 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            {
              name: 'node-1',
              status: 'Ready',
              role: '',
              cpuPercent: 45.5,
              memoryPercent: 62.3,
            },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const memoryBars = screen.getAllByRole('progressbar');
        // Should have 2 progress bars (CPU and Memory)
        expect(memoryBars.length).toBe(2);
      });
    });

    it('should display all required fields for multiple nodes', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 3, total: 3 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            { name: 'node-1', status: 'Ready', role: '', cpuPercent: 40.0, memoryPercent: 50.0 },
            { name: 'node-2', status: 'Ready', role: '', cpuPercent: 45.0, memoryPercent: 55.0 },
            { name: 'node-3', status: 'Ready', role: '', cpuPercent: 50.0, memoryPercent: 60.0 },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const nodeItems = screen.getAllByTestId('node-item');
        expect(nodeItems.length).toBe(3);

        nodeItems.forEach((item) => {
          const name = item.querySelector('[data-testid="node-name"]');
          const status = item.querySelector('[data-testid="node-status"]');
          const progressBars = item.querySelectorAll('[role="progressbar"]');

          expect(name).toBeInTheDocument();
          expect(status).toBeInTheDocument();
          expect(progressBars.length).toBe(2); // CPU and Memory
        });
      });
    });
  });

  describe('NotReady nodes - priority display', () => {
    it('should display NotReady nodes before Ready nodes', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 2, total: 3 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            { name: 'ready-node-1', status: 'Ready', role: '', cpuPercent: 40.0, memoryPercent: 50.0 },
            { name: 'not-ready-node', status: 'NotReady', role: '', cpuPercent: 0, memoryPercent: 0 },
            { name: 'ready-node-2', status: 'Ready', role: '', cpuPercent: 45.0, memoryPercent: 55.0 },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const nodeItems = screen.getAllByTestId('node-item');
        const firstNodeName = nodeItems[0].querySelector('[data-testid="node-name"]');
        expect(firstNodeName?.textContent).toBe('not-ready-node');
      });
    });

    it('should display warning indicator for NotReady nodes', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 1, total: 2 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            { name: 'node-1', status: 'NotReady', role: '', cpuPercent: 0, memoryPercent: 0 },
            { name: 'node-2', status: 'Ready', role: '', cpuPercent: 45.0, memoryPercent: 55.0 },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const warningIndicator = screen.getByTestId('node-warning-indicator');
        expect(warningIndicator).toBeInTheDocument();
      });
    });

    it('should display warning message instead of usage bars for NotReady nodes', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 1, total: 2 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            { name: 'node-1', status: 'NotReady', role: '', cpuPercent: 0, memoryPercent: 0 },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const warningMessage = screen.getByTestId('node-warning-indicator');
        expect(warningMessage).toBeInTheDocument();
        expect(warningMessage.textContent).toMatch(/not ready|unavailable|unhealthy/i);
      });
    });

    it('should not display usage bars for NotReady nodes', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 0, total: 1 },
          unhealthyPods: 0,
          avgCpuPercent: 0,
          avgMemoryPercent: 0,
          nodesList: [
            { name: 'node-1', status: 'NotReady', role: '', cpuPercent: 0, memoryPercent: 0 },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const progressBars = screen.queryAllByRole('progressbar');
        expect(progressBars.length).toBe(0);
      });
    });

    it('should display multiple NotReady nodes', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 0, total: 3 },
          unhealthyPods: 0,
          avgCpuPercent: 0,
          avgMemoryPercent: 0,
          nodesList: [
            { name: 'node-1', status: 'NotReady', role: '', cpuPercent: 0, memoryPercent: 0 },
            { name: 'node-2', status: 'NotReady', role: '', cpuPercent: 0, memoryPercent: 0 },
            { name: 'node-3', status: 'NotReady', role: '', cpuPercent: 0, memoryPercent: 0 },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const nodeItems = screen.getAllByTestId('node-item');
        expect(nodeItems.length).toBe(3);

        const warningIndicators = screen.getAllByTestId('node-warning-indicator');
        expect(warningIndicators.length).toBe(3);
      });
    });
  });

  describe('empty state', () => {
    it('should handle empty node list', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 0, total: 0 },
          unhealthyPods: 0,
          avgCpuPercent: 0,
          avgMemoryPercent: 0,
          nodesList: [],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const nodeItems = screen.queryAllByTestId('node-item');
        expect(nodeItems.length).toBe(0);
      });
    });

    it('should display message when no nodes exist', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 0, total: 0 },
          unhealthyPods: 0,
          avgCpuPercent: 0,
          avgMemoryPercent: 0,
          nodesList: [],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const emptyMessage = screen.getByText(/no nodes|no nodes found/i);
        expect(emptyMessage).toBeInTheDocument();
      });
    });
  });

  describe('view more link', () => {
    it('should display "view more" link when more than 5 nodes exist', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 8, total: 10 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: Array.from({ length: 10 }, (_, i) => ({
            name: `node-${i + 1}`,
            status: 'Ready',
            role: '',
            cpuPercent: 40.0 + i,
            memoryPercent: 50.0 + i,
          })),
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const viewMoreLink = screen.getByTestId('view-more-link');
        expect(viewMoreLink).toBeInTheDocument();
      });
    });

    it('should be a clickable link', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 8, total: 10 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: Array.from({ length: 10 }, (_, i) => ({
            name: `node-${i + 1}`,
            status: 'Ready',
            role: '',
            cpuPercent: 40.0 + i,
            memoryPercent: 50.0 + i,
          })),
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const viewMoreLink = screen.getByTestId('view-more-link');
        expect(viewMoreLink.tagName).toBe('A');
      });
    });

    it('should navigate to nodes page', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 8, total: 10 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: Array.from({ length: 10 }, (_, i) => ({
            name: `node-${i + 1}`,
            status: 'Ready',
            role: '',
            cpuPercent: 40.0 + i,
            memoryPercent: 50.0 + i,
          })),
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const viewMoreLink = screen.getByTestId('view-more-link');
        expect(viewMoreLink).toHaveAttribute('href');
        const href = viewMoreLink.getAttribute('href');
        expect(href?.toLowerCase()).toMatch(/nodes?/);
      });
    });

    it('should have accessible link text', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 8, total: 10 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: Array.from({ length: 10 }, (_, i) => ({
            name: `node-${i + 1}`,
            status: 'Ready',
            role: '',
            cpuPercent: 40.0 + i,
            memoryPercent: 50.0 + i,
          })),
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const viewMoreLink = screen.getByTestId('view-more-link');
        expect(viewMoreLink.textContent).toMatch(/view|more|see|all/i);
      });
    });

    it('should not display link when 5 or fewer nodes exist', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 3, total: 3 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            { name: 'node-1', status: 'Ready', role: '', cpuPercent: 40.0, memoryPercent: 50.0 },
            { name: 'node-2', status: 'Ready', role: '', cpuPercent: 45.0, memoryPercent: 55.0 },
            { name: 'node-3', status: 'Ready', role: '', cpuPercent: 50.0, memoryPercent: 60.0 },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const viewMoreLink = screen.queryByTestId('view-more-link');
        expect(viewMoreLink).not.toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should handle API fetch errors gracefully', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: null,
        isLoading: false,
        error: new Error('Network error'),
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should display error message text', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: null,
        isLoading: false,
        error: new Error('Failed to fetch'),
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage.textContent).toMatch(/error|failed|unable/i);
      });
    });

    it('should display retry button on error', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: null,
        isLoading: false,
        error: new Error('Network error'),
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry|try again/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('should retry fetching when retry button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockRefresh = vi.fn();
      vi.mocked(useOverview).mockReturnValue({
        overviewData: null,
        isLoading: false,
        error: new Error('Network error'),
        refresh: mockRefresh,
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert - Initial error state
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Act - Click retry
      const retryButton = screen.getByRole('button', { name: /retry|try again/i });
      await user.click(retryButton);

      // Assert - refresh was called
      expect(mockRefresh).toHaveBeenCalled();
    });

    it('should not show loading indicator after error', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: null,
        isLoading: false,
        error: new Error('Network error'),
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toBeInTheDocument();
      });

      const loadingIndicator = screen.queryByTestId('loading-indicator');
      expect(loadingIndicator).not.toBeInTheDocument();
    });

    it('should handle 404 errors', async () => {
      // Arrange
      const error = new Error('Not found') as ErrorWithStatus;
      error.status = 404;
      vi.mocked(useOverview).mockReturnValue({
        overviewData: null,
        isLoading: false,
        error: error,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should handle 500 errors', async () => {
      // Arrange
      const error = new Error('Internal server error') as ErrorWithStatus;
      error.status = 500;
      vi.mocked(useOverview).mockReturnValue({
        overviewData: null,
        isLoading: false,
        error: error,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have semantic HTML structure', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 1, total: 1 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            {
              name: 'node-1',
              status: 'Ready',
              role: '',
              cpuPercent: 45.5,
              memoryPercent: 62.3,
            },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const section = screen.getByRole('region');
        expect(section).toBeInTheDocument();
      });
    });

    it('should have accessible heading', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 1, total: 1 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            {
              name: 'node-1',
              status: 'Ready',
              role: '',
              cpuPercent: 45.5,
              memoryPercent: 62.3,
            },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /nodes/i });
        expect(heading).toBeInTheDocument();
      });
    });

    it('should have accessible list for node items', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 2, total: 2 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            { name: 'node-1', status: 'Ready', role: '', cpuPercent: 40.0, memoryPercent: 50.0 },
            { name: 'node-2', status: 'Ready', role: '', cpuPercent: 45.0, memoryPercent: 55.0 },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const list = screen.getByRole('list');
        expect(list).toBeInTheDocument();
      });
    });

    it('should have list items for each node', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 2, total: 2 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            { name: 'node-1', status: 'Ready', role: '', cpuPercent: 40.0, memoryPercent: 50.0 },
            { name: 'node-2', status: 'Ready', role: '', cpuPercent: 45.0, memoryPercent: 55.0 },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const listItems = screen.getAllByRole('listitem');
        expect(listItems.length).toBe(2);
      });
    });

    it('should have accessible link to nodes page', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 8, total: 10 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: Array.from({ length: 10 }, (_, i) => ({
            name: `node-${i + 1}`,
            status: 'Ready',
            role: '',
            cpuPercent: 40.0 + i,
            memoryPercent: 50.0 + i,
          })),
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /view|more|see|all/i });
        expect(link).toBeInTheDocument();
      });
    });

    it('should have proper ARIA attributes for progress bars', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 1, total: 1 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            {
              name: 'node-1',
              status: 'Ready',
              role: '',
              cpuPercent: 45.5,
              memoryPercent: 62.3,
            },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        progressBars.forEach((bar) => {
          expect(bar).toHaveAttribute('aria-valuenow');
          expect(bar).toHaveAttribute('aria-valuemin', '0');
          expect(bar).toHaveAttribute('aria-valuemax', '100');
        });
      });
    });
  });

  describe('styling and layout', () => {
    it('should have proper CSS classes', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 1, total: 1 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            {
              name: 'node-1',
              status: 'Ready',
              role: '',
              cpuPercent: 45.5,
              memoryPercent: 62.3,
            },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const component = screen.getByTestId('node-quick-view');
        expect(component.className).toBeTruthy();
      });
    });

    it('should be styled as a card/section component', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 1, total: 1 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            {
              name: 'node-1',
              status: 'Ready',
              role: '',
              cpuPercent: 45.5,
              memoryPercent: 62.3,
            },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const component = screen.getByTestId('node-quick-view');
        expect(component.className).toMatch(/rounded|shadow|bg-|p-/);
      });
    });

    it('should have proper spacing between node items', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 3, total: 3 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            { name: 'node-1', status: 'Ready', role: '', cpuPercent: 40.0, memoryPercent: 50.0 },
            { name: 'node-2', status: 'Ready', role: '', cpuPercent: 45.0, memoryPercent: 55.0 },
            { name: 'node-3', status: 'Ready', role: '', cpuPercent: 50.0, memoryPercent: 60.0 },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const nodeItems = screen.getAllByTestId('node-item');
        expect(nodeItems.length).toBe(3);
        // Each item should have spacing classes
        nodeItems.forEach((item) => {
          expect(item.className).toBeTruthy();
        });
      });
    });
  });

  describe('edge cases', () => {
    it('should handle exactly 5 nodes', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 5, total: 5 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: Array.from({ length: 5 }, (_, i) => ({
            name: `node-${i + 1}`,
            status: 'Ready',
            role: '',
            cpuPercent: 40.0 + i,
            memoryPercent: 50.0 + i,
          })),
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const nodeItems = screen.getAllByTestId('node-item');
        expect(nodeItems.length).toBe(5);
      });
    });

    it('should handle very long node names', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 1, total: 1 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            {
              name: 'very-long-node-name-that-should-be-truncated-or-handled-gracefully',
              status: 'Ready',
              role: '',
              cpuPercent: 45.5,
              memoryPercent: 62.3,
            },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const nodeName = screen.getByTestId('node-name');
        expect(nodeName).toBeInTheDocument();
        // Should handle text overflow
        expect(nodeName.className).toMatch(/truncate|overflow/);
      });
    });

    it('should handle 0% CPU usage', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 1, total: 1 },
          unhealthyPods: 0,
          avgCpuPercent: 0,
          avgMemoryPercent: 0,
          nodesList: [
            {
              name: 'node-1',
              status: 'Ready',
              role: '',
              cpuPercent: 0,
              memoryPercent: 0,
            },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        const cpuBar = progressBars[0];
        expect(cpuBar).toHaveAttribute('aria-valuenow', '0');
      });
    });

    it('should handle 100% CPU usage', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 1, total: 1 },
          unhealthyPods: 0,
          avgCpuPercent: 100,
          avgMemoryPercent: 100,
          nodesList: [
            {
              name: 'node-1',
              status: 'Ready',
              role: '',
              cpuPercent: 100,
              memoryPercent: 100,
            },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        const cpuBar = progressBars[0];
        expect(cpuBar).toHaveAttribute('aria-valuenow', '100');
      });
    });

    it('should handle mixed Ready and NotReady nodes', async () => {
      // Arrange
      vi.mocked(useOverview).mockReturnValue({
        overviewData: {
          nodes: { ready: 2, total: 4 },
          unhealthyPods: 0,
          avgCpuPercent: 45.5,
          avgMemoryPercent: 62.3,
          nodesList: [
            { name: 'ready-1', status: 'Ready', role: '', cpuPercent: 40.0, memoryPercent: 50.0 },
            { name: 'not-ready-1', status: 'NotReady', role: '', cpuPercent: 0, memoryPercent: 0 },
            { name: 'ready-2', status: 'Ready', role: '', cpuPercent: 45.0, memoryPercent: 55.0 },
            { name: 'not-ready-2', status: 'NotReady', role: '', cpuPercent: 0, memoryPercent: 0 },
          ],
        },
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        lastUpdate: new Date(),
      });

      // Act
      render(<NodeQuickView />);

      // Assert
      await waitFor(() => {
        const nodeItems = screen.getAllByTestId('node-item');
        expect(nodeItems.length).toBe(4);

        // NotReady nodes should come first
        const firstNodeName = nodeItems[0].querySelector('[data-testid="node-name"]');
        const secondNodeName = nodeItems[1].querySelector('[data-testid="node-name"]');
        expect(firstNodeName?.textContent).toMatch(/not-ready/);
        expect(secondNodeName?.textContent).toMatch(/not-ready/);
      });
    });
  });
});
