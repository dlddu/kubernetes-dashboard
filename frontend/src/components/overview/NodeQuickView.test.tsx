import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NodeQuickView } from './NodeQuickView';
import { Node } from '../../api/overview';

describe('NodeQuickView', () => {
  describe('rendering - happy path', () => {
    it('should render component with node list', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 45.5, memoryUsage: 62.3, status: 'Ready' },
        { name: 'node-2', cpuUsage: 30.0, memoryUsage: 50.0, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      expect(screen.getByTestId('node-quick-view')).toBeInTheDocument();
    });

    it('should display node names', () => {
      // Arrange
      const nodes = [
        { name: 'master-node-1', cpuUsage: 45.5, memoryUsage: 62.3, status: 'Ready' },
        { name: 'worker-node-1', cpuUsage: 30.0, memoryUsage: 50.0, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      expect(screen.getByText('master-node-1')).toBeInTheDocument();
      expect(screen.getByText('worker-node-1')).toBeInTheDocument();
    });

    it('should display all nodes', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 45.5, memoryUsage: 62.3, status: 'Ready' },
        { name: 'node-2', cpuUsage: 30.0, memoryUsage: 50.0, status: 'Ready' },
        { name: 'node-3', cpuUsage: 60.0, memoryUsage: 70.0, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      const nodeItems = screen.getAllByTestId('node-item');
      expect(nodeItems.length).toBe(3);
    });
  });

  describe('usage bars', () => {
    it('should display CPU usage bar for each node', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 45.5, memoryUsage: 62.3, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      const cpuBars = screen.getAllByTestId('cpu-usage-bar');
      expect(cpuBars[0]).toBeInTheDocument();
    });

    it('should display Memory usage bar for each node', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 45.5, memoryUsage: 62.3, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      const memoryBars = screen.getAllByTestId('memory-usage-bar');
      expect(memoryBars[0]).toBeInTheDocument();
    });

    it('should display CPU usage percentage', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 67.8, memoryUsage: 50.0, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      expect(screen.getByText(/67\.8%/)).toBeInTheDocument();
    });

    it('should display Memory usage percentage', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 45.5, memoryUsage: 82.4, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      expect(screen.getByText(/82\.4%/)).toBeInTheDocument();
    });

    it('should show CPU label', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 45.5, memoryUsage: 62.3, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      expect(screen.getByText(/cpu/i)).toBeInTheDocument();
    });

    it('should show Memory label', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 45.5, memoryUsage: 62.3, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      expect(screen.getByText(/memory|mem/i)).toBeInTheDocument();
    });
  });

  describe('usage bar colors', () => {
    it('should show green bar for low CPU usage', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 30.0, memoryUsage: 50.0, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert - Check for the usage bar fill which has the color class
      const usageBarFill = screen.getAllByTestId('usage-bar-fill')[0];
      expect(usageBarFill).toHaveClass(/green/i);
    });

    it('should show yellow bar for medium CPU usage', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 60.0, memoryUsage: 50.0, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      const usageBarFill = screen.getAllByTestId('usage-bar-fill')[0];
      expect(usageBarFill).toHaveClass(/yellow/i);
    });

    it('should show red bar for high CPU usage', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 90.0, memoryUsage: 50.0, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      const usageBarFill = screen.getAllByTestId('usage-bar-fill')[0];
      expect(usageBarFill).toHaveClass(/red/i);
    });

    it('should show appropriate color for Memory usage', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 30.0, memoryUsage: 85.0, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert - Memory bar is the second usage bar (index 1)
      const usageBarFills = screen.getAllByTestId('usage-bar-fill');
      expect(usageBarFills[1]).toHaveClass(/red/i);
    });
  });

  describe('node status', () => {
    it('should display Ready status indicator', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 45.5, memoryUsage: 62.3, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      const statusIndicators = screen.getAllByTestId('node-status-indicator');
      expect(statusIndicators[0]).toHaveClass(/green/i);
    });

    it('should display NotReady status indicator', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 0, memoryUsage: 0, status: 'NotReady' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      const statusIndicators = screen.getAllByTestId('node-status-indicator');
      expect(statusIndicators[0]).toHaveClass(/red/i);
    });

    it('should display status text', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 45.5, memoryUsage: 62.3, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      expect(screen.getByText(/ready/i)).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no nodes', () => {
      // Arrange
      const nodes: Node[] = [];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      expect(screen.getByText(/no nodes available/i)).toBeInTheDocument();
    });

    it('should display appropriate icon in empty state', () => {
      // Arrange
      const nodes: Node[] = [];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      const emptyState = screen.getByTestId('nodes-empty-state');
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle zero CPU usage', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 0, memoryUsage: 50.0, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert - Check that the component renders with 0% usage
      const cpuBar = screen.getByTestId('cpu-usage-bar');
      expect(cpuBar).toBeInTheDocument();
      expect(screen.getByText(/cpu/i)).toBeInTheDocument();
    });

    it('should handle 100% CPU usage', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 100.0, memoryUsage: 50.0, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    it('should handle fractional percentages', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 33.333, memoryUsage: 66.667, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      expect(screen.getByText(/33\.3/)).toBeInTheDocument();
      expect(screen.getByText(/66\.7/)).toBeInTheDocument();
    });

    it('should handle very long node names', () => {
      // Arrange
      const nodes = [
        {
          name: 'very-long-node-name-that-might-break-layout-if-not-handled-properly',
          cpuUsage: 45.5,
          memoryUsage: 62.3,
          status: 'Ready'
        },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert - Check that the long name is displayed (truncate class is on the span, not the node-item)
      const nodeName = screen.getByText('very-long-node-name-that-might-break-layout-if-not-handled-properly');
      expect(nodeName).toBeInTheDocument();
      expect(nodeName).toHaveClass('truncate');
    });

    it('should handle many nodes', () => {
      // Arrange
      const nodes = Array.from({ length: 100 }, (_, i) => ({
        name: `node-${i}`,
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        status: 'Ready',
      }));

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      const nodeItems = screen.getAllByTestId('node-item');
      expect(nodeItems.length).toBe(100);
    });
  });

  describe('responsive layout', () => {
    it('should have scrollable container for many nodes', () => {
      // Arrange
      const nodes = Array.from({ length: 20 }, (_, i) => ({
        name: `node-${i}`,
        cpuUsage: 45.5,
        memoryUsage: 62.3,
        status: 'Ready',
      }));

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      const container = screen.getByTestId('node-quick-view');
      expect(container).toHaveClass(/overflow-y-auto|overflow-scroll/i);
    });

    it('should have proper container styling', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 45.5, memoryUsage: 62.3, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      const container = screen.getByTestId('node-quick-view');
      expect(container).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 45.5, memoryUsage: 62.3, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      const view = screen.getByTestId('node-quick-view');
      expect(view).toHaveAttribute('aria-label', expect.stringMatching(/node/i));
    });

    it('should have proper role for node list', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 45.5, memoryUsage: 62.3, status: 'Ready' },
        { name: 'node-2', cpuUsage: 30.0, memoryUsage: 50.0, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      const nodeList = screen.getByRole('list');
      expect(nodeList).toBeInTheDocument();
    });

    it('should have accessible usage bars with aria-valuenow', () => {
      // Arrange
      const nodes = [
        { name: 'node-1', cpuUsage: 45.5, memoryUsage: 62.3, status: 'Ready' },
      ];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert - Get the actual UsageBar component (role="progressbar")
      const usageBars = screen.getAllByRole('progressbar');
      expect(usageBars[0]).toHaveAttribute('aria-valuenow', '45.5');
      expect(usageBars[0]).toHaveAttribute('aria-valuemin', '0');
      expect(usageBars[0]).toHaveAttribute('aria-valuemax', '100');
    });
  });
});
