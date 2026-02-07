import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SummaryCards } from './SummaryCards';

describe('SummaryCards', () => {
  describe('rendering - happy path', () => {
    it('should render without crashing', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 3, total: 5 }}
          unhealthyPods={2}
          avgCpuUsage={45.5}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      const cards = screen.getByTestId('summary-cards');
      expect(cards).toBeInTheDocument();
    });

    it('should render all 4 cards', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 3, total: 5 }}
          unhealthyPods={2}
          avgCpuUsage={45.5}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      expect(screen.getByTestId('nodes-card')).toBeInTheDocument();
      expect(screen.getByTestId('pods-card')).toBeInTheDocument();
      expect(screen.getByTestId('cpu-card')).toBeInTheDocument();
      expect(screen.getByTestId('memory-card')).toBeInTheDocument();
    });

    it('should use grid layout with 2 columns on mobile', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 3, total: 5 }}
          unhealthyPods={2}
          avgCpuUsage={45.5}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      const container = screen.getByTestId('summary-cards');
      expect(container.className).toMatch(/grid/);
      expect(container.className).toMatch(/grid-cols-2/);
    });

    it('should expand to 4 columns on larger screens', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 3, total: 5 }}
          unhealthyPods={2}
          avgCpuUsage={45.5}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      const container = screen.getByTestId('summary-cards');
      expect(container.className).toMatch(/md:grid-cols-4|lg:grid-cols-4/);
    });
  });

  describe('nodes card', () => {
    it('should display node statistics', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 8, total: 10 }}
          unhealthyPods={0}
          avgCpuUsage={45.5}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      expect(screen.getByText(/8/)).toBeInTheDocument();
      expect(screen.getByText(/10/)).toBeInTheDocument();
    });

    it('should show "Nodes" label', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 3, total: 5 }}
          unhealthyPods={0}
          avgCpuUsage={45.5}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      expect(screen.getByText(/nodes/i)).toBeInTheDocument();
    });

    it('should display ready vs total format', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 7 }}
          unhealthyPods={0}
          avgCpuUsage={45.5}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      expect(screen.getByText(/5.*7|5\/7/)).toBeInTheDocument();
    });

    it('should handle all nodes ready', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 10, total: 10 }}
          unhealthyPods={0}
          avgCpuUsage={45.5}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      expect(screen.getByText(/10.*10|10\/10/)).toBeInTheDocument();
    });

    it('should handle no nodes ready', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 0, total: 5 }}
          unhealthyPods={0}
          avgCpuUsage={0}
          avgMemoryUsage={0}
        />
      );

      // Assert
      expect(screen.getByText(/0.*5|0\/5/)).toBeInTheDocument();
    });
  });

  describe('unhealthy pods card', () => {
    it('should display unhealthy pods count', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 5 }}
          unhealthyPods={7}
          avgCpuUsage={45.5}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('should show "Unhealthy Pods" label', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 5 }}
          unhealthyPods={3}
          avgCpuUsage={45.5}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      expect(screen.getByText(/unhealthy pods/i)).toBeInTheDocument();
    });

    it('should display zero when no unhealthy pods', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 5 }}
          unhealthyPods={0}
          avgCpuUsage={45.5}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle large numbers', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 5 }}
          unhealthyPods={999}
          avgCpuUsage={45.5}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      expect(screen.getByText('999')).toBeInTheDocument();
    });
  });

  describe('CPU usage card', () => {
    it('should display CPU usage percentage', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 5 }}
          unhealthyPods={0}
          avgCpuUsage={73.5}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      expect(screen.getByText(/73\.5%/)).toBeInTheDocument();
    });

    it('should show "CPU Usage" label', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 5 }}
          unhealthyPods={0}
          avgCpuUsage={45.5}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      expect(screen.getByText(/cpu usage/i)).toBeInTheDocument();
    });

    it('should display usage bar visualization', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 5 }}
          unhealthyPods={0}
          avgCpuUsage={85.0}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      expect(screen.getByTestId('cpu-usage-bar')).toBeInTheDocument();
    });

    it('should handle zero CPU usage', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 5 }}
          unhealthyPods={0}
          avgCpuUsage={0}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      expect(screen.getByText(/0%|0\.0%/)).toBeInTheDocument();
    });

    it('should handle high CPU usage', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 5 }}
          unhealthyPods={0}
          avgCpuUsage={99.9}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      expect(screen.getByText(/99\.9%/)).toBeInTheDocument();
    });
  });

  describe('Memory usage card', () => {
    it('should display Memory usage percentage', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 5 }}
          unhealthyPods={0}
          avgCpuUsage={45.5}
          avgMemoryUsage={81.2}
        />
      );

      // Assert
      expect(screen.getByText(/81\.2%/)).toBeInTheDocument();
    });

    it('should show "Memory Usage" label', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 5 }}
          unhealthyPods={0}
          avgCpuUsage={45.5}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      expect(screen.getByText(/memory usage/i)).toBeInTheDocument();
    });

    it('should display usage bar visualization', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 5 }}
          unhealthyPods={0}
          avgCpuUsage={45.5}
          avgMemoryUsage={75.0}
        />
      );

      // Assert
      expect(screen.getByTestId('memory-usage-bar')).toBeInTheDocument();
    });

    it('should handle zero Memory usage', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 5 }}
          unhealthyPods={0}
          avgCpuUsage={45.5}
          avgMemoryUsage={0}
        />
      );

      // Assert
      expect(screen.getByText(/0%|0\.0%/)).toBeInTheDocument();
    });

    it('should handle high Memory usage', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 5 }}
          unhealthyPods={0}
          avgCpuUsage={45.5}
          avgMemoryUsage={98.5}
        />
      );

      // Assert
      expect(screen.getByText(/98\.5%/)).toBeInTheDocument();
    });
  });

  describe('card styling', () => {
    it('should apply card styles to each card', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 5 }}
          unhealthyPods={0}
          avgCpuUsage={45.5}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      const nodesCard = screen.getByTestId('nodes-card');
      expect(nodesCard.className).toMatch(/bg-|rounded|shadow|border/);
    });

    it('should have consistent spacing between cards', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 5 }}
          unhealthyPods={0}
          avgCpuUsage={45.5}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      const container = screen.getByTestId('summary-cards');
      expect(container.className).toMatch(/gap-/);
    });
  });

  describe('edge cases', () => {
    it('should handle very large node counts', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 999, total: 1000 }}
          unhealthyPods={0}
          avgCpuUsage={45.5}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      expect(screen.getByText(/999/)).toBeInTheDocument();
      expect(screen.getByText(/1000/)).toBeInTheDocument();
    });

    it('should handle decimal CPU percentages', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 5 }}
          unhealthyPods={0}
          avgCpuUsage={45.678}
          avgMemoryUsage={62.3}
        />
      );

      // Assert
      expect(screen.getByText(/45\.6|45\.7/)).toBeInTheDocument();
    });

    it('should handle decimal Memory percentages', () => {
      // Arrange & Act
      render(
        <SummaryCards
          nodes={{ ready: 5, total: 5 }}
          unhealthyPods={0}
          avgCpuUsage={45.5}
          avgMemoryUsage={62.345}
        />
      );

      // Assert
      expect(screen.getByText(/62\.3|62\.4/)).toBeInTheDocument();
    });
  });
});
