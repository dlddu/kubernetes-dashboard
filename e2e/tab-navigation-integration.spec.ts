import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Tab Navigation Integration
 *
 * TDD Red Phase: Tests written - components not yet implemented.
 * These tests define the expected behavior of the BottomTabBar component
 * and its integration with tab navigation, namespace filtering, and mobile layout.
 *
 * Related Issue: DLD-339 - 12-1: [탭 네비게이션 통합] e2e 테스트 작성 (skipped)
 *
 * Components to be tested (pending implementation):
 * - BottomTabBar: Mobile tab navigation component
 * - LoadingSkeleton: Loading state component
 * - ErrorRetry: Error state with retry functionality
 * - EmptyState: Empty data state component
 */

// Set mobile viewport for all tests in this file
test.use({ viewport: { width: 375, height: 812 } });

test.describe('Tab Navigation - Basic Tab Switching', () => {
  test.skip('should display BottomTabBar with 5 tabs on mobile viewport', async ({ page }) => {
    // Tests that BottomTabBar renders all 5 tabs correctly

    // Arrange: Navigate to home page with mobile viewport
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: BottomTabBar should be visible
    const bottomTabBar = page.getByTestId('bottom-tab-bar');
    await expect(bottomTabBar).toBeVisible();

    // Assert: All 5 tab buttons should be visible
    const overviewTab = page.getByTestId('tab-button-overview');
    const nodesTab = page.getByTestId('tab-button-nodes');
    const workloadsTab = page.getByTestId('tab-button-workloads');
    const podsTab = page.getByTestId('tab-button-pods');
    const secretsTab = page.getByTestId('tab-button-secrets');

    await expect(overviewTab).toBeVisible();
    await expect(nodesTab).toBeVisible();
    await expect(workloadsTab).toBeVisible();
    await expect(podsTab).toBeVisible();
    await expect(secretsTab).toBeVisible();

    // Assert: Tab bar should have navigation role
    await expect(bottomTabBar).toHaveAttribute('role', 'navigation');
  });

  test.skip('should switch to Overview tab when Overview button is clicked', async ({ page }) => {
    // Tests navigation to Overview tab displays cluster summary

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Click Overview tab button
    const overviewTab = page.getByTestId('tab-button-overview');
    await overviewTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: URL should reflect overview route
    expect(page.url()).toMatch(/\/(overview)?$/);

    // Assert: Overview page should be visible
    const overviewPage = page.getByTestId('overview-page');
    await expect(overviewPage).toBeVisible();

    // Assert: Overview tab should be marked as active
    await expect(overviewTab).toHaveAttribute('aria-current', 'page');
  });

  test.skip('should switch to Nodes tab when Nodes button is clicked', async ({ page }) => {
    // Tests navigation to Nodes tab displays node list

    // Arrange: Start from Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Click Nodes tab button
    const nodesTab = page.getByTestId('tab-button-nodes');
    await nodesTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: URL should reflect nodes route
    expect(page.url()).toContain('/nodes');

    // Assert: Nodes page should be visible
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Assert: Nodes tab should be marked as active
    await expect(nodesTab).toHaveAttribute('aria-current', 'page');

    // Assert: Node cards should be displayed
    const nodeCards = page.getByTestId('node-card');
    expect(await nodeCards.count()).toBeGreaterThanOrEqual(1);
  });

  test.skip('should switch to Workloads tab when Workloads button is clicked', async ({ page }) => {
    // Tests navigation to Workloads/Deployments tab

    // Arrange: Start from Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Click Workloads tab button
    const workloadsTab = page.getByTestId('tab-button-workloads');
    await workloadsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: URL should reflect workloads or deployments route
    expect(page.url()).toMatch(/\/(workloads|deployments)/);

    // Assert: Workloads page should be visible
    const workloadsPage = page.getByTestId('workloads-page')
      .or(page.getByTestId('deployments-page'));
    await expect(workloadsPage).toBeVisible();

    // Assert: Workloads tab should be marked as active
    await expect(workloadsTab).toHaveAttribute('aria-current', 'page');
  });

  test.skip('should switch to Pods tab when Pods button is clicked', async ({ page }) => {
    // Tests navigation to Pods tab displays unhealthy pod list

    // Arrange: Start from Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Click Pods tab button
    const podsTab = page.getByTestId('tab-button-pods');
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: URL should reflect pods route
    expect(page.url()).toContain('/pods');

    // Assert: Pods page should be visible
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    // Assert: Pods tab should be marked as active
    await expect(podsTab).toHaveAttribute('aria-current', 'page');
  });

  test.skip('should switch to Secrets tab when Secrets button is clicked', async ({ page }) => {
    // Tests navigation to Secrets tab displays secret list

    // Arrange: Start from Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Click Secrets tab button
    const secretsTab = page.getByTestId('tab-button-secrets');
    await secretsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: URL should reflect secrets route
    expect(page.url()).toContain('/secrets');

    // Assert: Secrets page should be visible
    const secretsPage = page.getByTestId('secrets-page');
    await expect(secretsPage).toBeVisible();

    // Assert: Secrets tab should be marked as active
    await expect(secretsTab).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('Tab Navigation - Unhealthy Pod Badge', () => {
  test.skip('should display badge count on Pods tab icon for unhealthy pods', async ({ page }) => {
    // Tests that Pods tab shows count of unhealthy pods in badge

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate Pods tab button
    const podsTab = page.getByTestId('tab-button-pods');
    await expect(podsTab).toBeVisible();

    // Act: Check for badge count element
    const badgeCount = podsTab.getByTestId('tab-badge-count');

    // Assert: Badge should be visible if there are unhealthy pods
    // Note: Badge might not be visible if all pods are healthy
    if (await badgeCount.isVisible()) {
      // Assert: Badge count should contain a number
      const badgeText = await badgeCount.innerText();
      expect(badgeText).toMatch(/^\d+$/);

      // Assert: Badge count should be greater than 0
      const count = parseInt(badgeText);
      expect(count).toBeGreaterThan(0);
    }
  });

  test.skip('should update badge count when unhealthy pod count changes', async ({ page }) => {
    // Tests badge count reactivity to pod state changes

    // Arrange: Navigate to home page and get initial badge count
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const podsTab = page.getByTestId('tab-button-pods');
    const badgeCount = podsTab.getByTestId('tab-badge-count');

    let initialCount = 0;
    if (await badgeCount.isVisible()) {
      const initialText = await badgeCount.innerText();
      initialCount = parseInt(initialText);
    }

    // Act: Navigate to Pods tab
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Act: Wait for potential polling/refresh
    await page.waitForTimeout(3000);

    // Assert: Badge count should reflect current unhealthy pod count
    if (await badgeCount.isVisible()) {
      const currentText = await badgeCount.innerText();
      const currentCount = parseInt(currentText);
      expect(currentCount).toBeGreaterThanOrEqual(0);
    }
  });

  test.skip('should hide badge when all pods are healthy', async ({ page }) => {
    // Tests that badge is hidden when unhealthy pod count is 0

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate Pods tab button and badge
    const podsTab = page.getByTestId('tab-button-pods');
    const badgeCount = podsTab.getByTestId('tab-badge-count');

    // Assert: If badge exists, it should either be hidden or show 0
    const badgeVisible = await badgeCount.isVisible().catch(() => false);

    if (badgeVisible) {
      const badgeText = await badgeCount.innerText();
      const count = parseInt(badgeText);

      // Badge is visible, so count should be > 0 or badge should have display:none
      if (count === 0) {
        // Badge with 0 count should be hidden via CSS
        const isHidden = await badgeCount.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || style.visibility === 'hidden';
        });
        expect(isHidden).toBe(true);
      }
    }
  });

  test.skip('should display correct badge count matching unhealthy pods list', async ({ page }) => {
    // Tests badge count accuracy against actual unhealthy pods

    // Arrange: Navigate to home page and get badge count
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const podsTab = page.getByTestId('tab-button-pods');
    const badgeCount = podsTab.getByTestId('tab-badge-count');

    let badgeNumber = 0;
    if (await badgeCount.isVisible()) {
      const badgeText = await badgeCount.innerText();
      badgeNumber = parseInt(badgeText);
    }

    // Act: Navigate to Pods tab to see actual list
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Act: Count unhealthy pod rows in table
    const podsTable = page.getByTestId('pods-table')
      .or(page.getByRole('table'));

    const unhealthyPodRows = page.getByTestId('pod-row')
      .or(podsTable.locator('tbody tr'));
    const actualCount = await unhealthyPodRows.count();

    // Assert: Badge count should match actual unhealthy pod count
    expect(badgeNumber).toBe(actualCount);
  });
});

test.describe('Tab Navigation - Mobile Viewport Layout', () => {
  test.skip('should render without layout breakage on 375px viewport', async ({ page }) => {
    // Tests mobile layout integrity on standard mobile width

    // Arrange: Navigate to home page (viewport already set to 375px)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: BottomTabBar should be visible and properly positioned
    const bottomTabBar = page.getByTestId('bottom-tab-bar');
    await expect(bottomTabBar).toBeVisible();

    // Assert: Tab bar should be at bottom of viewport
    const tabBarBox = await bottomTabBar.boundingBox();
    expect(tabBarBox).toBeTruthy();
    expect(tabBarBox!.y).toBeGreaterThan(600); // Should be near bottom of 812px height

    // Assert: All tab buttons should be visible and not overflow
    const tabButtons = bottomTabBar.locator('button');
    const buttonCount = await tabButtons.count();
    expect(buttonCount).toBe(5);

    for (let i = 0; i < buttonCount; i++) {
      const button = tabButtons.nth(i);
      await expect(button).toBeVisible();

      // Assert: Button should be within viewport width
      const buttonBox = await button.boundingBox();
      expect(buttonBox!.x + buttonBox!.width).toBeLessThanOrEqual(375);
    }
  });

  test.skip('should display tab icons without text overflow on mobile', async ({ page }) => {
    // Tests that tab labels don't overflow on narrow viewport

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Get all tab buttons
    const overviewTab = page.getByTestId('tab-button-overview');
    const nodesTab = page.getByTestId('tab-button-nodes');
    const workloadsTab = page.getByTestId('tab-button-workloads');
    const podsTab = page.getByTestId('tab-button-pods');
    const secretsTab = page.getByTestId('tab-button-secrets');

    const tabs = [overviewTab, nodesTab, workloadsTab, podsTab, secretsTab];

    // Assert: Each tab should be fully visible without text truncation issues
    for (const tab of tabs) {
      await expect(tab).toBeVisible();

      // Assert: Tab button should not be wider than its container allows
      const tabBox = await tab.boundingBox();
      expect(tabBox!.width).toBeLessThanOrEqual(375 / 5 + 10); // ~75px per tab + small margin
    }
  });

  test.skip('should maintain tab bar visibility when scrolling page content', async ({ page }) => {
    // Tests that BottomTabBar remains fixed at bottom during scroll

    // Arrange: Navigate to Nodes page with multiple node cards
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get initial tab bar position
    const bottomTabBar = page.getByTestId('bottom-tab-bar');
    await expect(bottomTabBar).toBeVisible();
    const initialBox = await bottomTabBar.boundingBox();

    // Act: Scroll page content down
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(300); // Wait for scroll to complete

    // Assert: Tab bar should still be visible
    await expect(bottomTabBar).toBeVisible();

    // Assert: Tab bar position should remain fixed (or at least visible)
    const scrolledBox = await bottomTabBar.boundingBox();
    expect(scrolledBox).toBeTruthy();

    // Tab bar should either be position:fixed (same Y) or stick to viewport bottom
    const positionStyle = await bottomTabBar.evaluate(el => {
      return window.getComputedStyle(el).position;
    });
    expect(positionStyle).toMatch(/fixed|sticky/);
  });

  test.skip('should handle touch interactions on mobile viewport', async ({ page }) => {
    // Tests touch/tap interactions work correctly on mobile

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Tap on Nodes tab using touch
    const nodesTab = page.getByTestId('tab-button-nodes');
    await nodesTab.tap();
    await page.waitForLoadState('networkidle');

    // Assert: Should navigate to Nodes page
    expect(page.url()).toContain('/nodes');
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Act: Tap on Pods tab
    const podsTab = page.getByTestId('tab-button-pods');
    await podsTab.tap();
    await page.waitForLoadState('networkidle');

    // Assert: Should navigate to Pods page
    expect(page.url()).toContain('/pods');
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();
  });
});

test.describe('Tab Navigation - Namespace Filtering Integration', () => {
  test.skip('should filter Nodes tab data when namespace is changed', async ({ page }) => {
    // Tests namespace filter affects Nodes tab content

    // Arrange: Navigate to Nodes tab
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get initial node count (All Namespaces)
    const nodeCards = page.getByTestId('node-card');
    const initialCount = await nodeCards.count();

    // Act: Open namespace selector and select "kube-system"
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const kubeSystemOption = page.getByRole('option', { name: /^kube-system$/i })
      .or(page.getByTestId('namespace-option-kube-system'));
    await kubeSystemOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Node data should be filtered
    // Note: Nodes are cluster-scoped, so namespace filter might not affect them
    // This test verifies the component handles namespace changes gracefully
    const filteredCards = page.getByTestId('node-card');
    const filteredCount = await filteredCards.count();

    // Nodes should still be visible (they're cluster-scoped)
    expect(filteredCount).toBeGreaterThanOrEqual(1);
  });

  test.skip('should filter Workloads tab data when namespace is changed', async ({ page }) => {
    // Tests namespace filter affects Workloads/Deployments tab content

    // Arrange: Navigate to Workloads tab
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const workloadsTab = page.getByTestId('tab-button-workloads');
    await workloadsTab.click();
    await page.waitForLoadState('networkidle');

    // Act: Get initial deployment count with "All Namespaces"
    const deploymentsTable = page.getByTestId('deployments-table')
      .or(page.getByRole('table'));
    await expect(deploymentsTable).toBeVisible();

    const initialRows = deploymentsTable.locator('tbody tr');
    const initialCount = await initialRows.count();

    // Act: Select "default" namespace
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Deployment list should be filtered to default namespace
    const filteredRows = deploymentsTable.locator('tbody tr');
    const filteredCount = await filteredRows.count();

    // Filtered count should be <= initial count
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Assert: All visible deployments should be from default namespace
    if (filteredCount > 0) {
      const firstRow = filteredRows.first();
      const namespaceCell = firstRow.locator('td').nth(1); // Assuming namespace is 2nd column
      await expect(namespaceCell).toContainText(/default/i);
    }
  });

  test.skip('should filter Pods tab data when namespace is changed', async ({ page }) => {
    // Tests namespace filter affects Pods tab (unhealthy pods list)

    // Arrange: Navigate to Pods tab
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const podsTab = page.getByTestId('tab-button-pods');
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Act: Get initial unhealthy pod count
    const podsTable = page.getByTestId('pods-table')
      .or(page.getByRole('table'));

    const initialRows = podsTable.locator('tbody tr');
    const initialCount = await initialRows.count();

    // Act: Select "kube-system" namespace
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const kubeSystemOption = page.getByRole('option', { name: /^kube-system$/i })
      .or(page.getByTestId('namespace-option-kube-system'));
    await kubeSystemOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Pod list should be filtered to kube-system namespace
    const filteredRows = podsTable.locator('tbody tr');
    const filteredCount = await filteredRows.count();

    // Filtered count should be <= initial count
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test.skip('should filter Secrets tab data when namespace is changed', async ({ page }) => {
    // Tests namespace filter affects Secrets tab content

    // Arrange: Navigate to Secrets tab
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const secretsTab = page.getByTestId('tab-button-secrets');
    await secretsTab.click();
    await page.waitForLoadState('networkidle');

    // Act: Get initial secret count with "All Namespaces"
    const secretsTable = page.getByTestId('secrets-table')
      .or(page.getByRole('table'));
    await expect(secretsTable).toBeVisible();

    const initialRows = secretsTable.locator('tbody tr');
    const initialCount = await initialRows.count();

    // Act: Select "default" namespace
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Secret list should be filtered to default namespace
    const filteredRows = secretsTable.locator('tbody tr');
    const filteredCount = await filteredRows.count();

    // Filtered count should be <= initial count
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Assert: All visible secrets should be from default namespace
    if (filteredCount > 0) {
      const firstRow = filteredRows.first();
      const namespaceCell = firstRow.locator('td').nth(1);
      await expect(namespaceCell).toContainText(/default/i);
    }
  });

  test.skip('should persist namespace selection when switching between tabs', async ({ page }) => {
    // Tests namespace context persists across tab navigation

    // Arrange: Navigate to home and select "default" namespace
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Verify "default" is selected
    await expect(namespaceSelector).toContainText(/^default$/i);

    // Act: Navigate to Nodes tab
    const nodesTab = page.getByTestId('tab-button-nodes');
    await nodesTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace should still be "default"
    const namespaceSelectorOnNodes = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnNodes).toContainText(/^default$/i);

    // Act: Navigate to Pods tab
    const podsTab = page.getByTestId('tab-button-pods');
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace should still be "default"
    const namespaceSelectorOnPods = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnPods).toContainText(/^default$/i);

    // Act: Navigate to Workloads tab
    const workloadsTab = page.getByTestId('tab-button-workloads');
    await workloadsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace should still be "default"
    const namespaceSelectorOnWorkloads = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnWorkloads).toContainText(/^default$/i);

    // Act: Navigate to Secrets tab
    const secretsTab = page.getByTestId('tab-button-secrets');
    await secretsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace should still be "default"
    const namespaceSelectorOnSecrets = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnSecrets).toContainText(/^default$/i);
  });
});

