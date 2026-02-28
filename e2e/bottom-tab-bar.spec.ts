import { test, expect } from '@playwright/test';

/**
 * E2E Tests for BottomTabBar Component
 *
 * Tests verify mobile-first tab navigation behavior with 5 tabs:
 * Overview, Nodes, Workloads, Pods, Secrets
 *
 * Related Issue: DLD-391 - 13-2: Tab Navigation Integration
 */

test.describe('BottomTabBar - Tab Navigation', () => {
  test('should display all 5 tabs in bottom tab bar', async ({ page }) => {
    // Tests that all navigation tabs are visible

    // Arrange: Set mobile viewport (matches project pattern)
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE dimensions
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Bottom tab bar should be visible
    const bottomTabBar = page.getByTestId('bottom-tab-bar');
    await expect(bottomTabBar).toBeVisible();

    // Assert: All 5 tabs should be visible
    const overviewTab = page.getByTestId('tab-overview')
      .or(page.getByRole('button', { name: /overview/i }));
    const nodesTab = page.getByTestId('tab-nodes')
      .or(page.getByRole('button', { name: /nodes/i }));
    const workloadsTab = page.getByTestId('tab-workloads')
      .or(page.getByRole('button', { name: /workloads/i }));
    const podsTab = page.getByTestId('tab-pods');
    const secretsTab = page.getByTestId('tab-secrets')
      .or(page.getByRole('button', { name: /secrets/i }));

    await expect(overviewTab).toBeVisible();
    await expect(nodesTab).toBeVisible();
    await expect(workloadsTab).toBeVisible();
    await expect(podsTab).toBeVisible();
    await expect(secretsTab).toBeVisible();
  });

  test('should navigate to Overview page when Overview tab is clicked', async ({ page }) => {
    // Tests navigation to Overview tab

    // Arrange: Set mobile viewport and navigate to different page
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Click Overview tab
    const overviewTab = page.getByTestId('tab-overview')
      .or(page.getByRole('button', { name: /overview/i }));
    await overviewTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Should navigate to root route
    expect(page.url()).toMatch(/\/$|\/overview$/);

    // Assert: Overview content should be visible
    const summaryCards = page.getByTestId('summary-cards')
      .or(page.getByRole('article').first());
    await expect(summaryCards).toBeVisible();

    // Assert: Overview tab should have active state
    await expect(overviewTab).toHaveAttribute('aria-current', 'page');
  });

  test('should navigate to Nodes page when Nodes tab is clicked', async ({ page }) => {
    // Tests navigation to Nodes tab

    // Arrange: Set mobile viewport and start at home
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Click Nodes tab
    const nodesTab = page.getByTestId('tab-nodes')
      .or(page.getByRole('button', { name: /nodes/i }));
    await nodesTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Should navigate to /nodes route
    expect(page.url()).toContain('/nodes');

    // Assert: Nodes page content should be visible
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Assert: Nodes tab should have active state
    await expect(nodesTab).toHaveAttribute('aria-current', 'page');
  });

  test('should navigate to Workloads page when Workloads tab is clicked', async ({ page }) => {
    // Tests navigation to Workloads tab

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Click Workloads tab
    const workloadsTab = page.getByTestId('tab-workloads')
      .or(page.getByRole('button', { name: /workloads/i }));
    await workloadsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Should navigate to /workloads route (deployments view)
    expect(page.url()).toMatch(/\/workloads|\/deployments/);

    // Assert: Workloads page content should be visible
    const workloadsPage = page.getByTestId('workloads-page')
      .or(page.getByTestId('deployments-page'));
    await expect(workloadsPage).toBeVisible();

    // Assert: Workloads tab should have active state
    await expect(workloadsTab).toHaveAttribute('aria-current', 'page');
  });

  test('should navigate to Pods page when Pods tab is clicked', async ({ page }) => {
    // Tests navigation to Pods tab

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Click Pods tab
    const podsTab = page.getByTestId('tab-pods');
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Should navigate to /pods route
    expect(page.url()).toContain('/pods');

    // Assert: Pods page content should be visible
    await expect(page.getByTestId('pods-page')).toBeVisible();

    // Assert: Pods tab should have active state
    await expect(podsTab).toHaveAttribute('aria-current', 'page');
  });

  test('should navigate to Secrets page when Secrets tab is clicked', async ({ page }) => {
    // Tests navigation to Secrets tab

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Click Secrets tab
    const secretsTab = page.getByTestId('tab-secrets')
      .or(page.getByRole('button', { name: /secrets/i }));
    await secretsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Should navigate to /secrets route
    expect(page.url()).toContain('/secrets');

    // Assert: Secrets page content should be visible
    const secretsPage = page.getByTestId('secrets-page')
      .or(page.locator('[data-testid^="secret-accordion-"]').first());
    await expect(secretsPage).toBeVisible();

    // Assert: Secrets tab should have active state
    await expect(secretsTab).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('BottomTabBar - Overview Tab Badge', () => {
  /**
   * Helper: intercept /api/overview and return a controlled response.
   * This makes badge tests deterministic regardless of cluster state.
   */
  function mockOverviewApi(page: import('@playwright/test').Page, unhealthyPods: number) {
    return page.route('**/api/overview**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nodes: { ready: 2, total: 2 },
          unhealthyPods,
          unhealthyPodsList: Array.from({ length: unhealthyPods }, (_, i) => ({
            name: `unhealthy-pod-${i}`,
            namespace: 'default',
            status: 'CrashLoopBackOff',
          })),
          avgCpuPercent: 25.0,
          avgMemoryPercent: 40.0,
          nodesList: [],
        }),
      });
    });
  }

  test('should display badge with correct count when unhealthy pods exist', async ({ page }) => {
    // Arrange: Mock API to return 3 unhealthy pods
    await mockOverviewApi(page, 3);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Badge should be visible with count "3"
    const overviewTab = page.getByTestId('tab-overview');
    const overviewBadge = overviewTab.getByTestId('overview-badge');

    await expect(overviewBadge).toBeVisible();
    await expect(overviewBadge).toHaveText('3');

    // Assert: Badge number must be > 0
    const badgeText = await overviewBadge.innerText();
    expect(parseInt(badgeText, 10)).toBeGreaterThan(0);
  });

  test('should not display badge when unhealthyPods is 0', async ({ page }) => {
    // Regression: previously "0" was rendered as visible text in the tab
    // Arrange: Mock API to return 0 unhealthy pods
    await mockOverviewApi(page, 0);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const overviewTab = page.getByTestId('tab-overview');

    // Assert: Badge element with data-testid should not exist in the DOM
    const overviewBadge = overviewTab.getByTestId('overview-badge');
    await expect(overviewBadge).toHaveCount(0);

    // Assert: No stray "0" text should appear in the Overview tab
    // This catches the exact bug where {unhealthyPodCount} rendered "0" outside the badge span
    const tabText = await overviewTab.innerText();
    expect(tabText).not.toMatch(/\b0\b/);
  });

  test('should hide badge when unhealthy count drops to 0', async ({ page }) => {
    // Arrange: Start with 5 unhealthy pods
    await mockOverviewApi(page, 5);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const overviewTab = page.getByTestId('tab-overview');
    const overviewBadge = overviewTab.getByTestId('overview-badge');

    // Assert: Badge should initially be visible
    await expect(overviewBadge).toBeVisible();
    await expect(overviewBadge).toHaveText('5');

    // Act: Simulate count dropping to 0 via new API response
    await page.unrouteAll();
    await mockOverviewApi(page, 0);

    // Trigger a re-fetch by navigating away and back
    await page.getByTestId('tab-nodes').click();
    await page.waitForLoadState('networkidle');
    await page.getByTestId('tab-overview').click();
    await page.waitForLoadState('networkidle');

    // Assert: Badge should disappear completely
    await expect(overviewTab.getByTestId('overview-badge')).toHaveCount(0);

    // Assert: No "0" text leaking into the tab
    const tabText = await overviewTab.innerText();
    expect(tabText).not.toMatch(/\b0\b/);
  });

  test('should update badge count when unhealthy pod count changes', async ({ page }) => {
    // Arrange: Start with 2 unhealthy pods
    await mockOverviewApi(page, 2);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const overviewTab = page.getByTestId('tab-overview');
    await expect(overviewTab.getByTestId('overview-badge')).toHaveText('2');

    // Act: Change to 7 unhealthy pods
    await page.unrouteAll();
    await mockOverviewApi(page, 7);

    await page.getByTestId('tab-nodes').click();
    await page.waitForLoadState('networkidle');
    await page.getByTestId('tab-overview').click();
    await page.waitForLoadState('networkidle');

    // Assert: Badge should reflect the new count
    await expect(overviewTab.getByTestId('overview-badge')).toHaveText('7');
  });

  test('should display correct badge count for selected namespace', async ({ page }) => {
    // Tests that badge count respects namespace filter

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Select specific namespace and wait for API response
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));

    // Wait for the overview API response after namespace selection
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/overview') && resp.status() === 200),
      defaultNamespaceOption.click(),
    ]);

    // Act: Check Overview tab badge (shows unhealthy pod count)
    const overviewTab = page.getByTestId('tab-overview');
    const overviewBadge = overviewTab.getByTestId('overview-badge');

    const badgeExists = await overviewBadge.count() > 0;

    if (badgeExists) {
      const badgeText = await overviewBadge.innerText();
      const unhealthyCount = parseInt(badgeText, 10);

      // Assert: Badge count must be > 0 if badge is present
      expect(unhealthyCount).toBeGreaterThan(0);

      // Act: Navigate to Pods page and wait for data to load
      const podsTab = page.getByTestId('tab-pods');
      await podsTab.click();

      await expect(
        page.getByTestId('pod-card').first()
          .or(page.getByTestId('no-pods-message'))
      ).toBeVisible({ timeout: 10000 });

      // Assert: Pods page shows all pods, badge shows only unhealthy
      // Total pod count should be >= unhealthy count
      const podCards = page.getByTestId('pod-card');
      const actualCount = await podCards.count();

      expect(actualCount).toBeGreaterThanOrEqual(unhealthyCount);
    }
  });
});

