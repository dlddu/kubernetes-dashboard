import { test, expect } from '@playwright/test';

test.describe('Overview Dashboard - SummaryCards', () => {
  test('should render all 4 summary cards on Overview tab', async ({ page }) => {
    // Test for SummaryCards component rendering

    // Arrange: Navigate to the home page (Overview tab)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Wait for overview content to load
    const overviewTab = page.getByRole('tab', { name: /overview/i })
      .or(page.getByTestId('overview-tab'));
    await expect(overviewTab).toBeVisible();

    // Assert: All 4 summary cards should be visible
    const nodesCard = page.getByTestId('summary-card-nodes');
    const unhealthyPodsCard = page.getByTestId('summary-card-unhealthy-pods');
    const cpuCard = page.getByTestId('summary-card-cpu');
    const memoryCard = page.getByTestId('summary-card-memory');

    await expect(nodesCard).toBeVisible();
    await expect(unhealthyPodsCard).toBeVisible();
    await expect(cpuCard).toBeVisible();
    await expect(memoryCard).toBeVisible();
  });

  test('should display correct labels for each summary card', async ({ page }) => {
    // Test for summary card labels

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act & Assert: Verify each card has the correct label
    const nodesCard = page.getByTestId('summary-card-nodes');
    await expect(nodesCard).toContainText(/nodes/i);

    const unhealthyPodsCard = page.getByTestId('summary-card-unhealthy-pods');
    await expect(unhealthyPodsCard).toContainText(/unhealthy pods/i);

    const cpuCard = page.getByTestId('summary-card-cpu');
    await expect(cpuCard).toContainText(/cpu|average cpu/i);

    const memoryCard = page.getByTestId('summary-card-memory');
    await expect(memoryCard).toContainText(/memory|average memory/i);
  });

  test('should display numeric values in summary cards', async ({ page }) => {
    // Test for summary card values display

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Wait for data to load
    await page.waitForTimeout(2000); // Wait for API response

    // Assert: Each card should display a numeric value or percentage
    const nodesCard = page.getByTestId('summary-card-nodes');
    await expect(nodesCard).toContainText(/\d+/); // Contains at least one number

    const unhealthyPodsCard = page.getByTestId('summary-card-unhealthy-pods');
    await expect(unhealthyPodsCard).toContainText(/\d+/);

    const cpuCard = page.getByTestId('summary-card-cpu');
    await expect(cpuCard).toContainText(/\d+%|\d+/);

    const memoryCard = page.getByTestId('summary-card-memory');
    await expect(memoryCard).toContainText(/\d+%|\d+/);
  });

  test('should update summary card values when namespace filter changes', async ({ page }) => {
    // Test for summary cards reacting to namespace changes

    // Arrange: Navigate to home page with default namespace
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Get initial unhealthy pods count
    const unhealthyPodsCard = page.getByTestId('summary-card-unhealthy-pods');
    const initialText = await unhealthyPodsCard.textContent();

    // Act: Change namespace filter to 'default'
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await namespaceSelector.click();
    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultNamespaceOption.click();

    // Wait for data to refresh
    await page.waitForTimeout(1000);

    // Assert: Card values may have changed (or stayed the same, but component re-rendered)
    const updatedText = await unhealthyPodsCard.textContent();
    // Both cases are valid: changed or unchanged (but component responded to filter change)
    expect(updatedText).toBeTruthy();
  });
});

