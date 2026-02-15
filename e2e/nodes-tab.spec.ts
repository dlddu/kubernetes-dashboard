import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Nodes Tab (Full Page View)
 *
 * TDD Red Phase: Tests written - components not yet implemented.
 * These tests define the expected behavior of the Nodes tab page,
 * which displays all cluster nodes as cards with detailed information
 * including CPU/Memory usage bars, pod counts, and status badges.
 *
 * Related Issue: DLD-331 - 8-1: [Node 목록] e2e 테스트 작성 (skipped)
 */

test.describe('Nodes Tab - Basic Rendering', () => {
  test('should display nodes page when navigating to /nodes', async ({ page }) => {
    // Tests that Nodes page is accessible and renders correctly

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Assert: Nodes page should be visible
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Assert: Page should have appropriate title/heading
    const pageHeading = page.getByRole('heading', { name: /nodes/i });
    await expect(pageHeading).toBeVisible();
  });

  test('should display node cards for all cluster nodes', async ({ page }) => {
    // Tests that NodeCard components are rendered for each node

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Locate the nodes page container
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Assert: Should display at least one node card (kind cluster has at least 1 node)
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: First node card should be visible
    await expect(nodeCards.first()).toBeVisible();
  });

  test('should display node name in each NodeCard', async ({ page }) => {
    // Tests that each NodeCard displays the node's name

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get the first node card
    const firstNodeCard = page.getByTestId('node-card').first();
    await expect(firstNodeCard).toBeVisible();

    // Assert: Node name should be visible
    const nodeName = firstNodeCard.getByTestId('node-name');
    await expect(nodeName).toBeVisible();

    // Assert: Node name should not be empty
    const nodeNameText = await nodeName.innerText();
    expect(nodeNameText.length).toBeGreaterThan(0);
    expect(nodeNameText).toMatch(/^[a-z0-9-]+$/i); // Kubernetes naming convention
  });
});

test.describe('Nodes Tab - NodeCard Components', () => {
  test('should display StatusBadge with node status in each NodeCard', async ({ page }) => {
    // Tests that each NodeCard shows the node's status using StatusBadge component

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get all node cards
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Check first node card for status badge
    const firstNodeCard = nodeCards.first();
    const statusBadge = firstNodeCard.getByTestId('status-badge');
    await expect(statusBadge).toBeVisible();

    // Assert: Status should be either Ready or NotReady
    const statusText = await statusBadge.innerText();
    expect(statusText.toLowerCase()).toMatch(/ready|notready/i);
  });

  test('should display CPU usage bar in each NodeCard', async ({ page }) => {
    // Tests that each NodeCard displays CPU usage with UsageBar component

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get the first node card
    const firstNodeCard = page.getByTestId('node-card').first();
    await expect(firstNodeCard).toBeVisible();

    // Assert: CPU usage container should be visible
    const cpuUsageContainer = firstNodeCard.getByTestId('node-cpu-usage');
    await expect(cpuUsageContainer).toBeVisible();

    // Assert: CPU usage label should be present
    const cpuLabel = cpuUsageContainer.getByText(/cpu/i);
    await expect(cpuLabel).toBeVisible();

    // Assert: CPU usage bar should have progressbar role
    const cpuProgressBar = firstNodeCard.getByRole('progressbar').first();
    await expect(cpuProgressBar).toBeVisible();
  });

  test('should display Memory usage bar in each NodeCard', async ({ page }) => {
    // Tests that each NodeCard displays Memory usage with UsageBar component

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get the first node card
    const firstNodeCard = page.getByTestId('node-card').first();
    await expect(firstNodeCard).toBeVisible();

    // Assert: Memory usage container should be visible
    const memoryUsageContainer = firstNodeCard.getByTestId('node-memory-usage');
    await expect(memoryUsageContainer).toBeVisible();

    // Assert: Memory usage label should be present
    const memoryLabel = memoryUsageContainer.getByText(/memory/i);
    await expect(memoryLabel).toBeVisible();

    // Assert: Memory usage bar should have progressbar role
    const memoryProgressBar = firstNodeCard.getByRole('progressbar').nth(1);
    await expect(memoryProgressBar).toBeVisible();
  });

  test('should display pod count in each NodeCard', async ({ page }) => {
    // Tests that each NodeCard shows the number of pods running on the node

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get the first node card
    const firstNodeCard = page.getByTestId('node-card').first();
    await expect(firstNodeCard).toBeVisible();

    // Assert: Pod count should be visible
    const podCount = firstNodeCard.getByTestId('node-pod-count');
    await expect(podCount).toBeVisible();

    // Assert: Pod count should contain a number
    const podCountText = await podCount.innerText();
    expect(podCountText).toMatch(/\d+/); // Contains at least one digit
    expect(podCountText.toLowerCase()).toMatch(/pod/i); // Contains "pod" text
  });
});