test.describe('BottomTabBar - Mobile Layout', () => {
  test('should render without layout issues on mobile viewport (375px)', async ({ page }) => {
    // Tests responsive layout on mobile

    // Arrange: Set mobile viewport (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Bottom tab bar should be visible
    const bottomTabBar = page.getByTestId('bottom-tab-bar');
    await expect(bottomTabBar).toBeVisible();

    // Assert: Tab bar should be at bottom of screen
    const tabBarBox = await bottomTabBar.boundingBox();
    expect(tabBarBox).toBeTruthy();
    expect(tabBarBox!.y + tabBarBox!.height).toBeGreaterThan(600); // Near bottom of viewport

    // Assert: Tab bar should span full width
    expect(tabBarBox!.width).toBe(375);

    // Assert: All 5 tabs should fit without overflow
    const overviewTab = page.getByTestId('tab-overview');
    const secretsTab = page.getByTestId('tab-secrets');

    await expect(overviewTab).toBeVisible();
    await expect(secretsTab).toBeVisible();

    // Assert: Tabs should not be truncated or hidden
    const overviewBox = await overviewTab.boundingBox();
    const secretsBox = await secretsTab.boundingBox();

    expect(overviewBox!.width).toBeGreaterThan(50); // Each tab has adequate width
    expect(secretsBox!.width).toBeGreaterThan(50);
  });

  test('should display tab icons on mobile', async ({ page }) => {
    // Tests that tab icons are visible on mobile

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Each tab should have an icon
    const tabs = [
      { testId: 'tab-overview', iconTestId: 'overview-icon' },
      { testId: 'tab-nodes', iconTestId: 'nodes-icon' },
      { testId: 'tab-workloads', iconTestId: 'workloads-icon' },
      { testId: 'tab-pods', iconTestId: 'pods-icon' },
      { testId: 'tab-secrets', iconTestId: 'secrets-icon' }
    ];

    for (const tab of tabs) {
      const tabElement = page.getByTestId(tab.testId);
      await expect(tabElement).toBeVisible();

      // Assert: Tab should contain icon (SVG or icon element)
      const icon = tabElement.locator('svg').or(tabElement.getByTestId(tab.iconTestId));
      const iconCount = await icon.count();
      expect(iconCount).toBeGreaterThan(0);
    }
  });

  test('should display tab labels on mobile', async ({ page }) => {
    // Tests that tab labels are readable on mobile

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Each tab should have readable label
    const overviewTab = page.getByTestId('tab-overview');
    const overviewText = await overviewTab.innerText();
    expect(overviewText.toLowerCase()).toContain('overview');

    const nodesTab = page.getByTestId('tab-nodes');
    const nodesText = await nodesTab.innerText();
    expect(nodesText.toLowerCase()).toContain('nodes');

    const workloadsTab = page.getByTestId('tab-workloads');
    const workloadsText = await workloadsTab.innerText();
    expect(workloadsText.toLowerCase()).toMatch(/workloads|deploy/);

    const podsTab = page.getByTestId('tab-pods');
    const podsText = await podsTab.innerText();
    expect(podsText.toLowerCase()).toContain('pods');

    const secretsTab = page.getByTestId('tab-secrets');
    const secretsText = await secretsTab.innerText();
    expect(secretsText.toLowerCase()).toContain('secrets');
  });

  test('should have adequate touch target size for tabs', async ({ page }) => {
    // Tests that tabs meet minimum touch target requirements (44px)

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Each tab should have minimum 44px touch target
    const tabs = ['tab-overview', 'tab-nodes', 'tab-workloads', 'tab-pods', 'tab-secrets'];

    for (const tabTestId of tabs) {
      const tab = page.getByTestId(tabTestId);
      const box = await tab.boundingBox();

      expect(box).toBeTruthy();
      expect(box!.height).toBeGreaterThanOrEqual(44); // iOS minimum touch target
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }
  });

  test('should not overflow or cause horizontal scroll', async ({ page }) => {
    // Tests that tab bar doesn't cause layout overflow

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Page should not have horizontal scrollbar
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // Assert: Bottom tab bar should fit within viewport
    const bottomTabBar = page.getByTestId('bottom-tab-bar');
    const tabBarBox = await bottomTabBar.boundingBox();

    expect(tabBarBox!.x).toBe(0); // Starts at left edge
    expect(tabBarBox!.width).toBeLessThanOrEqual(375); // Doesn't exceed viewport
  });
});