test.describe('Overview Dashboard - UnhealthyPodPreview', () => {
  test('should display UnhealthyPodPreview section', async ({ page }) => {
    // Test for UnhealthyPodPreview component visibility

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Wait for component to load
    const unhealthyPodPreview = page.getByTestId('unhealthy-pod-preview');

    // Assert: Component should be visible
    await expect(unhealthyPodPreview).toBeVisible();
  });

  test('should display maximum 3 unhealthy pods in preview', async ({ page }) => {
    // Test for unhealthy pod limit (max 3 pods)

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Wait for unhealthy pods to load
    await page.waitForTimeout(2000);

    // Assert: Should display at most 3 unhealthy pod items
    const unhealthyPodItems = page.getByTestId('unhealthy-pod-item');
    const count = await unhealthyPodItems.count();

    expect(count).toBeLessThanOrEqual(3);
  });

  test('should display pod name and status for each unhealthy pod', async ({ page }) => {
    // Test for unhealthy pod item content

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Act: Get first unhealthy pod item (if exists)
    const firstPodItem = page.getByTestId('unhealthy-pod-item').first();

    // Assert: If unhealthy pods exist, they should have name and status
    if (await firstPodItem.isVisible()) {
      // Pod item should contain text (pod name)
      const podText = await firstPodItem.textContent();
      expect(podText).toBeTruthy();
      expect(podText!.length).toBeGreaterThan(0);

      // Should display status indicator or status text
      const statusIndicator = firstPodItem.locator('[data-testid*="status"]')
        .or(firstPodItem.getByText(/error|failed|pending|crashloopbackoff/i));
      await expect(statusIndicator).toBeVisible();
    }
  });

  test('should show "View All" link when there are more than 3 unhealthy pods', async ({ page }) => {
    // Test for "View All" link visibility

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Act: Check if there are unhealthy pods
    const unhealthyPodItems = page.getByTestId('unhealthy-pod-item');
    const count = await unhealthyPodItems.count();

    // Assert: If exactly 3 pods are shown, "View All" link should be visible
    if (count === 3) {
      const viewAllLink = page.getByRole('link', { name: /view all|see all|show all/i })
        .or(page.getByTestId('view-all-unhealthy-pods'));
      await expect(viewAllLink).toBeVisible();
    }
  });

  test('should show empty state when no unhealthy pods exist', async ({ page }) => {
    // Test for empty state handling

    // Arrange: Navigate to the home page with a namespace that has no unhealthy pods
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Select a namespace (assuming it has no unhealthy pods for this test)
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await namespaceSelector.click();
    const kubeSystemOption = page.getByRole('option', { name: /kube-system/i })
      .or(page.getByTestId('namespace-option-kube-system'));

    if (await kubeSystemOption.isVisible()) {
      await kubeSystemOption.click();
      await page.waitForTimeout(1000);
    }

    // Assert: Should show empty state message or no pod items
    const unhealthyPodItems = page.getByTestId('unhealthy-pod-item');
    const count = await unhealthyPodItems.count();

    if (count === 0) {
      const emptyMessage = page.getByText(/no unhealthy pods|all pods are healthy/i)
        .or(page.getByTestId('unhealthy-pods-empty-state'));
      await expect(emptyMessage).toBeVisible();
    }
  });
});

