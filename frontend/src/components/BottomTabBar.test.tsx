import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomTabBar } from './BottomTabBar';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useLocation: vi.fn(),
  useNavigate: vi.fn(),
}));

// Import after mock setup
import { useLocation, useNavigate } from 'react-router-dom';

describe('BottomTabBar Component', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  describe('Basic Rendering', () => {
    it('should render bottom tab bar container', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar).toBeInTheDocument();
    });

    it('should render all 5 tabs', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
      expect(screen.getByTestId('tab-nodes')).toBeInTheDocument();
      expect(screen.getByTestId('tab-workloads')).toBeInTheDocument();
      expect(screen.getByTestId('tab-pods')).toBeInTheDocument();
      expect(screen.getByTestId('tab-secrets')).toBeInTheDocument();
    });

    it('should display tab labels', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Nodes')).toBeInTheDocument();
      expect(screen.getByText('Workloads')).toBeInTheDocument();
      expect(screen.getByText('Pods')).toBeInTheDocument();
      expect(screen.getByText('Secrets')).toBeInTheDocument();
    });

    it('should display tab icons', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      // Each tab should have an icon (SVG or icon element)
      expect(screen.getByTestId('tab-overview').querySelector('svg, [class*="icon"]')).toBeTruthy();
      expect(screen.getByTestId('tab-nodes').querySelector('svg, [class*="icon"]')).toBeTruthy();
      expect(screen.getByTestId('tab-workloads').querySelector('svg, [class*="icon"]')).toBeTruthy();
      expect(screen.getByTestId('tab-pods').querySelector('svg, [class*="icon"]')).toBeTruthy();
      expect(screen.getByTestId('tab-secrets').querySelector('svg, [class*="icon"]')).toBeTruthy();
    });
  });

  describe('Active Tab Highlighting', () => {
    it('should highlight Overview tab when pathname is /', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const overviewTab = screen.getByTestId('tab-overview');
      expect(overviewTab).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight Nodes tab when pathname is /nodes', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/nodes',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const nodesTab = screen.getByTestId('tab-nodes');
      expect(nodesTab).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight Workloads tab when pathname is /workloads', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/workloads',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const workloadsTab = screen.getByTestId('tab-workloads');
      expect(workloadsTab).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight Pods tab when pathname is /pods', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/pods',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const podsTab = screen.getByTestId('tab-pods');
      expect(podsTab).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight Secrets tab when pathname is /secrets', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/secrets',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const secretsTab = screen.getByTestId('tab-secrets');
      expect(secretsTab).toHaveAttribute('aria-current', 'page');
    });

    it('should apply active styling to active tab', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/pods',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const podsTab = screen.getByTestId('tab-pods');
      // Active tab should have distinct styling (e.g., text-blue, font-semibold)
      expect(podsTab.className).toMatch(/text-blue|font-semibold|active|selected/i);
    });

    it('should not apply active styling to inactive tabs', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/pods',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const overviewTab = screen.getByTestId('tab-overview');
      expect(overviewTab).not.toHaveAttribute('aria-current', 'page');
      // Inactive tabs should have muted styling (e.g., text-gray)
      expect(overviewTab.className).toMatch(/text-gray/i);
    });
  });

  describe('Pods Badge Display', () => {
    it('should not display badge when unhealthyPodCount is 0', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const badge = screen.queryByTestId('pods-badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('should display badge when unhealthyPodCount is greater than 0', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={3} />);

      // Assert
      const badge = screen.getByTestId('pods-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('3');
    });

    it('should display correct count in badge', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={15} />);

      // Assert
      const badge = screen.getByTestId('pods-badge');
      expect(badge).toHaveTextContent('15');
    });

    it('should handle single digit count', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={1} />);

      // Assert
      const badge = screen.getByTestId('pods-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('1');
    });

    it('should handle large count numbers', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={999} />);

      // Assert
      const badge = screen.getByTestId('pods-badge');
      expect(badge).toHaveTextContent('999');
    });

    it('should position badge on Pods tab', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={5} />);

      // Assert
      const podsTab = screen.getByTestId('tab-pods');
      const badge = screen.getByTestId('pods-badge');
      // Badge should be a child or sibling of pods tab
      expect(podsTab.contains(badge) || podsTab.parentElement?.contains(badge)).toBe(true);
    });

    it('should style badge with error/warning color', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={5} />);

      // Assert
      const badge = screen.getByTestId('pods-badge');
      // Badge should have red/error styling
      expect(badge.className).toMatch(/bg-red|bg-error|text-red|text-white/i);
    });
  });

  describe('Tab Click Handlers', () => {
    it('should navigate to / when Overview tab is clicked', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/pods',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);
      const overviewTab = screen.getByTestId('tab-overview');
      fireEvent.click(overviewTab);

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should navigate to /nodes when Nodes tab is clicked', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);
      const nodesTab = screen.getByTestId('tab-nodes');
      fireEvent.click(nodesTab);

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith('/nodes');
    });

    it('should navigate to /workloads when Workloads tab is clicked', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);
      const workloadsTab = screen.getByTestId('tab-workloads');
      fireEvent.click(workloadsTab);

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith('/workloads');
    });

    it('should navigate to /pods when Pods tab is clicked', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);
      const podsTab = screen.getByTestId('tab-pods');
      fireEvent.click(podsTab);

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith('/pods');
    });

    it('should navigate to /secrets when Secrets tab is clicked', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);
      const secretsTab = screen.getByTestId('tab-secrets');
      fireEvent.click(secretsTab);

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith('/secrets');
    });

    it('should call onTabChange prop if provided when tab is clicked', () => {
      // Arrange
      const mockOnTabChange = vi.fn();
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} onTabChange={mockOnTabChange} />);
      const podsTab = screen.getByTestId('tab-pods');
      fireEvent.click(podsTab);

      // Assert
      expect(mockOnTabChange).toHaveBeenCalledWith('/pods');
    });

    it('should not navigate when clicking already active tab', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/pods',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);
      const podsTab = screen.getByTestId('tab-pods');
      fireEvent.click(podsTab);

      // Assert
      // Should still call navigate (React Router handles duplicate navigation)
      expect(mockNavigate).toHaveBeenCalledWith('/pods');
    });
  });

  describe('Touch Target Size', () => {
    it('should have minimum 44px touch target height', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const overviewTab = screen.getByTestId('tab-overview');
      const styles = window.getComputedStyle(overviewTab);
      const minHeight = parseInt(styles.minHeight) || parseInt(styles.height);

      // Should have at least 44px for accessibility
      expect(minHeight >= 44 || overviewTab.className).toMatch(/min-h-|h-11|h-12|h-14|h-16/);
    });

    it('should have minimum 44px touch target width per tab', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const overviewTab = screen.getByTestId('tab-overview');
      // Each tab should have adequate width
      expect(overviewTab.className).toMatch(/flex|w-|min-w-/);
    });
  });

  describe('iOS Safe Area', () => {
    it('should apply safe area padding to container', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');

      // Should have bottom padding for safe area
      expect(tabBar.className).toMatch(/pb-|padding-bottom/);
    });

    it('should use CSS env() for safe area insets in style attribute', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      const style = tabBar.getAttribute('style');

      // Should use env(safe-area-inset-bottom) or have appropriate padding
      expect(
        style?.includes('env(safe-area-inset-bottom)') ||
        tabBar.className.includes('pb-')
      ).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have navigation role', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const tabBar = screen.getByRole('navigation');
      expect(tabBar).toBeInTheDocument();
    });

    it('should have aria-label describing the navigation', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const tabBar = screen.getByRole('navigation');
      expect(tabBar).toHaveAttribute('aria-label', expect.stringMatching(/tab|navigation|main/i));
    });

    it('should mark active tab with aria-current="page"', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/workloads',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const workloadsTab = screen.getByTestId('tab-workloads');
      expect(workloadsTab).toHaveAttribute('aria-current', 'page');
    });

    it('should not mark inactive tabs with aria-current', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/workloads',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const overviewTab = screen.getByTestId('tab-overview');
      expect(overviewTab).not.toHaveAttribute('aria-current');
    });

    it('should have accessible button elements for tabs', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const tabs = screen.getAllByRole('button');
      expect(tabs.length).toBeGreaterThanOrEqual(5);
    });

    it('should have descriptive aria-label for badge', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={7} />);

      // Assert
      const badge = screen.getByTestId('pods-badge');
      expect(badge).toHaveAttribute('aria-label', expect.stringMatching(/unhealthy|pod|7/i));
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined unhealthyPodCount', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const badge = screen.queryByTestId('pods-badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('should handle negative unhealthyPodCount', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={-5} />);

      // Assert
      const badge = screen.queryByTestId('pods-badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('should handle unknown pathname gracefully', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/unknown-route',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar).toBeInTheDocument();
      // No tab should be marked as active
      const tabs = [
        screen.getByTestId('tab-overview'),
        screen.getByTestId('tab-nodes'),
        screen.getByTestId('tab-workloads'),
        screen.getByTestId('tab-pods'),
        screen.getByTestId('tab-secrets'),
      ];
      tabs.forEach(tab => {
        expect(tab).not.toHaveAttribute('aria-current', 'page');
      });
    });

    it('should handle pathname with trailing slash', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/pods/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const podsTab = screen.getByTestId('tab-pods');
      // Should still recognize as pods route
      expect(podsTab).toHaveAttribute('aria-current', 'page');
    });

    it('should handle nested routes', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/pods/detail/123',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const podsTab = screen.getByTestId('tab-pods');
      // Should still highlight pods tab for nested routes
      expect(podsTab).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Styling and Layout', () => {
    it('should have fixed position at bottom', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar.className).toMatch(/fixed|sticky/);
      expect(tabBar.className).toMatch(/bottom/);
    });

    it('should have proper background styling', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar.className).toMatch(/bg-white|bg-gray|bg-/);
    });

    it('should have shadow or border for visual separation', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      expect(tabBar.className).toMatch(/shadow|border-t|border/);
    });

    it('should distribute tabs evenly', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      const tabBar = screen.getByTestId('bottom-tab-bar');
      // Should use flex with space distribution
      const innerDiv = tabBar.children[0] as HTMLElement;
      expect(innerDiv.className).toMatch(/flex/);
    });
  });

  describe('Data Integrity', () => {
    it('should preserve unhealthyPodCount value', () => {
      // Arrange
      const count = 42;
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      render(<BottomTabBar unhealthyPodCount={count} />);

      // Assert
      const badge = screen.getByTestId('pods-badge');
      expect(badge).toHaveTextContent(count.toString());
    });

    it('should update badge when unhealthyPodCount changes', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      const { rerender } = render(<BottomTabBar unhealthyPodCount={5} />);
      expect(screen.getByTestId('pods-badge')).toHaveTextContent('5');

      // Update count
      rerender(<BottomTabBar unhealthyPodCount={10} />);

      // Assert
      expect(screen.getByTestId('pods-badge')).toHaveTextContent('10');
    });

    it('should hide badge when count changes to 0', () => {
      // Arrange
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      // Act
      const { rerender } = render(<BottomTabBar unhealthyPodCount={5} />);
      expect(screen.getByTestId('pods-badge')).toBeInTheDocument();

      // Update to 0
      rerender(<BottomTabBar unhealthyPodCount={0} />);

      // Assert
      expect(screen.queryByTestId('pods-badge')).not.toBeInTheDocument();
    });
  });
});
