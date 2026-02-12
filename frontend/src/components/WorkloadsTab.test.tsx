/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WorkloadsTab } from './WorkloadsTab';

// Mock fetch globally
global.fetch = vi.fn();

describe('WorkloadsTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render workloads tab container', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<WorkloadsTab />);

      // Assert
      const workloadsTab = screen.getByTestId('workloads-tab');
      expect(workloadsTab).toBeInTheDocument();
    });

    it('should display page heading', () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<WorkloadsTab />);

      // Assert
      const heading = screen.getByRole('heading', { name: /workloads/i });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch deployments from API on mount', async () => {
      // Arrange
      const mockDeployments = [
        {
          name: 'test-deployment',
          namespace: 'default',
          replicas: 2,
          readyReplicas: 2,
          availableReplicas: 2,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDeployments,
      });

      // Act
      render(<WorkloadsTab />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/deployments');
      });
    });

    it('should fetch deployments with namespace filter when namespace is selected', async () => {
      // Arrange
      const mockDeployments = [
        {
          name: 'kube-system-deployment',
          namespace: 'kube-system',
          replicas: 1,
          readyReplicas: 1,
          availableReplicas: 1,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDeployments,
      });

      // Act
      render(<WorkloadsTab namespace="kube-system" />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/deployments?ns=kube-system');
      });
    });

    it('should display loading state while fetching', () => {
      // Arrange
      (global.fetch as any).mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      // Act
      render(<WorkloadsTab />);

      // Assert
      const loadingIndicator = screen.getByTestId('loading-indicator');
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should display error state when fetch fails', async () => {
      // Arrange
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<WorkloadsTab />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(/error|failed/i);
      });
    });

    it('should display error state when API returns non-OK status', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      // Act
      render(<WorkloadsTab />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('Deployment List Display', () => {
    it('should display deployment cards when data is loaded', async () => {
      // Arrange
      const mockDeployments = [
        {
          name: 'deployment-1',
          namespace: 'default',
          replicas: 2,
          readyReplicas: 2,
          availableReplicas: 2,
        },
        {
          name: 'deployment-2',
          namespace: 'default',
          replicas: 3,
          readyReplicas: 3,
          availableReplicas: 3,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDeployments,
      });

      // Act
      render(<WorkloadsTab />);

      // Assert
      await waitFor(() => {
        const deploymentCards = screen.getAllByTestId('deployment-card');
        expect(deploymentCards).toHaveLength(2);
      });
    });

    it('should display empty state when no deployments exist', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<WorkloadsTab />);

      // Assert
      await waitFor(() => {
        const emptyState = screen.getByTestId('empty-state');
        expect(emptyState).toBeInTheDocument();
        expect(emptyState).toHaveTextContent(/no deployments/i);
      });
    });

    it('should display correct number of deployment cards', async () => {
      // Arrange
      const mockDeployments = Array.from({ length: 5 }, (_, i) => ({
        name: `deployment-${i}`,
        namespace: 'default',
        replicas: 1,
        readyReplicas: 1,
        availableReplicas: 1,
      }));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDeployments,
      });

      // Act
      render(<WorkloadsTab />);

      // Assert
      await waitFor(() => {
        const deploymentCards = screen.getAllByTestId('deployment-card');
        expect(deploymentCards).toHaveLength(5);
      });
    });
  });

  describe('Namespace Filtering', () => {
    it('should refetch deployments when namespace prop changes', async () => {
      // Arrange
      const mockDeploymentsAll = [
        { name: 'dep-1', namespace: 'default', replicas: 1, readyReplicas: 1, availableReplicas: 1 },
        { name: 'dep-2', namespace: 'kube-system', replicas: 1, readyReplicas: 1, availableReplicas: 1 },
      ];

      const mockDeploymentsFiltered = [
        { name: 'dep-2', namespace: 'kube-system', replicas: 1, readyReplicas: 1, availableReplicas: 1 },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDeploymentsAll,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDeploymentsFiltered,
        });

      // Act
      const { rerender } = render(<WorkloadsTab />);
      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

      rerender(<WorkloadsTab namespace="kube-system" />);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenLastCalledWith('/api/deployments?ns=kube-system');
      });
    });

    it('should display only filtered deployments when namespace is selected', async () => {
      // Arrange
      const mockDeployments = [
        {
          name: 'kube-system-deployment',
          namespace: 'kube-system',
          replicas: 1,
          readyReplicas: 1,
          availableReplicas: 1,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDeployments,
      });

      // Act
      render(<WorkloadsTab namespace="kube-system" />);

      // Assert
      await waitFor(() => {
        const deploymentCards = screen.getAllByTestId('deployment-card');
        expect(deploymentCards).toHaveLength(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message on network failure', async () => {
      // Arrange
      (global.fetch as any).mockRejectedValueOnce(new Error('Failed to fetch'));

      // Act
      render(<WorkloadsTab />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toBeVisible();
      });
    });

    it('should show retry button on error', async () => {
      // Arrange
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<WorkloadsTab />);

      // Assert
      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry|try again/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('should handle API error response gracefully', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Failed to fetch deployments' }),
      });

      // Act
      render(<WorkloadsTab />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Act
      render(<WorkloadsTab />);

      // Assert
      const heading = screen.getByRole('heading', { name: /workloads/i });
      expect(heading).toBeInTheDocument();
    });

    it('should show loading indicator with proper ARIA attributes', () => {
      // Arrange
      (global.fetch as any).mockImplementationOnce(() => new Promise(() => {}));

      // Act
      render(<WorkloadsTab />);

      // Assert
      const loadingIndicator = screen.getByTestId('loading-indicator');
      expect(loadingIndicator).toHaveAttribute('aria-busy', 'true');
    });

    it('should announce error messages to screen readers', async () => {
      // Arrange
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<WorkloadsTab />);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });
});
