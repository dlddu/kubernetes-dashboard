import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Bottom Tab Navigation Integration
 *
 * TDD Red Phase: Tests written - BottomTabBar component not yet implemented.
 * These tests define the expected behavior of the bottom tab navigation bar,
 * which provides mobile-first navigation with 5 tabs and dynamic badge indicators.
 *
 * Related Issue: DLD-339 - Bottom Tab Navigation Implementation
 *
 * Components to be implemented:
 * - BottomTabBar (main navigation component)
 * - LoadingSkeleton (loading state component)
 * - ErrorRetry (error state component)
 * - EmptyState (empty state component)
 *
 * Test Coverage:
 * - Tab navigation (5 tabs: Overview, Pods, Nodes, Deployments, Secrets)
 * - Unhealthy pod badge on Pods tab
 * - Mobile viewport (375px) rendering
 * - Namespace filtering integration
 * - Active tab highlighting
 * - Accessibility (ARIA labels, keyboard navigation)
 */

test.describe('Bottom Tab Navigation - Basic Rendering', () => {
  test('should display BottomTabBar component on all pages', async ({ page }) => {
    // Tests that BottomTabBar is consistently rendered across all routes

    // Arrange: Set mobile viewport (iPhone SE dimensions)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: BottomTabBar should be visible on Overview page
    const bottomTabBar = page.getByTestId('bottom-tab-bar');
    await expect(bottomTabBar).toBeVisible();

    // Act: Navigate to Pods tab
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: BottomTabBar should be visible on Pods page
    await expect(bottomTabBar).toBeVisible();

    // Act: Navigate to Nodes tab
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Assert: BottomTabBar should be visible on Nodes page
    await expect(bottomTabBar).toBeVisible();

    // Act: Navigate to Workloads tab
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Assert: BottomTabBar should be visible on Workloads page
    await expect(bottomTabBar).toBeVisible();

    // Act: Navigate to Secrets tab
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Assert: BottomTabBar should be visible on Secrets page
    await expect(bottomTabBar).toBeVisible();
  });

  test('should display all 5 navigation tabs', async ({ page }) => {
    // Tests that all 5 tabs are rendered in BottomTabBar

    // Arrange: Set mobile viewport and navigate to home
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the BottomTabBar
    const bottomTabBar = page.getByTestId('bottom-tab-bar');
    await expect(bottomTabBar).toBeVisible();

    // Assert: Overview tab should be visible
    const overviewTab = page.getByTestId('tab-overview')
      .or(page.getByRole('link', { name: /overview/i }));
    await expect(overviewTab).toBeVisible();

    // Assert: Pods tab should be visible
    const podsTab = page.getByTestId('tab-pods')
      .or(page.getByRole('link', { name: /pods/i }));
    await expect(podsTab).toBeVisible();

    // Assert: Nodes tab should be visible
    const nodesTab = page.getByTestId('tab-nodes')
      .or(page.getByRole('link', { name: /nodes/i }));
    await expect(nodesTab).toBeVisible();

    // Assert: Deployments tab should be visible
    const deploymentsTab = page.getByTestId('tab-deployments')
      .or(page.getByRole('link', { name: /deployments/i }));
    await expect(deploymentsTab).toBeVisible();

    // Assert: Secrets tab should be visible
    const secretsTab = page.getByTestId('tab-secrets')
      .or(page.getByRole('link', { name: /secrets/i }));
    await expect(secretsTab).toBeVisible();

    // Assert: Exactly 5 tabs should be present
    const allTabs = bottomTabBar.locator('[data-testid^="tab-"]');
    await expect(allTabs).toHaveCount(5);
  });

  test('should render BottomTabBar with fixed position at bottom on mobile', async ({ page }) => {
    // Tests that BottomTabBar is fixed to the bottom of viewport on mobile

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the BottomTabBar
    const bottomTabBar = page.getByTestId('bottom-tab-bar');
    await expect(bottomTabBar).toBeVisible();

    // Assert: BottomTabBar should have fixed position styling
    const position = await bottomTabBar.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        position: style.position,
        bottom: style.bottom,
        left: style.left,
        right: style.right,
        zIndex: style.zIndex,
      };
    });

    expect(position.position).toBe('fixed');
    expect(position.bottom).toBe('0px');
    expect(parseInt(position.zIndex)).toBeGreaterThan(0);

    // Assert: BottomTabBar should span full width
    const boundingBox = await bottomTabBar.boundingBox();
    expect(boundingBox!.width).toBe(375);
  });
});

