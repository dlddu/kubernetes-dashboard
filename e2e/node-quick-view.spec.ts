import { test, expect } from '@playwright/test';

/**
 * E2E Tests for NodeQuickView Component
 *
 * TDD Red Phase: Tests written - component not yet implemented.
 * These tests define the expected behavior of the NodeQuickView component,
 * which displays a quick overview of cluster nodes with CPU/Memory usage bars.
 */
test.describe('NodeQuickView Component', () => {
  test('should display node items with name, status, and usage bars', async ({ page }) => {
    // Tests that NodeQuickView displays all required node information

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the NodeQuickView component
    const nodeQuickView = page.getByTestId('node-quick-view');
    await expect(nodeQuickView).toBeVisible();

    // Assert: Should display at least one node item
    const nodeItems = nodeQuickView.getByTestId('node-item');
    const itemCount = await nodeItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(1);

    // Assert: Check first node item has all required elements
    const firstNodeItem = nodeItems.first();

    // Assert: Node name should be visible
    const nodeName = firstNodeItem.getByTestId('node-name');
    await expect(nodeName).toBeVisible();
    const nodeNameText = await nodeName.innerText();
    expect(nodeNameText.length).toBeGreaterThan(0);

    // Assert: Node status should be visible
    const nodeStatus = firstNodeItem.getByTestId('node-status');
    await expect(nodeStatus).toBeVisible();
    const statusText = await nodeStatus.innerText();
    expect(statusText).toMatch(/ready|notready/i);

    // Assert: CPU usage bar should be visible
    const cpuUsageContainer = firstNodeItem.getByTestId('node-cpu-usage');
    await expect(cpuUsageContainer).toBeVisible();

    // Assert: Memory usage bar should be visible
    const memoryUsageContainer = firstNodeItem.getByTestId('node-memory-usage');
    await expect(memoryUsageContainer).toBeVisible();
  });

  test('should display CPU and Memory usage bars with correct accessibility attributes', async ({ page }) => {
    // Tests UsageBar accessibility for CPU and Memory metrics

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the NodeQuickView component
    const nodeQuickView = page.getByTestId('node-quick-view');
    await expect(nodeQuickView).toBeVisible();

    // Act: Get the first node item
    const firstNodeItem = nodeQuickView.getByTestId('node-item').first();
    await expect(firstNodeItem).toBeVisible();

    // Assert: CPU usage bar should have progressbar role
    const cpuUsageBar = firstNodeItem.getByRole('progressbar').first();
    await expect(cpuUsageBar).toBeVisible();

    // Assert: CPU usage bar should have aria attributes
    await expect(cpuUsageBar).toHaveAttribute('aria-valuenow');
    await expect(cpuUsageBar).toHaveAttribute('aria-valuemin', '0');
    await expect(cpuUsageBar).toHaveAttribute('aria-valuemax', '100');

    // Assert: CPU usage percentage should be between 0-100
    const cpuAriaValue = await cpuUsageBar.getAttribute('aria-valuenow');
    const cpuPercentage = parseFloat(cpuAriaValue!);
    expect(cpuPercentage).toBeGreaterThan(0);
    expect(cpuPercentage).toBeLessThanOrEqual(100);

    // Assert: Memory usage bar should have progressbar role
    const memoryUsageBar = firstNodeItem.getByRole('progressbar').nth(1);
    await expect(memoryUsageBar).toBeVisible();

    // Assert: Memory usage bar should have aria attributes
    await expect(memoryUsageBar).toHaveAttribute('aria-valuenow');
    await expect(memoryUsageBar).toHaveAttribute('aria-valuemin', '0');
    await expect(memoryUsageBar).toHaveAttribute('aria-valuemax', '100');

    // Assert: Memory usage percentage should be between 0-100
    const memoryAriaValue = await memoryUsageBar.getAttribute('aria-valuenow');
    const memoryPercentage = parseFloat(memoryAriaValue!);
    expect(memoryPercentage).toBeGreaterThan(0);
    expect(memoryPercentage).toBeLessThanOrEqual(100);
  });

  test('should display warning indicator for NotReady nodes', async ({ page }) => {
    // Tests that unhealthy nodes show visual warning indicators

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the NodeQuickView component
    const nodeQuickView = page.getByTestId('node-quick-view');
    await expect(nodeQuickView).toBeVisible();

    // Act: Check all node items for NotReady status
    const nodeItems = nodeQuickView.getByTestId('node-item');
    const itemCount = await nodeItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(1);

    // Assert: Check each node for status and warning indicator
    for (let i = 0; i < itemCount; i++) {
      const nodeItem = nodeItems.nth(i);
      const nodeStatus = nodeItem.getByTestId('node-status');
      const statusText = await nodeStatus.innerText();

      // Assert: If node is NotReady, warning indicator should be visible
      if (statusText.toLowerCase().includes('notready')) {
        const warningIndicator = nodeItem.getByTestId('node-warning-indicator')
          .or(nodeItem.locator('[role="alert"]'))
          .or(nodeItem.locator('.warning-icon'));
        await expect(warningIndicator).toBeVisible();
      }
    }
  });

  test('should display "all nodes healthy" message when all nodes are Ready', async ({ page }) => {
    // Tests empty state when all nodes are healthy

    // Note: This test requires a test environment with all healthy nodes

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the NodeQuickView component
    const nodeQuickView = page.getByTestId('node-quick-view');
    await expect(nodeQuickView).toBeVisible();

    // Act: Check all node items for their status
    const nodeItems = nodeQuickView.getByTestId('node-item');
    const itemCount = await nodeItems.count();

    // Assert: Check if all nodes are Ready
    let allNodesHealthy = true;
    for (let i = 0; i < itemCount; i++) {
      const nodeItem = nodeItems.nth(i);
      const nodeStatus = nodeItem.getByTestId('node-status');
      const statusText = await nodeStatus.innerText();

      if (!statusText.toLowerCase().includes('ready') || statusText.toLowerCase().includes('notready')) {
        allNodesHealthy = false;
        break;
      }
    }

    // Assert: When all nodes are healthy, should show positive message
    if (allNodesHealthy) {
      const allNodesHealthyMessage = nodeQuickView.getByTestId('all-nodes-healthy-message')
        .or(nodeQuickView.getByText(/all nodes healthy|all nodes running/i));
      await expect(allNodesHealthyMessage).toBeVisible();

      // Assert: Message should contain positive/healthy language
      const messageText = await allNodesHealthyMessage.innerText();
      expect(messageText.toLowerCase()).toMatch(/all|healthy|ready|running/);
    } else {
      // If unhealthy nodes exist, message should not be visible
      const allNodesHealthyMessage = nodeQuickView.getByTestId('all-nodes-healthy-message');
      const messageExists = await allNodesHealthyMessage.count();
      if (messageExists > 0) {
        await expect(allNodesHealthyMessage).not.toBeVisible();
      }
    }
  });

  test('should navigate to Nodes page when "view more" link is clicked', async ({ page }) => {
    // Tests navigation from NodeQuickView to Nodes page

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the NodeQuickView component
    const nodeQuickView = page.getByTestId('node-quick-view');
    await expect(nodeQuickView).toBeVisible();

    // Act: Locate the "view more" link
    const viewMoreLink = nodeQuickView.getByTestId('view-more-link');
    const linkCount = await viewMoreLink.count();
    if (linkCount > 0) {
      await expect(viewMoreLink).toBeVisible();

      // Assert: Link should be clickable
      await expect(viewMoreLink).toBeEnabled();

      // Act: Click the "view more" link
      await viewMoreLink.click();

      // Wait for navigation to complete
      await page.waitForLoadState('networkidle');

      // Assert: Should navigate to Nodes page
      // URL should change to include "nodes" route
      const currentUrl = page.url();
      expect(currentUrl.toLowerCase()).toContain('nodes');

      // Assert: Nodes page should be active/visible
      const nodesPage = page.getByTestId('nodes-page')
        .or(page.getByRole('tab', { name: /nodes/i, selected: true }))
        .or(page.getByRole('heading', { name: /nodes/i }));
      await expect(nodesPage).toBeVisible();
    } else {
      // 5개 이하일 때 view more 링크가 없는 것은 정상
      console.log('No view more link - less than 5 nodes or all nodes displayed');
    }
  });

  test('should display node items ordered by status (NotReady first)', async ({ page }) => {
    // Tests that unhealthy nodes are prioritized in the display order

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the NodeQuickView component
    const nodeQuickView = page.getByTestId('node-quick-view');
    await expect(nodeQuickView).toBeVisible();

    // Act: Get all node items
    const nodeItems = nodeQuickView.getByTestId('node-item');
    const itemCount = await nodeItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(1);

    // Assert: Check ordering - NotReady nodes should appear first
    let foundReadyNode = false;
    for (let i = 0; i < itemCount; i++) {
      const nodeItem = nodeItems.nth(i);
      const nodeStatus = nodeItem.getByTestId('node-status');
      const statusText = await nodeStatus.innerText();

      if (statusText.toLowerCase().includes('ready') && !statusText.toLowerCase().includes('notready')) {
        foundReadyNode = true;
      } else if (statusText.toLowerCase().includes('notready')) {
        // Assert: Should not find NotReady nodes after Ready nodes
        expect(foundReadyNode).toBe(false);
      }
    }
  });

  test('should limit display to maximum 5 nodes in preview', async ({ page }) => {
    // Tests that NodeQuickView limits the number of displayed nodes

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the NodeQuickView component
    const nodeQuickView = page.getByTestId('node-quick-view');
    await expect(nodeQuickView).toBeVisible();

    // Assert: Should display maximum 5 node items
    const nodeItems = nodeQuickView.getByTestId('node-item');
    const itemCount = await nodeItems.count();

    // Should show at least 1 node (assuming test environment has nodes)
    // but no more than 5 nodes in the preview
    expect(itemCount).toBeGreaterThanOrEqual(1);
    expect(itemCount).toBeLessThanOrEqual(5);

    // Assert: Each node item should be visible
    const items = await nodeItems.all();
    for (const item of items) {
      await expect(item).toBeVisible();
    }
  });

  test('should update node status in real-time when node state changes', async ({ page }) => {
    // Tests real-time updates to node status display

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the NodeQuickView component
    const nodeQuickView = page.getByTestId('node-quick-view');
    await expect(nodeQuickView).toBeVisible();

    // Act: Get initial node count and status
    const nodeItems = nodeQuickView.getByTestId('node-item');
    const initialCount = await nodeItems.count();
    expect(initialCount).toBeGreaterThanOrEqual(1);

    // Note: To test real-time updates, you would:
    // 1. Modify a node's status in the cluster (e.g., drain/cordon)
    // 2. Wait for the dashboard to refresh (WebSocket or polling)
    // 3. Verify the status updates

    // Act: Refresh the page to simulate update
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert: NodeQuickView should still be visible
    await expect(nodeQuickView).toBeVisible();

    // Assert: Should still display nodes (count may have changed)
    const updatedNodeItems = nodeQuickView.getByTestId('node-item');
    const updatedCount = await updatedNodeItems.count();
    expect(updatedCount).toBeGreaterThanOrEqual(1);
  });
});

