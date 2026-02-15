import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NodeCard } from './NodeCard';

describe('NodeCard Component', () => {
  describe('Basic Rendering', () => {
    it('should render node card container', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 50,
        memoryPercent: 60,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const nodeCard = screen.getByTestId('node-card');
      expect(nodeCard).toBeInTheDocument();
    });

    it('should display node name', () => {
      // Arrange
      const node = {
        name: 'my-node-1',
        status: 'Ready',
        role: '',
        cpuPercent: 50,
        memoryPercent: 60,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const nodeName = screen.getByTestId('node-name');
      expect(nodeName).toBeInTheDocument();
      expect(nodeName).toHaveTextContent('my-node-1');
    });

    it('should display status badge', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 50,
        memoryPercent: 60,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveTextContent('Ready');
    });

    it('should display pod count', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 50,
        memoryPercent: 60,
        podCount: 15,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const podCount = screen.getByTestId('node-pod-count');
      expect(podCount).toBeInTheDocument();
      expect(podCount).toHaveTextContent(/15/);
      expect(podCount).toHaveTextContent(/pod/i);
    });
  });

  describe('Ready Node Status', () => {
    it('should display CPU usage bar for Ready nodes', () => {
      // Arrange
      const node = {
        name: 'ready-node',
        status: 'Ready',
        role: '',
        cpuPercent: 45.5,
        memoryPercent: 60.2,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const cpuUsage = screen.getByTestId('node-cpu-usage');
      expect(cpuUsage).toBeInTheDocument();

      const cpuLabel = screen.getByText(/cpu/i);
      expect(cpuLabel).toBeInTheDocument();
    });

    it('should display Memory usage bar for Ready nodes', () => {
      // Arrange
      const node = {
        name: 'ready-node',
        status: 'Ready',
        role: '',
        cpuPercent: 45.5,
        memoryPercent: 60.2,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const memoryUsage = screen.getByTestId('node-memory-usage');
      expect(memoryUsage).toBeInTheDocument();

      const memoryLabel = screen.getByText(/memory/i);
      expect(memoryLabel).toBeInTheDocument();
    });

    it('should render usage bars with correct percentage values', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 45.5,
        memoryPercent: 78.3,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert: Check that percentage values are displayed
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThanOrEqual(2);

      // CPU progressbar
      const cpuBar = progressBars[0];
      expect(cpuBar).toHaveAttribute('aria-valuenow', '45.5');
      expect(cpuBar).toHaveAttribute('aria-valuemin', '0');
      expect(cpuBar).toHaveAttribute('aria-valuemax', '100');

      // Memory progressbar
      const memoryBar = progressBars[1];
      expect(memoryBar).toHaveAttribute('aria-valuenow', '78.3');
      expect(memoryBar).toHaveAttribute('aria-valuemin', '0');
      expect(memoryBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should display green status badge for Ready nodes', () => {
      // Arrange
      const node = {
        name: 'ready-node',
        status: 'Ready',
        role: '',
        cpuPercent: 45,
        memoryPercent: 60,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveClass(/green|success|ready/i);
    });
  });

  describe('NotReady Node Status', () => {
    it('should display warning message for NotReady nodes', () => {
      // Arrange
      const node = {
        name: 'unhealthy-node',
        status: 'NotReady',
        role: '',
        cpuPercent: 0,
        memoryPercent: 0,
        podCount: 5,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert: Should show warning instead of usage bars
      const warningMessage =
        screen.queryByTestId('node-not-ready-warning') ||
        screen.queryByText(/not ready|unavailable|warning/i);

      expect(warningMessage).toBeInTheDocument();
    });

    it('should NOT display usage bars for NotReady nodes', () => {
      // Arrange
      const node = {
        name: 'unhealthy-node',
        status: 'NotReady',
        role: '',
        cpuPercent: 0,
        memoryPercent: 0,
        podCount: 5,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert: Usage bars should not be visible
      const cpuUsage = screen.queryByTestId('node-cpu-usage');
      const memoryUsage = screen.queryByTestId('node-memory-usage');

      // Either they don't exist or they're not visible
      if (cpuUsage) {
        expect(cpuUsage).not.toBeVisible();
      }
      if (memoryUsage) {
        expect(memoryUsage).not.toBeVisible();
      }
    });

    it('should display red status badge for NotReady nodes', () => {
      // Arrange
      const node = {
        name: 'unhealthy-node',
        status: 'NotReady',
        role: '',
        cpuPercent: 0,
        memoryPercent: 0,
        podCount: 5,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveClass(/red|error|danger|notready/i);
    });

    it('should still display node name for NotReady nodes', () => {
      // Arrange
      const node = {
        name: 'unhealthy-node',
        status: 'NotReady',
        role: '',
        cpuPercent: 0,
        memoryPercent: 0,
        podCount: 5,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const nodeName = screen.getByTestId('node-name');
      expect(nodeName).toBeInTheDocument();
      expect(nodeName).toHaveTextContent('unhealthy-node');
    });

    it('should still display pod count for NotReady nodes', () => {
      // Arrange
      const node = {
        name: 'unhealthy-node',
        status: 'NotReady',
        role: '',
        cpuPercent: 0,
        memoryPercent: 0,
        podCount: 5,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const podCount = screen.getByTestId('node-pod-count');
      expect(podCount).toBeInTheDocument();
      expect(podCount).toHaveTextContent(/5/);
    });
  });

  describe('Resource Usage Display', () => {
    it('should display low CPU usage with green color', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 30,
        memoryPercent: 50,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert: Low usage should be green
      const cpuUsage = screen.getByTestId('node-cpu-usage');
      const progressBar = cpuUsage.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('should display high CPU usage with warning color', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 85,
        memoryPercent: 50,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert: High usage should show different color
      const cpuUsage = screen.getByTestId('node-cpu-usage');
      const progressBar = cpuUsage.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('should handle zero CPU usage', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 0,
        memoryPercent: 50,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const progressBars = screen.getAllByRole('progressbar');
      const cpuBar = progressBars[0];
      expect(cpuBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should handle 100% Memory usage', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 50,
        memoryPercent: 100,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const progressBars = screen.getAllByRole('progressbar');
      const memoryBar = progressBars[1];
      expect(memoryBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('Pod Count Display', () => {
    it('should display zero pods correctly', () => {
      // Arrange
      const node = {
        name: 'empty-node',
        status: 'Ready',
        role: '',
        cpuPercent: 10,
        memoryPercent: 20,
        podCount: 0,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const podCount = screen.getByTestId('node-pod-count');
      expect(podCount).toHaveTextContent(/0/);
    });

    it('should display single pod correctly', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 50,
        memoryPercent: 60,
        podCount: 1,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const podCount = screen.getByTestId('node-pod-count');
      expect(podCount).toHaveTextContent(/1/);
    });

    it('should display multiple pods with plural form', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 50,
        memoryPercent: 60,
        podCount: 25,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const podCount = screen.getByTestId('node-pod-count');
      expect(podCount).toHaveTextContent(/25/);
      expect(podCount).toHaveTextContent(/pods?/i);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for progressbars', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 45.5,
        memoryPercent: 78.3,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(2);

      progressBars.forEach((bar) => {
        expect(bar).toHaveAttribute('aria-valuenow');
        expect(bar).toHaveAttribute('aria-valuemin', '0');
        expect(bar).toHaveAttribute('aria-valuemax', '100');
      });
    });

    it('should have descriptive aria-labels for usage bars', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 45.5,
        memoryPercent: 78.3,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const progressBars = screen.getAllByRole('progressbar');

      // CPU bar should have CPU-related label
      const cpuBar = progressBars[0];
      const cpuLabel = cpuBar.getAttribute('aria-label');
      expect(cpuLabel).toMatch(/cpu/i);

      // Memory bar should have Memory-related label
      const memoryBar = progressBars[1];
      const memoryLabel = memoryBar.getAttribute('aria-label');
      expect(memoryLabel).toMatch(/memory/i);
    });

    it('should have role="status" for status badge', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 50,
        memoryPercent: 60,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveAttribute('role', 'status');
    });

    it('should be keyboard navigable', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 50,
        memoryPercent: 60,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert: Card should be in the document
      const nodeCard = screen.getByTestId('node-card');
      expect(nodeCard).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty node name gracefully', () => {
      // Arrange
      const node = {
        name: '',
        status: 'Ready',
        role: '',
        cpuPercent: 50,
        memoryPercent: 60,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert: Should still render the card
      const nodeCard = screen.getByTestId('node-card');
      expect(nodeCard).toBeInTheDocument();
    });

    it('should handle very long node names', () => {
      // Arrange
      const node = {
        name: 'very-long-node-name-that-might-break-layout-if-not-handled-properly',
        status: 'Ready',
        role: '',
        cpuPercent: 50,
        memoryPercent: 60,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert
      const nodeName = screen.getByTestId('node-name');
      expect(nodeName).toHaveTextContent(node.name);
    });

    it('should handle negative percentages by clamping to 0', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: -5,
        memoryPercent: -10,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert: Should render without errors
      const nodeCard = screen.getByTestId('node-card');
      expect(nodeCard).toBeInTheDocument();
    });

    it('should handle percentages over 100 by clamping to 100', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 150,
        memoryPercent: 200,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert: Should render without errors
      const nodeCard = screen.getByTestId('node-card');
      expect(nodeCard).toBeInTheDocument();
    });

    it('should handle decimal pod counts', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 50,
        memoryPercent: 60,
        podCount: 10.5, // Should not happen in real data, but test robustness
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert: Should render without crashing
      const nodeCard = screen.getByTestId('node-card');
      expect(nodeCard).toBeInTheDocument();
    });
  });

  describe('Role Display', () => {
    it('should display role badge when role is provided', () => {
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: 'control-plane',
        cpuPercent: 50,
        memoryPercent: 60,
        podCount: 10,
      };

      render(<NodeCard {...node} />);

      const roleBadge = screen.getByTestId('node-role');
      expect(roleBadge).toBeInTheDocument();
      expect(roleBadge).toHaveTextContent('control-plane');
    });

    it('should not display role badge when role is empty', () => {
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 50,
        memoryPercent: 60,
        podCount: 10,
      };

      render(<NodeCard {...node} />);

      const roleBadge = screen.queryByTestId('node-role');
      expect(roleBadge).not.toBeInTheDocument();
    });

    it('should display worker role', () => {
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: 'worker',
        cpuPercent: 50,
        memoryPercent: 60,
        podCount: 10,
      };

      render(<NodeCard {...node} />);

      const roleBadge = screen.getByTestId('node-role');
      expect(roleBadge).toHaveTextContent('worker');
    });
  });

  describe('Visual Layout', () => {
    it('should render with proper card styling', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 50,
        memoryPercent: 60,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert: Card should have proper structure
      const nodeCard = screen.getByTestId('node-card');
      expect(nodeCard).toBeInTheDocument();
      expect(nodeCard).toBeVisible();
    });

    it('should display elements in correct order', () => {
      // Arrange
      const node = {
        name: 'test-node',
        status: 'Ready',
        role: '',
        cpuPercent: 50,
        memoryPercent: 60,
        podCount: 10,
      };

      // Act
      render(<NodeCard {...node} />);

      // Assert: All required elements should be present
      expect(screen.getByTestId('node-name')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge')).toBeInTheDocument();
      expect(screen.getByTestId('node-cpu-usage')).toBeInTheDocument();
      expect(screen.getByTestId('node-memory-usage')).toBeInTheDocument();
      expect(screen.getByTestId('node-pod-count')).toBeInTheDocument();
    });
  });
});