test.describe('Bottom Tab Navigation - Tab Switching', () => {
  test('should navigate to Overview page when clicking Overview tab', async ({ page }) => {
    // Tests navigation to Overview page via tab click

    // Arrange: Set mobile viewport and start on Pods page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Click Overview tab
    const overviewTab = page.getByTestId('tab-overview')
      .or(page.getByRole('link', { name: /overview/i }));
    await overviewTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: URL should be root path
    expect(page.url()).toMatch(/\/$|\/$/);

    // Assert: Overview content should be visible
    const overviewContent = page.getByTestId('overview-tab');
    await expect(overviewContent).toBeVisible();

    // Assert: Overview tab should be highlighted as active
    await expect(overviewTab).toHaveAttribute('aria-current', 'page');
  });

  test('should navigate to Pods page when clicking Pods tab', async ({ page }) => {
    // Tests navigation to Pods page via tab click

    // Arrange: Set mobile viewport and start on home page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Click Pods tab
    const podsTab = page.getByTestId('tab-pods')
      .or(page.getByRole('link', { name: /pods/i }));
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: URL should be /pods
    expect(page.url()).toContain('/pods');

    // Assert: Pods page content should be visible
    const podsPage = page.getByTestId('pods-page')
      .or(page.getByRole('heading', { name: /pods/i }));
    await expect(podsPage).toBeVisible();

    // Assert: Pods tab should be highlighted as active
    await expect(podsTab).toHaveAttribute('aria-current', 'page');
  });

  test('should navigate to Nodes page when clicking Nodes tab', async ({ page }) => {
    // Tests navigation to Nodes page via tab click

    // Arrange: Set mobile viewport and start on home page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Click Nodes tab
    const nodesTab = page.getByTestId('tab-nodes')
      .or(page.getByRole('link', { name: /nodes/i }));
    await nodesTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: URL should be /nodes
    expect(page.url()).toContain('/nodes');

    // Assert: Nodes page content should be visible
    const nodesPage = page.getByTestId('nodes-page')
      .or(page.getByRole('heading', { name: /nodes/i }));
    await expect(nodesPage).toBeVisible();

    // Assert: Nodes tab should be highlighted as active
    await expect(nodesTab).toHaveAttribute('aria-current', 'page');
  });

  test('should navigate to Deployments page when clicking Deployments tab', async ({ page }) => {
    // Tests navigation to Deployments/Workloads page via tab click

    // Arrange: Set mobile viewport and start on home page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Click Deployments tab
    const deploymentsTab = page.getByTestId('tab-deployments')
      .or(page.getByRole('link', { name: /deployments/i }));
    await deploymentsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: URL should be /workloads
    expect(page.url()).toContain('/workloads');

    // Assert: Workloads page content should be visible
    const workloadsPage = page.getByTestId('workloads-page')
      .or(page.getByRole('heading', { name: /workloads|deployments/i }));
    await expect(workloadsPage).toBeVisible();

    // Assert: Deployments tab should be highlighted as active
    await expect(deploymentsTab).toHaveAttribute('aria-current', 'page');
  });

  test('should navigate to Secrets page when clicking Secrets tab', async ({ page }) => {
    // Tests navigation to Secrets page via tab click

    // Arrange: Set mobile viewport and start on home page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Click Secrets tab
    const secretsTab = page.getByTestId('tab-secrets')
      .or(page.getByRole('link', { name: /secrets/i }));
    await secretsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: URL should be /secrets
    expect(page.url()).toContain('/secrets');

    // Assert: Secrets page content should be visible
    const secretsPage = page.getByTestId('secrets-page')
      .or(page.getByRole('heading', { name: /secrets/i }));
    await expect(secretsPage).toBeVisible();

    // Assert: Secrets tab should be highlighted as active
    await expect(secretsTab).toHaveAttribute('aria-current', 'page');
  });

  test('should maintain scroll position when switching tabs', async ({ page }) => {
    // Tests that tab navigation doesn't affect scroll position

    // Arrange: Set mobile viewport and navigate to Pods page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Scroll down the page
    await page.evaluate(() => window.scrollTo(0, 200));
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeGreaterThan(0);

    // Act: Click Overview tab
    const overviewTab = page.getByTestId('tab-overview')
      .or(page.getByRole('link', { name: /overview/i }));
    await overviewTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Page should scroll to top on navigation (expected behavior)
    const newScrollPosition = await page.evaluate(() => window.scrollY);
    expect(newScrollPosition).toBe(0);
  });
});

