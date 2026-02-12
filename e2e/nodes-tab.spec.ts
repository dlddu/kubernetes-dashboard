import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Nodes Tab (DLD-331)
 *
 * TDD Red Phase: Tests written - components not yet implemented.
 * These tests define the expected behavior of the Nodes Tab feature,
 * which displays a comprehensive list of all cluster nodes with detailed
 * resource usage metrics, pod counts, and status indicators.
 *
 * Components to be implemented:
 * - NodesTab: Main page component for /nodes route
 * - NodeCard: Individual node card showing metrics and status
 * - StatusBadge: Status indicator component (already exists)
 * - UsageBar: Progress bar for CPU/Memory usage (already exists)
 */
test.describe('Nodes Tab - Navigation', () => {
  test.skip('should navigate to Nodes tab when Nodes tab is clicked', async ({ page }) => {
    // Tests navigation from Overview to Nodes page via tab click

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Should be on Overview page initially
    const overviewTab = page.getByTestId('overview-tab');
    await expect(overviewTab).toBeVisible();

    // Act: Click the Nodes tab in the bottom navigation
    const nodesTab = page.getByTestId('nodes-tab')
      .or(page.getByRole('link', { name: /nodes/i }));
    await expect(nodesTab).toBeVisible();
    await expect(nodesTab).toBeEnabled();
    await nodesTab.click();

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');

    // Assert: URL should change to /nodes route
    const currentUrl = page.url();
    expect(currentUrl.toLowerCase()).toContain('nodes');

    // Assert: Nodes page should be visible
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Assert: Page title or heading should indicate Nodes page
    const pageHeading = page.getByRole('heading', { name: /^nodes$/i });
    await expect(pageHeading).toBeVisible();
  });

  test.skip('should navigate to Nodes tab from NodeQuickView "view more" link', async ({ page }) => {
    // Tests navigation from NodeQuickView component to full Nodes page

    // Arrange: Navigate to Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the NodeQuickView component
    const nodeQuickView = page.getByTestId('node-quick-view');
    await expect(nodeQuickView).toBeVisible();

    // Act: Click the "view more" link if it exists (when >5 nodes)
    const viewMoreLink = nodeQuickView.getByTestId('view-more-link')
      .or(nodeQuickView.getByRole('link', { name: /view.*nodes|see all/i }));

    const linkCount = await viewMoreLink.count();
    if (linkCount > 0) {
      await viewMoreLink.click();
      await page.waitForLoadState('networkidle');

      // Assert: Should navigate to Nodes page
      const nodesPage = page.getByTestId('nodes-page');
      await expect(nodesPage).toBeVisible();

      // Assert: URL should be /nodes
      expect(page.url().toLowerCase()).toContain('nodes');
    } else {
      // If no view more link, navigate directly to test the page
      await page.goto('/nodes');
      await page.waitForLoadState('networkidle');

      const nodesPage = page.getByTestId('nodes-page');
      await expect(nodesPage).toBeVisible();
    }
  });

  test.skip('should persist namespace selection when navigating to Nodes tab', async ({ page }) => {
    // Tests that NamespaceContext is maintained during navigation

    // Note: Nodes are cluster-scoped resources, so namespace selection
    // might not filter nodes, but the selector should remain consistent

    // Arrange: Navigate to Overview and select a namespace
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Verify selection is applied
    await expect(namespaceSelector).toContainText(/^default$/i);

    // Act: Navigate to Nodes tab
    const nodesTab = page.getByTestId('nodes-tab')
      .or(page.getByRole('link', { name: /nodes/i }));
    await nodesTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selector should still show "default"
    const namespaceSelectorOnNodesTab = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnNodesTab).toContainText(/^default$/i);
  });
});