test.describe('Tab Navigation - Loading and Error States', () => {
  test.skip('should display LoadingSkeleton while tab content is loading', async ({ page }) => {
    // Tests loading state during tab navigation

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Click on Nodes tab
    const nodesTab = page.getByTestId('tab-button-nodes');
    await nodesTab.click();

    // Assert: Loading skeleton should be visible during data fetch
    const loadingSkeleton = page.getByTestId('nodes-loading')
      .or(page.locator('[aria-busy="true"]'))
      .or(page.locator('.loading-skeleton'));

    // Note: Loading might be very fast, so we check if it appears or content loads directly
    await page.waitForLoadState('networkidle');

    // Assert: After loading completes, content should be visible
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Assert: Loading skeleton should no longer be visible
    const loadingExists = await loadingSkeleton.count();
    if (loadingExists > 0) {
      await expect(loadingSkeleton.first()).not.toBeVisible();
    }
  });

  test.skip('should display ErrorRetry component when tab data fetch fails', async ({ page }) => {
    // Tests error state handling in tab content

    // Arrange: Navigate to Pods tab
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state or successful load
    const podsPage = page.getByTestId('pods-page');
    const errorContainer = page.getByTestId('pods-error');

    // Assert: Either error is shown or data loads successfully
    const errorVisible = await errorContainer.isVisible().catch(() => false);
    const contentVisible = await podsPage.isVisible();

    expect(errorVisible || contentVisible).toBeTruthy();
  });

  test.skip('should retry data fetch when retry button is clicked in ErrorRetry', async ({ page }) => {
    // Tests retry functionality in error state

    // Arrange: Navigate to Workloads tab
    await page.goto('/deployments');
    await page.waitForLoadState('networkidle');

    // Act: Look for error state
    const errorContainer = page.getByTestId('deployments-error')
      .or(page.getByTestId('workloads-error'));

    // If error state is visible, test retry button
    if (await errorContainer.isVisible()) {
      const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i })
        .or(errorContainer.getByTestId('retry-button'));

      await expect(retryButton).toBeVisible();
      await expect(retryButton).toBeEnabled();

      // Act: Click retry button
      await retryButton.click();
      await page.waitForLoadState('networkidle');

      // Assert: Should either show content or error again
      const contentNowVisible = await page.getByTestId('deployments-page').isVisible()
        || await page.getByTestId('workloads-page').isVisible();
      const errorStillVisible = await errorContainer.isVisible().catch(() => false);

      expect(contentNowVisible || errorStillVisible).toBeTruthy();
    }
  });

  test.skip('should display EmptyState when tab has no data to show', async ({ page }) => {
    // Tests empty state display when resource list is empty

    // Arrange: Navigate to Secrets tab
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Act: Check for empty state or data
    const secretsTable = page.getByTestId('secrets-table');
    const emptyState = page.getByTestId('secrets-empty')
      .or(page.getByText(/no secrets found|no data available/i));

    // Assert: Either empty state or data table is visible
    const emptyVisible = await emptyState.isVisible().catch(() => false);
    const dataVisible = await secretsTable.isVisible().catch(() => false);

    expect(emptyVisible || dataVisible).toBeTruthy();

    // If empty state is visible, verify its structure
    if (emptyVisible) {
      // Assert: Empty state should have descriptive message
      await expect(emptyState).toBeVisible();

      // Assert: Empty state might have icon or illustration
      const emptyIcon = page.locator('svg').first();
      const iconVisible = await emptyIcon.isVisible().catch(() => false);
      expect(iconVisible).toBeTruthy();
    }
  });
});