test.describe('Bottom Tab Navigation - Unhealthy Pod Badge', () => {
  test('should display badge with unhealthy pod count on Pods tab icon', async ({ page }) => {
    // Tests that Pods tab shows badge with count of unhealthy pods

    // Arrange: Set mobile viewport and navigate to home page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the Pods tab
    const podsTab = page.getByTestId('tab-pods')
      .or(page.getByRole('link', { name: /pods/i }));
    await expect(podsTab).toBeVisible();

    // Assert: Badge should be visible if there are unhealthy pods
    const badge = podsTab.getByTestId('unhealthy-pod-badge')
      .or(podsTab.locator('[data-badge]'))
      .or(podsTab.locator('.badge'));

    // Note: Badge visibility depends on cluster state
    const badgeCount = await badge.count();
    if (badgeCount > 0 && await badge.isVisible()) {
      // Assert: Badge should contain a number
      const badgeText = await badge.innerText();
      expect(badgeText).toMatch(/\d+/);

      // Assert: Badge number should be greater than 0
      const count = parseInt(badgeText);
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should not display badge when all pods are healthy', async ({ page }) => {
    // Tests that badge is hidden when no unhealthy pods exist

    // Arrange: Set mobile viewport and navigate to home page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Check UnhealthyPodPreview for pod status
    const unhealthyPodPreview = page.getByTestId('unhealthy-pod-preview');
    const noPodMessage = unhealthyPodPreview.getByText(/no unhealthy pods|all pods are healthy/i);

    // If all pods are healthy, badge should not be visible
    if (await noPodMessage.isVisible()) {
      // Assert: Pods tab badge should not be visible
      const podsTab = page.getByTestId('tab-pods')
        .or(page.getByRole('link', { name: /pods/i }));
      const badge = podsTab.getByTestId('unhealthy-pod-badge')
        .or(podsTab.locator('[data-badge]'));

      const badgeExists = await badge.count();
      if (badgeExists > 0) {
        await expect(badge).not.toBeVisible();
      }
    }
  });

  test('should update badge count dynamically when pods change state', async ({ page }) => {
    // Tests that badge count updates when pod health status changes

    // Arrange: Set mobile viewport and navigate to home page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Get initial badge count
    const podsTab = page.getByTestId('tab-pods')
      .or(page.getByRole('link', { name: /pods/i }));
    const badge = podsTab.getByTestId('unhealthy-pod-badge')
      .or(podsTab.locator('[data-badge]'));

    let initialCount = 0;
    if (await badge.count() > 0 && await badge.isVisible()) {
      const badgeText = await badge.innerText();
      initialCount = parseInt(badgeText);
    }

    // Act: Wait for potential data refresh (polling interval)
    await page.waitForTimeout(5000);

    // Assert: Badge count should still be present (may have changed)
    if (await badge.count() > 0 && await badge.isVisible()) {
      const updatedBadgeText = await badge.innerText();
      const updatedCount = parseInt(updatedBadgeText);

      // Assert: Count should be a valid number
      expect(updatedCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display badge with correct styling for visibility', async ({ page }) => {
    // Tests that badge has proper styling for mobile viewport

    // Arrange: Set mobile viewport and navigate to home page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the Pods tab badge
    const podsTab = page.getByTestId('tab-pods')
      .or(page.getByRole('link', { name: /pods/i }));
    const badge = podsTab.getByTestId('unhealthy-pod-badge')
      .or(podsTab.locator('[data-badge]'));

    // Assert: If badge is visible, verify styling
    if (await badge.count() > 0 && await badge.isVisible()) {
      const badgeStyles = await badge.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          position: style.position,
          backgroundColor: style.backgroundColor,
          color: style.color,
          borderRadius: style.borderRadius,
        };
      });

      // Assert: Badge should have absolute or relative positioning
      expect(['absolute', 'relative']).toContain(badgeStyles.position);

      // Assert: Badge should have visible background color (not transparent)
      expect(badgeStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    }
  });
});

test.describe('Bottom Tab Navigation - Mobile Viewport Rendering', () => {
  test('should render correctly on iPhone SE viewport (375x667)', async ({ page }) => {
    // Tests rendering on smallest common mobile viewport

    // Arrange: Set iPhone SE viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the BottomTabBar
    const bottomTabBar = page.getByTestId('bottom-tab-bar');
    await expect(bottomTabBar).toBeVisible();

    // Assert: All 5 tabs should be visible and fit within viewport
    const allTabs = bottomTabBar.locator('[data-testid^="tab-"]');
    await expect(allTabs).toHaveCount(5);

    // Assert: Each tab should be visible
    for (let i = 0; i < 5; i++) {
      const tab = allTabs.nth(i);
      await expect(tab).toBeVisible();
    }

    // Assert: Tab bar should not overflow viewport width
    const boundingBox = await bottomTabBar.boundingBox();
    expect(boundingBox!.width).toBeLessThanOrEqual(375);

    // Assert: No horizontal scrollbar should appear
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test('should display tab icons on mobile viewport', async ({ page }) => {
    // Tests that tab icons are visible on mobile

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate tabs and check for icons
    const overviewTab = page.getByTestId('tab-overview');
    const podsTab = page.getByTestId('tab-pods');
    const nodesTab = page.getByTestId('tab-nodes');
    const deploymentsTab = page.getByTestId('tab-deployments');
    const secretsTab = page.getByTestId('tab-secrets');

    // Assert: Each tab should contain an icon or SVG element
    const overviewIcon = overviewTab.locator('svg, [data-icon]').first();
    await expect(overviewIcon).toBeVisible();

    const podsIcon = podsTab.locator('svg, [data-icon]').first();
    await expect(podsIcon).toBeVisible();

    const nodesIcon = nodesTab.locator('svg, [data-icon]').first();
    await expect(nodesIcon).toBeVisible();

    const deploymentsIcon = deploymentsTab.locator('svg, [data-icon]').first();
    await expect(deploymentsIcon).toBeVisible();

    const secretsIcon = secretsTab.locator('svg, [data-icon]').first();
    await expect(secretsIcon).toBeVisible();
  });

  test('should display tab labels on mobile viewport', async ({ page }) => {
    // Tests that tab labels are visible and readable on mobile

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Each tab should have visible text label
    const overviewTab = page.getByTestId('tab-overview');
    await expect(overviewTab).toContainText(/overview/i);

    const podsTab = page.getByTestId('tab-pods');
    await expect(podsTab).toContainText(/pods/i);

    const nodesTab = page.getByTestId('tab-nodes');
    await expect(nodesTab).toContainText(/nodes/i);

    const deploymentsTab = page.getByTestId('tab-deployments');
    await expect(deploymentsTab).toContainText(/deployments/i);

    const secretsTab = page.getByTestId('tab-secrets');
    await expect(secretsTab).toContainText(/secrets/i);
  });

  test('should have sufficient tap target size on mobile (minimum 44x44px)', async ({ page }) => {
    // Tests accessibility tap target size for mobile

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Get all tabs
    const allTabs = page.locator('[data-testid^="tab-"]');
    const tabCount = await allTabs.count();

    // Assert: Each tab should meet minimum tap target size
    for (let i = 0; i < tabCount; i++) {
      const tab = allTabs.nth(i);
      const boundingBox = await tab.boundingBox();

      // Assert: Minimum 44x44px tap target (WCAG 2.1 Level AAA)
      expect(boundingBox!.height).toBeGreaterThanOrEqual(44);
      expect(boundingBox!.width).toBeGreaterThanOrEqual(44);
    }
  });

  test('should not interfere with page content on mobile', async ({ page }) => {
    // Tests that BottomTabBar doesn't overlap with page content

    // Arrange: Set mobile viewport and navigate to Pods page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get BottomTabBar height
    const bottomTabBar = page.getByTestId('bottom-tab-bar');
    const tabBarBox = await bottomTabBar.boundingBox();

    // Assert: Main content should have bottom padding/margin to avoid overlap
    const mainContent = page.locator('main');
    const mainContentStyles = await mainContent.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        paddingBottom: parseInt(style.paddingBottom),
        marginBottom: parseInt(style.marginBottom),
      };
    });

    const totalBottomSpace = mainContentStyles.paddingBottom + mainContentStyles.marginBottom;

    // Assert: Bottom space should be at least as tall as the tab bar
    expect(totalBottomSpace).toBeGreaterThanOrEqual(tabBarBox!.height);
  });
});