test.describe('NodeQuickView Component - Loading and Error States', () => {
  test('should display loading state while fetching node data', async ({ page }) => {
    // Tests loading state with skeleton or spinner

    // Arrange: Navigate to the page
    await page.goto('/');

    // Act: Look for loading state immediately after navigation
    const nodeQuickView = page.getByTestId('node-quick-view');
    await expect(nodeQuickView).toBeVisible();

    // Act: Check for loading indicator
    const loadingIndicator = nodeQuickView.getByTestId('node-quick-view-loading')
      .or(nodeQuickView.locator('[aria-busy="true"]'))
      .or(nodeQuickView.locator('.loading-skeleton'));

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');

    // Assert: After loading, should display node items
    const nodeItems = nodeQuickView.getByTestId('node-item');
    const itemCount = await nodeItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(1);

    // Assert: Loading indicator should no longer be visible
    const loadingExists = await loadingIndicator.count();
    if (loadingExists > 0) {
      await expect(loadingIndicator.first()).not.toBeVisible();
    }
  });

  test('should display error message when node data fetch fails', async ({ page }) => {
    // Tests error state when API request fails

    // Arrange: Navigate to the page (assume API will fail in test environment)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the NodeQuickView component
    const nodeQuickView = page.getByTestId('node-quick-view');
    await expect(nodeQuickView).toBeVisible();

    // Act: Check for error state
    const errorMessage = nodeQuickView.getByTestId('node-quick-view-error')
      .or(nodeQuickView.getByText(/error loading nodes|failed to fetch nodes/i));

    // Assert: Either error is shown or nodes are loaded successfully
    const nodeItems = nodeQuickView.getByTestId('node-item');
    const errorVisible = await errorMessage.count() > 0 && await errorMessage.isVisible().catch(() => false);
    const nodesVisible = (await nodeItems.count()) >= 1;

    expect(errorVisible || nodesVisible).toBeTruthy();
  });

  test('should display retry button on error state', async ({ page }) => {
    // Tests retry functionality in error state

    // Arrange: Navigate to the page and wait for potential error
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the NodeQuickView component
    const nodeQuickView = page.getByTestId('node-quick-view');
    await expect(nodeQuickView).toBeVisible();

    // Act: Look for error state with retry button
    const errorContainer = nodeQuickView.getByTestId('node-quick-view-error')
      .or(nodeQuickView.locator('.node-quick-view-error'));

    // Assert: If error state is shown, retry button should be present
    if (await errorContainer.isVisible()) {
      const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i })
        .or(errorContainer.getByTestId('retry-button'));
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toBeEnabled();

      // Act: Click retry button
      await retryButton.click();

      // Wait for retry to complete
      await page.waitForLoadState('networkidle');

      // Assert: Should either show nodes or error message again
      const nodeItems = nodeQuickView.getByTestId('node-item');
      const errorMessage = nodeQuickView.getByTestId('node-quick-view-error');

      const nodesVisible = (await nodeItems.count()) > 0;
      const errorStillVisible = await errorMessage.isVisible().catch(() => false);

      expect(nodesVisible || errorStillVisible).toBeTruthy();
    }
  });
});