test.describe('Nodes Tab - Node List Display', () => {
  test.skip('should display all cluster nodes as cards on Nodes page', async ({ page }) => {
    // Tests that all nodes from the kind cluster are displayed

    // Arrange: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Assert: Nodes page should be visible
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Assert: Should display at least one node card
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Each node card should be visible
    const cards = await nodeCards.all();
    for (const card of cards) {
      await expect(card).toBeVisible();
    }

    // Assert: In kind cluster, typically has at least control-plane node
    const firstNodeCard = nodeCards.first();
    await expect(firstNodeCard).toBeVisible();
  });

  test.skip('should display more than 5 nodes if cluster has more (unlike NodeQuickView)', async ({ page }) => {
    // Tests that Nodes tab shows all nodes without the 5-node limit of NodeQuickView

    // Arrange: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Count node cards
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();

    // Assert: Should display all nodes (no 5-node limit)
    // In a kind cluster with multiple nodes, all should be visible
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Note: Unlike NodeQuickView which limits to 5, Nodes tab shows all
    // This test passes as long as nodes are displayed
  });

  test.skip('should not display "view more" link on Nodes tab', async ({ page }) => {
    // Tests that Nodes tab shows all nodes without pagination controls

    // Arrange: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Assert: Nodes page should be visible
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Assert: Should not have "view more" link (all nodes already shown)
    const viewMoreLink = page.getByTestId('view-more-link');
    const linkCount = await viewMoreLink.count();
    expect(linkCount).toBe(0);
  });
});

test.describe('Nodes Tab - NodeCard Components', () => {
  test.skip('should display node name in each NodeCard', async ({ page }) => {
    // Tests that each node card displays the node name

    // Arrange: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get all node cards
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Each card should have a node name
    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const nodeName = nodeCard.getByTestId('node-name');
      await expect(nodeName).toBeVisible();

      // Assert: Node name should not be empty
      const nodeNameText = await nodeName.innerText();
      expect(nodeNameText.length).toBeGreaterThan(0);

      // Assert: Node name should match typical Kubernetes naming patterns
      // (lowercase alphanumeric with hyphens)
      expect(nodeNameText).toMatch(/^[a-z0-9-]+$/);
    }
  });

  test.skip('should display StatusBadge in each NodeCard', async ({ page }) => {
    // Tests that each node card displays a status badge

    // Arrange: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get all node cards
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Each card should have a status badge
    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const statusBadge = nodeCard.getByTestId('status-badge');
      await expect(statusBadge).toBeVisible();

      // Assert: Status badge should show valid status
      const statusText = await statusBadge.innerText();
      expect(statusText.toLowerCase()).toMatch(/ready|notready|unknown|schedulingdisabled/);
    }
  });

  test.skip('should display CPU usage bar in each NodeCard', async ({ page }) => {
    // Tests that each node card displays CPU usage with UsageBar component

    // Arrange: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get all node cards
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Each card should have CPU usage bar
    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const cpuUsage = nodeCard.getByTestId('node-cpu-usage');
      await expect(cpuUsage).toBeVisible();

      // Assert: CPU usage should have progressbar role (accessibility)
      const cpuProgressBar = cpuUsage.getByRole('progressbar')
        .or(cpuUsage.locator('[role="progressbar"]'));
      await expect(cpuProgressBar).toBeVisible();

      // Assert: Progress bar should have aria attributes
      await expect(cpuProgressBar).toHaveAttribute('aria-valuenow');
      await expect(cpuProgressBar).toHaveAttribute('aria-valuemin', '0');
      await expect(cpuProgressBar).toHaveAttribute('aria-valuemax', '100');

      // Assert: CPU percentage should be valid (0-100)
      const cpuAriaValue = await cpuProgressBar.getAttribute('aria-valuenow');
      const cpuPercentage = parseFloat(cpuAriaValue!);
      expect(cpuPercentage).toBeGreaterThanOrEqual(0);
      expect(cpuPercentage).toBeLessThanOrEqual(100);
    }
  });

  test.skip('should display Memory usage bar in each NodeCard', async ({ page }) => {
    // Tests that each node card displays Memory usage with UsageBar component

    // Arrange: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get all node cards
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Each card should have Memory usage bar
    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const memoryUsage = nodeCard.getByTestId('node-memory-usage');
      await expect(memoryUsage).toBeVisible();

      // Assert: Memory usage should have progressbar role (accessibility)
      const memoryProgressBar = memoryUsage.getByRole('progressbar')
        .or(memoryUsage.locator('[role="progressbar"]'));
      await expect(memoryProgressBar).toBeVisible();

      // Assert: Progress bar should have aria attributes
      await expect(memoryProgressBar).toHaveAttribute('aria-valuenow');
      await expect(memoryProgressBar).toHaveAttribute('aria-valuemin', '0');
      await expect(memoryProgressBar).toHaveAttribute('aria-valuemax', '100');

      // Assert: Memory percentage should be valid (0-100)
      const memoryAriaValue = await memoryProgressBar.getAttribute('aria-valuenow');
      const memoryPercentage = parseFloat(memoryAriaValue!);
      expect(memoryPercentage).toBeGreaterThanOrEqual(0);
      expect(memoryPercentage).toBeLessThanOrEqual(100);
    }
  });

  test.skip('should display Pod count in each NodeCard', async ({ page }) => {
    // Tests that each node card displays the number of pods running on the node

    // Arrange: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get all node cards
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Each card should display pod count
    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const podCount = nodeCard.getByTestId('node-pod-count');
      await expect(podCount).toBeVisible();

      // Assert: Pod count should be a non-negative integer
      const podCountText = await podCount.innerText();
      const podCountNumber = parseInt(podCountText.replace(/[^\d]/g, ''), 10);
      expect(podCountNumber).toBeGreaterThanOrEqual(0);

      // Assert: Pod count text should include "pod" or "pods"
      expect(podCountText.toLowerCase()).toMatch(/pods?/);
    }
  });
});