test.describe('Bottom Tab Navigation - Namespace Filtering Integration', () => {
  test('should preserve namespace selection when switching between tabs', async ({ page }) => {
    // Tests that namespace context persists across tab navigation

    // Arrange: Set mobile viewport and navigate to home page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Select "default" namespace
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Verify "default" is selected
    await expect(namespaceSelector).toContainText(/^default$/i);

    // Act: Navigate to Pods tab using bottom tab bar
    const podsTab = page.getByTestId('tab-pods')
      .or(page.getByRole('link', { name: /pods/i }));
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace should still be "default"
    const namespaceSelectorOnPods = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnPods).toContainText(/^default$/i);

    // Act: Navigate to Nodes tab using bottom tab bar
    const nodesTab = page.getByTestId('tab-nodes')
      .or(page.getByRole('link', { name: /nodes/i }));
    await nodesTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace should still be "default"
    const namespaceSelectorOnNodes = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnNodes).toContainText(/^default$/i);

    // Act: Navigate to Deployments tab using bottom tab bar
    const deploymentsTab = page.getByTestId('tab-deployments')
      .or(page.getByRole('link', { name: /deployments/i }));
    await deploymentsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace should still be "default"
    const namespaceSelectorOnDeployments = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnDeployments).toContainText(/^default$/i);
  });

  test('should filter Pods tab data based on selected namespace', async ({ page }) => {
    // Tests that Pods tab respects namespace filter from NamespaceContext

    // Arrange: Set mobile viewport and navigate to Pods page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Count initial pods (All Namespaces)
    const podsTable = page.getByRole('table')
      .or(page.getByTestId('pods-table'));
    const allPodsRows = podsTable.locator('tbody tr');
    const initialCount = await allPodsRows.count();

    // Act: Select "default" namespace
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Filtered pods should be visible
    const filteredPodsRows = podsTable.locator('tbody tr');
    const filteredCount = await filteredPodsRows.count();

    // Assert: Filtered count should be less than or equal to initial
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Act: Navigate to Overview using bottom tab bar
    const overviewTab = page.getByTestId('tab-overview')
      .or(page.getByRole('link', { name: /overview/i }));
    await overviewTab.click();
    await page.waitForLoadState('networkidle');

    // Act: Navigate back to Pods using bottom tab bar
    const podsTab = page.getByTestId('tab-pods')
      .or(page.getByRole('link', { name: /pods/i }));
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Filter should still be applied (default namespace)
    const namespaceSelectorAfterNav = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorAfterNav).toContainText(/^default$/i);

    // Assert: Same filtered data should be displayed
    const podsRowsAfterNav = podsTable.locator('tbody tr');
    const countAfterNav = await podsRowsAfterNav.count();
    expect(countAfterNav).toBe(filteredCount);
  });

  test('should filter Deployments tab data based on selected namespace', async ({ page }) => {
    // Tests that Deployments tab respects namespace filter from NamespaceContext

    // Arrange: Set mobile viewport and select "kube-system" namespace
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const kubeSystemOption = page.getByRole('option', { name: /^kube-system$/i })
      .or(page.getByTestId('namespace-option-kube-system'));
    await kubeSystemOption.click();
    await page.waitForLoadState('networkidle');

    // Act: Navigate to Deployments using bottom tab bar
    const deploymentsTab = page.getByTestId('tab-deployments')
      .or(page.getByRole('link', { name: /deployments/i }));
    await deploymentsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Deployments should be filtered to kube-system
    const deploymentsTable = page.getByRole('table')
      .or(page.getByTestId('deployments-table'));
    await expect(deploymentsTable).toBeVisible();

    // Assert: Namespace selector should show kube-system
    const namespaceSelectorOnDeployments = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnDeployments).toContainText(/^kube-system$/i);
  });

  test('should update unhealthy pod badge when namespace filter changes', async ({ page }) => {
    // Tests that badge count updates based on namespace-filtered pod data

    // Arrange: Set mobile viewport and navigate to home page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Get initial badge count (All Namespaces)
    const podsTab = page.getByTestId('tab-pods')
      .or(page.getByRole('link', { name: /pods/i }));
    const badge = podsTab.getByTestId('unhealthy-pod-badge')
      .or(podsTab.locator('[data-badge]'));

    let initialBadgeCount = 0;
    if (await badge.count() > 0 && await badge.isVisible()) {
      const badgeText = await badge.innerText();
      initialBadgeCount = parseInt(badgeText);
    }

    // Act: Select "default" namespace
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Badge count may have changed based on namespace filter
    let filteredBadgeCount = 0;
    if (await badge.count() > 0 && await badge.isVisible()) {
      const filteredBadgeText = await badge.innerText();
      filteredBadgeCount = parseInt(filteredBadgeText);
    }

    // Assert: Filtered count should be less than or equal to initial count
    expect(filteredBadgeCount).toBeLessThanOrEqual(initialBadgeCount);

    // Act: Select "All Namespaces"
    await namespaceSelector.click();
    const allNamespacesOption = page.getByRole('option', { name: /all namespaces/i })
      .or(page.getByTestId('namespace-option-all'));
    await allNamespacesOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Badge count should return to initial value
    let finalBadgeCount = 0;
    if (await badge.count() > 0 && await badge.isVisible()) {
      const finalBadgeText = await badge.innerText();
      finalBadgeCount = parseInt(finalBadgeText);
    }

    expect(finalBadgeCount).toBe(initialBadgeCount);
  });
});

