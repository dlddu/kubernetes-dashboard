import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NodeQuickView } from './NodeQuickView';

describe('NodeQuickView', () => {
  const mockNodes = [
    {
      name: 'node-1',
      cpuUsage: 45.5,
      memoryUsage: 60.2,
      status: 'Ready',
    },
    {
      name: 'node-2',
      cpuUsage: 75.0,
      memoryUsage: 80.5,
      status: 'Ready',
    },
    {
      name: 'node-3',
      cpuUsage: 25.0,
      memoryUsage: 40.0,
      status: 'NotReady',
    },
  ];

  describe('rendering - happy path', () => {
    it('should render without crashing', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      const nodeQuickView = screen.getByTestId('node-quick-view');
      expect(nodeQuickView).toBeInTheDocument();
    });

    it('should display section title', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      expect(screen.getByText(/nodes|node status/i)).toBeInTheDocument();
    });

    it('should display all nodes', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      const nodeItems = screen.getAllByTestId('node-item');
      expect(nodeItems).toHaveLength(3);
    });
  });

  describe('node information display', () => {
    it('should display node names', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      expect(screen.getByText('node-1')).toBeInTheDocument();
      expect(screen.getByText('node-2')).toBeInTheDocument();
      expect(screen.getByText('node-3')).toBeInTheDocument();
    });

    it('should display node status', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      expect(screen.getAllByText('Ready')).toHaveLength(2);
      expect(screen.getByText('NotReady')).toBeInTheDocument();
    });

    it('should show status indicator with appropriate color', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      const indicators = screen.getAllByTestId('node-status-indicator');
      expect(indicators).toHaveLength(3);

      // Ready nodes should have green indicator
      expect(indicators[0]).toHaveClass(/bg-green/i);
      expect(indicators[1]).toHaveClass(/bg-green/i);

      // NotReady nodes should have red indicator
      expect(indicators[2]).toHaveClass(/bg-red|bg-orange/i);
    });
  });

  describe('usage bars', () => {
    it('should display CPU usage bar for each node', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      const cpuBars = screen.getAllByTestId('cpu-usage-bar');
      expect(cpuBars).toHaveLength(3);
    });

    it('should display Memory usage bar for each node', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      const memoryBars = screen.getAllByTestId('memory-usage-bar');
      expect(memoryBars).toHaveLength(3);
    });

    it('should show CPU percentage values', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      expect(screen.getByText('45.5%')).toBeInTheDocument();
      expect(screen.getByText('75.0%')).toBeInTheDocument();
      expect(screen.getByText('25.0%')).toBeInTheDocument();
    });

    it('should show Memory percentage values', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      expect(screen.getByText('60.2%')).toBeInTheDocument();
      expect(screen.getByText('80.5%')).toBeInTheDocument();
      expect(screen.getByText('40.0%')).toBeInTheDocument();
    });

    it('should label CPU and Memory bars', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      const nodeItem = screen.getAllByTestId('node-item')[0];
      expect(nodeItem).toHaveTextContent(/CPU/i);
      expect(nodeItem).toHaveTextContent(/Memory/i);
    });
  });

  describe('empty state', () => {
    it('should show empty state when no nodes', () => {
      // Act
      render(<NodeQuickView nodes={[]} />);

      // Assert
      const emptyMessage = screen.getByText('No nodes found');
      expect(emptyMessage).toBeInTheDocument();
    });

    it('should display helpful message in empty state', () => {
      // Act
      render(<NodeQuickView nodes={[]} />);

      // Assert
      expect(screen.getByText(/Cluster is empty. Add nodes to get started./i)).toBeInTheDocument();
    });
  });

  describe('node filtering', () => {
    it('should filter ready nodes when filter is applied', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} filter="Ready" />);

      // Assert
      const nodeItems = screen.getAllByTestId('node-item');
      expect(nodeItems).toHaveLength(2);
    });

    it('should filter not ready nodes when filter is applied', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} filter="NotReady" />);

      // Assert
      const nodeItems = screen.getAllByTestId('node-item');
      expect(nodeItems).toHaveLength(1);
    });
  });

  describe('responsive layout', () => {
    it('should display nodes in scrollable container', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      const container = screen.getByTestId('node-quick-view');
      expect(container).toHaveClass(/overflow-auto|overflow-y-auto/);
    });

    it('should handle long list of nodes', () => {
      // Arrange
      const manyNodes = Array.from({ length: 20 }, (_, i) => ({
        name: `node-${i}`,
        cpuUsage: 50,
        memoryUsage: 60,
        status: 'Ready',
      }));

      // Act
      render(<NodeQuickView nodes={manyNodes} />);

      // Assert
      const nodeItems = screen.getAllByTestId('node-item');
      expect(nodeItems).toHaveLength(20);
    });

    it('should have max-height for scrolling', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      const container = screen.getByTestId('node-list-container');
      expect(container).toHaveClass(/max-h/);
    });
  });

  describe('edge cases', () => {
    it('should handle very long node names', () => {
      // Arrange
      const nodes = [{
        name: 'very-long-node-name-that-might-overflow-the-container',
        cpuUsage: 50,
        memoryUsage: 60,
        status: 'Ready',
      }];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      const nodeName = screen.getByText(/very-long-node-name/);
      expect(nodeName).toHaveClass(/truncate/);
    });

    it('should handle zero usage values', () => {
      // Arrange
      const nodes = [{
        name: 'node-1',
        cpuUsage: 0,
        memoryUsage: 0,
        status: 'Ready',
      }];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      expect(screen.getAllByText('0.0%')).toHaveLength(2);
    });

    it('should handle very high usage values', () => {
      // Arrange
      const nodes = [{
        name: 'node-1',
        cpuUsage: 99.9,
        memoryUsage: 100.0,
        status: 'Ready',
      }];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      expect(screen.getByText('99.9%')).toBeInTheDocument();
      expect(screen.getByText('100.0%')).toBeInTheDocument();
    });

    it('should handle unknown node status', () => {
      // Arrange
      const nodes = [{
        name: 'node-1',
        cpuUsage: 50,
        memoryUsage: 60,
        status: 'Unknown',
      }];

      // Act
      render(<NodeQuickView nodes={nodes} />);

      // Assert
      expect(screen.getByText(/Unknown/i)).toBeInTheDocument();
      const indicator = screen.getByTestId('node-status-indicator');
      expect(indicator).toHaveClass(/bg-gray/i);
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      const nodeQuickView = screen.getByTestId('node-quick-view');
      expect(nodeQuickView).toHaveAttribute('aria-label', expect.stringMatching(/node/i));
    });

    it('should use semantic list elements', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
    });

    it('should have accessible usage bars', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);

      progressBars.forEach(bar => {
        expect(bar).toHaveAttribute('aria-valuenow');
        expect(bar).toHaveAttribute('aria-valuemin', '0');
        expect(bar).toHaveAttribute('aria-valuemax', '100');
      });
    });
  });

  describe('styling', () => {
    it('should have consistent card styling', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      const nodeQuickView = screen.getByTestId('node-quick-view');
      expect(nodeQuickView).toHaveClass(/border|rounded|shadow|bg-white/);
    });

    it('should have proper spacing between nodes', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      const list = screen.getByRole('list');
      expect(list).toHaveClass(/space-y|gap/);
    });

    it('should highlight nodes on hover', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      const nodeItem = screen.getAllByTestId('node-item')[0];
      expect(nodeItem).toHaveClass(/hover:bg-gray|hover:shadow/);
    });
  });

  describe('loading state', () => {
    it('should show loading skeleton when loading', () => {
      // Act
      render(<NodeQuickView nodes={[]} loading={true} />);

      // Assert
      const skeleton = screen.getByTestId('node-quick-view-skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should show 3 skeleton items by default', () => {
      // Act
      render(<NodeQuickView nodes={[]} loading={true} />);

      // Assert
      const skeletons = screen.getAllByTestId(/skeleton-item/);
      expect(skeletons).toHaveLength(3);
    });
  });

  describe('sorting', () => {
    it('should sort nodes by name alphabetically by default', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} />);

      // Assert
      const nodeItems = screen.getAllByTestId('node-item');
      const names = nodeItems.map(item => item.textContent);

      // node-1, node-2, node-3 should be in order
      expect(names[0]).toContain('node-1');
      expect(names[1]).toContain('node-2');
      expect(names[2]).toContain('node-3');
    });

    it('should support sorting by CPU usage', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} sortBy="cpu" />);

      // Assert
      const nodeItems = screen.getAllByTestId('node-item');

      // Should be sorted by CPU: node-3 (25%), node-1 (45.5%), node-2 (75%)
      expect(nodeItems[0]).toHaveTextContent('node-3');
      expect(nodeItems[1]).toHaveTextContent('node-1');
      expect(nodeItems[2]).toHaveTextContent('node-2');
    });

    it('should support sorting by Memory usage', () => {
      // Act
      render(<NodeQuickView nodes={mockNodes} sortBy="memory" />);

      // Assert
      const nodeItems = screen.getAllByTestId('node-item');

      // Should be sorted by Memory: node-3 (40%), node-1 (60.2%), node-2 (80.5%)
      expect(nodeItems[0]).toHaveTextContent('node-3');
      expect(nodeItems[1]).toHaveTextContent('node-1');
      expect(nodeItems[2]).toHaveTextContent('node-2');
    });
  });
});
