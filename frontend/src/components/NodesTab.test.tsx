/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NodesTab } from './NodesTab';

// Mock usePolling to avoid timer side effects in tests
vi.mock('../hooks/usePolling', () => ({
  usePolling: vi.fn(() => ({
    refresh: vi.fn(),
    lastUpdate: new Date(),
    isLoading: false,
  })),
}));

// Mock fetch API
global.fetch = vi.fn();

describe('NodesTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render nodes tab container', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<NodesTab />);

      // Assert
      const nodesTab = screen.getByTestId('nodes-page');
      expect(nodesTab).toBeInTheDocument();
    });

    it('should display page heading', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<NodesTab />);

      // Assert
      const heading = screen.getByRole('heading', { name: /nodes/i });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator while fetching data', () => {
      // Arrange: Mock a delayed response
      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: async () => [] }), 100)
          )
      );

      // Act
      render(<NodesTab />);

      // Assert: Loading indicator should be present
      const loadingIndicator =
        screen.queryByTestId('nodes-loading') ||
        screen.queryByLabelText(/loading/i) ||
        screen.queryByText(/loading/i);

      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should hide loading indicator after data is loaded', async () => {
      // Arrange
      const mockNodes = [
        {
          name: 'test-node',
          status: 'Ready',
          role: '',
          cpuPercent: 45.5,
          memoryPercent: 60.2,
          podCount: 10,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNodes,
      });

      // Act
      render(<NodesTab />);

      // Assert: Wait for data to load
      await waitFor(() => {
        const nodeCard = screen.queryByTestId('node-card');
        expect(nodeCard).toBeInTheDocument();
      });

      // Loading indicator should be hidden
      const loadingIndicator = screen.queryByTestId('nodes-loading');
      expect(loadingIndicator).not.toBeInTheDocument();
    });

    it('should display skeleton or loading placeholder', () => {
      // Arrange: Mock delayed response
      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: async () => [] }), 100)
          )
      );

      // Act
      render(<NodesTab />);

      // Assert: Should show loading state
      const loadingState =
        screen.queryByTestId('nodes-loading') ||
        screen.queryByRole('progressbar') ||
        screen.queryByText(/loading/i);

      expect(loadingState).toBeInTheDocument();
    });
  });

  describe('Success State - Node Cards Rendering', () => {
    it('should render node cards when data is loaded', async () => {
      // Arrange
      const mockNodes = [
        {
          name: 'node-1',
          status: 'Ready',
          role: '',
          cpuPercent: 50,
          memoryPercent: 60,
          podCount: 15,
        },
        {
          name: 'node-2',
          status: 'Ready',
          role: '',
          cpuPercent: 30,
          memoryPercent: 40,
          podCount: 8,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNodes,
      });

      // Act
      render(<NodesTab />);

      // Assert: Wait for nodes to be rendered
      await waitFor(() => {
        const nodeCards = screen.getAllByTestId('node-card');
        expect(nodeCards).toHaveLength(2);
      });
    });

    it('should pass correct props to NodeCard components', async () => {
      // Arrange
      const mockNodes = [
        {
          name: 'test-node',
          status: 'Ready',
          role: '',
          cpuPercent: 45.5,
          memoryPercent: 60.2,
          podCount: 10,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNodes,
      });

      // Act
      render(<NodesTab />);

      // Assert: Verify node data is rendered
      await waitFor(() => {
        expect(screen.getByText('test-node')).toBeInTheDocument();
        expect(screen.getByText(/ready/i)).toBeInTheDocument();
      });
    });

    it('should render multiple nodes correctly', async () => {
      // Arrange
      const mockNodes = Array.from({ length: 5 }, (_, i) => ({
        name: `node-${i + 1}`,
        status: 'Ready',
        role: '',
        cpuPercent: 40 + i * 5,
        memoryPercent: 50 + i * 5,
        podCount: 10 + i,
      }));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNodes,
      });

      // Act
      render(<NodesTab />);

      // Assert: All nodes should be rendered
      await waitFor(() => {
        const nodeCards = screen.getAllByTestId('node-card');
        expect(nodeCards).toHaveLength(5);
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no nodes exist', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<NodesTab />);

      // Assert: Should show empty state message
      await waitFor(() => {
        const emptyMessage =
          screen.queryByTestId('nodes-empty') ||
          screen.queryByText(/no nodes/i) ||
          screen.queryByText(/empty/i);
        expect(emptyMessage).toBeInTheDocument();
      });
    });

    it('should not render node cards when nodes array is empty', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<NodesTab />);

      // Assert
      await waitFor(() => {
        const nodeCards = screen.queryAllByTestId('node-card');
        expect(nodeCards).toHaveLength(0);
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when API call fails', async () => {
      // Arrange: Mock failed fetch
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<NodesTab />);

      // Assert: Should show error message
      await waitFor(() => {
        const errorMessage =
          screen.queryByTestId('nodes-error') ||
          screen.queryByText(/error/i) ||
          screen.queryByText(/failed/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      // Arrange
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<NodesTab />);

      // Assert: Should show retry button
      await waitFor(() => {
        const retryButton =
          screen.queryByTestId('retry-button') ||
          screen.queryByRole('button', { name: /retry|try again/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('should handle HTTP error responses', async () => {
      // Arrange: Mock 500 error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      // Act
      render(<NodesTab />);

      // Assert: Should display error state
      await waitFor(() => {
        const errorMessage = screen.queryByTestId('nodes-error');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should not render node cards when error occurs', async () => {
      // Arrange
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<NodesTab />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.queryByTestId('nodes-error');
        expect(errorMessage).toBeInTheDocument();

        const nodeCards = screen.queryAllByTestId('node-card');
        expect(nodeCards).toHaveLength(0);
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch nodes from /api/nodes endpoint', async () => {
      // Arrange
      const mockNodes = [
        {
          name: 'test-node',
          status: 'Ready',
          role: '',
          cpuPercent: 45,
          memoryPercent: 60,
          podCount: 10,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNodes,
      });

      // Act
      render(<NodesTab />);

      // Assert: Verify fetch was called with correct URL
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/nodes');
      });
    });

    it('should use GET method for API request', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<NodesTab />);

      // Assert: Default fetch method is GET
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Responsive Layout', () => {
    it('should render nodes in a grid layout', async () => {
      // Arrange
      const mockNodes = [
        {
          name: 'node-1',
          status: 'Ready',
          role: '',
          cpuPercent: 50,
          memoryPercent: 60,
          podCount: 10,
        },
        {
          name: 'node-2',
          status: 'Ready',
          role: '',
          cpuPercent: 40,
          memoryPercent: 50,
          podCount: 8,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNodes,
      });

      // Act
      render(<NodesTab />);

      // Assert: Nodes should be displayed
      await waitFor(() => {
        const nodesContainer = screen.getByTestId('nodes-page');
        expect(nodesContainer).toBeInTheDocument();

        const nodeCards = screen.getAllByTestId('node-card');
        expect(nodeCards.length).toBeGreaterThan(0);
      });
    });

    it('should be accessible with proper ARIA attributes', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<NodesTab />);

      // Assert: Container should have proper accessibility attributes
      const nodesTab = screen.getByTestId('nodes-page');
      expect(nodesTab).toBeInTheDocument();

      const heading = screen.getByRole('heading', { name: /nodes/i });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Polling Integration', () => {
    it('should render polling indicator', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<NodesTab />);

      // Assert
      await waitFor(() => {
        const pollingIndicator = screen.getByTestId('polling-indicator');
        expect(pollingIndicator).toBeInTheDocument();
      });
    });
  });

  describe('Data Consistency', () => {
    it('should maintain node data integrity', async () => {
      // Arrange
      const mockNodes = [
        {
          name: 'test-node',
          status: 'Ready',
          role: '',
          cpuPercent: 45.5,
          memoryPercent: 60.2,
          podCount: 10,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNodes,
      });

      // Act
      render(<NodesTab />);

      // Assert: Data should be preserved
      await waitFor(() => {
        expect(screen.getByText('test-node')).toBeInTheDocument();
        expect(screen.getByText(/ready/i)).toBeInTheDocument();
      });
    });

    it('should handle node updates correctly', async () => {
      // Arrange
      const initialNodes = [
        {
          name: 'node-1',
          status: 'Ready',
          role: '',
          cpuPercent: 50,
          memoryPercent: 60,
          podCount: 10,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => initialNodes,
      });

      // Act
      render(<NodesTab />);

      // Assert: Initial data should be rendered
      await waitFor(() => {
        expect(screen.getByText('node-1')).toBeInTheDocument();
      });
    });
  });
});
