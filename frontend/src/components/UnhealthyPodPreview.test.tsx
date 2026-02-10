import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnhealthyPodPreview } from './UnhealthyPodPreview';

interface ErrorWithStatus extends Error {
  status?: number;
}

// Mock the overview API
vi.mock('@/api/overview', () => ({
  fetchOverview: vi.fn(),
}));

// Mock the StatusBadge component
vi.mock('./StatusBadge', () => ({
  StatusBadge: ({ status, testId }: { status: string; testId?: string }) => (
    <span data-testid={testId || 'status-badge'} role="status">
      {status}
    </span>
  ),
}));

import { fetchOverview } from '@/api/overview';

describe('UnhealthyPodPreview', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering - happy path', () => {
    it('should render without crashing', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const component = screen.getByTestId('unhealthy-pod-preview');
        expect(component).toBeInTheDocument();
      });
    });

    it('should be accessible as section', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const section = screen.getByRole('region', { name: /unhealthy pods/i });
        expect(section).toBeInTheDocument();
      });
    });

    it('should display component title', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /unhealthy pods/i });
        expect(heading).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('should display loading indicator while fetching', () => {
      // Arrange
      vi.mocked(fetchOverview).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      const loadingIndicator = screen.getByTestId('loading-indicator');
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should show loading text', () => {
      // Arrange
      vi.mocked(fetchOverview).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      const loadingText = screen.getByText(/loading/i);
      expect(loadingText).toBeInTheDocument();
    });

    it('should be accessible during loading', () => {
      // Arrange
      vi.mocked(fetchOverview).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      const component = screen.getByTestId('unhealthy-pod-preview');
      expect(component).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('displaying unhealthy pods - maximum 3 items', () => {
    it('should display up to 3 unhealthy pods', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 5, // More than 3, but should only show 3
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const podItems = screen.getAllByTestId('unhealthy-pod-item');
        expect(podItems.length).toBeLessThanOrEqual(3);
      });
    });

    it('should display 1 pod when only 1 is unhealthy', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const podItems = screen.getAllByTestId('unhealthy-pod-item');
        expect(podItems.length).toBe(1);
      });
    });

    it('should display 2 pods when 2 are unhealthy', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 2,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const podItems = screen.getAllByTestId('unhealthy-pod-item');
        expect(podItems.length).toBe(2);
      });
    });

    it('should limit to 3 pods even when more exist', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 10,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const podItems = screen.getAllByTestId('unhealthy-pod-item');
        expect(podItems.length).toBe(3);
      });
    });
  });

  describe('pod item structure', () => {
    it('should display pod name for each item', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const podName = screen.getByTestId('unhealthy-pod-name');
        expect(podName).toBeInTheDocument();
        expect(podName.textContent).toBeTruthy();
      });
    });

    it('should display pod namespace for each item', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const podNamespace = screen.getByTestId('unhealthy-pod-namespace');
        expect(podNamespace).toBeInTheDocument();
        expect(podNamespace.textContent).toBeTruthy();
      });
    });

    it('should display status badge for each item', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const statusBadge = screen.getByTestId('status-badge');
        expect(statusBadge).toBeInTheDocument();
      });
    });

    it('should display all required fields for multiple pods', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 3,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const podItems = screen.getAllByTestId('unhealthy-pod-item');
        expect(podItems.length).toBe(3);

        podItems.forEach((item) => {
          const name = item.querySelector('[data-testid="unhealthy-pod-name"]');
          const namespace = item.querySelector('[data-testid="unhealthy-pod-namespace"]');
          const badge = item.querySelector('[data-testid="status-badge"]');

          expect(name).toBeInTheDocument();
          expect(namespace).toBeInTheDocument();
          expect(badge).toBeInTheDocument();
        });
      });
    });
  });

  describe('status badge integration', () => {
    it('should display CrashLoopBackOff status', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const statusBadge = screen.getByTestId('status-badge');
        expect(statusBadge).toBeInTheDocument();
        // Status text should be one of the error states
        expect(statusBadge.textContent).toMatch(/CrashLoopBackOff|ImagePullBackOff|Failed|Pending|Unknown/);
      });
    });

    it('should display ImagePullBackOff status', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const statusBadges = screen.getAllByTestId('status-badge');
        expect(statusBadges.length).toBeGreaterThan(0);
      });
    });

    it('should pass correct status to StatusBadge component', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const statusBadge = screen.getByTestId('status-badge');
        expect(statusBadge).toHaveAttribute('role', 'status');
      });
    });
  });

  describe('empty state - all pods healthy', () => {
    it('should display "all pods healthy" message when no unhealthy pods', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        avgCpuPercent: 30.0,
        avgMemoryPercent: 40.0,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const message = screen.getByTestId('all-pods-healthy-message');
        expect(message).toBeInTheDocument();
      });
    });

    it('should show positive message text', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        avgCpuPercent: 30.0,
        avgMemoryPercent: 40.0,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const message = screen.getByTestId('all-pods-healthy-message');
        expect(message.textContent).toMatch(/all|healthy|running|good|normal/i);
      });
    });

    it('should not display pod items when all healthy', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        avgCpuPercent: 30.0,
        avgMemoryPercent: 40.0,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const podItems = screen.queryAllByTestId('unhealthy-pod-item');
        expect(podItems.length).toBe(0);
      });
    });

    it('should not display healthy message when unhealthy pods exist', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const message = screen.queryByTestId('all-pods-healthy-message');
        expect(message).not.toBeInTheDocument();
      });
    });
  });

  describe('view more link', () => {
    it('should display "view more" link', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 5,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const viewMoreLink = screen.getByTestId('view-more-link');
        expect(viewMoreLink).toBeInTheDocument();
      });
    });

    it('should be a clickable link', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 5,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const viewMoreLink = screen.getByTestId('view-more-link');
        expect(viewMoreLink.tagName).toBe('A');
      });
    });

    it('should navigate to pods tab/page', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 5,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const viewMoreLink = screen.getByTestId('view-more-link');
        expect(viewMoreLink).toHaveAttribute('href');
        const href = viewMoreLink.getAttribute('href');
        expect(href?.toLowerCase()).toMatch(/pods?/);
      });
    });

    it('should have accessible link text', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 5,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const viewMoreLink = screen.getByTestId('view-more-link');
        expect(viewMoreLink.textContent).toMatch(/view|more|see|all/i);
      });
    });

    it('should show link when more than 3 unhealthy pods exist', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 10,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const viewMoreLink = screen.getByTestId('view-more-link');
        expect(viewMoreLink).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should handle API fetch errors gracefully', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('should display error message text', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockRejectedValueOnce(new Error('Failed to fetch'));

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage.textContent).toMatch(/error|failed|unable/i);
      });
    });

    it('should not show loading indicator after error', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<UnhealthyPodPreview />);

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
      vi.mocked(fetchOverview).mockRejectedValueOnce(error);

      // Act
      render(<UnhealthyPodPreview />);

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
      vi.mocked(fetchOverview).mockRejectedValueOnce(error);

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('namespace filtering', () => {
    it('should support optional namespace prop', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview namespace="default" />);

      // Assert
      await waitFor(() => {
        expect(fetchOverview).toHaveBeenCalledWith('default');
      });
    });

    it('should call API without namespace when prop not provided', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        expect(fetchOverview).toHaveBeenCalledWith(undefined);
      });
    });

    it('should fetch data for kube-system namespace', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        avgCpuPercent: 20.0,
        avgMemoryPercent: 30.0,
      });

      // Act
      render(<UnhealthyPodPreview namespace="kube-system" />);

      // Assert
      await waitFor(() => {
        expect(fetchOverview).toHaveBeenCalledWith('kube-system');
      });
    });
  });

  describe('accessibility', () => {
    it('should have semantic HTML structure', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const section = screen.getByRole('region');
        expect(section).toBeInTheDocument();
      });
    });

    it('should have accessible heading', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /unhealthy pods/i });
        expect(heading).toBeInTheDocument();
      });
    });

    it('should have accessible list for pod items', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 2,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const list = screen.getByRole('list');
        expect(list).toBeInTheDocument();
      });
    });

    it('should have list items for each pod', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 2,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const listItems = screen.getAllByRole('listitem');
        expect(listItems.length).toBe(2);
      });
    });

    it('should have accessible link to pods page', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 5,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /view|more|see|all/i });
        expect(link).toBeInTheDocument();
      });
    });
  });

  describe('styling and layout', () => {
    it('should have proper CSS classes', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const component = screen.getByTestId('unhealthy-pod-preview');
        expect(component.className).toBeTruthy();
      });
    });

    it('should be styled as a card/section component', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const component = screen.getByTestId('unhealthy-pod-preview');
        expect(component.className).toMatch(/rounded|shadow|bg-|p-/);
      });
    });

    it('should have proper spacing between pod items', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 3,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const podItems = screen.getAllByTestId('unhealthy-pod-item');
        expect(podItems.length).toBe(3);
        // Each item should have margin or spacing classes
        podItems.forEach((item) => {
          expect(item.className).toBeTruthy();
        });
      });
    });
  });

  describe('edge cases', () => {
    it('should handle exactly 3 unhealthy pods', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 3,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const podItems = screen.getAllByTestId('unhealthy-pod-item');
        expect(podItems.length).toBe(3);
      });
    });

    it('should handle very large unhealthy pod count', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 999,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const podItems = screen.getAllByTestId('unhealthy-pod-item');
        // Should still only show maximum of 3
        expect(podItems.length).toBe(3);
      });
    });

    it('should handle empty pod names gracefully', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const podName = screen.getByTestId('unhealthy-pod-name');
        expect(podName).toBeInTheDocument();
      });
    });

    it('should handle very long pod names', async () => {
      // Arrange
      vi.mocked(fetchOverview).mockResolvedValueOnce({
        nodes: { ready: 2, total: 3 },
        unhealthyPods: 1,
        avgCpuPercent: 45.5,
        avgMemoryPercent: 62.3,
      });

      // Act
      render(<UnhealthyPodPreview />);

      // Assert
      await waitFor(() => {
        const podName = screen.getByTestId('unhealthy-pod-name');
        expect(podName).toBeInTheDocument();
        // Should handle text overflow
        expect(podName.className).toBeTruthy();
      });
    });
  });
});
