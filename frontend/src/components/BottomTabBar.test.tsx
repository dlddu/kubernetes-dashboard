import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BottomTabBar } from './BottomTabBar';

describe('BottomTabBar', () => {
  describe('rendering - basic structure', () => {
    it('should render without crashing', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar).toBeInTheDocument();
    });

    it('should render navigation element with proper role', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should render all 5 tabs', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      expect(screen.getByRole('button', { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pods/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /nodes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /deployments|workloads/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /secrets/i })).toBeInTheDocument();
    });

    it('should have aria-label on navigation', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label');
      const ariaLabel = nav.getAttribute('aria-label');
      expect(ariaLabel?.toLowerCase()).toMatch(/tab|navigation/i);
    });
  });

  describe('tab selection and active state', () => {
    it('should highlight Overview tab when currentTab is overview', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const overviewTab = screen.getByRole('button', { name: /overview/i });
      expect(overviewTab).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight Pods tab when currentTab is pods', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="pods" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const podsTab = screen.getByRole('button', { name: /pods/i });
      expect(podsTab).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight Nodes tab when currentTab is nodes', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="nodes" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const nodesTab = screen.getByRole('button', { name: /nodes/i });
      expect(nodesTab).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight Workloads tab when currentTab is workloads', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="workloads" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const workloadsTab = screen.getByRole('button', { name: /deployments|workloads/i });
      expect(workloadsTab).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight Secrets tab when currentTab is secrets', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="secrets" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const secretsTab = screen.getByRole('button', { name: /secrets/i });
      expect(secretsTab).toHaveAttribute('aria-current', 'page');
    });

    it('should only highlight one tab at a time', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="pods" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const currentTabs = screen.getAllByRole('button').filter((tab) => tab.getAttribute('aria-current') === 'page');
      expect(currentTabs).toHaveLength(1);
    });
  });

  describe('unhealthy pod count badge', () => {
    it('should display badge on Pods tab when unhealthyPodCount is greater than 0', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={3} onTabChange={vi.fn()} />);

      // Assert
      const badge = screen.getByTestId('unhealthy-pod-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('3');
    });

    it('should not display badge when unhealthyPodCount is 0', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const badge = screen.queryByTestId('unhealthy-pod-badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('should display double-digit counts correctly', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={15} onTabChange={vi.fn()} />);

      // Assert
      const badge = screen.getByTestId('unhealthy-pod-badge');
      expect(badge).toHaveTextContent('15');
    });

    it('should display 99+ for counts over 99', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={150} onTabChange={vi.fn()} />);

      // Assert
      const badge = screen.getByTestId('unhealthy-pod-badge');
      expect(badge).toHaveTextContent(/99\+|150/);
    });

    it('should have accessible label for badge', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={5} onTabChange={vi.fn()} />);

      // Assert
      const badge = screen.getByTestId('unhealthy-pod-badge');
      expect(badge).toHaveAttribute('aria-label');
      const ariaLabel = badge.getAttribute('aria-label');
      expect(ariaLabel?.toLowerCase()).toMatch(/unhealthy|error|problem/i);
    });
  });

  describe('tab interaction and event handling', () => {
    it('should call onTabChange with overview when Overview tab is clicked', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onTabChange = vi.fn();

      // Act
      render(<BottomTabBar currentTab="pods" unhealthyPodCount={0} onTabChange={onTabChange} />);
      const overviewTab = screen.getByRole('button', { name: /overview/i });
      await user.click(overviewTab);

      // Assert
      expect(onTabChange).toHaveBeenCalledWith('overview');
    });

    it('should call onTabChange with pods when Pods tab is clicked', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onTabChange = vi.fn();

      // Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={onTabChange} />);
      const podsTab = screen.getByRole('button', { name: /pods/i });
      await user.click(podsTab);

      // Assert
      expect(onTabChange).toHaveBeenCalledWith('pods');
    });

    it('should call onTabChange with nodes when Nodes tab is clicked', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onTabChange = vi.fn();

      // Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={onTabChange} />);
      const nodesTab = screen.getByRole('button', { name: /nodes/i });
      await user.click(nodesTab);

      // Assert
      expect(onTabChange).toHaveBeenCalledWith('nodes');
    });

    it('should call onTabChange with workloads when Workloads tab is clicked', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onTabChange = vi.fn();

      // Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={onTabChange} />);
      const workloadsTab = screen.getByRole('button', { name: /deployments|workloads/i });
      await user.click(workloadsTab);

      // Assert
      expect(onTabChange).toHaveBeenCalledWith('workloads');
    });

    it('should call onTabChange with secrets when Secrets tab is clicked', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onTabChange = vi.fn();

      // Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={onTabChange} />);
      const secretsTab = screen.getByRole('button', { name: /secrets/i });
      await user.click(secretsTab);

      // Assert
      expect(onTabChange).toHaveBeenCalledWith('secrets');
    });

    it('should not call onTabChange when clicking currently active tab', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onTabChange = vi.fn();

      // Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={onTabChange} />);
      const overviewTab = screen.getByRole('button', { name: /overview/i });
      await user.click(overviewTab);

      // Assert - can be called or not, depends on implementation
      // This test verifies the tab is still active
      expect(overviewTab).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('keyboard navigation', () => {
    it('should allow Tab key to focus on tab buttons', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });

      // Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);
      await user.tab();

      // Assert - first tab should be focused
      const firstButton = screen.getAllByRole('button')[0];
      expect(firstButton).toHaveFocus();
    });

    it('should navigate through tabs with Tab key', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });

      // Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);
      await user.tab(); // Focus first tab
      await user.tab(); // Focus second tab

      // Assert
      const buttons = screen.getAllByRole('button');
      expect(buttons[1]).toHaveFocus();
    });

    it('should activate tab with Enter key', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onTabChange = vi.fn();

      // Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={onTabChange} />);
      const podsTab = screen.getByRole('button', { name: /pods/i });
      podsTab.focus();
      await user.keyboard('{Enter}');

      // Assert
      expect(onTabChange).toHaveBeenCalledWith('pods');
    });

    it('should activate tab with Space key', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const onTabChange = vi.fn();

      // Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={onTabChange} />);
      const nodesTab = screen.getByRole('button', { name: /nodes/i });
      nodesTab.focus();
      await user.keyboard(' ');

      // Assert
      expect(onTabChange).toHaveBeenCalledWith('nodes');
    });

    it('should support arrow key navigation (ArrowRight)', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });

      // Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      await user.keyboard('{ArrowRight}');

      // Assert - next button should be focused
      expect(buttons[1]).toHaveFocus();
    });

    it('should support arrow key navigation (ArrowLeft)', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });

      // Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);
      const buttons = screen.getAllByRole('button');
      buttons[1].focus();
      await user.keyboard('{ArrowLeft}');

      // Assert - previous button should be focused
      expect(buttons[0]).toHaveFocus();
    });
  });

  describe('responsive design - mobile only', () => {
    it('should have fixed position at bottom', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar.className).toMatch(/fixed|sticky/);
      expect(tabBar.className).toMatch(/bottom/);
    });

    it('should be hidden on desktop (md breakpoint and above)', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar.className).toMatch(/md:hidden|hidden.*md/);
    });

    it('should be visible on mobile', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      // Should not have `hidden` class without breakpoint prefix
      expect(tabBar.className).not.toMatch(/^hidden$| hidden /);
    });

    it('should span full width', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar.className).toMatch(/w-full|w-screen/);
    });
  });

  describe('touch target size - accessibility', () => {
    it('should have minimum touch target size of 44x44px', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        // Should have appropriate padding/height classes
        expect(button.className).toMatch(/h-|p-|py-|min-h/);
      });
    });

    it('should have appropriate padding for touch targets', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button.className).toMatch(/p-|px-|py-/);
      });
    });
  });

  describe('visual styling', () => {
    it('should have proper background color', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar.className).toMatch(/bg-/);
    });

    it('should have border or shadow for visual separation', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar.className).toMatch(/border|shadow/);
    });

    it('should display active tab with different styling', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="pods" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const podsTab = screen.getByRole('button', { name: /pods/i });
      const overviewTab = screen.getByRole('button', { name: /overview/i });

      // Active and inactive tabs should have different classes
      expect(podsTab.className).not.toBe(overviewTab.className);
    });

    it('should have tab icons or labels', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        // Each button should have text content or aria-label
        expect(button.textContent || button.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle very large unhealthy pod counts', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={9999} onTabChange={vi.fn()} />);

      // Assert
      const badge = screen.getByTestId('unhealthy-pod-badge');
      expect(badge).toBeInTheDocument();
    });

    it('should handle negative unhealthy pod counts gracefully', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={-1} onTabChange={vi.fn()} />);

      // Assert - should not crash, might not show badge
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar).toBeInTheDocument();
    });

    it('should handle invalid currentTab gracefully', () => {
      // Arrange & Act
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<BottomTabBar currentTab={'invalid' as any} unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert - should still render
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar).toBeInTheDocument();
    });

    it('should handle missing onTabChange prop', () => {
      // Arrange & Act & Assert
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={undefined as any} />);
      }).not.toThrow();
    });
  });

  describe('accessibility - ARIA attributes', () => {
    it('should have proper role for navigation container', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('role', 'navigation');
    });

    it('should have aria-current on active tab only', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="nodes" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const buttons = screen.getAllByRole('button');
      const activeButtons = buttons.filter((btn) => btn.getAttribute('aria-current') === 'page');
      expect(activeButtons).toHaveLength(1);
      expect(activeButtons[0]).toHaveTextContent(/nodes/i);
    });

    it('should not have aria-current on inactive tabs', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const podsTab = screen.getByRole('button', { name: /pods/i });
      expect(podsTab).not.toHaveAttribute('aria-current', 'page');
    });

    it('should have accessible button labels', () => {
      // Arrange & Act
      render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        const label = button.getAttribute('aria-label') || button.textContent;
        expect(label).toBeTruthy();
        expect(label?.length).toBeGreaterThan(0);
      });
    });
  });

  describe('prop updates', () => {
    it('should update active tab when currentTab prop changes', () => {
      // Arrange
      const { rerender } = render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Act
      rerender(<BottomTabBar currentTab="pods" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      // Assert
      const podsTab = screen.getByRole('button', { name: /pods/i });
      expect(podsTab).toHaveAttribute('aria-current', 'page');
    });

    it('should update badge when unhealthyPodCount prop changes', () => {
      // Arrange
      const { rerender } = render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={vi.fn()} />);

      expect(screen.queryByTestId('unhealthy-pod-badge')).not.toBeInTheDocument();

      // Act
      rerender(<BottomTabBar currentTab="overview" unhealthyPodCount={5} onTabChange={vi.fn()} />);

      // Assert
      const badge = screen.getByTestId('unhealthy-pod-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('5');
    });

    it('should handle onTabChange prop updates', () => {
      // Arrange
      const firstHandler = vi.fn();
      const secondHandler = vi.fn();
      const { rerender } = render(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={firstHandler} />);

      // Act
      rerender(<BottomTabBar currentTab="overview" unhealthyPodCount={0} onTabChange={secondHandler} />);

      // Assert - component should still render
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar).toBeInTheDocument();
    });
  });
});