test.describe('Tab Navigation - Accessibility', () => {
  test.skip('should support keyboard navigation between tabs', async ({ page }) => {
    // Tests keyboard accessibility for tab navigation

    // Arrange: Navigate to home page and focus first tab
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const overviewTab = page.getByTestId('tab-button-overview');
    await overviewTab.focus();

    // Assert: Overview tab should be focused
    await expect(overviewTab).toBeFocused();

    // Act: Press Tab key to move to next tab button
    await page.keyboard.press('Tab');

    // Assert: Next tab should be focused (Nodes)
    const nodesTab = page.getByTestId('tab-button-nodes');
    await expect(nodesTab).toBeFocused();

    // Act: Press Enter to activate Nodes tab
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');

    // Assert: Should navigate to Nodes page
    expect(page.url()).toContain('/nodes');
    await expect(nodesTab).toHaveAttribute('aria-current', 'page');
  });

  test.skip('should have proper ARIA labels for all tab buttons', async ({ page }) => {
    // Tests ARIA accessibility attributes

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: All tabs should have proper ARIA labels
    const overviewTab = page.getByTestId('tab-button-overview');
    const nodesTab = page.getByTestId('tab-button-nodes');
    const workloadsTab = page.getByTestId('tab-button-workloads');
    const podsTab = page.getByTestId('tab-button-pods');
    const secretsTab = page.getByTestId('tab-button-secrets');

    await expect(overviewTab).toHaveAttribute('aria-label', /overview/i);
    await expect(nodesTab).toHaveAttribute('aria-label', /nodes/i);
    await expect(workloadsTab).toHaveAttribute('aria-label', /workloads|deployments/i);
    await expect(podsTab).toHaveAttribute('aria-label', /pods/i);
    await expect(secretsTab).toHaveAttribute('aria-label', /secrets/i);

    // Assert: Tab buttons should have button role
    await expect(overviewTab).toHaveRole('button');
    await expect(nodesTab).toHaveRole('button');
  });

  test.skip('should indicate active tab with aria-current attribute', async ({ page }) => {
    // Tests active tab indication for screen readers

    // Arrange: Navigate to Pods tab
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Pods tab should be marked as current
    const podsTab = page.getByTestId('tab-button-pods');
    await expect(podsTab).toHaveAttribute('aria-current', 'page');

    // Assert: Other tabs should not have aria-current
    const nodesTab = page.getByTestId('tab-button-nodes');
    const ariaCurrentValue = await nodesTab.getAttribute('aria-current');
    expect(ariaCurrentValue).not.toBe('page');
  });
});