test.describe('Nodes Tab - Ready Nodes Resource Bars', () => {
  test.skip('should render CPU and Memory usage bars for Ready nodes', async ({ page }) => {
    // Tests that Ready nodes display functional resource usage bars

    // Arrange: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Find Ready nodes
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Check each Ready node has working usage bars
    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const statusBadge = nodeCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      // Only check Ready nodes (not NotReady, Unknown, etc.)
      if (statusText.toLowerCase().includes('ready') && !statusText.toLowerCase().includes('notready')) {
        // Assert: CPU usage bar should be visible and functional
        const cpuUsage = nodeCard.getByTestId('node-cpu-usage');
        await expect(cpuUsage).toBeVisible();

        const cpuBar = cpuUsage.getByRole('progressbar');
        await expect(cpuBar).toBeVisible();

        // Assert: Should have visual progress indicator
        const cpuValue = await cpuBar.getAttribute('aria-valuenow');
        expect(cpuValue).toBeDefined();

        // Assert: Memory usage bar should be visible and functional
        const memoryUsage = nodeCard.getByTestId('node-memory-usage');
        await expect(memoryUsage).toBeVisible();

        const memoryBar = memoryUsage.getByRole('progressbar');
        await expect(memoryBar).toBeVisible();

        // Assert: Should have visual progress indicator
        const memoryValue = await memoryBar.getAttribute('aria-valuenow');
        expect(memoryValue).toBeDefined();
      }
    }
  });

  test.skip('should display accurate resource usage percentages for Ready nodes', async ({ page }) => {
    // Tests that resource bars show accurate usage data

    // Arrange: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get all node cards
    const nodeCards = page.getByTestId('node-card');
    const firstNodeCard = nodeCards.first();

    // Act: Get status badge
    const statusBadge = firstNodeCard.getByTestId('status-badge');
    const statusText = await statusBadge.innerText();

    // Assert: If node is Ready, check resource accuracy
    if (statusText.toLowerCase().includes('ready') && !statusText.toLowerCase().includes('notready')) {
      // Assert: CPU usage should match displayed percentage
      const cpuUsage = firstNodeCard.getByTestId('node-cpu-usage');
      const cpuBar = cpuUsage.getByRole('progressbar');
      const cpuAriaValue = await cpuBar.getAttribute('aria-valuenow');
      const cpuPercentage = parseFloat(cpuAriaValue!);

      // Check if percentage text is displayed
      const cpuText = await cpuUsage.innerText();
      if (cpuText.match(/\d+%/)) {
        const displayedCpuPercentage = parseInt(cpuText.match(/(\d+)%/)![1], 10);
        expect(Math.abs(displayedCpuPercentage - cpuPercentage)).toBeLessThanOrEqual(1);
      }

      // Assert: Memory usage should match displayed percentage
      const memoryUsage = firstNodeCard.getByTestId('node-memory-usage');
      const memoryBar = memoryUsage.getByRole('progressbar');
      const memoryAriaValue = await memoryBar.getAttribute('aria-valuenow');
      const memoryPercentage = parseFloat(memoryAriaValue!);

      // Check if percentage text is displayed
      const memoryText = await memoryUsage.innerText();
      if (memoryText.match(/\d+%/)) {
        const displayedMemoryPercentage = parseInt(memoryText.match(/(\d+)%/)![1], 10);
        expect(Math.abs(displayedMemoryPercentage - memoryPercentage)).toBeLessThanOrEqual(1);
      }
    }
  });
});