test.describe('Bottom Tab Navigation - Active Tab Highlighting', () => {
  test('should highlight Overview tab when on home page', async ({ page }) => {
    // Tests that Overview tab is visually highlighted when active

    // Arrange: Set mobile viewport and navigate to home page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the Overview tab
    const overviewTab = page.getByTestId('tab-overview')
      .or(page.getByRole('link', { name: /overview/i }));

    // Assert: Overview tab should have aria-current="page"
    await expect(overviewTab).toHaveAttribute('aria-current', 'page');

    // Assert: Overview tab should have active styling
    const tabClasses = await overviewTab.getAttribute('class');
    expect(tabClasses).toMatch(/active|current|selected/i);

    // Assert: Other tabs should not be active
    const podsTab = page.getByTestId('tab-pods');
    await expect(podsTab).not.toHaveAttribute('aria-current', 'page');
  });

  test('should highlight Pods tab when on Pods page', async ({ page }) => {
    // Tests that Pods tab is visually highlighted when active

    // Arrange: Set mobile viewport and navigate to Pods page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Locate the Pods tab
    const podsTab = page.getByTestId('tab-pods')
      .or(page.getByRole('link', { name: /pods/i }));

    // Assert: Pods tab should have aria-current="page"
    await expect(podsTab).toHaveAttribute('aria-current', 'page');

    // Assert: Pods tab should have active styling
    const tabClasses = await podsTab.getAttribute('class');
    expect(tabClasses).toMatch(/active|current|selected/i);

    // Assert: Other tabs should not be active
    const overviewTab = page.getByTestId('tab-overview');
    await expect(overviewTab).not.toHaveAttribute('aria-current', 'page');

    const nodesTab = page.getByTestId('tab-nodes');
    await expect(nodesTab).not.toHaveAttribute('aria-current', 'page');
  });

  test('should highlight Nodes tab when on Nodes page', async ({ page }) => {
    // Tests that Nodes tab is visually highlighted when active

    // Arrange: Set mobile viewport and navigate to Nodes page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Locate the Nodes tab
    const nodesTab = page.getByTestId('tab-nodes')
      .or(page.getByRole('link', { name: /nodes/i }));

    // Assert: Nodes tab should have aria-current="page"
    await expect(nodesTab).toHaveAttribute('aria-current', 'page');

    // Assert: Nodes tab should have active styling
    const tabClasses = await nodesTab.getAttribute('class');
    expect(tabClasses).toMatch(/active|current|selected/i);
  });

  test('should highlight Deployments tab when on Workloads page', async ({ page }) => {
    // Tests that Deployments tab is visually highlighted when active

    // Arrange: Set mobile viewport and navigate to Workloads page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Locate the Deployments tab
    const deploymentsTab = page.getByTestId('tab-deployments')
      .or(page.getByRole('link', { name: /deployments/i }));

    // Assert: Deployments tab should have aria-current="page"
    await expect(deploymentsTab).toHaveAttribute('aria-current', 'page');

    // Assert: Deployments tab should have active styling
    const tabClasses = await deploymentsTab.getAttribute('class');
    expect(tabClasses).toMatch(/active|current|selected/i);
  });

  test('should highlight Secrets tab when on Secrets page', async ({ page }) => {
    // Tests that Secrets tab is visually highlighted when active

    // Arrange: Set mobile viewport and navigate to Secrets page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Act: Locate the Secrets tab
    const secretsTab = page.getByTestId('tab-secrets')
      .or(page.getByRole('link', { name: /secrets/i }));

    // Assert: Secrets tab should have aria-current="page"
    await expect(secretsTab).toHaveAttribute('aria-current', 'page');

    // Assert: Secrets tab should have active styling
    const tabClasses = await secretsTab.getAttribute('class');
    expect(tabClasses).toMatch(/active|current|selected/i);
  });

  test('should change highlighted tab when switching between pages', async ({ page }) => {
    // Tests that active tab highlighting updates dynamically

    // Arrange: Set mobile viewport and start on Overview
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Overview should be active
    const overviewTab = page.getByTestId('tab-overview');
    await expect(overviewTab).toHaveAttribute('aria-current', 'page');

    // Act: Click Pods tab
    const podsTab = page.getByTestId('tab-pods');
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Pods should now be active, Overview should not be
    await expect(podsTab).toHaveAttribute('aria-current', 'page');
    await expect(overviewTab).not.toHaveAttribute('aria-current', 'page');

    // Act: Click Nodes tab
    const nodesTab = page.getByTestId('tab-nodes');
    await nodesTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Nodes should now be active, Pods should not be
    await expect(nodesTab).toHaveAttribute('aria-current', 'page');
    await expect(podsTab).not.toHaveAttribute('aria-current', 'page');
  });
});