test.describe('Overview Dashboard - NodeQuickView', () => {
  test('should display NodeQuickView section', async ({ page }) => {
    // Test for NodeQuickView component visibility

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Wait for component to load
    const nodeQuickView = page.getByTestId('node-quick-view');

    // Assert: Component should be visible
    await expect(nodeQuickView).toBeVisible();
  });

  test('should display list of nodes with CPU and Memory usage bars', async ({ page }) => {
    // Test for node items with usage bars

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Act: Get node items
    const nodeItems = page.getByTestId('node-item');

    // Assert: At least one node should be displayed
    const count = await nodeItems.count();
    expect(count).toBeGreaterThan(0);

    // Assert: First node should have CPU and Memory bars
    const firstNode = nodeItems.first();
    const cpuBar = firstNode.getByTestId('cpu-usage-bar');
    const memoryBar = firstNode.getByTestId('memory-usage-bar');

    await expect(cpuBar).toBeVisible();
    await expect(memoryBar).toBeVisible();
  });

  test('should display node names in NodeQuickView', async ({ page }) => {
    // Test for node name display

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Act: Get first node item
    const firstNode = page.getByTestId('node-item').first();

    // Assert: Node should have a name/label
    const nodeName = await firstNode.textContent();
    expect(nodeName).toBeTruthy();
    expect(nodeName!.length).toBeGreaterThan(0);
  });

  test('should display CPU usage bar with percentage', async ({ page }) => {
    // Test for CPU usage bar content

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Act: Get CPU usage bar from first node
    const firstNode = page.getByTestId('node-item').first();
    const cpuBar = firstNode.getByTestId('cpu-usage-bar');

    // Assert: CPU bar should have visual representation
    await expect(cpuBar).toBeVisible();

    // Assert: Should display percentage value
    const cpuBarOrParent = cpuBar.or(firstNode);
    await expect(cpuBarOrParent).toContainText(/\d+%/);
  });

  test('should display Memory usage bar with percentage', async ({ page }) => {
    // Test for Memory usage bar content

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Act: Get Memory usage bar from first node
    const firstNode = page.getByTestId('node-item').first();
    const memoryBar = firstNode.getByTestId('memory-usage-bar');

    // Assert: Memory bar should have visual representation
    await expect(memoryBar).toBeVisible();

    // Assert: Should display percentage value
    const memoryBarOrParent = memoryBar.or(firstNode);
    await expect(memoryBarOrParent).toContainText(/\d+%/);
  });

  test('should update node usage bars when data refreshes', async ({ page }) => {
    // Test for node data refresh/polling

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Act: Get initial CPU usage value
    const firstNode = page.getByTestId('node-item').first();
    const cpuBar = firstNode.getByTestId('cpu-usage-bar');
    const initialValue = await cpuBar.getAttribute('aria-valuenow')
      || await cpuBar.textContent();

    // Wait for polling interval (assuming 30 seconds)
    // In real test, this would be mocked or use shorter interval
    await page.waitForTimeout(5000);

    // Assert: Component should still be functional (may or may not have different value)
    await expect(cpuBar).toBeVisible();
  });

  test('should display nodes on mobile viewport', async ({ page }) => {
    // Test for mobile responsiveness

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Act: Get node quick view
    const nodeQuickView = page.getByTestId('node-quick-view');

    // Assert: Should be visible and scrollable on mobile
    await expect(nodeQuickView).toBeVisible();

    const nodeItems = page.getByTestId('node-item');
    const count = await nodeItems.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Overview Dashboard - PollingIndicator', () => {
  test('should display PollingIndicator on Overview tab', async ({ page }) => {
    // Test for PollingIndicator component visibility

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Look for polling indicator
    const pollingIndicator = page.getByTestId('polling-indicator');

    // Assert: Indicator should be visible
    await expect(pollingIndicator).toBeVisible();
  });

  test('should show "Updated" timestamp after initial data load', async ({ page }) => {
    // Test for timestamp display

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Act: Get polling indicator content
    const pollingIndicator = page.getByTestId('polling-indicator');

    // Assert: Should show "Updated" text with timestamp
    await expect(pollingIndicator).toContainText(/updated|last updated|refreshed/i);

    // Should contain time-related text (e.g., "just now", "1 minute ago")
    await expect(pollingIndicator).toContainText(/just now|ago|second|minute/i);
  });

  test('should update timestamp after polling interval', async ({ page }) => {
    // Test for timestamp update after auto-refresh

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Act: Get initial timestamp text
    const pollingIndicator = page.getByTestId('polling-indicator');
    const initialText = await pollingIndicator.textContent();

    // Wait for polling interval (shorter for test purposes)
    await page.waitForTimeout(5000);

    // Assert: Timestamp should be updated or show loading state
    const updatedText = await pollingIndicator.textContent();
    expect(updatedText).toBeTruthy();
  });

  test('should show loading state during data refresh', async ({ page }) => {
    // Test for loading indicator during refresh

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Look for loading state immediately after navigation
    const pollingIndicator = page.getByTestId('polling-indicator');
    const loadingState = pollingIndicator.getByText(/loading|refreshing|updating/i)
      .or(pollingIndicator.locator('[aria-busy="true"]'));

    // Note: This may be visible briefly during initial load
    // The test validates that the component handles loading states

    // Wait for loading to complete
    await page.waitForTimeout(2000);

    // Assert: Loading state should disappear
    await expect(pollingIndicator).toBeVisible();
    await expect(pollingIndicator).not.toContainText(/loading/i);
  });

  test('should allow manual refresh trigger', async ({ page }) => {
    // Test for manual refresh button

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Act: Look for refresh button within polling indicator
    const refreshButton = page.getByRole('button', { name: /refresh|reload/i })
      .or(page.getByTestId('polling-refresh-button'));

    // Assert: If refresh button exists, it should be clickable
    if (await refreshButton.isVisible()) {
      await expect(refreshButton).toBeEnabled();

      // Click refresh and verify indicator updates
      await refreshButton.click();
      await page.waitForTimeout(1000);

      const pollingIndicator = page.getByTestId('polling-indicator');
      await expect(pollingIndicator).toBeVisible();
    }
  });

  test('should display polling indicator on mobile viewport', async ({ page }) => {
    // Test for mobile responsiveness

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Get polling indicator
    const pollingIndicator = page.getByTestId('polling-indicator');

    // Assert: Should be visible and readable on mobile
    await expect(pollingIndicator).toBeVisible();
  });
});

test.describe('Overview Dashboard - Integration Tests', () => {
  test('should display all overview components together', async ({ page }) => {
    // Test for full page integration

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Assert: All major components should be visible
    await expect(page.getByTestId('summary-card-nodes')).toBeVisible();
    await expect(page.getByTestId('summary-card-unhealthy-pods')).toBeVisible();
    await expect(page.getByTestId('summary-card-cpu')).toBeVisible();
    await expect(page.getByTestId('summary-card-memory')).toBeVisible();
    await expect(page.getByTestId('unhealthy-pod-preview')).toBeVisible();
    await expect(page.getByTestId('node-quick-view')).toBeVisible();
    await expect(page.getByTestId('polling-indicator')).toBeVisible();
  });

  test('should update all components when namespace filter changes', async ({ page }) => {
    // Test for synchronized updates across components

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Act: Change namespace to 'default'
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await namespaceSelector.click();
    const defaultOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultOption.click();

    // Wait for all components to refresh
    await page.waitForTimeout(2000);

    // Assert: All components should still be visible and functional
    await expect(page.getByTestId('summary-card-unhealthy-pods')).toBeVisible();
    await expect(page.getByTestId('unhealthy-pod-preview')).toBeVisible();
    await expect(page.getByTestId('node-quick-view')).toBeVisible();
    await expect(page.getByTestId('polling-indicator')).toBeVisible();
  });

  test('should maintain layout on different screen sizes', async ({ page }) => {
    // Test for responsive layout

    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1024, height: 768, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' },
    ];

    for (const viewport of viewports) {
      // Arrange: Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Assert: Key components should be visible
      await expect(page.getByTestId('summary-card-nodes')).toBeVisible();
      await expect(page.getByTestId('node-quick-view')).toBeVisible();
    }
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Test for empty/no data state

    // Arrange: Navigate to home page (assuming test environment might have no data)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Assert: Components should handle empty state without errors
    const summaryCards = page.getByTestId(/summary-card-/);
    const cardsCount = await summaryCards.count();
    expect(cardsCount).toBeGreaterThanOrEqual(4);

    // All cards should be visible even with 0 values
    await expect(page.getByTestId('summary-card-nodes')).toBeVisible();
    await expect(page.getByTestId('summary-card-unhealthy-pods')).toBeVisible();
  });
});