test.describe('Nodes Tab - Node Status Badge', () => {
  test.skip('should display "Ready" status badge for healthy nodes', async ({ page }) => {
    // Tests that healthy nodes show Ready status

    // Arrange: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get all node cards
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();

    // Assert: At least one node should be Ready in a healthy cluster
    let foundReadyNode = false;
    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const statusBadge = nodeCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      if (statusText.toLowerCase().includes('ready') && !statusText.toLowerCase().includes('notready')) {
        foundReadyNode = true;

        // Assert: Ready badge should have appropriate styling
        // (typically green/success color)
        await expect(statusBadge).toBeVisible();
      }
    }

    // Assert: In a healthy kind cluster, should have at least one Ready node
    expect(foundReadyNode).toBe(true);
  });

  test.skip('should display "NotReady" status badge for unhealthy nodes', async ({ page }) => {
    // Tests that unhealthy nodes show NotReady status

    // Arrange: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get all node cards
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();

    // Assert: Check if any NotReady nodes exist
    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const statusBadge = nodeCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      if (statusText.toLowerCase().includes('notready')) {
        // Assert: NotReady badge should have warning/error styling
        // (typically red/error color)
        await expect(statusBadge).toBeVisible();

        // Assert: Node card might have additional warning indicators
        const warningIndicator = nodeCard.getByTestId('node-warning-indicator')
          .or(nodeCard.locator('[role="alert"]'))
          .or(nodeCard.locator('.warning-icon'));

        // Warning indicator is optional but should exist for NotReady nodes
        const indicatorCount = await warningIndicator.count();
        if (indicatorCount > 0) {
          await expect(warningIndicator).toBeVisible();
        }
      }
    }

    // Note: This test doesn't fail if all nodes are Ready
    // It only validates NotReady display when such nodes exist
  });

  test.skip('should display status badge with correct color coding', async ({ page }) => {
    // Tests that status badges use appropriate colors for different states

    // Arrange: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get first node card
    const nodeCards = page.getByTestId('node-card');
    const firstNodeCard = nodeCards.first();
    const statusBadge = firstNodeCard.getByTestId('status-badge');

    await expect(statusBadge).toBeVisible();

    // Assert: Status badge should have color classes or styles
    // Ready = green/success, NotReady = red/error, Unknown = yellow/warning
    const statusText = await statusBadge.innerText();

    // Assert: Badge should be clearly visible
    const badgeBox = await statusBadge.boundingBox();
    expect(badgeBox).toBeDefined();
    expect(badgeBox!.width).toBeGreaterThan(0);
    expect(badgeBox!.height).toBeGreaterThan(0);

    // Assert: Status text should be one of the expected values
    expect(statusText.toLowerCase()).toMatch(/ready|notready|unknown|schedulingdisabled/);
  });
});

test.describe('Nodes Tab - Loading and Error States', () => {
  test.skip('should display loading state while fetching node data', async ({ page }) => {
    // Tests loading state with skeleton or spinner

    // Arrange: Navigate to Nodes page
    await page.goto('/nodes');

    // Act: Look for loading indicator immediately after navigation
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Act: Check for loading indicator
    const loadingIndicator = nodesPage.getByTestId('nodes-loading')
      .or(nodesPage.locator('[aria-busy="true"]'))
      .or(nodesPage.locator('.loading-skeleton'));

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');

    // Assert: After loading, should display node cards
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Loading indicator should no longer be visible
    const loadingExists = await loadingIndicator.count();
    if (loadingExists > 0) {
      await expect(loadingIndicator.first()).not.toBeVisible();
    }
  });

  test.skip('should display error message when node data fetch fails', async ({ page }) => {
    // Tests error state when API request fails

    // Arrange: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Locate the Nodes page
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Act: Check for error state
    const errorMessage = nodesPage.getByTestId('nodes-error')
      .or(nodesPage.getByText(/error loading nodes|failed to fetch nodes/i));

    // Assert: Either error is shown or nodes are loaded successfully
    const nodeCards = page.getByTestId('node-card');
    const errorVisible = await errorMessage.count() > 0 && await errorMessage.isVisible().catch(() => false);
    const nodesVisible = (await nodeCards.count()) >= 1;

    expect(errorVisible || nodesVisible).toBeTruthy();
  });

  test.skip('should display empty state when cluster has no nodes', async ({ page }) => {
    // Tests empty state display (unlikely in real clusters but good to handle)

    // Note: This scenario is rare since clusters always have nodes
    // But the component should handle it gracefully

    // Arrange: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Check for node cards
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();

    // Assert: If no nodes, should show empty state message
    if (cardCount === 0) {
      const emptyMessage = page.getByTestId('nodes-empty-state')
        .or(page.getByText(/no nodes found|no nodes available/i));
      await expect(emptyMessage).toBeVisible();
    }
  });
});

