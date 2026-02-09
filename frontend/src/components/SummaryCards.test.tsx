import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SummaryCards } from './SummaryCards';
import type { OverviewData } from '../api/overview';

describe('SummaryCards', () => {
  const mockData: OverviewData = {
    nodes: { ready: 3, total: 3 },
    unhealthyPods: 5,
    avgCpu: 45.5,
    avgMemory: 62.3,
  };

  describe('rendering - happy path', () => {
    it('should render without crashing', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const container = screen.getByTestId('summary-cards-container');
      expect(container).toBeInTheDocument();
    });

    it('should display exactly 4 summary cards', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const cards = screen.getAllByRole('article');
      expect(cards).toHaveLength(4);
    });

    it('should have accessible container with aria-live', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const container = screen.getByTestId('summary-cards-container');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Nodes card', () => {
    it('should display Nodes card with correct label', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const nodesCard = screen.getByTestId('summary-card-nodes');
      expect(nodesCard).toBeInTheDocument();
      expect(nodesCard).toHaveTextContent(/nodes/i);
    });

    it('should display ready/total format', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const nodesCard = screen.getByTestId('summary-card-nodes');
      const value = nodesCard.querySelector('[data-testid="summary-card-value"]');
      expect(value).toHaveTextContent('3/3');
    });

    it('should have article role for semantics', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const nodesCard = screen.getByTestId('summary-card-nodes');
      expect(nodesCard).toHaveAttribute('role', 'article');
    });

    it('should handle partial ready nodes', () => {
      // Arrange
      const data = { ...mockData, nodes: { ready: 2, total: 3 } };

      // Act
      render(<SummaryCards data={data} />);

      // Assert
      const nodesCard = screen.getByTestId('summary-card-nodes');
      expect(nodesCard).toHaveTextContent('2/3');
    });

    it('should handle zero nodes', () => {
      // Arrange
      const data = { ...mockData, nodes: { ready: 0, total: 0 } };

      // Act
      render(<SummaryCards data={data} />);

      // Assert
      const nodesCard = screen.getByTestId('summary-card-nodes');
      expect(nodesCard).toHaveTextContent('0/0');
    });
  });

  describe('Unhealthy Pods card', () => {
    it('should display Unhealthy Pods card with correct label', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const unhealthyCard = screen.getByTestId('summary-card-unhealthy-pods');
      expect(unhealthyCard).toBeInTheDocument();
      expect(unhealthyCard).toHaveTextContent(/unhealthy pods/i);
    });

    it('should display unhealthy pods count', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const unhealthyCard = screen.getByTestId('summary-card-unhealthy-pods');
      const value = unhealthyCard.querySelector('[data-testid="summary-card-value"]');
      expect(value).toHaveTextContent('5');
    });

    it('should handle zero unhealthy pods', () => {
      // Arrange
      const data = { ...mockData, unhealthyPods: 0 };

      // Act
      render(<SummaryCards data={data} />);

      // Assert
      const unhealthyCard = screen.getByTestId('summary-card-unhealthy-pods');
      expect(unhealthyCard).toHaveTextContent('0');
    });

    it('should handle large unhealthy pods count', () => {
      // Arrange
      const data = { ...mockData, unhealthyPods: 150 };

      // Act
      render(<SummaryCards data={data} />);

      // Assert
      const unhealthyCard = screen.getByTestId('summary-card-unhealthy-pods');
      expect(unhealthyCard).toHaveTextContent('150');
    });
  });

  describe('Avg CPU card', () => {
    it('should display Avg CPU card with correct label', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const cpuCard = screen.getByTestId('summary-card-avg-cpu');
      expect(cpuCard).toBeInTheDocument();
      expect(cpuCard).toHaveTextContent(/avg cpu/i);
    });

    it('should display CPU percentage with % symbol', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const cpuCard = screen.getByTestId('summary-card-avg-cpu');
      const value = cpuCard.querySelector('[data-testid="summary-card-value"]');
      expect(value).toHaveTextContent('45.5%');
    });

    it('should display UsageBar component', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const cpuCard = screen.getByTestId('summary-card-avg-cpu');
      const usageBar = cpuCard.querySelector('[data-testid="usage-bar"]');
      expect(usageBar).toBeInTheDocument();
      expect(usageBar).toHaveAttribute('role', 'progressbar');
    });

    it('should pass correct value to UsageBar', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const cpuCard = screen.getByTestId('summary-card-avg-cpu');
      const usageBar = cpuCard.querySelector('[role="progressbar"]');
      expect(usageBar).toHaveAttribute('aria-valuenow', '45.5');
    });

    it('should handle 0% CPU usage', () => {
      // Arrange
      const data = { ...mockData, avgCpu: 0 };

      // Act
      render(<SummaryCards data={data} />);

      // Assert
      const cpuCard = screen.getByTestId('summary-card-avg-cpu');
      expect(cpuCard).toHaveTextContent('0%');
    });

    it('should handle 100% CPU usage', () => {
      // Arrange
      const data = { ...mockData, avgCpu: 100 };

      // Act
      render(<SummaryCards data={data} />);

      // Assert
      const cpuCard = screen.getByTestId('summary-card-avg-cpu');
      expect(cpuCard).toHaveTextContent('100.0%');
    });
  });

  describe('Avg Memory card', () => {
    it('should display Avg Memory card with correct label', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const memoryCard = screen.getByTestId('summary-card-avg-memory');
      expect(memoryCard).toBeInTheDocument();
      expect(memoryCard).toHaveTextContent(/avg memory/i);
    });

    it('should display Memory percentage with % symbol', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const memoryCard = screen.getByTestId('summary-card-avg-memory');
      const value = memoryCard.querySelector('[data-testid="summary-card-value"]');
      expect(value).toHaveTextContent('62.3%');
    });

    it('should display UsageBar component', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const memoryCard = screen.getByTestId('summary-card-avg-memory');
      const usageBar = memoryCard.querySelector('[data-testid="usage-bar"]');
      expect(usageBar).toBeInTheDocument();
      expect(usageBar).toHaveAttribute('role', 'progressbar');
    });

    it('should pass correct value to UsageBar', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const memoryCard = screen.getByTestId('summary-card-avg-memory');
      const usageBar = memoryCard.querySelector('[role="progressbar"]');
      expect(usageBar).toHaveAttribute('aria-valuenow', '62.3');
    });

    it('should handle 0% Memory usage', () => {
      // Arrange
      const data = { ...mockData, avgMemory: 0 };

      // Act
      render(<SummaryCards data={data} />);

      // Assert
      const memoryCard = screen.getByTestId('summary-card-avg-memory');
      expect(memoryCard).toHaveTextContent('0%');
    });

    it('should handle 100% Memory usage', () => {
      // Arrange
      const data = { ...mockData, avgMemory: 100 };

      // Act
      render(<SummaryCards data={data} />);

      // Assert
      const memoryCard = screen.getByTestId('summary-card-avg-memory');
      expect(memoryCard).toHaveTextContent('100.0%');
    });
  });

  describe('layout', () => {
    it('should use grid layout', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const container = screen.getByTestId('summary-cards-container');
      expect(container).toHaveClass(/grid/);
    });

    it('should have 2 columns on mobile', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const container = screen.getByTestId('summary-cards-container');
      // Should have grid-cols-2 or similar mobile-first class
      expect(container).toHaveClass(/grid-cols-2/);
    });

    it('should have 4 columns on desktop', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const container = screen.getByTestId('summary-cards-container');
      // Should have responsive class like md:grid-cols-4 or lg:grid-cols-4
      expect(container.className).toMatch(/(?:md|lg):grid-cols-4/);
    });

    it('should have proper gap between cards', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const container = screen.getByTestId('summary-cards-container');
      expect(container).toHaveClass(/gap-/);
    });
  });

  describe('card styling', () => {
    it('should have consistent card styling', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const cards = screen.getAllByRole('article');
      cards.forEach((card) => {
        expect(card).toHaveClass(/border|rounded|shadow|p-/);
      });
    });

    it('should have hover effects', () => {
      // Arrange & Act
      render(<SummaryCards data={mockData} />);

      // Assert
      const cards = screen.getAllByRole('article');
      cards.forEach((card) => {
        expect(card.className).toMatch(/hover:/);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle all zero values', () => {
      // Arrange
      const data: OverviewData = {
        nodes: { ready: 0, total: 0 },
        unhealthyPods: 0,
        avgCpu: 0,
        avgMemory: 0,
      };

      // Act
      render(<SummaryCards data={data} />);

      // Assert
      const cards = screen.getAllByRole('article');
      expect(cards).toHaveLength(4);
    });

    it('should handle decimal precision for percentages', () => {
      // Arrange
      const data = {
        ...mockData,
        avgCpu: 33.333333,
        avgMemory: 66.666666,
      };

      // Act
      render(<SummaryCards data={data} />);

      // Assert
      const cpuCard = screen.getByTestId('summary-card-avg-cpu');
      const memoryCard = screen.getByTestId('summary-card-avg-memory');

      // Should format to reasonable decimal places (e.g., 33.3% not 33.333333%)
      expect(cpuCard.textContent).toMatch(/33\.\d%/);
      expect(memoryCard.textContent).toMatch(/66\.\d%/);
    });
  });
});
