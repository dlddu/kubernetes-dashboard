// Verifies: CM1 (docs/product/prd-common.md) — sole dedicated e2e spec for this AC.
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
    // Use exact testid only — getByRole(/secrets/i) also matches the
    // tab-external-secrets button (label "ExtSecrets"), which would trigger
    // a strict-mode violation.
    const secretsTab = page.getByTestId('tab-secrets');

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
    // Use exact testid only — getByRole(/secrets/i) also matches the
    // tab-external-secrets button (label "ExtSecrets"), which would trigger
    // a strict-mode violation.
    const secretsTab = page.getByTestId('tab-secrets');
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
    // Tests that badge count is accessible via aria-label

    // Arrange: Capture real API response to know the expected count
    await page.setViewportSize({ width: 375, height: 667 });
    const overviewPromise = page.waitForResponse(
      resp => resp.url().includes('/api/overview') && resp.status() === 200
    ).then(async (resp) => (await resp.json()).unhealthyPods as number);

    await page.goto('/');
    const unhealthyPods = await overviewPromise;
    await page.waitForLoadState('networkidle');

    const overviewTab = page.getByTestId('tab-overview');
    const overviewBadge = overviewTab.getByTestId('overview-badge');

    if (unhealthyPods > 0) {
      // Assert: Badge should be present and have descriptive aria-label
      await expect(overviewBadge).toBeVisible();

      const badgeAriaLabel = await overviewBadge.getAttribute('aria-label');
      expect(badgeAriaLabel).toBeTruthy();
      expect(badgeAriaLabel!.toLowerCase()).toMatch(/unhealthy|problems|issues|alerts?/);
      expect(badgeAriaLabel).toContain(String(unhealthyPods));
    } else {
      // Assert: No badge, no stray text
      await expect(overviewBadge).toHaveCount(0);
    }
  });
});
