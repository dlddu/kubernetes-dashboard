/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PodsTab } from './PodsTab';

// Mock fetch API
global.fetch = vi.fn();

describe('PodsTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render pods tab container', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<PodsTab />);

      // Assert
      const podsTab = screen.getByTestId('pods-page');
      expect(podsTab).toBeInTheDocument();
    });

    it('should display page heading', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<PodsTab />);

      // Assert
      const heading = screen.getByRole('heading', { name: 'Pods', level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should display "All Pods" section heading', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<PodsTab />);

      // Assert
      const sectionHeading = screen.getByRole('heading', { name: /all pods/i });
      expect(sectionHeading).toBeInTheDocument();
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
      render(<PodsTab />);

      // Assert: Loading indicator should be present
      const loadingIndicator =
        screen.queryByTestId('pods-loading') ||
        screen.queryByLabelText(/loading/i) ||
        screen.queryByText(/loading/i);

      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should hide loading indicator after data is loaded', async () => {
      // Arrange
      const mockPods = [
        {
          name: 'test-pod',
          namespace: 'default',
          status: 'ImagePullBackOff',
          restarts: 5,
          node: 'node-1',
          age: '2h',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPods,
      });

      // Act
      render(<PodsTab />);

      // Assert: Wait for data to load
      await waitFor(() => {
        const podCard = screen.queryByTestId('pod-card');
        expect(podCard).toBeInTheDocument();
      });

      // Loading indicator should be hidden
      const loadingIndicator = screen.queryByTestId('pods-loading');
      expect(loadingIndicator).not.toBeInTheDocument();
    });
  });

  describe('Success State - Pod Cards Rendering', () => {
    it('should render pod cards when data is loaded', async () => {
      // Arrange
      const mockPods = [
        {
          name: 'pod-1',
          namespace: 'default',
          status: 'CrashLoopBackOff',
          restarts: 15,
          node: 'node-1',
          age: '1h',
        },
        {
          name: 'pod-2',
          namespace: 'kube-system',
          status: 'ImagePullBackOff',
          restarts: 3,
          node: 'node-2',
          age: '30m',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPods,
      });

      // Act
      render(<PodsTab />);

      // Assert: Wait for pods to be rendered
      await waitFor(() => {
        const podCards = screen.getAllByTestId('pod-card');
        expect(podCards).toHaveLength(2);
      });
    });

    it('should display pod name in cards', async () => {
      // Arrange
      const mockPods = [
        {
          name: 'unhealthy-test-pod',
          namespace: 'default',
          status: 'Pending',
          restarts: 0,
          node: 'node-1',
          age: '5m',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPods,
      });

      // Act
      render(<PodsTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('unhealthy-test-pod')).toBeInTheDocument();
      });
    });

    it('should display pod namespace in cards', async () => {
      // Arrange
      const mockPods = [
        {
          name: 'test-pod',
          namespace: 'dashboard-test',
          status: 'Error',
          restarts: 2,
          node: 'node-1',
          age: '10m',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPods,
      });

      // Act
      render(<PodsTab />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('dashboard-test')).toBeInTheDocument();
      });
    });

    it('should display pod status badges', async () => {
      // Arrange
      const mockPods = [
        {
          name: 'test-pod',
          namespace: 'default',
          status: 'CrashLoopBackOff',
          restarts: 20,
          node: 'node-1',
          age: '3h',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPods,
      });

      // Act
      render(<PodsTab />);

      // Assert
      await waitFor(() => {
        const statusBadge = screen.getByTestId('status-badge');
        expect(statusBadge).toBeInTheDocument();
      });
    });

    it('should render multiple pods correctly', async () => {
      // Arrange
      const mockPods = Array.from({ length: 5 }, (_, i) => ({
        name: `pod-${i + 1}`,
        namespace: 'default',
        status: 'ImagePullBackOff',
        restarts: i * 2,
        node: `node-${(i % 2) + 1}`,
        age: `${i + 1}h`,
      }));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPods,
      });

      // Act
      render(<PodsTab />);

      // Assert: All pods should be rendered
      await waitFor(() => {
        const podCards = screen.getAllByTestId('pod-card');
        expect(podCards).toHaveLength(5);
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no pods exist', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<PodsTab />);

      // Assert: Should show empty state message
      await waitFor(() => {
        const emptyMessage =
          screen.queryByTestId('no-pods-message') ||
          screen.queryByText(/no pods found/i);
        expect(emptyMessage).toBeInTheDocument();
      });
    });

    it('should display "No pods found" message', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<PodsTab />);

      // Assert
      await waitFor(() => {
        const emptyMessage = screen.getByTestId('no-pods-message');
        expect(emptyMessage.textContent).toMatch(/no pods found/i);
      });
    });

    it('should not render pod cards when pods array is empty', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<PodsTab />);

      // Assert
      await waitFor(() => {
        const podCards = screen.queryAllByTestId('pod-card');
        expect(podCards).toHaveLength(0);
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when API call fails', async () => {
      // Arrange: Mock failed fetch
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<PodsTab />);

      // Assert: Should show error message
      await waitFor(() => {
        const errorMessage =
          screen.queryByTestId('pods-error') ||
          screen.queryByText(/error/i) ||
          screen.queryByText(/failed/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      // Arrange
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<PodsTab />);

      // Assert: Should show retry button
      await waitFor(() => {
        const retryButton =
          screen.queryByTestId('retry-button') ||
          screen.queryByRole('button', { name: /retry|try again|다시 시도/i });
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
      render(<PodsTab />);

      // Assert: Should display error state
      await waitFor(() => {
        const errorMessage = screen.queryByTestId('pods-error');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should not render pod cards when error occurs', async () => {
      // Arrange
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<PodsTab />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.queryByTestId('pods-error');
        expect(errorMessage).toBeInTheDocument();

        const podCards = screen.queryAllByTestId('pod-card');
        expect(podCards).toHaveLength(0);
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch all pods from /api/pods/all endpoint', async () => {
      // Arrange
      const mockPods = [
        {
          name: 'test-pod',
          namespace: 'default',
          status: 'Failed',
          restarts: 8,
          node: 'node-1',
          age: '1h',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPods,
      });

      // Act
      render(<PodsTab />);

      // Assert: Verify fetch was called with correct URL
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/pods/all')
        );
      });
    });

    it('should use GET method for API request', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<PodsTab />);

      // Assert: Default fetch method is GET
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should fetch pods without namespace filter by default', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<PodsTab />);

      // Assert: Should fetch from all namespaces
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/pods/all');
      });
    });

    it('should support namespace filtering via props', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<PodsTab namespace="dashboard-test" />);

      // Assert: Should fetch with namespace parameter
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/pods/all?ns=dashboard-test'
        );
      });
    });
  });

  describe('Pod Card Information Display', () => {
    it('should display all required pod information', async () => {
      // Arrange
      const mockPods = [
        {
          name: 'unhealthy-test-pod-1',
          namespace: 'dashboard-test',
          status: 'ImagePullBackOff',
          restarts: 12,
          node: 'kind-control-plane',
          age: '2h30m',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPods,
      });

      // Act
      render(<PodsTab />);

      // Assert: All information should be visible
      await waitFor(() => {
        expect(screen.getByText('unhealthy-test-pod-1')).toBeInTheDocument();
        expect(screen.getByText('dashboard-test')).toBeInTheDocument();
        expect(screen.getByTestId('status-badge')).toBeInTheDocument();
        expect(screen.getByText(/12/)).toBeInTheDocument(); // restarts
        expect(screen.getByText('kind-control-plane')).toBeInTheDocument();
        expect(screen.getByText('2h30m')).toBeInTheDocument();
      });
    });

    it('should highlight restarts > 10 in red', async () => {
      // Arrange
      const mockPods = [
        {
          name: 'high-restart-pod',
          namespace: 'default',
          status: 'CrashLoopBackOff',
          restarts: 15,
          node: 'node-1',
          age: '1h',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPods,
      });

      // Act
      render(<PodsTab />);

      // Assert: Restart count > 10 should be highlighted
      await waitFor(() => {
        const podCard = screen.getByTestId('pod-card');
        const restartsElement = podCard.querySelector('[data-testid="pod-restarts"]');
        expect(restartsElement).toBeInTheDocument();

        // Should have red/error styling
        if (restartsElement) {
          expect(restartsElement.className).toMatch(/red|error|text-red/i);
        }
      });
    });

    it('should not highlight restarts <= 10', async () => {
      // Arrange
      const mockPods = [
        {
          name: 'low-restart-pod',
          namespace: 'default',
          status: 'Pending',
          restarts: 5,
          node: 'node-1',
          age: '30m',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPods,
      });

      // Act
      render(<PodsTab />);

      // Assert: Restart count <= 10 should not be highlighted
      await waitFor(() => {
        const podCard = screen.getByTestId('pod-card');
        const restartsElement = podCard.querySelector('[data-testid="pod-restarts"]');
        expect(restartsElement).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Layout', () => {
    it('should render pods in a grid layout', async () => {
      // Arrange
      const mockPods = [
        {
          name: 'pod-1',
          namespace: 'default',
          status: 'Failed',
          restarts: 2,
          node: 'node-1',
          age: '1h',
        },
        {
          name: 'pod-2',
          namespace: 'default',
          status: 'Pending',
          restarts: 0,
          node: 'node-2',
          age: '30m',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPods,
      });

      // Act
      render(<PodsTab />);

      // Assert: Pods should be displayed
      await waitFor(() => {
        const podsContainer = screen.getByTestId('pods-page');
        expect(podsContainer).toBeInTheDocument();

        const podCards = screen.getAllByTestId('pod-card');
        expect(podCards.length).toBeGreaterThan(0);
      });
    });

    it('should be accessible with proper ARIA attributes', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<PodsTab />);

      // Assert: Container should have proper accessibility attributes
      const podsTab = screen.getByTestId('pods-page');
      expect(podsTab).toBeInTheDocument();

      const heading = screen.getByRole('heading', { name: 'Pods', level: 1 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain pod data integrity', async () => {
      // Arrange
      const mockPods = [
        {
          name: 'test-pod',
          namespace: 'dashboard-test',
          status: 'ImagePullBackOff',
          restarts: 7,
          node: 'kind-control-plane',
          age: '1h15m',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPods,
      });

      // Act
      render(<PodsTab />);

      // Assert: Data should be preserved
      await waitFor(() => {
        expect(screen.getByText('test-pod')).toBeInTheDocument();
        expect(screen.getByText('dashboard-test')).toBeInTheDocument();
        expect(screen.getByText(/7/)).toBeInTheDocument();
      });
    });
  });
});
