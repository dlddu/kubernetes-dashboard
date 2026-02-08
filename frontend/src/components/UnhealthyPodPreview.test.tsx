import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnhealthyPodPreview } from './UnhealthyPodPreview';

describe('UnhealthyPodPreview', () => {
  const mockPods = [
    { name: 'pod-1', namespace: 'default', status: 'CrashLoopBackOff' },
    { name: 'pod-2', namespace: 'production', status: 'Error' },
    { name: 'pod-3', namespace: 'staging', status: 'Pending' },
    { name: 'pod-4', namespace: 'default', status: 'Failed' },
    { name: 'pod-5', namespace: 'production', status: 'Unknown' },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering - happy path', () => {
    it('should render without crashing', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods.slice(0, 3)} />);

      // Assert
      const preview = screen.getByTestId('unhealthy-pod-preview');
      expect(preview).toBeInTheDocument();
    });

    it('should display section title', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods.slice(0, 3)} />);

      // Assert
      expect(screen.getByText(/unhealthy pods/i)).toBeInTheDocument();
    });
  });

  describe('pod list display', () => {
    it('should display maximum 3 pods', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods} />);

      // Assert
      const podItems = screen.getAllByTestId('unhealthy-pod-item');
      expect(podItems).toHaveLength(3);
    });

    it('should display pod name for each item', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods.slice(0, 3)} />);

      // Assert
      expect(screen.getByText('pod-1')).toBeInTheDocument();
      expect(screen.getByText('pod-2')).toBeInTheDocument();
      expect(screen.getByText('pod-3')).toBeInTheDocument();
    });

    it('should display pod namespace', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods.slice(0, 3)} />);

      // Assert
      expect(screen.getByText(/default/)).toBeInTheDocument();
      expect(screen.getByText(/production/)).toBeInTheDocument();
      expect(screen.getByText(/staging/)).toBeInTheDocument();
    });

    it('should display pod status', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods.slice(0, 3)} />);

      // Assert
      expect(screen.getByText(/CrashLoopBackOff/i)).toBeInTheDocument();
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
      expect(screen.getByText(/Pending/i)).toBeInTheDocument();
    });

    it('should show status indicator with appropriate color', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods.slice(0, 1)} />);

      // Assert
      const statusIndicator = screen.getByTestId('pod-status-indicator');
      expect(statusIndicator).toHaveClass(/bg-red|bg-orange|bg-yellow/i);
    });
  });

  describe('view all link', () => {
    it('should show "View All" link when more than 3 pods exist', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods} totalCount={5} />);

      // Assert
      const viewAllLink = screen.getByRole('link', { name: /view all|see all/i });
      expect(viewAllLink).toBeInTheDocument();
    });

    it('should not show "View All" link when 3 or fewer pods', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods.slice(0, 2)} totalCount={2} />);

      // Assert
      const viewAllLink = screen.queryByRole('link', { name: /view all/i });
      expect(viewAllLink).not.toBeInTheDocument();
    });

    it('should display total unhealthy pod count in link', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods.slice(0, 3)} totalCount={15} />);

      // Assert
      const viewAllLink = screen.getByRole('link', { name: /view all/i });
      expect(viewAllLink).toHaveTextContent(/15/);
    });

    it('should link to pods page', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods.slice(0, 3)} totalCount={5} />);

      // Assert
      const viewAllLink = screen.getByRole('link', { name: /view all/i });
      expect(viewAllLink).toHaveAttribute('href', expect.stringMatching(/pods|\/pods/i));
    });
  });

  describe('empty state', () => {
    it('should show empty state when no unhealthy pods', () => {
      // Act
      render(<UnhealthyPodPreview pods={[]} />);

      // Assert
      const emptyMessage = screen.getByText(/no unhealthy pods|all pods are healthy/i);
      expect(emptyMessage).toBeInTheDocument();
    });

    it('should display positive message in empty state', () => {
      // Act
      render(<UnhealthyPodPreview pods={[]} />);

      // Assert
      expect(screen.getByText(/healthy|running normally/i)).toBeInTheDocument();
    });

    it('should show checkmark icon in empty state', () => {
      // Act
      render(<UnhealthyPodPreview pods={[]} />);

      // Assert
      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass(/text-green|text-success/i);
    });
  });

  describe('pod status colors', () => {
    it('should use red for CrashLoopBackOff', () => {
      // Arrange
      const pods = [{ name: 'pod-1', namespace: 'default', status: 'CrashLoopBackOff' }];

      // Act
      render(<UnhealthyPodPreview pods={pods} />);

      // Assert
      const indicator = screen.getByTestId('pod-status-indicator');
      expect(indicator).toHaveClass(/bg-red/i);
    });

    it('should use red for Error/Failed', () => {
      // Arrange
      const pods = [{ name: 'pod-1', namespace: 'default', status: 'Error' }];

      // Act
      render(<UnhealthyPodPreview pods={pods} />);

      // Assert
      const indicator = screen.getByTestId('pod-status-indicator');
      expect(indicator).toHaveClass(/bg-red/i);
    });

    it('should use orange for Pending', () => {
      // Arrange
      const pods = [{ name: 'pod-1', namespace: 'default', status: 'Pending' }];

      // Act
      render(<UnhealthyPodPreview pods={pods} />);

      // Assert
      const indicator = screen.getByTestId('pod-status-indicator');
      expect(indicator).toHaveClass(/bg-orange|bg-yellow/i);
    });

    it('should use gray for Unknown', () => {
      // Arrange
      const pods = [{ name: 'pod-1', namespace: 'default', status: 'Unknown' }];

      // Act
      render(<UnhealthyPodPreview pods={pods} />);

      // Assert
      const indicator = screen.getByTestId('pod-status-indicator');
      expect(indicator).toHaveClass(/bg-gray/i);
    });
  });

  describe('user interaction', () => {
    it('should allow clicking on pod item', () => {
      // Arrange
      const onPodClick = vi.fn();

      // Act
      render(<UnhealthyPodPreview pods={mockPods.slice(0, 3)} onPodClick={onPodClick} />);

      const firstPod = screen.getAllByTestId('unhealthy-pod-item')[0];
      fireEvent.click(firstPod);

      // Assert
      expect(onPodClick).toHaveBeenCalledWith(mockPods[0]);
    });

    it('should highlight pod item on hover', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods.slice(0, 3)} />);

      // Assert
      const podItem = screen.getAllByTestId('unhealthy-pod-item')[0];
      expect(podItem).toHaveClass(/hover:bg-gray|hover:shadow/);
    });
  });

  describe('edge cases', () => {
    it('should handle very long pod names', () => {
      // Arrange
      const pods = [{
        name: 'very-long-pod-name-that-might-overflow-the-container-width',
        namespace: 'default',
        status: 'Error',
      }];

      // Act
      render(<UnhealthyPodPreview pods={pods} />);

      // Assert
      const podName = screen.getByText(/very-long-pod-name/);
      expect(podName).toHaveClass(/truncate/);
    });

    it('should handle special characters in pod names', () => {
      // Arrange
      const pods = [{
        name: 'my-app-v1.2.3-abc123',
        namespace: 'prod-us-east-1',
        status: 'Error',
      }];

      // Act
      render(<UnhealthyPodPreview pods={pods} />);

      // Assert
      expect(screen.getByText('my-app-v1.2.3-abc123')).toBeInTheDocument();
      expect(screen.getByText(/prod-us-east-1/)).toBeInTheDocument();
    });

    it('should handle exactly 3 pods without view all link', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods.slice(0, 3)} totalCount={3} />);

      // Assert
      const podItems = screen.getAllByTestId('unhealthy-pod-item');
      expect(podItems).toHaveLength(3);

      const viewAllLink = screen.queryByRole('link', { name: /view all/i });
      expect(viewAllLink).not.toBeInTheDocument();
    });

    it('should handle large total count in view all link', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods.slice(0, 3)} totalCount={999} />);

      // Assert
      const viewAllLink = screen.getByRole('link', { name: /view all/i });
      expect(viewAllLink).toHaveTextContent(/999/);
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods.slice(0, 3)} />);

      // Assert
      const preview = screen.getByTestId('unhealthy-pod-preview');
      expect(preview).toHaveAttribute('aria-label', expect.stringMatching(/unhealthy pod/i));
    });

    it('should use semantic list elements', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods.slice(0, 3)} />);

      // Assert
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
    });

    it('should be keyboard navigable', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods.slice(0, 3)} />);

      // Assert
      const podItems = screen.getAllByTestId('unhealthy-pod-item');
      podItems.forEach(item => {
        expect(item).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('styling', () => {
    it('should have consistent card styling', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods.slice(0, 3)} />);

      // Assert
      const preview = screen.getByTestId('unhealthy-pod-preview');
      expect(preview).toHaveClass(/border|rounded|shadow|bg-white/);
    });

    it('should have proper spacing between items', () => {
      // Act
      render(<UnhealthyPodPreview pods={mockPods.slice(0, 3)} />);

      // Assert
      const list = screen.getByRole('list');
      expect(list).toHaveClass(/space-y|gap/);
    });
  });

  describe('loading state', () => {
    it('should show loading skeleton when loading', () => {
      // Act
      render(<UnhealthyPodPreview pods={[]} loading={true} />);

      // Assert
      const skeleton = screen.getByTestId('unhealthy-pods-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should show 3 skeleton items', () => {
      // Act
      render(<UnhealthyPodPreview pods={[]} loading={true} />);

      // Assert
      const skeletons = screen.getAllByTestId(/skeleton-item/);
      expect(skeletons).toHaveLength(3);
    });
  });
});