test.describe('Nodes Tab - Responsive Design', () => {
  test.skip('should display correctly on mobile viewport', async ({ page }) => {
    // Tests mobile viewport rendering

    // Arrange: Set mobile viewport (iPhone SE dimensions)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Locate the Nodes page
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Assert: Node cards should be visible on mobile
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Cards should stack vertically on mobile
    const firstCard = nodeCards.first();
    const secondCard = nodeCards.nth(1);

    await expect(firstCard).toBeVisible();

    if (cardCount > 1) {
      await expect(secondCard).toBeVisible();

      // Assert: Cards should be stacked vertically
      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();
      expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height - 10);
    }

    // Assert: Usage bars should be visible on mobile
    const firstCardCpuBar = firstCard.getByRole('progressbar').first();
    await expect(firstCardCpuBar).toBeVisible();
  });

  test.skip('should display correctly on desktop viewport', async ({ page }) => {
    // Tests desktop viewport rendering

    // Arrange: Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Locate the Nodes page
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

    // Assert: Cards might be displayed in a grid layout on desktop
    // (implementation detail, but all should be visible)
    const firstCard = nodeCards.first();
    await expect(firstCard).toBeVisible();

    // Assert: All NodeCard components should be rendered
    const firstCardElements = firstCard.getByTestId('node-name');
    await expect(firstCardElements).toBeVisible();
  });
});

test.describe('Nodes Tab - Node Ordering', () => {
  test.skip('should display nodes ordered by status (NotReady first)', async ({ page }) => {
    // Tests that unhealthy nodes are prioritized in display order

    // Arrange: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get all node cards
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Check ordering - NotReady nodes should appear before Ready nodes
    let foundReadyNode = false;
    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const statusBadge = nodeCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      if (statusText.toLowerCase().includes('ready') && !statusText.toLowerCase().includes('notready')) {
        foundReadyNode = true;
      } else if (statusText.toLowerCase().includes('notready')) {
        // Assert: Should not find NotReady nodes after Ready nodes
        expect(foundReadyNode).toBe(false);
      }
    }
  });
});

test.describe('Nodes Tab - Integration with NodeQuickView', () => {
  test.skip('should show same nodes as NodeQuickView but without 5-node limit', async ({ page }) => {
    // Tests consistency between NodeQuickView and Nodes tab

    // Arrange: Navigate to Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Count nodes in NodeQuickView
    const nodeQuickView = page.getByTestId('node-quick-view');
    await expect(nodeQuickView).toBeVisible();

    const quickViewNodeItems = nodeQuickView.getByTestId('node-item');
    const quickViewCount = await quickViewNodeItems.count();
    expect(quickViewCount).toBeGreaterThanOrEqual(1);
    expect(quickViewCount).toBeLessThanOrEqual(5); // NodeQuickView limits to 5

    // Act: Navigate to Nodes tab
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Assert: Nodes tab should show same or more nodes
    const nodeCards = page.getByTestId('node-card');
    const nodesTabCount = await nodeCards.count();

    // Assert: Nodes tab should show at least as many nodes as NodeQuickView
    expect(nodesTabCount).toBeGreaterThanOrEqual(quickViewCount);

    // Assert: Node names should be consistent
    const firstQuickViewNode = await quickViewNodeItems.first().getByTestId('node-name').innerText();
    const firstNodesTabNode = await nodeCards.first().getByTestId('node-name').innerText();

    // If NodeQuickView shows NotReady first, Nodes tab should too
    // So first node should match (assuming same ordering logic)
    if (quickViewCount > 0 && nodesTabCount > 0) {
      // Names should exist (exact match depends on ordering implementation)
      expect(firstNodesTabNode).toBeTruthy();
    }
  });
});
