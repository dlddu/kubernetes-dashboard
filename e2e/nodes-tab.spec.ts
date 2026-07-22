// Verifies: ND1 (docs/product/prd-nodes.md) — sole dedicated e2e spec for this AC.
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
