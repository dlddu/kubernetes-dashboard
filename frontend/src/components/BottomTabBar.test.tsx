import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomTabBar } from './BottomTabBar';

// Mock window.location
const mockLocation = {
  pathname: '/',
  assign: vi.fn(),
};

Object.defineProperty(window, 'location', {
  writable: true,
  value: mockLocation,
});

describe('BottomTabBar Component', () => {
  describe('Basic Rendering', () => {
    it('should render bottom tab bar container', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar).toBeInTheDocument();
    });

    it('should render all 5 navigation tabs', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const overviewTab = screen.getByTestId('tab-overview');
      const podsTab = screen.getByTestId('tab-pods');
      const nodesTab = screen.getByTestId('tab-nodes');
      const deploymentsTab = screen.getByTestId('tab-deployments');
      const secretsTab = screen.getByTestId('tab-secrets');

      expect(overviewTab).toBeInTheDocument();
      expect(podsTab).toBeInTheDocument();
      expect(nodesTab).toBeInTheDocument();
      expect(deploymentsTab).toBeInTheDocument();
      expect(secretsTab).toBeInTheDocument();
    });

    it('should display tab labels', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      expect(screen.getByText(/overview/i)).toBeInTheDocument();
      expect(screen.getByText(/pods/i)).toBeInTheDocument();
      expect(screen.getByText(/nodes/i)).toBeInTheDocument();
      expect(screen.getByText(/deployments/i)).toBeInTheDocument();
      expect(screen.getByText(/secrets/i)).toBeInTheDocument();
    });

    it('should render tab icons', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert: Each tab should contain an SVG icon
      const overviewTab = screen.getByTestId('tab-overview');
      const podsTab = screen.getByTestId('tab-pods');
      const nodesTab = screen.getByTestId('tab-nodes');
      const deploymentsTab = screen.getByTestId('tab-deployments');
      const secretsTab = screen.getByTestId('tab-secrets');

      expect(overviewTab.querySelector('svg')).toBeInTheDocument();
      expect(podsTab.querySelector('svg')).toBeInTheDocument();
      expect(nodesTab.querySelector('svg')).toBeInTheDocument();
      expect(deploymentsTab.querySelector('svg')).toBeInTheDocument();
      expect(secretsTab.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Navigation Behavior', () => {
    it('should navigate to overview page when clicking Overview tab', () => {
      // Arrange
      mockLocation.pathname = '/pods';
      render(<BottomTabBar />);

      // Act
      const overviewTab = screen.getByTestId('tab-overview');
      fireEvent.click(overviewTab);

      // Assert
      expect(mockLocation.assign).toHaveBeenCalledWith('/');
    });

    it('should navigate to pods page when clicking Pods tab', () => {
      // Arrange
      mockLocation.pathname = '/';
      render(<BottomTabBar />);

      // Act
      const podsTab = screen.getByTestId('tab-pods');
      fireEvent.click(podsTab);

      // Assert
      expect(mockLocation.assign).toHaveBeenCalledWith('/pods');
    });

    it('should navigate to nodes page when clicking Nodes tab', () => {
      // Arrange
      mockLocation.pathname = '/';
      render(<BottomTabBar />);

      // Act
      const nodesTab = screen.getByTestId('tab-nodes');
      fireEvent.click(nodesTab);

      // Assert
      expect(mockLocation.assign).toHaveBeenCalledWith('/nodes');
    });

    it('should navigate to workloads page when clicking Deployments tab', () => {
      // Arrange
      mockLocation.pathname = '/';
      render(<BottomTabBar />);

      // Act
      const deploymentsTab = screen.getByTestId('tab-deployments');
      fireEvent.click(deploymentsTab);

      // Assert
      expect(mockLocation.assign).toHaveBeenCalledWith('/workloads');
    });

    it('should navigate to secrets page when clicking Secrets tab', () => {
      // Arrange
      mockLocation.pathname = '/';
      render(<BottomTabBar />);

      // Act
      const secretsTab = screen.getByTestId('tab-secrets');
      fireEvent.click(secretsTab);

      // Assert
      expect(mockLocation.assign).toHaveBeenCalledWith('/secrets');
    });
  });

  describe('Active Tab Highlighting', () => {
    it('should highlight Overview tab when on home page', () => {
      // Arrange
      mockLocation.pathname = '/';

      // Act
      render(<BottomTabBar />);

      // Assert
      const overviewTab = screen.getByTestId('tab-overview');
      expect(overviewTab).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight Pods tab when on pods page', () => {
      // Arrange
      mockLocation.pathname = '/pods';

      // Act
      render(<BottomTabBar />);

      // Assert
      const podsTab = screen.getByTestId('tab-pods');
      expect(podsTab).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight Nodes tab when on nodes page', () => {
      // Arrange
      mockLocation.pathname = '/nodes';

      // Act
      render(<BottomTabBar />);

      // Assert
      const nodesTab = screen.getByTestId('tab-nodes');
      expect(nodesTab).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight Deployments tab when on workloads page', () => {
      // Arrange
      mockLocation.pathname = '/workloads';

      // Act
      render(<BottomTabBar />);

      // Assert
      const deploymentsTab = screen.getByTestId('tab-deployments');
      expect(deploymentsTab).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight Secrets tab when on secrets page', () => {
      // Arrange
      mockLocation.pathname = '/secrets';

      // Act
      render(<BottomTabBar />);

      // Assert
      const secretsTab = screen.getByTestId('tab-secrets');
      expect(secretsTab).toHaveAttribute('aria-current', 'page');
    });

    it('should only highlight one tab at a time', () => {
      // Arrange
      mockLocation.pathname = '/pods';

      // Act
      render(<BottomTabBar />);

      // Assert
      const tabs = [
        screen.getByTestId('tab-overview'),
        screen.getByTestId('tab-pods'),
        screen.getByTestId('tab-nodes'),
        screen.getByTestId('tab-deployments'),
        screen.getByTestId('tab-secrets'),
      ];

      const activeTabsCount = tabs.filter((tab) =>
        tab.hasAttribute('aria-current')
      ).length;

      expect(activeTabsCount).toBe(1);
    });

    it('should apply active styling to active tab', () => {
      // Arrange
      mockLocation.pathname = '/pods';

      // Act
      render(<BottomTabBar />);

      // Assert
      const podsTab = screen.getByTestId('tab-pods');
      expect(podsTab.className).toMatch(/text-blue|text-primary|font-semibold/);
    });

    it('should not apply active styling to inactive tabs', () => {
      // Arrange
      mockLocation.pathname = '/pods';

      // Act
      render(<BottomTabBar />);

      // Assert
      const overviewTab = screen.getByTestId('tab-overview');
      expect(overviewTab).not.toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Unhealthy Pod Badge', () => {
    it('should display badge on Pods tab when unhealthy pods exist', () => {
      // Arrange & Act
      render(<BottomTabBar unhealthyPodCount={5} />);

      // Assert
      const badge = screen.getByTestId('unhealthy-pod-badge');
      expect(badge).toBeInTheDocument();
    });

    it('should display correct count in badge', () => {
      // Arrange & Act
      render(<BottomTabBar unhealthyPodCount={12} />);

      // Assert
      const badge = screen.getByTestId('unhealthy-pod-badge');
      expect(badge).toHaveTextContent('12');
    });

    it('should not display badge when unhealthy count is 0', () => {
      // Arrange & Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const badge = screen.queryByTestId('unhealthy-pod-badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('should not display badge when unhealthyPodCount prop is undefined', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const badge = screen.queryByTestId('unhealthy-pod-badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('should display badge with maximum value of 99+', () => {
      // Arrange & Act
      render(<BottomTabBar unhealthyPodCount={150} />);

      // Assert
      const badge = screen.getByTestId('unhealthy-pod-badge');
      expect(badge).toHaveTextContent('99+');
    });

    it('should position badge on top-right of Pods tab icon', () => {
      // Arrange & Act
      render(<BottomTabBar unhealthyPodCount={3} />);

      // Assert
      const badge = screen.getByTestId('unhealthy-pod-badge');
      expect(badge.className).toMatch(/absolute|top-|right-/);
    });

    it('should style badge with red background', () => {
      // Arrange & Act
      render(<BottomTabBar unhealthyPodCount={7} />);

      // Assert
      const badge = screen.getByTestId('unhealthy-pod-badge');
      expect(badge.className).toMatch(/bg-red|bg-error/);
    });
  });

  describe('Layout and Styling', () => {
    it('should have fixed position at bottom', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar.className).toMatch(/fixed|bottom-0/);
    });

    it('should span full width', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar.className).toMatch(/w-full|left-0|right-0/);
    });

    it('should have safe area bottom padding for iOS', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar.className).toMatch(/pb-safe|safe-area/);
    });

    it('should display tabs in horizontal layout', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar.className).toMatch(/flex|grid/);
    });

    it('should distribute tabs evenly', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const overviewTab = screen.getByTestId('tab-overview');
      expect(overviewTab.className).toMatch(/flex-1|col-span/);
    });

    it('should have white or light background', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar.className).toMatch(/bg-white|bg-gray/);
    });

    it('should have top border or shadow', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar.className).toMatch(/border-t|shadow/);
    });
  });

  describe('Touch Target Size', () => {
    it('should have minimum 44px height for each tab', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const overviewTab = screen.getByTestId('tab-overview');
      expect(overviewTab.className).toMatch(/h-|min-h-|py-/);
    });

    it('should have adequate padding for tap targets', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const podsTab = screen.getByTestId('tab-pods');
      expect(podsTab.className).toMatch(/p-|px-|py-/);
    });
  });

  describe('Accessibility', () => {
    it('should have navigation role', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar).toHaveAttribute('role', 'navigation');
    });

    it('should have descriptive aria-label', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      const ariaLabel = tabBar.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/main|primary|tab|navigation/i);
    });

    it('should have aria-label on Overview tab', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const overviewTab = screen.getByTestId('tab-overview');
      const ariaLabel = overviewTab.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.toLowerCase()).toContain('overview');
    });

    it('should have aria-label on Pods tab', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const podsTab = screen.getByTestId('tab-pods');
      const ariaLabel = podsTab.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.toLowerCase()).toContain('pod');
    });

    it('should have aria-label on Nodes tab', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const nodesTab = screen.getByTestId('tab-nodes');
      const ariaLabel = nodesTab.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.toLowerCase()).toContain('node');
    });

    it('should have aria-label on Deployments tab', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const deploymentsTab = screen.getByTestId('tab-deployments');
      const ariaLabel = deploymentsTab.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.toLowerCase()).toMatch(/deployment|workload/);
    });

    it('should have aria-label on Secrets tab', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const secretsTab = screen.getByTestId('tab-secrets');
      const ariaLabel = secretsTab.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.toLowerCase()).toContain('secret');
    });

    it('should use button elements for tabs', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const overviewTab = screen.getByTestId('tab-overview');
      expect(overviewTab.tagName).toBe('BUTTON');
    });

    it('should announce badge count to screen readers', () => {
      // Arrange & Act
      render(<BottomTabBar unhealthyPodCount={5} />);

      // Assert
      const podsTab = screen.getByTestId('tab-pods');
      const ariaLabel = podsTab.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/5|unhealthy/i);
    });
  });

  describe('Responsive Design', () => {
    it('should be hidden on desktop viewport (md and above)', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar.className).toMatch(/md:hidden|lg:hidden/);
    });

    it('should be visible on mobile viewport', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar.className).not.toMatch(/hidden(?!.*md:hidden)/);
    });
  });

  describe('Icon Display', () => {
    it('should center icon and label vertically', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const overviewTab = screen.getByTestId('tab-overview');
      expect(overviewTab.className).toMatch(/flex|items-center|justify-center/);
    });

    it('should display icon above label', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const overviewTab = screen.getByTestId('tab-overview');
      expect(overviewTab.className).toMatch(/flex-col/);
    });

    it('should have appropriate icon size', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const icon = screen.getByTestId('tab-overview').querySelector('svg');
      expect(icon?.className).toMatch(/w-|h-/);
    });

    it('should have appropriate label text size', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const overviewTab = screen.getByTestId('tab-overview');
      expect(overviewTab.className).toMatch(/text-xs|text-sm/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle large unhealthy pod counts gracefully', () => {
      // Arrange & Act
      render(<BottomTabBar unhealthyPodCount={999} />);

      // Assert
      const badge = screen.getByTestId('unhealthy-pod-badge');
      expect(badge).toHaveTextContent('99+');
    });

    it('should handle negative unhealthy pod counts', () => {
      // Arrange & Act
      render(<BottomTabBar unhealthyPodCount={-5} />);

      // Assert
      const badge = screen.queryByTestId('unhealthy-pod-badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('should handle unknown pathname gracefully', () => {
      // Arrange
      mockLocation.pathname = '/unknown-route';

      // Act
      render(<BottomTabBar />);

      // Assert: No tab should be highlighted
      const tabs = [
        screen.getByTestId('tab-overview'),
        screen.getByTestId('tab-pods'),
        screen.getByTestId('tab-nodes'),
        screen.getByTestId('tab-deployments'),
        screen.getByTestId('tab-secrets'),
      ];

      const activeTabsCount = tabs.filter((tab) =>
        tab.hasAttribute('aria-current')
      ).length;

      expect(activeTabsCount).toBe(0);
    });
  });

  describe('Component Props', () => {
    it('should accept unhealthyPodCount prop', () => {
      // Arrange & Act
      render(<BottomTabBar unhealthyPodCount={10} />);

      // Assert
      const badge = screen.getByTestId('unhealthy-pod-badge');
      expect(badge).toHaveTextContent('10');
    });

    it('should work without unhealthyPodCount prop', () => {
      // Arrange & Act
      render(<BottomTabBar />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar).toBeInTheDocument();
    });

    it('should re-render when unhealthyPodCount changes', () => {
      // Arrange
      const { rerender } = render(<BottomTabBar unhealthyPodCount={5} />);
      expect(screen.getByTestId('unhealthy-pod-badge')).toHaveTextContent('5');

      // Act
      rerender(<BottomTabBar unhealthyPodCount={10} />);

      // Assert
      expect(screen.getByTestId('unhealthy-pod-badge')).toHaveTextContent('10');
    });

    it('should hide badge when count changes to 0', () => {
      // Arrange
      const { rerender } = render(<BottomTabBar unhealthyPodCount={5} />);
      expect(screen.getByTestId('unhealthy-pod-badge')).toBeInTheDocument();

      // Act
      rerender(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      expect(screen.queryByTestId('unhealthy-pod-badge')).not.toBeInTheDocument();
    });
  });
});