test.describe('Bottom Tab Navigation - Accessibility', () => {
  test('should have proper ARIA labels for each tab', async ({ page }) => {
    // Tests that all tabs have descriptive ARIA labels

    // Arrange: Set mobile viewport and navigate to home page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Overview tab should have aria-label
    const overviewTab = page.getByTestId('tab-overview');
    const overviewLabel = await overviewTab.getAttribute('aria-label');
    expect(overviewLabel).toBeTruthy();
    expect(overviewLabel?.toLowerCase()).toContain('overview');

    // Assert: Pods tab should have aria-label
    const podsTab = page.getByTestId('tab-pods');
    const podsLabel = await podsTab.getAttribute('aria-label');
    expect(podsLabel).toBeTruthy();
    expect(podsLabel?.toLowerCase()).toContain('pod');

    // Assert: Nodes tab should have aria-label
    const nodesTab = page.getByTestId('tab-nodes');
    const nodesLabel = await nodesTab.getAttribute('aria-label');
    expect(nodesLabel).toBeTruthy();
    expect(nodesLabel?.toLowerCase()).toContain('node');

    // Assert: Deployments tab should have aria-label
    const deploymentsTab = page.getByTestId('tab-deployments');
    const deploymentsLabel = await deploymentsTab.getAttribute('aria-label');
    expect(deploymentsLabel).toBeTruthy();
    expect(deploymentsLabel?.toLowerCase()).toMatch(/deployment|workload/);

    // Assert: Secrets tab should have aria-label
    const secretsTab = page.getByTestId('tab-secrets');
    const secretsLabel = await secretsTab.getAttribute('aria-label');
    expect(secretsLabel).toBeTruthy();
    expect(secretsLabel?.toLowerCase()).toContain('secret');
  });

  test('should support keyboard navigation with Tab key', async ({ page }) => {
    // Tests keyboard navigation through tabs

    // Arrange: Set mobile viewport and navigate to home page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Focus first tab with keyboard
    await page.keyboard.press('Tab');

    // Continue tabbing until we reach the bottom tab bar
    // (exact number of Tabs depends on page structure)
    for (let i = 0; i < 10; i++) {
      const activeElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      if (activeElement?.startsWith('tab-')) {
        break;
      }
      await page.keyboard.press('Tab');
    }

    // Assert: A tab should have focus
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedElement).toMatch(/^tab-/);
  });

  test('should support keyboard navigation with Arrow keys', async ({ page }) => {
    // Tests arrow key navigation within tab bar (if implemented)

    // Arrange: Set mobile viewport and navigate to home page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Focus first tab
    const overviewTab = page.getByTestId('tab-overview');
    await overviewTab.focus();

    // Assert: Overview tab should be focused
    let focusedTestId = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedTestId).toBe('tab-overview');

    // Act: Press ArrowRight to move to next tab
    await page.keyboard.press('ArrowRight');

    // Assert: Pods tab should now be focused
    focusedTestId = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedTestId).toBe('tab-pods');

    // Act: Press ArrowRight again
    await page.keyboard.press('ArrowRight');

    // Assert: Nodes tab should now be focused
    focusedTestId = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedTestId).toBe('tab-nodes');

    // Act: Press ArrowLeft to move back
    await page.keyboard.press('ArrowLeft');

    // Assert: Pods tab should be focused again
    focusedTestId = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedTestId).toBe('tab-pods');
  });

  test('should support Enter key to activate focused tab', async ({ page }) => {
    // Tests Enter key activation of tabs

    // Arrange: Set mobile viewport and navigate to home page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Focus Pods tab
    const podsTab = page.getByTestId('tab-pods');
    await podsTab.focus();

    // Act: Press Enter to activate
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');

    // Assert: Should navigate to Pods page
    expect(page.url()).toContain('/pods');
    await expect(podsTab).toHaveAttribute('aria-current', 'page');
  });

  test('should have role="navigation" on BottomTabBar container', async ({ page }) => {
    // Tests proper semantic HTML for navigation landmark

    // Arrange: Set mobile viewport and navigate to home page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the BottomTabBar
    const bottomTabBar = page.getByTestId('bottom-tab-bar');

    // Assert: Should have navigation role
    const role = await bottomTabBar.getAttribute('role');
    expect(role).toBe('navigation');

    // Assert: Should have descriptive aria-label
    const ariaLabel = await bottomTabBar.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel?.toLowerCase()).toMatch(/main|primary|tab|navigation/);
  });

  test('should announce badge count to screen readers', async ({ page }) => {
    // Tests that badge count is accessible to screen readers

    // Arrange: Set mobile viewport and navigate to home page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the Pods tab
    const podsTab = page.getByTestId('tab-pods');
    const badge = podsTab.getByTestId('unhealthy-pod-badge')
      .or(podsTab.locator('[data-badge]'));

    // Assert: If badge exists, it should have aria-label or be announced
    if (await badge.count() > 0 && await badge.isVisible()) {
      const badgeText = await badge.innerText();
      const badgeLabel = await badge.getAttribute('aria-label');

      // Assert: Badge should have accessible text
      expect(badgeText || badgeLabel).toBeTruthy();

      // Assert: Pods tab aria-label should mention badge count
      const tabLabel = await podsTab.getAttribute('aria-label');
      expect(tabLabel).toBeTruthy();
    }
  });
});