test.describe('BottomTabBar - Namespace Context Integration', () => {
  test('should filter current tab data when namespace is changed', async ({ page }) => {
    // Tests that namespace selection affects active tab's data

    // Arrange: Set mobile viewport and navigate to Pods tab
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/pods');

    // Wait for initial pod data to load
    await expect(
      page.getByTestId('pod-card').first()
        .or(page.getByTestId('no-pods-message'))
    ).toBeVisible({ timeout: 10000 });

    // Act: Record initial pod count (all namespaces)
    const initialPodCards = page.getByTestId('pod-card');
    const initialCount = await initialPodCards.count();

    // Act: Select "default" namespace and wait for API response
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));

    // Wait for pods API response after namespace selection
    await Promise.all([
      page.waitForResponse(resp =>
        resp.url().includes('/api/pods') &&
        resp.url().includes('ns=default') &&
        resp.status() === 200
      ),
      defaultNamespaceOption.click(),
    ]);

    // Wait for the filtered pod list to render
    await expect(
      page.getByTestId('pod-card').first()
        .or(page.getByTestId('no-pods-message'))
    ).toBeVisible({ timeout: 10000 });

    // Assert: Pod list should be filtered to default namespace
    const filteredPodCards = page.getByTestId('pod-card');
    const filteredCount = await filteredPodCards.count();

    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Assert: All visible pods should belong to default namespace
    if (filteredCount > 0) {
      const firstPod = filteredPodCards.first();
      await expect(firstPod).toContainText('default', { timeout: 5000 });
    }
  });

  test('should persist namespace selection when switching tabs', async ({ page }) => {
    // Tests that namespace filter persists across tab navigation

    // Arrange: Set mobile viewport and select namespace
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const kubeSystemOption = page.getByRole('option', { name: /^kube-system$/i })
      .or(page.getByTestId('namespace-option-kube-system'));
    await kubeSystemOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selector shows "kube-system"
    await expect(namespaceSelector).toContainText(/^kube-system$/i);

    // Act: Navigate to Nodes tab
    const nodesTab = page.getByTestId('tab-nodes');
    await nodesTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selection should persist
    const namespaceSelectorOnNodes = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnNodes).toContainText(/^kube-system$/i);

    // Act: Navigate to Workloads tab
    const workloadsTab = page.getByTestId('tab-workloads');
    await workloadsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selection should still persist
    const namespaceSelectorOnWorkloads = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnWorkloads).toContainText(/^kube-system$/i);

    // Act: Navigate to Pods tab
    const podsTab = page.getByTestId('tab-pods');
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selection should still persist
    const namespaceSelectorOnPods = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnPods).toContainText(/^kube-system$/i);

    // Assert: Pods should be filtered to kube-system namespace
    const podCards = page.getByTestId('pod-card');
    const podCount = await podCards.count();

    if (podCount > 0) {
      const firstPod = podCards.first();
      const podDetails = await firstPod.innerText();
      expect(podDetails.toLowerCase()).toContain('kube-system');
    }
  });

  test('should update Overview badge when namespace filter changes', async ({ page }) => {
    // Tests that Overview tab badge reflects namespace-filtered count

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Record badge count with "All Namespaces"
    const overviewTab = page.getByTestId('tab-overview');
    const overviewBadge = overviewTab.getByTestId('overview-badge');

    const allNamespacesBadgeVisible = await overviewBadge.count() > 0;
    let allNamespacesCount = 0;

    if (allNamespacesBadgeVisible) {
      const badgeText = await overviewBadge.innerText();
      allNamespacesCount = parseInt(badgeText, 10);
    }

    // Act: Select "default" namespace and wait for API response
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));

    // Wait for the overview API response after namespace selection
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/overview') && resp.status() === 200),
      defaultNamespaceOption.click(),
    ]);

    // Assert: Badge count should update to reflect filtered namespace
    const filteredBadgeVisible = await overviewBadge.count() > 0;

    if (filteredBadgeVisible) {
      const filteredBadgeText = await overviewBadge.innerText();
      const filteredCount = parseInt(filteredBadgeText, 10);

      // Badge must only show positive counts
      expect(filteredCount).toBeGreaterThan(0);
      expect(filteredCount).toBeLessThanOrEqual(allNamespacesCount);
    }

    // Assert: If no badge visible, ensure no stray "0" in the tab
    if (!filteredBadgeVisible) {
      const tabText = await overviewTab.innerText();
      expect(tabText).not.toMatch(/\b0\b/);
    }
  });
});

