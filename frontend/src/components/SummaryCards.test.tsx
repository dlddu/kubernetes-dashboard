import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SummaryCards } from './SummaryCards';

describe('SummaryCards', () => {
  const mockData = {
    nodes: { ready: 3, total: 3 },
    unhealthyPods: 5,
    averageCpu: 45.5,
    averageMemory: 60.2,
  };

  describe('rendering - happy path', () => {
    it('should render all 4 summary cards', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      expect(screen.getByTestId('summary-card-nodes')).toBeInTheDocument();
      expect(screen.getByTestId('summary-card-unhealthy-pods')).toBeInTheDocument();
      expect(screen.getByTestId('summary-card-cpu')).toBeInTheDocument();
      expect(screen.getByTestId('summary-card-memory')).toBeInTheDocument();
    });

    it('should display correct labels for each card', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      expect(screen.getByText(/nodes/i)).toBeInTheDocument();
      expect(screen.getByText(/unhealthy pods/i)).toBeInTheDocument();
      expect(screen.getByText(/average cpu|cpu usage/i)).toBeInTheDocument();
      expect(screen.getByText(/average memory|memory usage/i)).toBeInTheDocument();
    });
  });

  describe('nodes card', () => {
    it('should display ready and total node counts', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const nodesCard = screen.getByTestId('summary-card-nodes');
      expect(nodesCard).toHaveTextContent('3');
      expect(nodesCard).toHaveTextContent(/ready|total/i);
    });

    it('should display ratio format (ready/total)', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const nodesCard = screen.getByTestId('summary-card-nodes');
      expect(nodesCard).toHaveTextContent(/3.*\/.*3|3.*of.*3/i);
    });

    it('should highlight when nodes are not ready', () => {
      // Arrange
      const dataWithUnreadyNodes = {
        ...mockData,
        nodes: { ready: 1, total: 3 },
      };

      // Act
      render(<SummaryCards data={dataWithUnreadyNodes} />);

      // Assert
      const nodesCard = screen.getByTestId('summary-card-nodes');
      expect(nodesCard).toHaveClass(/text-yellow|text-orange|text-warning/i);
    });

    it('should show success state when all nodes are ready', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const nodesCard = screen.getByTestId('summary-card-nodes');
      expect(nodesCard).toHaveClass(/text-green|text-success/i);
    });
  });

  describe('unhealthy pods card', () => {
    it('should display unhealthy pod count', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const unhealthyCard = screen.getByTestId('summary-card-unhealthy-pods');
      expect(unhealthyCard).toHaveTextContent('5');
    });

    it('should highlight when there are unhealthy pods', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const unhealthyCard = screen.getByTestId('summary-card-unhealthy-pods');
      expect(unhealthyCard).toHaveClass(/text-red|text-error|text-danger/i);
    });

    it('should show success state when no unhealthy pods', () => {
      // Arrange
      const dataWithHealthyPods = {
        ...mockData,
        unhealthyPods: 0,
      };

      // Act
      render(<SummaryCards data={dataWithHealthyPods} />);

      // Assert
      const unhealthyCard = screen.getByTestId('summary-card-unhealthy-pods');
      expect(unhealthyCard).toHaveClass(/text-green|text-success/i);
    });
  });

  describe('CPU card', () => {
    it('should display CPU percentage', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const cpuCard = screen.getByTestId('summary-card-cpu');
      expect(cpuCard).toHaveTextContent(/45\.5|46/);
      expect(cpuCard).toHaveTextContent('%');
    });

    it('should show warning color for high CPU usage', () => {
      // Arrange
      const dataWithHighCPU = {
        ...mockData,
        averageCpu: 85.0,
      };

      // Act
      render(<SummaryCards data={dataWithHighCPU} />);

      // Assert
      const cpuCard = screen.getByTestId('summary-card-cpu');
      expect(cpuCard).toHaveClass(/text-red|text-warning|text-orange/i);
    });

    it('should show success color for normal CPU usage', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const cpuCard = screen.getByTestId('summary-card-cpu');
      expect(cpuCard).toHaveClass(/text-green|text-blue|text-success/i);
    });

    it('should include UsageBar component', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const cpuCard = screen.getByTestId('summary-card-cpu');
      const usageBar = cpuCard.querySelector('[data-testid="usage-bar"]');
      expect(usageBar).toBeInTheDocument();
    });
  });

  describe('Memory card', () => {
    it('should display Memory percentage', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const memoryCard = screen.getByTestId('summary-card-memory');
      expect(memoryCard).toHaveTextContent(/60\.2|60/);
      expect(memoryCard).toHaveTextContent('%');
    });

    it('should show warning color for high Memory usage', () => {
      // Arrange
      const dataWithHighMemory = {
        ...mockData,
        averageMemory: 90.0,
      };

      // Act
      render(<SummaryCards data={dataWithHighMemory} />);

      // Assert
      const memoryCard = screen.getByTestId('summary-card-memory');
      expect(memoryCard).toHaveClass(/text-red|text-warning|text-orange/i);
    });

    it('should show success color for normal Memory usage', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const memoryCard = screen.getByTestId('summary-card-memory');
      expect(memoryCard).toHaveClass(/text-green|text-blue|text-success/i);
    });

    it('should include UsageBar component', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const memoryCard = screen.getByTestId('summary-card-memory');
      const usageBar = memoryCard.querySelector('[data-testid="usage-bar"]');
      expect(usageBar).toBeInTheDocument();
    });
  });

  describe('responsive layout', () => {
    it('should apply 2-column grid layout', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const container = screen.getByTestId('summary-cards-container');
      expect(container).toHaveClass(/grid|grid-cols-2/);
    });

    it('should apply 4-column layout on larger screens', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const container = screen.getByTestId('summary-cards-container');
      expect(container).toHaveClass(/md:grid-cols-4|lg:grid-cols-4/);
    });
  });

  describe('edge cases', () => {
    it('should handle zero values', () => {
      // Arrange
      const zeroData = {
        nodes: { ready: 0, total: 0 },
        unhealthyPods: 0,
        averageCpu: 0,
        averageMemory: 0,
      };

      // Act
      render(<SummaryCards data={zeroData} />);

      // Assert
      expect(screen.getByTestId('summary-card-nodes')).toHaveTextContent('0');
      expect(screen.getByTestId('summary-card-unhealthy-pods')).toHaveTextContent('0');
      expect(screen.getByTestId('summary-card-cpu')).toHaveTextContent('0');
      expect(screen.getByTestId('summary-card-memory')).toHaveTextContent('0');
    });

    it('should handle very high percentages', () => {
      // Arrange
      const highData = {
        ...mockData,
        averageCpu: 99.9,
        averageMemory: 100.0,
      };

      // Act
      render(<SummaryCards data={highData} />);

      // Assert
      const cpuCard = screen.getByTestId('summary-card-cpu');
      const memoryCard = screen.getByTestId('summary-card-memory');
      expect(cpuCard).toHaveTextContent(/99\.9|100/);
      expect(memoryCard).toHaveTextContent('100');
    });

    it('should handle large node counts', () => {
      // Arrange
      const largeData = {
        ...mockData,
        nodes: { ready: 50, total: 50 },
        unhealthyPods: 150,
      };

      // Act
      render(<SummaryCards data={largeData} />);

      // Assert
      expect(screen.getByTestId('summary-card-nodes')).toHaveTextContent('50');
      expect(screen.getByTestId('summary-card-unhealthy-pods')).toHaveTextContent('150');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels for each card', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const nodesCard = screen.getByTestId('summary-card-nodes');
      const unhealthyCard = screen.getByTestId('summary-card-unhealthy-pods');
      const cpuCard = screen.getByTestId('summary-card-cpu');
      const memoryCard = screen.getByTestId('summary-card-memory');

      expect(nodesCard).toHaveAttribute('aria-label', expect.stringMatching(/node/i));
      expect(unhealthyCard).toHaveAttribute('aria-label', expect.stringMatching(/unhealthy pod/i));
      expect(cpuCard).toHaveAttribute('aria-label', expect.stringMatching(/cpu/i));
      expect(memoryCard).toHaveAttribute('aria-label', expect.stringMatching(/memory/i));
    });

    it('should use semantic HTML', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const cards = screen.getAllByRole('article');
      expect(cards).toHaveLength(4);
    });
  });

  describe('card styling', () => {
    it('should apply consistent card styling', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const cards = [
        screen.getByTestId('summary-card-nodes'),
        screen.getByTestId('summary-card-unhealthy-pods'),
        screen.getByTestId('summary-card-cpu'),
        screen.getByTestId('summary-card-memory'),
      ];

      cards.forEach(card => {
        expect(card).toHaveClass(/border|rounded|shadow|bg-white|p-4|p-6/);
      });
    });

    it('should have hover effects', () => {
      // Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const nodesCard = screen.getByTestId('summary-card-nodes');
      expect(nodesCard).toHaveClass(/hover:shadow|hover:scale/);
    });
  });
});
