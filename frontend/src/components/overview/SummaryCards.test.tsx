import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SummaryCards } from './SummaryCards';

describe('SummaryCards', () => {
  describe('rendering - happy path', () => {
    it('should render all 4 summary cards', () => {
      // Arrange
      const overviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 2,
        averageCPUUsage: 45.5,
        averageMemoryUsage: 62.3,
      };

      // Act
      render(<SummaryCards data={overviewData} />);

      // Assert
      expect(screen.getByTestId('summary-card-nodes')).toBeInTheDocument();
      expect(screen.getByTestId('summary-card-unhealthy-pods')).toBeInTheDocument();
      expect(screen.getByTestId('summary-card-cpu')).toBeInTheDocument();
      expect(screen.getByTestId('summary-card-memory')).toBeInTheDocument();
    });

    it('should display node statistics correctly', () => {
      // Arrange
      const overviewData = {
        nodes: { ready: 5, total: 6 },
        unhealthyPods: 0,
        averageCPUUsage: 30.0,
        averageMemoryUsage: 50.0,
      };

      // Act
      render(<SummaryCards data={overviewData} />);

      // Assert
      const nodesCard = screen.getByTestId('summary-card-nodes');
      expect(nodesCard).toHaveTextContent('5');
      expect(nodesCard).toHaveTextContent('6');
      expect(nodesCard).toHaveTextContent(/nodes/i);
    });

    it('should display unhealthy pods count', () => {
      // Arrange
      const overviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 7,
        averageCPUUsage: 45.5,
        averageMemoryUsage: 62.3,
      };

      // Act
      render(<SummaryCards data={overviewData} />);

      // Assert
      const unhealthyPodsCard = screen.getByTestId('summary-card-unhealthy-pods');
      expect(unhealthyPodsCard).toHaveTextContent('7');
      expect(unhealthyPodsCard).toHaveTextContent(/unhealthy pods/i);
    });

    it('should display CPU usage percentage', () => {
      // Arrange
      const overviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCPUUsage: 67.8,
        averageMemoryUsage: 50.0,
      };

      // Act
      render(<SummaryCards data={overviewData} />);

      // Assert
      const cpuCard = screen.getByTestId('summary-card-cpu');
      expect(cpuCard).toHaveTextContent('67.8');
      expect(cpuCard).toHaveTextContent('%');
      expect(cpuCard).toHaveTextContent(/cpu|average cpu/i);
    });

    it('should display Memory usage percentage', () => {
      // Arrange
      const overviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCPUUsage: 45.5,
        averageMemoryUsage: 82.4,
      };

      // Act
      render(<SummaryCards data={overviewData} />);

      // Assert
      const memoryCard = screen.getByTestId('summary-card-memory');
      expect(memoryCard).toHaveTextContent('82.4');
      expect(memoryCard).toHaveTextContent('%');
      expect(memoryCard).toHaveTextContent(/memory|average memory/i);
    });
  });

  describe('edge cases', () => {
    it('should handle zero values', () => {
      // Arrange
      const overviewData = {
        nodes: { ready: 0, total: 0 },
        unhealthyPods: 0,
        averageCPUUsage: 0,
        averageMemoryUsage: 0,
      };

      // Act
      render(<SummaryCards data={overviewData} />);

      // Assert
      expect(screen.getByTestId('summary-card-nodes')).toHaveTextContent('0');
      expect(screen.getByTestId('summary-card-unhealthy-pods')).toHaveTextContent('0');
      expect(screen.getByTestId('summary-card-cpu')).toHaveTextContent('0');
      expect(screen.getByTestId('summary-card-memory')).toHaveTextContent('0');
    });

    it('should handle all nodes not ready', () => {
      // Arrange
      const overviewData = {
        nodes: { ready: 0, total: 5 },
        unhealthyPods: 10,
        averageCPUUsage: 0,
        averageMemoryUsage: 0,
      };

      // Act
      render(<SummaryCards data={overviewData} />);

      // Assert
      const nodesCard = screen.getByTestId('summary-card-nodes');
      expect(nodesCard).toHaveTextContent('0');
      expect(nodesCard).toHaveTextContent('5');
    });

    it('should handle 100% resource usage', () => {
      // Arrange
      const overviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCPUUsage: 100.0,
        averageMemoryUsage: 100.0,
      };

      // Act
      render(<SummaryCards data={overviewData} />);

      // Assert
      const cpuCard = screen.getByTestId('summary-card-cpu');
      const memoryCard = screen.getByTestId('summary-card-memory');
      expect(cpuCard).toHaveTextContent('100');
      expect(memoryCard).toHaveTextContent('100');
    });

    it('should handle large number of unhealthy pods', () => {
      // Arrange
      const overviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 9999,
        averageCPUUsage: 45.5,
        averageMemoryUsage: 62.3,
      };

      // Act
      render(<SummaryCards data={overviewData} />);

      // Assert
      const unhealthyPodsCard = screen.getByTestId('summary-card-unhealthy-pods');
      expect(unhealthyPodsCard).toHaveTextContent('9999');
    });

    it('should handle fractional percentages', () => {
      // Arrange
      const overviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCPUUsage: 33.333,
        averageMemoryUsage: 66.667,
      };

      // Act
      render(<SummaryCards data={overviewData} />);

      // Assert
      const cpuCard = screen.getByTestId('summary-card-cpu');
      const memoryCard = screen.getByTestId('summary-card-memory');
      expect(cpuCard).toHaveTextContent(/33\.3/);
      expect(memoryCard).toHaveTextContent(/66\.7/);
    });
  });

  describe('visual indicators', () => {
    it('should show warning indicator when many pods are unhealthy', () => {
      // Arrange
      const overviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 10,
        averageCPUUsage: 45.5,
        averageMemoryUsage: 62.3,
      };

      // Act
      render(<SummaryCards data={overviewData} />);

      // Assert
      const unhealthyPodsCard = screen.getByTestId('summary-card-unhealthy-pods');
      expect(unhealthyPodsCard.className).toMatch(/warning|alert|error/i);
    });

    it('should show success indicator when no unhealthy pods', () => {
      // Arrange
      const overviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCPUUsage: 45.5,
        averageMemoryUsage: 62.3,
      };

      // Act
      render(<SummaryCards data={overviewData} />);

      // Assert
      const unhealthyPodsCard = screen.getByTestId('summary-card-unhealthy-pods');
      expect(unhealthyPodsCard.className).toMatch(/success|healthy|ok/i);
    });

    it('should show warning when CPU usage is high', () => {
      // Arrange
      const overviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCPUUsage: 90.0,
        averageMemoryUsage: 50.0,
      };

      // Act
      render(<SummaryCards data={overviewData} />);

      // Assert
      const cpuCard = screen.getByTestId('summary-card-cpu');
      expect(cpuCard.className).toMatch(/warning|alert|high/i);
    });

    it('should show warning when Memory usage is high', () => {
      // Arrange
      const overviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCPUUsage: 50.0,
        averageMemoryUsage: 95.0,
      };

      // Act
      render(<SummaryCards data={overviewData} />);

      // Assert
      const memoryCard = screen.getByTestId('summary-card-memory');
      expect(memoryCard.className).toMatch(/warning|alert|high/i);
    });
  });

  describe('responsive layout', () => {
    it('should have grid layout class', () => {
      // Arrange
      const overviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCPUUsage: 45.5,
        averageMemoryUsage: 62.3,
      };

      // Act
      render(<SummaryCards data={overviewData} />);

      // Assert
      const container = screen.getByTestId('overview-summary-cards');
      expect(container.className).toMatch(/grid/i);
    });

    it('should have proper data-testid for container', () => {
      // Arrange
      const overviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCPUUsage: 45.5,
        averageMemoryUsage: 62.3,
      };

      // Act
      render(<SummaryCards data={overviewData} />);

      // Assert
      const container = screen.getByTestId('overview-summary-cards');
      expect(container).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels for cards', () => {
      // Arrange
      const overviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 2,
        averageCPUUsage: 45.5,
        averageMemoryUsage: 62.3,
      };

      // Act
      render(<SummaryCards data={overviewData} />);

      // Assert
      const nodesCard = screen.getByTestId('summary-card-nodes');
      const unhealthyPodsCard = screen.getByTestId('summary-card-unhealthy-pods');
      const cpuCard = screen.getByTestId('summary-card-cpu');
      const memoryCard = screen.getByTestId('summary-card-memory');

      expect(nodesCard).toHaveAttribute('aria-label', expect.any(String));
      expect(unhealthyPodsCard).toHaveAttribute('aria-label', expect.any(String));
      expect(cpuCard).toHaveAttribute('aria-label', expect.any(String));
      expect(memoryCard).toHaveAttribute('aria-label', expect.any(String));
    });

    it('should have semantic HTML structure', () => {
      // Arrange
      const overviewData = {
        nodes: { ready: 3, total: 3 },
        unhealthyPods: 0,
        averageCPUUsage: 45.5,
        averageMemoryUsage: 62.3,
      };

      // Act
      const { container } = render(<SummaryCards data={overviewData} />);

      // Assert
      const cards = container.querySelectorAll('[data-testid^="summary-card"]');
      expect(cards.length).toBe(4);
    });
  });
});
