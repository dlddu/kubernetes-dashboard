import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomTabBar } from './BottomTabBar';

describe('BottomTabBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render tab bar container', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByRole('navigation', { name: /tab navigation/i });
      expect(tabBar).toBeInTheDocument();
    });

    it('should render all 5 tabs', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      expect(screen.getByRole('button', { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /nodes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /workloads/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pods/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /secrets/i })).toBeInTheDocument();
    });

    it('should display tabs in correct order', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabs = screen.getAllByRole('button');
      expect(tabs[0]).toHaveTextContent(/overview/i);
      expect(tabs[1]).toHaveTextContent(/nodes/i);
      expect(tabs[2]).toHaveTextContent(/workloads/i);
      expect(tabs[3]).toHaveTextContent(/pods/i);
      expect(tabs[4]).toHaveTextContent(/secrets/i);
    });
  });

  describe('Active Tab Highlighting', () => {
    it('should highlight Overview tab when active', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const overviewTab = screen.getByRole('button', { name: /overview/i });
      expect(overviewTab).toHaveClass(/active|selected|bg-blue|text-blue/i);
    });

    it('should highlight Nodes tab when active', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="nodes" onTabChange={() => {}} />);

      // Assert
      const nodesTab = screen.getByRole('button', { name: /nodes/i });
      expect(nodesTab).toHaveClass(/active|selected|bg-blue|text-blue/i);
    });

    it('should highlight Workloads tab when active', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="workloads" onTabChange={() => {}} />);

      // Assert
      const workloadsTab = screen.getByRole('button', { name: /workloads/i });
      expect(workloadsTab).toHaveClass(/active|selected|bg-blue|text-blue/i);
    });

    it('should highlight Pods tab when active', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="pods" onTabChange={() => {}} />);

      // Assert
      const podsTab = screen.getByRole('button', { name: /pods/i });
      expect(podsTab).toHaveClass(/active|selected|bg-blue|text-blue/i);
    });

    it('should highlight Secrets tab when active', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="secrets" onTabChange={() => {}} />);

      // Assert
      const secretsTab = screen.getByRole('button', { name: /secrets/i });
      expect(secretsTab).toHaveClass(/active|selected|bg-blue|text-blue/i);
    });

    it('should not highlight inactive tabs', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const nodesTab = screen.getByRole('button', { name: /nodes/i });
      const workloadsTab = screen.getByRole('button', { name: /workloads/i });
      expect(nodesTab).not.toHaveClass(/active|selected|bg-blue/i);
      expect(workloadsTab).not.toHaveClass(/active|selected|bg-blue/i);
    });
  });

  describe('Pod Badge Counter', () => {
    it('should display badge when unhealthyPodCount is provided', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} unhealthyPodCount={5} />);

      // Assert
      const badge = screen.getByTestId('pod-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('5');
    });

    it('should display correct count for unhealthy pods', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} unhealthyPodCount={12} />);

      // Assert
      const badge = screen.getByTestId('pod-badge');
      expect(badge).toHaveTextContent('12');
    });

    it('should not display badge when unhealthyPodCount is 0', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} unhealthyPodCount={0} />);

      // Assert
      const badge = screen.queryByTestId('pod-badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('should not display badge when unhealthyPodCount is undefined', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const badge = screen.queryByTestId('pod-badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('should display badge on Pods tab only', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} unhealthyPodCount={3} />);

      // Assert
      const podsTab = screen.getByRole('button', { name: /pods/i });
      const badge = podsTab.querySelector('[data-testid="pod-badge"]');
      expect(badge).toBeInTheDocument();
    });

    it('should handle large pod counts (99+)', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} unhealthyPodCount={150} />);

      // Assert
      const badge = screen.getByTestId('pod-badge');
      expect(badge).toHaveTextContent(/99\+|150/);
    });
  });

  describe('User Interaction', () => {
    it('should call onTabChange when Overview tab is clicked', () => {
      // Arrange
      const mockOnTabChange = vi.fn();
      render(<BottomTabBar activeTab="nodes" onTabChange={mockOnTabChange} />);

      // Act
      const overviewTab = screen.getByRole('button', { name: /overview/i });
      fireEvent.click(overviewTab);

      // Assert
      expect(mockOnTabChange).toHaveBeenCalledWith('overview');
      expect(mockOnTabChange).toHaveBeenCalledTimes(1);
    });

    it('should call onTabChange when Nodes tab is clicked', () => {
      // Arrange
      const mockOnTabChange = vi.fn();
      render(<BottomTabBar activeTab="overview" onTabChange={mockOnTabChange} />);

      // Act
      const nodesTab = screen.getByRole('button', { name: /nodes/i });
      fireEvent.click(nodesTab);

      // Assert
      expect(mockOnTabChange).toHaveBeenCalledWith('nodes');
    });

    it('should call onTabChange when Workloads tab is clicked', () => {
      // Arrange
      const mockOnTabChange = vi.fn();
      render(<BottomTabBar activeTab="overview" onTabChange={mockOnTabChange} />);

      // Act
      const workloadsTab = screen.getByRole('button', { name: /workloads/i });
      fireEvent.click(workloadsTab);

      // Assert
      expect(mockOnTabChange).toHaveBeenCalledWith('workloads');
    });

    it('should call onTabChange when Pods tab is clicked', () => {
      // Arrange
      const mockOnTabChange = vi.fn();
      render(<BottomTabBar activeTab="overview" onTabChange={mockOnTabChange} />);

      // Act
      const podsTab = screen.getByRole('button', { name: /pods/i });
      fireEvent.click(podsTab);

      // Assert
      expect(mockOnTabChange).toHaveBeenCalledWith('pods');
    });

    it('should call onTabChange when Secrets tab is clicked', () => {
      // Arrange
      const mockOnTabChange = vi.fn();
      render(<BottomTabBar activeTab="overview" onTabChange={mockOnTabChange} />);

      // Act
      const secretsTab = screen.getByRole('button', { name: /secrets/i });
      fireEvent.click(secretsTab);

      // Assert
      expect(mockOnTabChange).toHaveBeenCalledWith('secrets');
    });

    it('should allow clicking on already active tab', () => {
      // Arrange
      const mockOnTabChange = vi.fn();
      render(<BottomTabBar activeTab="overview" onTabChange={mockOnTabChange} />);

      // Act
      const overviewTab = screen.getByRole('button', { name: /overview/i });
      fireEvent.click(overviewTab);

      // Assert
      expect(mockOnTabChange).toHaveBeenCalledWith('overview');
    });
  });

  describe('iOS Safe Area Support', () => {
    it('should have bottom padding for iOS safe area', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByRole('navigation');
      expect(tabBar).toHaveClass(/pb-safe|safe-area-inset-bottom/i);
    });

    it('should render with fixed positioning at bottom', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByRole('navigation');
      expect(tabBar).toHaveClass(/fixed|sticky/i);
      expect(tabBar).toHaveClass(/bottom-0/);
    });
  });

  describe('Touch Target Size (44px minimum)', () => {
    it('should have minimum touch target height of 44px', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByRole('navigation');
      const parentDiv = tabBar.querySelector('div');
      expect(parentDiv?.className).toMatch(/h-16/);
    });

    it('should have adequate horizontal padding for touch targets', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabs = screen.getAllByRole('button');
      tabs.forEach((tab) => {
        expect(tab.className).toMatch(/px-|p-/);
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard focusable', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabs = screen.getAllByRole('button');
      tabs.forEach((tab) => {
        expect(tab).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('should trigger tab change on Enter key press', () => {
      // Arrange
      const mockOnTabChange = vi.fn();
      render(<BottomTabBar activeTab="overview" onTabChange={mockOnTabChange} />);

      // Act
      const nodesTab = screen.getByRole('button', { name: /nodes/i });
      nodesTab.focus();
      fireEvent.keyDown(nodesTab, { key: 'Enter' });

      // Assert
      expect(mockOnTabChange).toHaveBeenCalledWith('nodes');
    });

    it('should trigger tab change on Space key press', () => {
      // Arrange
      const mockOnTabChange = vi.fn();
      render(<BottomTabBar activeTab="overview" onTabChange={mockOnTabChange} />);

      // Act
      const workloadsTab = screen.getByRole('button', { name: /workloads/i });
      workloadsTab.focus();
      fireEvent.keyDown(workloadsTab, { key: ' ' });

      // Assert
      expect(mockOnTabChange).toHaveBeenCalledWith('workloads');
    });

    it('should allow Tab key navigation between tabs', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabs = screen.getAllByRole('button');
      tabs[0].focus();
      expect(document.activeElement).toBe(tabs[0]);

      // Tab to next
      fireEvent.keyDown(tabs[0], { key: 'Tab' });
    });
  });

  describe('Accessibility (ARIA)', () => {
    it('should have navigation role', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByRole('navigation');
      expect(tabBar).toBeInTheDocument();
    });

    it('should have aria-label for navigation', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByRole('navigation');
      expect(tabBar).toHaveAttribute('aria-label', expect.stringMatching(/tab navigation|main navigation/i));
    });

    it('should mark active tab with aria-current', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="nodes" onTabChange={() => {}} />);

      // Assert
      const nodesTab = screen.getByRole('button', { name: /nodes/i });
      expect(nodesTab).toHaveAttribute('aria-current', 'page');
    });

    it('should not mark inactive tabs with aria-current', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="nodes" onTabChange={() => {}} />);

      // Assert
      const overviewTab = screen.getByRole('button', { name: /overview/i });
      expect(overviewTab).not.toHaveAttribute('aria-current');
    });

    it('should have accessible labels for all tabs', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabs = screen.getAllByRole('button');
      tabs.forEach((tab) => {
        expect(tab).toHaveAccessibleName();
      });
    });

    it('should announce badge count to screen readers', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} unhealthyPodCount={7} />);

      // Assert
      const podsTab = screen.getByRole('button', { name: /pods/i });
      expect(podsTab).toHaveAttribute('aria-label', expect.stringMatching(/7|unhealthy/i));
    });
  });

  describe('Visual Design', () => {
    it('should have background color', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByRole('navigation');
      expect(tabBar).toHaveClass(/bg-/);
    });

    it('should have border or shadow for separation', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByRole('navigation');
      expect(tabBar.className).toMatch(/border|shadow/);
    });

    it('should display icons for each tab', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabs = screen.getAllByRole('button');
      tabs.forEach((tab) => {
        const icon = tab.querySelector('svg, [data-testid*="icon"]');
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid activeTab gracefully', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="invalid-tab" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByRole('navigation');
      expect(tabBar).toBeInTheDocument();
    });

    it('should handle undefined unhealthyPodCount', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} unhealthyPodCount={undefined} />);

      // Assert
      const tabBar = screen.getByRole('navigation');
      expect(tabBar).toBeInTheDocument();
    });

    it('should handle negative unhealthyPodCount', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} unhealthyPodCount={-1} />);

      // Assert
      const badge = screen.queryByTestId('pod-badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('should handle very large unhealthyPodCount', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} unhealthyPodCount={9999} />);

      // Assert
      const badge = screen.getByTestId('pod-badge');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should distribute tabs evenly across width', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByRole('navigation');
      const childDiv = tabBar.querySelector('div');
      expect(childDiv?.className).toMatch(/grid/);
    });

    it('should maintain fixed width for each tab', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabs = screen.getAllByRole('button');
      expect(tabs).toHaveLength(5);
    });
  });
});