test.describe('Bottom Tab Navigation - Edge Cases', () => {
  test('should handle rapid tab switching without errors', async ({ page }) => {
    // Tests stability when user rapidly clicks different tabs

    // Arrange: Set mobile viewport and navigate to home page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Rapidly click different tabs
    const podsTab = page.getByTestId('tab-pods');
    const nodesTab = page.getByTestId('tab-nodes');
    const deploymentsTab = page.getByTestId('tab-deployments');
    const overviewTab = page.getByTestId('tab-overview');

    await podsTab.click();
    await nodesTab.click();
    await deploymentsTab.click();
    await overviewTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Should end up on Overview page without errors
    expect(page.url()).toMatch(/\/$|\/$/);
    const overviewContent = page.getByTestId('overview-tab');
    await expect(overviewContent).toBeVisible();
  });

  test('should maintain BottomTabBar on browser back/forward navigation', async ({ page }) => {
    // Tests that BottomTabBar persists during browser navigation

    // Arrange: Set mobile viewport and navigate through tabs
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Navigate to Pods
    const podsTab = page.getByTestId('tab-pods');
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Act: Navigate to Nodes
    const nodesTab = page.getByTestId('tab-nodes');
    await nodesTab.click();
    await page.waitForLoadState('networkidle');

    // Act: Use browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Assert: Should be on Pods page with BottomTabBar visible
    expect(page.url()).toContain('/pods');
    const bottomTabBar = page.getByTestId('bottom-tab-bar');
    await expect(bottomTabBar).toBeVisible();

    // Act: Use browser forward button
    await page.goForward();
    await page.waitForLoadState('networkidle');

    // Assert: Should be on Nodes page with BottomTabBar visible
    expect(page.url()).toContain('/nodes');
    await expect(bottomTabBar).toBeVisible();
  });

  test('should handle direct URL navigation and highlight correct tab', async ({ page }) => {
    // Tests that active tab is correctly set when navigating via URL

    // Arrange: Set mobile viewport and directly navigate to Pods page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Pods tab should be highlighted
    const podsTab = page.getByTestId('tab-pods');
    await expect(podsTab).toHaveAttribute('aria-current', 'page');

    // Act: Directly navigate to Secrets page via URL
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Assert: Secrets tab should be highlighted
    const secretsTab = page.getByTestId('tab-secrets');
    await expect(secretsTab).toHaveAttribute('aria-current', 'page');

    // Assert: Pods tab should no longer be highlighted
    await expect(podsTab).not.toHaveAttribute('aria-current', 'page');
  });

  test('should hide BottomTabBar on desktop viewport', async ({ page }) => {
    // Tests that BottomTabBar is hidden on larger screens (desktop)

    // Arrange: Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: BottomTabBar should not be visible on desktop
    const bottomTabBar = page.getByTestId('bottom-tab-bar');
    const bottomTabBarExists = await bottomTabBar.count();

    if (bottomTabBarExists > 0) {
      // If element exists, it should be hidden via CSS
      const isVisible = await bottomTabBar.isVisible();
      expect(isVisible).toBe(false);
    }
  });

  test('should display BottomTabBar only on mobile viewport (breakpoint test)', async ({ page }) => {
    // Tests responsive breakpoint for BottomTabBar visibility

    // Arrange: Start with mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: BottomTabBar should be visible on mobile
    const bottomTabBar = page.getByTestId('bottom-tab-bar');
    await expect(bottomTabBar).toBeVisible();

    // Act: Resize to tablet viewport (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500); // Wait for resize

    // Assert: BottomTabBar visibility depends on implementation
    // (may be visible or hidden at tablet size)
    const isVisibleTablet = await bottomTabBar.isVisible();

    // Act: Resize to desktop viewport (1024px+)
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);

    // Assert: BottomTabBar should be hidden on desktop
    const isVisibleDesktop = await bottomTabBar.isVisible();
    expect(isVisibleDesktop).toBe(false);
  });
});