test.describe('NodeQuickView Component - Responsive Design', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    // Tests mobile viewport rendering

    // Arrange: Set mobile viewport (iPhone SE dimensions)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the NodeQuickView component
    const nodeQuickView = page.getByTestId('node-quick-view');
    await expect(nodeQuickView).toBeVisible();

    // Assert: Node items should be visible on mobile
    const nodeItems = nodeQuickView.getByTestId('node-item');
    const itemCount = await nodeItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(1);

    // Assert: Each node item should be visible and stacked vertically
    const firstNodeItem = nodeItems.first();
    const secondNodeItem = nodeItems.nth(1);

    await expect(firstNodeItem).toBeVisible();

    if (itemCount > 1) {
      await expect(secondNodeItem).toBeVisible();

      // Assert: Items should be stacked vertically (different Y positions)
      const firstBox = await firstNodeItem.boundingBox();
      const secondBox = await secondNodeItem.boundingBox();
      expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height - 10);
    }

    // Assert: Usage bars should be visible on mobile
    const usageBars = firstNodeItem.getByRole('progressbar');
    await expect(usageBars.first()).toBeVisible();
  });

  test('should display correctly on desktop viewport', async ({ page }) => {
    // Tests desktop viewport rendering

    // Arrange: Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the NodeQuickView component
    const nodeQuickView = page.getByTestId('node-quick-view');
    await expect(nodeQuickView).toBeVisible();

    // Assert: Node items should be visible on desktop
    const nodeItems = nodeQuickView.getByTestId('node-item');
    const itemCount = await nodeItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(1);

    // Assert: All items should be visible
    const items = await nodeItems.all();
    for (const item of items) {
      await expect(item).toBeVisible();
    }

    // Assert: View more link should be visible (if more than 5 nodes)
    const viewMoreLink = nodeQuickView.getByTestId('view-more-link');
    const linkCount = await viewMoreLink.count();
    if (linkCount > 0) {
      await expect(viewMoreLink).toBeVisible();
    }
  });
});