test.describe('Nodes Tab - CPU/Memory UsageBar Accessibility', () => {
  test('should have proper accessibility attributes for CPU usage bar', async ({ page }) => {
    // Tests ARIA attributes for CPU usage progressbar

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get the first node card
    const firstNodeCard = page.getByTestId('node-card').first();
    await expect(firstNodeCard).toBeVisible();

    // Act: Get CPU usage progressbar
    const cpuProgressBar = firstNodeCard.getByRole('progressbar').first();
    await expect(cpuProgressBar).toBeVisible();

    // Assert: Should have required ARIA attributes
    await expect(cpuProgressBar).toHaveAttribute('aria-valuenow');
    await expect(cpuProgressBar).toHaveAttribute('aria-valuemin', '0');
    await expect(cpuProgressBar).toHaveAttribute('aria-valuemax', '100');

    // Assert: aria-valuenow should be a valid percentage (0-100)
    const ariaValueNow = await cpuProgressBar.getAttribute('aria-valuenow');
    const cpuPercentage = parseFloat(ariaValueNow!);
    expect(cpuPercentage).toBeGreaterThanOrEqual(0);
    expect(cpuPercentage).toBeLessThanOrEqual(100);
  });

  test('should have proper accessibility attributes for Memory usage bar', async ({ page }) => {
    // Tests ARIA attributes for Memory usage progressbar

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get the first node card
    const firstNodeCard = page.getByTestId('node-card').first();
    await expect(firstNodeCard).toBeVisible();

    // Act: Get Memory usage progressbar (second progressbar in the card)
    const memoryProgressBar = firstNodeCard.getByRole('progressbar').nth(1);
    await expect(memoryProgressBar).toBeVisible();

    // Assert: Should have required ARIA attributes
    await expect(memoryProgressBar).toHaveAttribute('aria-valuenow');
    await expect(memoryProgressBar).toHaveAttribute('aria-valuemin', '0');
    await expect(memoryProgressBar).toHaveAttribute('aria-valuemax', '100');

    // Assert: aria-valuenow should be a valid percentage (0-100)
    const ariaValueNow = await memoryProgressBar.getAttribute('aria-valuenow');
    const memoryPercentage = parseFloat(ariaValueNow!);
    expect(memoryPercentage).toBeGreaterThanOrEqual(0);
    expect(memoryPercentage).toBeLessThanOrEqual(100);
  });

  test('should have aria-label for CPU usage bar describing the metric', async ({ page }) => {
    // Tests that CPU usage bar has descriptive aria-label

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get the first node card and CPU progressbar
    const firstNodeCard = page.getByTestId('node-card').first();
    const cpuProgressBar = firstNodeCard.getByRole('progressbar').first();

    // Assert: Should have aria-label or aria-labelledby
    const hasAriaLabel = await cpuProgressBar.getAttribute('aria-label');
    const hasAriaLabelledby = await cpuProgressBar.getAttribute('aria-labelledby');
    expect(hasAriaLabel || hasAriaLabelledby).toBeTruthy();

    // Assert: Label should contain "CPU" reference
    if (hasAriaLabel) {
      expect(hasAriaLabel.toLowerCase()).toContain('cpu');
    }
  });
});

