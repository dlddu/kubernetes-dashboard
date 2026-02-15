import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PodCard } from './PodCard';

// Mock StatusBadge component
vi.mock('./StatusBadge', () => ({
  StatusBadge: ({ status, testId }: { status: string; testId?: string }) => (
    <span data-testid={testId || 'status-badge'} role="status">
      {status}
    </span>
  ),
}));

describe('PodCard Component', () => {
  const mockPod = {
    name: 'test-pod',
    namespace: 'default',
    status: 'ImagePullBackOff',
    restarts: 5,
    node: 'node-1',
    age: '1h',
  };

  describe('Basic Rendering', () => {
    it('should render pod card container', () => {
      // Act
      render(<PodCard pod={mockPod} />);

      // Assert
      const podCard = screen.getByTestId('pod-card');
      expect(podCard).toBeInTheDocument();
    });

    it('should render all required information', () => {
      // Act
      render(<PodCard pod={mockPod} />);

      // Assert
      expect(screen.getByTestId('pod-name')).toBeInTheDocument();
      expect(screen.getByTestId('pod-namespace')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge')).toBeInTheDocument();
      expect(screen.getByTestId('pod-restarts')).toBeInTheDocument();
      expect(screen.getByTestId('pod-node')).toBeInTheDocument();
      expect(screen.getByTestId('pod-age')).toBeInTheDocument();
    });
  });

  describe('Pod Name Display', () => {
    it('should display pod name correctly', () => {
      // Act
      render(<PodCard pod={mockPod} />);

      // Assert
      const podName = screen.getByTestId('pod-name');
      expect(podName).toHaveTextContent('test-pod');
    });

    it('should handle long pod names', () => {
      // Arrange
      const longNamePod = {
        ...mockPod,
        name: 'very-long-pod-name-with-many-characters-that-might-overflow',
      };

      // Act
      render(<PodCard pod={longNamePod} />);

      // Assert
      const podName = screen.getByTestId('pod-name');
      expect(podName).toBeInTheDocument();
      expect(podName).toHaveTextContent(longNamePod.name);
    });

    it('should handle pod names with special characters', () => {
      // Arrange
      const specialNamePod = {
        ...mockPod,
        name: 'pod-name-123-test',
      };

      // Act
      render(<PodCard pod={specialNamePod} />);

      // Assert
      const podName = screen.getByTestId('pod-name');
      expect(podName).toHaveTextContent('pod-name-123-test');
    });
  });

  describe('Pod Namespace Display', () => {
    it('should display namespace correctly', () => {
      // Act
      render(<PodCard pod={mockPod} />);

      // Assert
      const namespace = screen.getByTestId('pod-namespace');
      expect(namespace).toHaveTextContent('default');
    });

    it('should display different namespaces', () => {
      // Arrange
      const kubeSystemPod = {
        ...mockPod,
        namespace: 'kube-system',
      };

      // Act
      render(<PodCard pod={kubeSystemPod} />);

      // Assert
      const namespace = screen.getByTestId('pod-namespace');
      expect(namespace).toHaveTextContent('kube-system');
    });
  });

  describe('Status Badge Integration', () => {
    it('should display status badge', () => {
      // Act
      render(<PodCard pod={mockPod} />);

      // Assert
      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toBeInTheDocument();
    });

    it('should pass correct status to StatusBadge', () => {
      // Act
      render(<PodCard pod={mockPod} />);

      // Assert
      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveTextContent('ImagePullBackOff');
    });

    it('should display Running status', () => {
      // Arrange
      const runningPod = {
        ...mockPod,
        status: 'Running',
      };

      // Act
      render(<PodCard pod={runningPod} />);

      // Assert
      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveTextContent('Running');
    });

    it('should display CrashLoopBackOff status', () => {
      // Arrange
      const crashPod = {
        ...mockPod,
        status: 'CrashLoopBackOff',
      };

      // Act
      render(<PodCard pod={crashPod} />);

      // Assert
      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveTextContent('CrashLoopBackOff');
    });

    it('should display Pending status', () => {
      // Arrange
      const pendingPod = {
        ...mockPod,
        status: 'Pending',
      };

      // Act
      render(<PodCard pod={pendingPod} />);

      // Assert
      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveTextContent('Pending');
    });

    it('should display Error status', () => {
      // Arrange
      const errorPod = {
        ...mockPod,
        status: 'Error',
      };

      // Act
      render(<PodCard pod={errorPod} />);

      // Assert
      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveTextContent('Error');
    });

    it('should display Succeeded status', () => {
      // Arrange
      const succeededPod = {
        ...mockPod,
        status: 'Succeeded',
      };

      // Act
      render(<PodCard pod={succeededPod} />);

      // Assert
      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveTextContent('Succeeded');
    });
  });

  describe('Restart Count Display', () => {
    it('should display restart count', () => {
      // Act
      render(<PodCard pod={mockPod} />);

      // Assert
      const restarts = screen.getByTestId('pod-restarts');
      expect(restarts).toHaveTextContent('5');
    });

    it('should display zero restarts', () => {
      // Arrange
      const noRestartPod = {
        ...mockPod,
        restarts: 0,
      };

      // Act
      render(<PodCard pod={noRestartPod} />);

      // Assert
      const restarts = screen.getByTestId('pod-restarts');
      expect(restarts).toHaveTextContent('0');
    });

    it('should highlight restarts > 10 in red', () => {
      // Arrange
      const highRestartPod = {
        ...mockPod,
        restarts: 15,
      };

      // Act
      render(<PodCard pod={highRestartPod} />);

      // Assert
      const restarts = screen.getByTestId('pod-restarts');
      expect(restarts).toBeInTheDocument();
      expect(restarts).toHaveTextContent('15');

      // Should have red/error styling
      expect(restarts.className).toMatch(/red|error|text-red/i);
    });

    it('should not highlight restarts = 10', () => {
      // Arrange
      const exactlyTenPod = {
        ...mockPod,
        restarts: 10,
      };

      // Act
      render(<PodCard pod={exactlyTenPod} />);

      // Assert
      const restarts = screen.getByTestId('pod-restarts');
      expect(restarts).toHaveTextContent('10');

      // Should NOT have red styling for exactly 10
      expect(restarts.className).not.toMatch(/red|error|text-red/i);
    });

    it('should not highlight restarts < 10', () => {
      // Arrange
      const lowRestartPod = {
        ...mockPod,
        restarts: 3,
      };

      // Act
      render(<PodCard pod={lowRestartPod} />);

      // Assert
      const restarts = screen.getByTestId('pod-restarts');
      expect(restarts).toHaveTextContent('3');

      // Should NOT have red styling
      expect(restarts.className).not.toMatch(/red|error|text-red/i);
    });

    it('should handle very high restart counts', () => {
      // Arrange
      const veryHighRestartPod = {
        ...mockPod,
        restarts: 999,
      };

      // Act
      render(<PodCard pod={veryHighRestartPod} />);

      // Assert
      const restarts = screen.getByTestId('pod-restarts');
      expect(restarts).toHaveTextContent('999');
      expect(restarts.className).toMatch(/red|error|text-red/i);
    });
  });

  describe('Node Display', () => {
    it('should display node name', () => {
      // Act
      render(<PodCard pod={mockPod} />);

      // Assert
      const node = screen.getByTestId('pod-node');
      expect(node).toHaveTextContent('node-1');
    });

    it('should display different node names', () => {
      // Arrange
      const differentNodePod = {
        ...mockPod,
        node: 'kind-control-plane',
      };

      // Act
      render(<PodCard pod={differentNodePod} />);

      // Assert
      const node = screen.getByTestId('pod-node');
      expect(node).toHaveTextContent('kind-control-plane');
    });

    it('should handle pending pods without node', () => {
      // Arrange
      const pendingPod = {
        ...mockPod,
        node: 'Pending',
        status: 'Pending',
      };

      // Act
      render(<PodCard pod={pendingPod} />);

      // Assert
      const node = screen.getByTestId('pod-node');
      expect(node).toHaveTextContent('Pending');
    });

    it('should handle empty node name', () => {
      // Arrange
      const noNodePod = {
        ...mockPod,
        node: '',
      };

      // Act
      render(<PodCard pod={noNodePod} />);

      // Assert
      const node = screen.getByTestId('pod-node');
      expect(node).toBeInTheDocument();
    });
  });

  describe('Age Display', () => {
    it('should display pod age', () => {
      // Act
      render(<PodCard pod={mockPod} />);

      // Assert
      const age = screen.getByTestId('pod-age');
      expect(age).toHaveTextContent('1h');
    });

    it('should display age in minutes', () => {
      // Arrange
      const minutesPod = {
        ...mockPod,
        age: '30m',
      };

      // Act
      render(<PodCard pod={minutesPod} />);

      // Assert
      const age = screen.getByTestId('pod-age');
      expect(age).toHaveTextContent('30m');
    });

    it('should display age in days', () => {
      // Arrange
      const daysPod = {
        ...mockPod,
        age: '3d',
      };

      // Act
      render(<PodCard pod={daysPod} />);

      // Assert
      const age = screen.getByTestId('pod-age');
      expect(age).toHaveTextContent('3d');
    });

    it('should display age in seconds', () => {
      // Arrange
      const secondsPod = {
        ...mockPod,
        age: '45s',
      };

      // Act
      render(<PodCard pod={secondsPod} />);

      // Assert
      const age = screen.getByTestId('pod-age');
      expect(age).toHaveTextContent('45s');
    });

    it('should display complex age format', () => {
      // Arrange
      const complexAgePod = {
        ...mockPod,
        age: '2h30m15s',
      };

      // Act
      render(<PodCard pod={complexAgePod} />);

      // Assert
      const age = screen.getByTestId('pod-age');
      expect(age).toHaveTextContent('2h30m15s');
    });
  });

  describe('Styling and Layout', () => {
    it('should have card styling', () => {
      // Act
      render(<PodCard pod={mockPod} />);

      // Assert
      const podCard = screen.getByTestId('pod-card');
      expect(podCard.className).toBeTruthy();
    });

    it('should be styled as a card component', () => {
      // Act
      render(<PodCard pod={mockPod} />);

      // Assert
      const podCard = screen.getByTestId('pod-card');
      // Should have typical card classes (border, padding, background, etc.)
      expect(podCard.className).toMatch(/rounded|border|bg-|p-|shadow/);
    });

    it('should have proper spacing between elements', () => {
      // Act
      render(<PodCard pod={mockPod} />);

      // Assert
      const podCard = screen.getByTestId('pod-card');
      expect(podCard).toBeInTheDocument();

      // All elements should be present
      expect(screen.getByTestId('pod-name')).toBeInTheDocument();
      expect(screen.getByTestId('pod-namespace')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible structure', () => {
      // Act
      render(<PodCard pod={mockPod} />);

      // Assert
      const podCard = screen.getByTestId('pod-card');
      expect(podCard).toBeInTheDocument();

      // Status should have role
      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveAttribute('role', 'status');
    });

    it('should have readable labels for screen readers', () => {
      // Act
      render(<PodCard pod={mockPod} />);

      // Assert
      // All information should be in the DOM for screen readers
      expect(screen.getByTestId('pod-name')).toBeInTheDocument();
      expect(screen.getByTestId('pod-namespace')).toBeInTheDocument();
      expect(screen.getByTestId('pod-restarts')).toBeInTheDocument();
      expect(screen.getByTestId('pod-node')).toBeInTheDocument();
      expect(screen.getByTestId('pod-age')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing optional fields gracefully', () => {
      // Arrange
      const minimalPod = {
        name: 'minimal-pod',
        namespace: 'default',
        status: 'Pending',
        restarts: 0,
        node: '',
        age: '1m',
      };

      // Act
      render(<PodCard pod={minimalPod} />);

      // Assert
      expect(screen.getByTestId('pod-card')).toBeInTheDocument();
    });

    it('should handle all status types', () => {
      const statuses = [
        'Running',
        'Succeeded',
        'CrashLoopBackOff',
        'ImagePullBackOff',
        'Error',
        'Failed',
        'Pending',
        'Unknown',
      ];

      statuses.forEach((status) => {
        // Arrange
        const statusPod = {
          ...mockPod,
          status,
        };

        // Act
        const { unmount } = render(<PodCard pod={statusPod} />);

        // Assert
        const statusBadge = screen.getByTestId('status-badge');
        expect(statusBadge).toHaveTextContent(status);

        unmount();
      });
    });

    it('should handle restart count boundaries', () => {
      const restartCounts = [0, 1, 10, 11, 100, 999];

      restartCounts.forEach((restarts) => {
        // Arrange
        const restartPod = {
          ...mockPod,
          restarts,
        };

        // Act
        const { unmount } = render(<PodCard pod={restartPod} />);

        // Assert
        const restartsElement = screen.getByTestId('pod-restarts');
        expect(restartsElement).toHaveTextContent(String(restarts));

        if (restarts > 10) {
          expect(restartsElement.className).toMatch(/red|error|text-red/i);
        } else {
          expect(restartsElement.className).not.toMatch(/red|error|text-red/i);
        }

        unmount();
      });
    });
  });

  describe('Data Integrity', () => {
    it('should preserve all pod data', () => {
      // Arrange
      const completePod = {
        name: 'complete-pod',
        namespace: 'dashboard-test',
        status: 'Running',
        restarts: 0,
        node: 'kind-control-plane',
        age: '2h30m',
      };

      // Act
      render(<PodCard pod={completePod} />);

      // Assert: All data should be displayed correctly
      expect(screen.getByTestId('pod-name')).toHaveTextContent('complete-pod');
      expect(screen.getByTestId('pod-namespace')).toHaveTextContent('dashboard-test');
      expect(screen.getByTestId('status-badge')).toHaveTextContent('Running');
      expect(screen.getByTestId('pod-restarts')).toHaveTextContent('0');
      expect(screen.getByTestId('pod-node')).toHaveTextContent('kind-control-plane');
      expect(screen.getByTestId('pod-age')).toHaveTextContent('2h30m');
    });

    it('should not modify input pod data', () => {
      // Arrange
      const originalPod = { ...mockPod };

      // Act
      render(<PodCard pod={mockPod} />);

      // Assert: Original pod object should not be modified
      expect(mockPod).toEqual(originalPod);
    });
  });
});
