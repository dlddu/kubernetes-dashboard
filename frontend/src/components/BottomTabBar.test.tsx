/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomTabBar } from './BottomTabBar';

describe('BottomTabBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render bottom tab bar container', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar).toBeInTheDocument();
    });

    it('should render all 5 tabs', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabs = screen.getAllByTestId(/tab-button-/);
      expect(tabs).toHaveLength(5);
    });

    it('should render Overview tab', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const overviewTab = screen.getByTestId('tab-button-overview');
      expect(overviewTab).toBeInTheDocument();
      expect(overviewTab).toHaveTextContent(/overview/i);
    });

    it('should render Nodes tab', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const nodesTab = screen.getByTestId('tab-button-nodes');
      expect(nodesTab).toBeInTheDocument();
      expect(nodesTab).toHaveTextContent(/nodes/i);
    });

    it('should render Workloads tab', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const workloadsTab = screen.getByTestId('tab-button-workloads');
      expect(workloadsTab).toBeInTheDocument();
      expect(workloadsTab).toHaveTextContent(/workloads/i);
    });

    it('should render Pods tab', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const podsTab = screen.getByTestId('tab-button-pods');
      expect(podsTab).toBeInTheDocument();
      expect(podsTab).toHaveTextContent(/pods/i);
    });

    it('should render Secrets tab', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const secretsTab = screen.getByTestId('tab-button-secrets');
      expect(secretsTab).toBeInTheDocument();
      expect(secretsTab).toHaveTextContent(/secrets/i);
    });
  });

  describe('Active Tab Highlighting', () => {
    it('should highlight Overview tab when active', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const overviewTab = screen.getByTestId('tab-button-overview');
      expect(overviewTab).toHaveClass(/active|selected|bg-blue/);
    });

    it('should highlight Nodes tab when active', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="nodes" onTabChange={() => {}} />);

      // Assert
      const nodesTab = screen.getByTestId('tab-button-nodes');
      expect(nodesTab).toHaveClass(/active|selected|bg-blue/);
    });

    it('should highlight Workloads tab when active', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="workloads" onTabChange={() => {}} />);

      // Assert
      const workloadsTab = screen.getByTestId('tab-button-workloads');
      expect(workloadsTab).toHaveClass(/active|selected|bg-blue/);
    });

    it('should highlight Pods tab when active', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="pods" onTabChange={() => {}} />);

      // Assert
      const podsTab = screen.getByTestId('tab-button-pods');
      expect(podsTab).toHaveClass(/active|selected|bg-blue/);
    });

    it('should highlight Secrets tab when active', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="secrets" onTabChange={() => {}} />);

      // Assert
      const secretsTab = screen.getByTestId('tab-button-secrets');
      expect(secretsTab).toHaveClass(/active|selected|bg-blue/);
    });

    it('should not highlight inactive tabs', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const nodesTab = screen.getByTestId('tab-button-nodes');
      expect(nodesTab).not.toHaveClass(/active|selected|bg-blue/);
    });

    it('should only highlight one tab at a time', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="pods" onTabChange={() => {}} />);

      // Assert
      const tabs = screen.getAllByTestId(/tab-button-/);
      const activeTabs = tabs.filter((tab) =>
        tab.className.match(/active|selected|bg-blue/)
      );
      expect(activeTabs).toHaveLength(1);
    });
  });

  describe('Click Events', () => {
    it('should call onTabChange when Overview tab is clicked', () => {
      // Arrange
      const handleTabChange = vi.fn();
      render(<BottomTabBar activeTab="pods" onTabChange={handleTabChange} />);

      // Act
      const overviewTab = screen.getByTestId('tab-button-overview');
      fireEvent.click(overviewTab);

      // Assert
      expect(handleTabChange).toHaveBeenCalledWith('overview');
    });

    it('should call onTabChange when Nodes tab is clicked', () => {
      // Arrange
      const handleTabChange = vi.fn();
      render(<BottomTabBar activeTab="overview" onTabChange={handleTabChange} />);

      // Act
      const nodesTab = screen.getByTestId('tab-button-nodes');
      fireEvent.click(nodesTab);

      // Assert
      expect(handleTabChange).toHaveBeenCalledWith('nodes');
    });

    it('should call onTabChange when Workloads tab is clicked', () => {
      // Arrange
      const handleTabChange = vi.fn();
      render(<BottomTabBar activeTab="overview" onTabChange={handleTabChange} />);

      // Act
      const workloadsTab = screen.getByTestId('tab-button-workloads');
      fireEvent.click(workloadsTab);

      // Assert
      expect(handleTabChange).toHaveBeenCalledWith('workloads');
    });

    it('should call onTabChange when Pods tab is clicked', () => {
      // Arrange
      const handleTabChange = vi.fn();
      render(<BottomTabBar activeTab="overview" onTabChange={handleTabChange} />);

      // Act
      const podsTab = screen.getByTestId('tab-button-pods');
      fireEvent.click(podsTab);

      // Assert
      expect(handleTabChange).toHaveBeenCalledWith('pods');
    });

    it('should call onTabChange when Secrets tab is clicked', () => {
      // Arrange
      const handleTabChange = vi.fn();
      render(<BottomTabBar activeTab="overview" onTabChange={handleTabChange} />);

      // Act
      const secretsTab = screen.getByTestId('tab-button-secrets');
      fireEvent.click(secretsTab);

      // Assert
      expect(handleTabChange).toHaveBeenCalledWith('secrets');
    });

    it('should call onTabChange exactly once per click', () => {
      // Arrange
      const handleTabChange = vi.fn();
      render(<BottomTabBar activeTab="overview" onTabChange={handleTabChange} />);

      // Act
      const nodesTab = screen.getByTestId('tab-button-nodes');
      fireEvent.click(nodesTab);

      // Assert
      expect(handleTabChange).toHaveBeenCalledTimes(1);
    });

    it('should allow clicking the active tab', () => {
      // Arrange
      const handleTabChange = vi.fn();
      render(<BottomTabBar activeTab="overview" onTabChange={handleTabChange} />);

      // Act
      const overviewTab = screen.getByTestId('tab-button-overview');
      fireEvent.click(overviewTab);

      // Assert
      expect(handleTabChange).toHaveBeenCalledWith('overview');
    });
  });

  describe('Badge Display', () => {
    it('should display badge on Pods tab when unhealthyPodCount > 0', () => {
      // Arrange & Act
      render(
        <BottomTabBar
          activeTab="overview"
          onTabChange={() => {}}
          unhealthyPodCount={5}
        />
      );

      // Assert
      const badge = screen.getByTestId('pods-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('5');
    });

    it('should not display badge when unhealthyPodCount is 0', () => {
      // Arrange & Act
      render(
        <BottomTabBar
          activeTab="overview"
          onTabChange={() => {}}
          unhealthyPodCount={0}
        />
      );

      // Assert
      const badge = screen.queryByTestId('pods-badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('should not display badge when unhealthyPodCount is undefined', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const badge = screen.queryByTestId('pods-badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('should display badge with correct count when unhealthyPodCount is 1', () => {
      // Arrange & Act
      render(
        <BottomTabBar
          activeTab="overview"
          onTabChange={() => {}}
          unhealthyPodCount={1}
        />
      );

      // Assert
      const badge = screen.getByTestId('pods-badge');
      expect(badge).toHaveTextContent('1');
    });

    it('should display badge with correct count when unhealthyPodCount is large', () => {
      // Arrange & Act
      render(
        <BottomTabBar
          activeTab="overview"
          onTabChange={() => {}}
          unhealthyPodCount={99}
        />
      );

      // Assert
      const badge = screen.getByTestId('pods-badge');
      expect(badge).toHaveTextContent('99');
    });

    it('should display badge only on Pods tab, not other tabs', () => {
      // Arrange & Act
      render(
        <BottomTabBar
          activeTab="overview"
          onTabChange={() => {}}
          unhealthyPodCount={5}
        />
      );

      // Assert
      const overviewBadge = screen.queryByTestId('overview-badge');
      const nodesBadge = screen.queryByTestId('nodes-badge');
      const workloadsBadge = screen.queryByTestId('workloads-badge');
      const secretsBadge = screen.queryByTestId('secrets-badge');

      expect(overviewBadge).not.toBeInTheDocument();
      expect(nodesBadge).not.toBeInTheDocument();
      expect(workloadsBadge).not.toBeInTheDocument();
      expect(secretsBadge).not.toBeInTheDocument();
    });

    it('should style badge with high visibility (red background)', () => {
      // Arrange & Act
      render(
        <BottomTabBar
          activeTab="overview"
          onTabChange={() => {}}
          unhealthyPodCount={5}
        />
      );

      // Assert
      const badge = screen.getByTestId('pods-badge');
      expect(badge).toHaveClass(/red|error|bg-red/);
    });
  });

  describe('Touch Target Size', () => {
    it('should have touch targets at least 44px height for each tab', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabs = screen.getAllByTestId(/tab-button-/);
      tabs.forEach((tab) => {
        const styles = window.getComputedStyle(tab);
        const height = parseInt(styles.height);
        expect(height).toBeGreaterThanOrEqual(44);
      });
    });

    it('should have adequate padding for touch interactions', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const overviewTab = screen.getByTestId('tab-button-overview');
      expect(overviewTab).toHaveClass(/p-|py-|px-/);
    });
  });

  describe('iOS Safe Area', () => {
    it('should have bottom padding for iOS safe area', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar).toHaveClass(/pb-|safe-area-inset-bottom/);
    });

    it('should apply safe area only to bottom, not top', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar.className).toMatch(/pb-/);
      expect(tabBar.className).not.toMatch(/pt-safe|safe-area-inset-top/);
    });
  });

  describe('Accessibility', () => {
    it('should have proper role for navigation', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByRole('navigation');
      expect(tabBar).toBeInTheDocument();
    });

    it('should have aria-label for tab bar', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByRole('navigation');
      expect(tabBar).toHaveAttribute('aria-label', /tab|navigation/i);
    });

    it('should mark active tab with aria-current', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const overviewTab = screen.getByTestId('tab-button-overview');
      expect(overviewTab).toHaveAttribute('aria-current', 'page');
    });

    it('should have proper button role for each tab', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabs = screen.getAllByRole('button');
      expect(tabs.length).toBeGreaterThanOrEqual(5);
    });

    it('should have accessible name for badge', () => {
      // Arrange & Act
      render(
        <BottomTabBar
          activeTab="overview"
          onTabChange={() => {}}
          unhealthyPodCount={5}
        />
      );

      // Assert
      const badge = screen.getByTestId('pods-badge');
      expect(badge).toHaveAttribute('aria-label', /unhealthy pods|5 issues/i);
    });
  });

  describe('Visual Layout', () => {
    it('should have fixed position at bottom of screen', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar).toHaveClass(/fixed|sticky/);
      expect(tabBar).toHaveClass(/bottom-0/);
    });

    it('should span full width of screen', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar).toHaveClass(/w-full/);
    });

    it('should have background to prevent content showing through', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar).toHaveClass(/bg-/);
    });

    it('should display tabs in horizontal layout', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar).toHaveClass(/flex/);
      expect(tabBar).not.toHaveClass(/flex-col/);
    });

    it('should evenly distribute tab space', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const tabs = screen.getAllByTestId(/tab-button-/);
      tabs.forEach((tab) => {
        expect(tab).toHaveClass(/flex-1|flex-grow/);
      });
    });
  });

  describe('Icon Display', () => {
    it('should display icon for each tab', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const overviewIcon = screen.getByTestId('tab-icon-overview');
      const nodesIcon = screen.getByTestId('tab-icon-nodes');
      const workloadsIcon = screen.getByTestId('tab-icon-workloads');
      const podsIcon = screen.getByTestId('tab-icon-pods');
      const secretsIcon = screen.getByTestId('tab-icon-secrets');

      expect(overviewIcon).toBeInTheDocument();
      expect(nodesIcon).toBeInTheDocument();
      expect(workloadsIcon).toBeInTheDocument();
      expect(podsIcon).toBeInTheDocument();
      expect(secretsIcon).toBeInTheDocument();
    });

    it('should display label text below icon', () => {
      // Arrange & Act
      render(<BottomTabBar activeTab="overview" onTabChange={() => {}} />);

      // Assert
      const overviewTab = screen.getByTestId('tab-button-overview');
      const icon = screen.getByTestId('tab-icon-overview');
      const label = screen.getByText(/overview/i);

      expect(overviewTab.contains(icon)).toBe(true);
      expect(overviewTab.contains(label)).toBe(true);
    });
  });
});