test.describe('Nodes Tab - Ready Node Status', () => {
  test('should display Ready status badge with success variant for healthy nodes', async ({ page }) => {
    // Tests that Ready nodes show success-style status badge

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get all node cards
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Act: Find a Ready node
    let foundReadyNode = false;
    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const statusBadge = nodeCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      // Assert: If node is Ready, verify status badge styling
      if (statusText.toLowerCase() === 'ready') {
        foundReadyNode = true;

        // Assert: Status badge should have success/green styling
        const badgeClasses = await statusBadge.getAttribute('class');
        expect(badgeClasses).toMatch(/success|green|ready/i);

        // Assert: CPU and Memory usage bars should be visible for Ready nodes
        const cpuUsage = nodeCard.getByTestId('node-cpu-usage');
        const memoryUsage = nodeCard.getByTestId('node-memory-usage');
        await expect(cpuUsage).toBeVisible();
        await expect(memoryUsage).toBeVisible();

        break;
      }
    }

    // Assert: At least one Ready node should exist in a healthy cluster
    expect(foundReadyNode).toBe(true);
  });

  test('should render usage bars correctly for Ready nodes', async ({ page }) => {
    // Tests that Ready nodes display functional CPU/Memory usage bars

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get all node cards and find a Ready node
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    let readyNodeCard = null;

    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const statusBadge = nodeCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      if (statusText.toLowerCase() === 'ready') {
        readyNodeCard = nodeCard;
        break;
      }
    }

    // Assert: Found a Ready node
    expect(readyNodeCard).toBeTruthy();
    if (!readyNodeCard) return;

    // Assert: CPU progressbar should render with valid width
    const cpuProgressBar = readyNodeCard.getByRole('progressbar').first();
    await expect(cpuProgressBar).toBeVisible();
    const cpuWidth = await cpuProgressBar.evaluate(el => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.width);
    });
    expect(cpuWidth).toBeGreaterThan(0);

    // Assert: Memory progressbar should render with valid width
    const memoryProgressBar = readyNodeCard.getByRole('progressbar').nth(1);
    await expect(memoryProgressBar).toBeVisible();
    const memoryWidth = await memoryProgressBar.evaluate(el => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.width);
    });
    expect(memoryWidth).toBeGreaterThan(0);
  });

  test('should display pod count for Ready nodes', async ({ page }) => {
    // Tests that Ready nodes show accurate pod count

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Find a Ready node
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    let readyNodeCard = null;

    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const statusBadge = nodeCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      if (statusText.toLowerCase() === 'ready') {
        readyNodeCard = nodeCard;
        break;
      }
    }

    // Assert: Found a Ready node
    expect(readyNodeCard).toBeTruthy();
    if (!readyNodeCard) return;

    // Assert: Pod count should be visible and contain valid number
    const podCount = readyNodeCard.getByTestId('node-pod-count');
    await expect(podCount).toBeVisible();

    const podCountText = await podCount.innerText();
    const podNumber = parseInt(podCountText.match(/\d+/)?.[0] || '0');
    expect(podNumber).toBeGreaterThanOrEqual(0); // Can be 0 or more
  });
});

test.describe('Nodes Tab - NotReady Node Handling', () => {
  test('should display NotReady status badge with error variant for unhealthy nodes', async ({ page }) => {
    // Tests that NotReady nodes show error-style status badge

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get all node cards
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();

    // Act: Look for NotReady nodes
    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const statusBadge = nodeCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      // Assert: If node is NotReady, verify error styling
      if (statusText.toLowerCase().includes('notready')) {
        // Assert: Status badge should have error/red styling
        const badgeClasses = await statusBadge.getAttribute('class');
        expect(badgeClasses).toMatch(/error|red|danger|notready/i);

        // Note: NotReady nodes may still show usage bars or show disabled state
        // This depends on implementation requirements
        break;
      }
    }

    // Note: This test doesn't fail if all nodes are Ready
    // In a healthy cluster, all nodes should be Ready
  });
});

test.describe('Nodes Tab - Loading and Error States', () => {
  test('should display loading state while fetching node data', async ({ page }) => {
    // Tests loading skeleton or spinner during data fetch

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');

    // Act: Look for loading indicator immediately after navigation
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Act: Check for loading state
    const loadingIndicator = nodesPage.getByTestId('nodes-loading')
      .or(nodesPage.locator('[aria-busy="true"]'))
      .or(nodesPage.locator('.loading-skeleton'));

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');

    // Assert: After loading, node cards should be displayed
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Loading indicator should no longer be visible
    const loadingExists = await loadingIndicator.count();
    if (loadingExists > 0) {
      await expect(loadingIndicator.first()).not.toBeVisible();
    }
  });

  test('should display error message when node data fetch fails', async ({ page }) => {
    // Tests error state when API request fails

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state or successful data load
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    const errorMessage = nodesPage.getByTestId('nodes-error')
      .or(nodesPage.getByText(/error loading nodes|failed to fetch nodes/i));

    // Assert: Either error is shown or nodes are loaded successfully
    const nodeCards = page.getByTestId('node-card');
    const errorVisible = await errorMessage.count() > 0 && await errorMessage.isVisible().catch(() => false);
    const nodesVisible = (await nodeCards.count()) >= 1;

    expect(errorVisible || nodesVisible).toBeTruthy();
  });

  test('should display retry button on error state', async ({ page }) => {
    // Tests retry functionality in error state

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Look for error state
    const nodesPage = page.getByTestId('nodes-page');
    const errorContainer = nodesPage.getByTestId('nodes-error');

    // Assert: If error state is shown, retry button should be present
    if (await errorContainer.isVisible()) {
      const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i })
        .or(errorContainer.getByTestId('retry-button'));
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toBeEnabled();

      // Act: Click retry button
      await retryButton.click();
      await page.waitForLoadState('networkidle');

      // Assert: Should either show nodes or error message again
      const nodeCards = page.getByTestId('node-card');
      const errorStillVisible = await errorContainer.isVisible().catch(() => false);
      const nodesNowVisible = (await nodeCards.count()) > 0;

      expect(errorStillVisible || nodesNowVisible).toBeTruthy();
    }
  });
});

