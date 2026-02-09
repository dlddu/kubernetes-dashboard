import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UnhealthyPodPreview } from './UnhealthyPodPreview';
import { UnhealthyPod } from '../../api/overview';

describe('UnhealthyPodPreview', () => {
  describe('rendering - happy path', () => {
    it('should render component with unhealthy pods', () => {
      // Arrange
      const unhealthyPods = [
        { name: 'pod-1', namespace: 'default', status: 'CrashLoopBackOff', restarts: 5 },
        { name: 'pod-2', namespace: 'default', status: 'Error', restarts: 0 },
      ];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      expect(screen.getByTestId('unhealthy-pod-preview')).toBeInTheDocument();
    });

    it('should display pod names', () => {
      // Arrange
      const unhealthyPods = [
        { name: 'my-app-pod', namespace: 'default', status: 'Error', restarts: 0 },
        { name: 'db-pod', namespace: 'production', status: 'Pending', restarts: 0 },
      ];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      expect(screen.getByText('my-app-pod')).toBeInTheDocument();
      expect(screen.getByText('db-pod')).toBeInTheDocument();
    });

    it('should display pod statuses', () => {
      // Arrange
      const unhealthyPods = [
        { name: 'pod-1', namespace: 'default', status: 'CrashLoopBackOff', restarts: 5 },
        { name: 'pod-2', namespace: 'default', status: 'Error', restarts: 0 },
      ];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      expect(screen.getByText(/CrashLoopBackOff/i)).toBeInTheDocument();
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
    });

    it('should display pod namespaces', () => {
      // Arrange
      const unhealthyPods = [
        { name: 'pod-1', namespace: 'production', status: 'Error', restarts: 0 },
        { name: 'pod-2', namespace: 'staging', status: 'Failed', restarts: 2 },
      ];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      expect(screen.getByText(/production/i)).toBeInTheDocument();
      expect(screen.getByText(/staging/i)).toBeInTheDocument();
    });

    it('should display restart count when greater than 0', () => {
      // Arrange
      const unhealthyPods = [
        { name: 'pod-1', namespace: 'default', status: 'CrashLoopBackOff', restarts: 5 },
      ];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      expect(screen.getByText(/5.*restart/i)).toBeInTheDocument();
    });
  });

  describe('maximum 3 pods limit', () => {
    it('should display only first 3 pods when more than 3 unhealthy', () => {
      // Arrange
      const unhealthyPods = [
        { name: 'pod-1', namespace: 'default', status: 'Error', restarts: 0 },
        { name: 'pod-2', namespace: 'default', status: 'Failed', restarts: 1 },
        { name: 'pod-3', namespace: 'default', status: 'Pending', restarts: 0 },
        { name: 'pod-4', namespace: 'default', status: 'CrashLoopBackOff', restarts: 5 },
        { name: 'pod-5', namespace: 'default', status: 'Error', restarts: 0 },
      ];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      const podItems = screen.getAllByTestId('unhealthy-pod-item');
      expect(podItems.length).toBe(3);
    });

    it('should show "View All" link when more than 3 pods', () => {
      // Arrange
      const unhealthyPods = [
        { name: 'pod-1', namespace: 'default', status: 'Error', restarts: 0 },
        { name: 'pod-2', namespace: 'default', status: 'Failed', restarts: 1 },
        { name: 'pod-3', namespace: 'default', status: 'Pending', restarts: 0 },
        { name: 'pod-4', namespace: 'default', status: 'CrashLoopBackOff', restarts: 5 },
      ];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      const viewAllLink = screen.getByRole('link', { name: /view all/i });
      expect(viewAllLink).toBeInTheDocument();
    });

    it('should display remaining pod count in "View All" link', () => {
      // Arrange
      const unhealthyPods = Array.from({ length: 10 }, (_, i) => ({
        name: `pod-${i}`,
        namespace: 'default',
        status: 'Error',
        restarts: 0,
      }));

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      expect(screen.getByText(/view all.*7/i)).toBeInTheDocument();
    });

    it('should not show "View All" link when 3 or fewer pods', () => {
      // Arrange
      const unhealthyPods = [
        { name: 'pod-1', namespace: 'default', status: 'Error', restarts: 0 },
        { name: 'pod-2', namespace: 'default', status: 'Failed', restarts: 1 },
      ];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      const viewAllLink = screen.queryByRole('link', { name: /view all/i });
      expect(viewAllLink).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty state message when no unhealthy pods', () => {
      // Arrange
      const unhealthyPods: UnhealthyPod[] = [];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      expect(screen.getByText(/no unhealthy pods|all pods are healthy/i)).toBeInTheDocument();
    });

    it('should display appropriate icon in empty state', () => {
      // Arrange
      const unhealthyPods: UnhealthyPod[] = [];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      const emptyState = screen.getByTestId('unhealthy-pods-empty-state');
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe('pod item interaction', () => {
    it('should be clickable to view pod details', () => {
      // Arrange
      const unhealthyPods = [
        { name: 'pod-1', namespace: 'default', status: 'Error', restarts: 0 },
      ];
      const onPodClick = vi.fn();

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} onPodClick={onPodClick} />);

      const podItem = screen.getByTestId('unhealthy-pod-item');
      fireEvent.click(podItem);

      // Assert
      expect(onPodClick).toHaveBeenCalledWith('pod-1', 'default');
    });

    it('should have hover effect on pod items', () => {
      // Arrange
      const unhealthyPods = [
        { name: 'pod-1', namespace: 'default', status: 'Error', restarts: 0 },
      ];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      const podItem = screen.getByTestId('unhealthy-pod-item');
      expect(podItem).toHaveClass(/hover:bg-|hover:shadow-|cursor-pointer/i);
    });
  });

  describe('status indicators', () => {
    it('should show error indicator for Error status', () => {
      // Arrange
      const unhealthyPods = [
        { name: 'pod-1', namespace: 'default', status: 'Error', restarts: 0 },
      ];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      const statusIndicator = screen.getByTestId('pod-status-indicator');
      expect(statusIndicator).toHaveClass(/error|red|danger/i);
    });

    it('should show warning indicator for CrashLoopBackOff', () => {
      // Arrange
      const unhealthyPods = [
        { name: 'pod-1', namespace: 'default', status: 'CrashLoopBackOff', restarts: 5 },
      ];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      const statusIndicator = screen.getByTestId('pod-status-indicator');
      expect(statusIndicator).toHaveClass(/warning|yellow|alert/i);
    });

    it('should show appropriate indicator for Pending status', () => {
      // Arrange
      const unhealthyPods = [
        { name: 'pod-1', namespace: 'default', status: 'Pending', restarts: 0 },
      ];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      const statusIndicator = screen.getByTestId('pod-status-indicator');
      expect(statusIndicator).toHaveClass(/pending|blue|info/i);
    });
  });

  describe('edge cases', () => {
    it('should handle very long pod names', () => {
      // Arrange
      const unhealthyPods = [
        {
          name: 'very-long-pod-name-that-might-break-layout-if-not-handled-properly',
          namespace: 'default',
          status: 'Error',
          restarts: 0
        },
      ];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      const podItem = screen.getByTestId('unhealthy-pod-item');
      expect(podItem.className).toMatch(/truncate|overflow-hidden|text-ellipsis/i);
    });

    it('should handle high restart counts', () => {
      // Arrange
      const unhealthyPods = [
        { name: 'pod-1', namespace: 'default', status: 'CrashLoopBackOff', restarts: 9999 },
      ];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      expect(screen.getByText(/9999.*restart/i)).toBeInTheDocument();
    });

    it('should handle pods with special characters in names', () => {
      // Arrange
      const unhealthyPods = [
        { name: 'my-app-v1.2.3-abc123', namespace: 'default', status: 'Error', restarts: 0 },
      ];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      expect(screen.getByText('my-app-v1.2.3-abc123')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      // Arrange
      const unhealthyPods = [
        { name: 'pod-1', namespace: 'default', status: 'Error', restarts: 0 },
      ];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      const preview = screen.getByTestId('unhealthy-pod-preview');
      expect(preview).toHaveAttribute('aria-label', expect.stringMatching(/unhealthy pods/i));
    });

    it('should have proper role for pod list', () => {
      // Arrange
      const unhealthyPods = [
        { name: 'pod-1', namespace: 'default', status: 'Error', restarts: 0 },
        { name: 'pod-2', namespace: 'default', status: 'Failed', restarts: 1 },
      ];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      const podList = screen.getByRole('list');
      expect(podList).toBeInTheDocument();
    });

    it('should have proper role for pod items', () => {
      // Arrange
      const unhealthyPods = [
        { name: 'pod-1', namespace: 'default', status: 'Error', restarts: 0 },
      ];

      // Act
      render(<UnhealthyPodPreview pods={unhealthyPods} />);

      // Assert
      const podItem = screen.getByRole('listitem');
      expect(podItem).toBeInTheDocument();
    });
  });
});