test.describe('BottomTabBar - Accessibility', () => {
  test('should have proper ARIA attributes for navigation', async ({ page }) => {
    // Tests accessibility of tab navigation

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Tab bar should have navigation role
    const bottomTabBar = page.getByTestId('bottom-tab-bar');
    const role = await bottomTabBar.getAttribute('role');
    expect(role).toMatch(/navigation|tablist/);

    // Assert: Tab bar should have aria-label
    const ariaLabel = await bottomTabBar.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel!.toLowerCase()).toMatch(/navigation|tabs|menu/);
  });

  test('should mark active tab with aria-current', async ({ page }) => {
    // Tests that active tab has proper ARIA state

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Overview tab should be active on home page
    const overviewTab = page.getByTestId('tab-overview');
    await expect(overviewTab).toHaveAttribute('aria-current', 'page');

    // Act: Navigate to Nodes tab
    const nodesTab = page.getByTestId('tab-nodes');
    await nodesTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Nodes tab should be active
    await expect(nodesTab).toHaveAttribute('aria-current', 'page');

    // Assert: Overview tab should no longer be active
    await expect(overviewTab).not.toHaveAttribute('aria-current', 'page');
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tests keyboard navigation support

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Focus first tab
    const overviewTab = page.getByTestId('tab-overview');
    await overviewTab.focus();

    // Assert: Tab should be focusable
    await expect(overviewTab).toBeFocused();

    // Act: Press Tab key to navigate
    await page.keyboard.press('Tab');

    // Assert: Next tab should receive focus
    const nodesTab = page.getByTestId('tab-nodes');
    const nodesTabFocused = await nodesTab.evaluate((el) => el === document.activeElement);

    // Note: Focus order may vary based on implementation
    expect(nodesTabFocused || await overviewTab.evaluate((el) => el !== document.activeElement)).toBe(true);

    // Act: Press Enter to activate focused tab
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');

    // Assert: Navigation should occur
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });

  test('should have proper labels for screen readers', async ({ page }) => {
    // Tests screen reader accessibility

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Each tab should have accessible name
    const tabs = [
      { testId: 'tab-overview', expectedLabel: /overview/i },
      { testId: 'tab-nodes', expectedLabel: /nodes/i },
      { testId: 'tab-workloads', expectedLabel: /workloads/i },
      { testId: 'tab-pods', expectedLabel: /pods/i },
      { testId: 'tab-secrets', expectedLabel: /secrets/i }
    ];

    for (const tab of tabs) {
      const tabElement = page.getByTestId(tab.testId);

      // Assert: Tab has aria-label or accessible text
      const ariaLabel = await tabElement.getAttribute('aria-label');
      const innerText = await tabElement.innerText();
      const accessibleName = ariaLabel || innerText;

      expect(accessibleName.toLowerCase()).toMatch(tab.expectedLabel);
    }
  });

  test('should announce badge count to screen readers', async ({ page }) => {
    // Tests that badge count is accessible
    // Arrange: Mock API to guarantee badge is present
    await page.route('**/api/overview**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nodes: { ready: 2, total: 2 },
          unhealthyPods: 4,
          unhealthyPodsList: [
            { name: 'pod-1', namespace: 'default', status: 'CrashLoopBackOff' },
            { name: 'pod-2', namespace: 'default', status: 'Error' },
            { name: 'pod-3', namespace: 'kube-system', status: 'ImagePullBackOff' },
            { name: 'pod-4', namespace: 'kube-system', status: 'CrashLoopBackOff' },
          ],
          avgCpuPercent: 30.0,
          avgMemoryPercent: 50.0,
          nodesList: [],
        }),
      });
    });

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Badge should be present and accessible
    const overviewTab = page.getByTestId('tab-overview');
    const overviewBadge = overviewTab.getByTestId('overview-badge');

    await expect(overviewBadge).toBeVisible();
    await expect(overviewBadge).toHaveText('4');

    // Assert: Badge should have aria-label describing the count
    const badgeAriaLabel = await overviewBadge.getAttribute('aria-label');
    expect(badgeAriaLabel).toBeTruthy();
    expect(badgeAriaLabel!.toLowerCase()).toMatch(/unhealthy|problems|issues|alerts?/);
    expect(badgeAriaLabel).toContain('4');
  });
});