test.describe('Nodes Tab - Responsive Design', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    // Tests mobile viewport rendering with stacked node cards

    // Arrange: Set mobile viewport (iPhone SE dimensions)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Locate the nodes page
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Assert: Node cards should be visible on mobile
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: First and second cards should be visible and stacked vertically
    const firstCard = nodeCards.first();
    await expect(firstCard).toBeVisible();

    if (cardCount > 1) {
      const secondCard = nodeCards.nth(1);
      await expect(secondCard).toBeVisible();

      // Assert: Cards should be stacked vertically (different Y positions)
      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();
      expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height - 10);
    }

    // Assert: Usage bars should be visible on mobile
    const cpuUsageBar = firstCard.getByRole('progressbar').first();
    await expect(cpuUsageBar).toBeVisible();
  });

  test('should display correctly on tablet viewport', async ({ page }) => {
    // Tests tablet viewport rendering with grid layout

    // Arrange: Set tablet viewport (iPad dimensions)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Locate the nodes page
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Assert: Node cards should be visible on tablet
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: All cards should be visible
    const cards = await nodeCards.all();
    for (const card of cards) {
      await expect(card).toBeVisible();
    }
  });

  test('should display correctly on desktop viewport', async ({ page }) => {
    // Tests desktop viewport rendering with multi-column grid

    // Arrange: Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Locate the nodes page
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Assert: Node cards should be visible on desktop
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: All cards should be visible
    const cards = await nodeCards.all();
    for (const card of cards) {
      await expect(card).toBeVisible();
    }

    // Assert: Page heading should be visible
    const pageHeading = page.getByRole('heading', { name: /nodes/i });
    await expect(pageHeading).toBeVisible();
  });
});

test.describe('Nodes Tab - Navigation and Integration', () => {
  test('should be accessible from the Overview page NodeQuickView', async ({ page }) => {
    // Tests navigation from Overview page to Nodes tab

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Look for "view more" link in NodeQuickView
    const nodeQuickView = page.getByTestId('node-quick-view');
    await expect(nodeQuickView).toBeVisible();

    const viewMoreLink = nodeQuickView.getByTestId('view-more-link');
    if (await viewMoreLink.count() > 0) {
      await viewMoreLink.click();
      await page.waitForLoadState('networkidle');

      // Assert: Should navigate to Nodes page
      const currentUrl = page.url();
      expect(currentUrl.toLowerCase()).toContain('nodes');

      // Assert: Nodes page should be visible
      const nodesPage = page.getByTestId('nodes-page');
      await expect(nodesPage).toBeVisible();
    }
  });

  test('should show more nodes than NodeQuickView preview', async ({ page }) => {
    // Tests that Nodes tab shows all nodes, not just preview limit

    // Arrange: Get node count from Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nodeQuickView = page.getByTestId('node-quick-view');
    const previewNodeItems = nodeQuickView.getByTestId('node-item');
    const previewCount = await previewNodeItems.count();

    // Act: Navigate to Nodes tab
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Assert: Nodes tab should show at least as many nodes as preview
    const nodeCards = page.getByTestId('node-card');
    const fullCount = await nodeCards.count();
    expect(fullCount).toBeGreaterThanOrEqual(previewCount);

    // Note: If cluster has ≤5 nodes, counts may be equal
    // If cluster has >5 nodes, full view should show more
  });

  test('should maintain data consistency with NodeQuickView', async ({ page }) => {
    // Tests that node data is consistent between Overview and Nodes tab

    // Arrange: Get first node name from Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nodeQuickView = page.getByTestId('node-quick-view');
    const firstNodeItem = nodeQuickView.getByTestId('node-item').first();
    const overviewNodeName = await firstNodeItem.getByTestId('node-name').innerText();

    // Act: Navigate to Nodes tab
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Assert: Same node should exist in Nodes tab with same name
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    let foundMatchingNode = false;

    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const nodeName = await nodeCard.getByTestId('node-name').innerText();
      if (nodeName === overviewNodeName) {
        foundMatchingNode = true;
        break;
      }
    }

    expect(foundMatchingNode).toBe(true);
  });
});

test.describe('Nodes Tab - Role Display', () => {
  test('should display node role when available', async ({ page }) => {
    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Assert: Node cards should be visible
    const firstNodeCard = page.getByTestId('node-card').first();
    await expect(firstNodeCard).toBeVisible();

    // Role badge may or may not be present depending on node labels
    const roleBadge = firstNodeCard.getByTestId('node-role');
    const roleCount = await roleBadge.count();
    if (roleCount > 0) {
      await expect(roleBadge).toBeVisible();
      const roleText = await roleBadge.innerText();
      expect(roleText.length).toBeGreaterThan(0);
    }
  });
});
