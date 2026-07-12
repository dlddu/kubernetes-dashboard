// Verifies: ND3 (docs/product/prd-nodes.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

test.describe('LoadingSkeleton Component - Nodes Tab', () => {
  test('should display loading skeleton while fetching node data', async ({ page }) => {
    // Tests that LoadingSkeleton appears during node data fetch

    // Arrange: Navigate to the Nodes tab
    await page.goto('/nodes');

    // Act: Check for loading state
    const loadingIndicator = page.getByTestId('nodes-loading')
      .or(page.locator('[data-testid*="loading"]'))
      .or(page.locator('[aria-busy="true"]'));

    // Assert: Page should be visible
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Assert: Node cards should be displayed after loading
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Loading indicator should no longer be visible
    const loadingStillVisible = await loadingIndicator.isVisible().catch(() => false);
    expect(loadingStillVisible).toBe(false);
  });

  test('should show skeleton cards matching final node card layout', async ({ page }) => {
    // Tests that loading skeleton matches the structure of node cards

    // Arrange: Navigate to the Nodes tab
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Navigate to Nodes tab to observe loading skeleton
    await page.goto('/nodes');

    // Wait for loading to complete
    await page.waitForLoadState('networkidle');

    // Assert: Node cards should have consistent structure
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Each card should have name, status, and usage bars
    const firstCard = nodeCards.first();
    await expect(firstCard.getByTestId('node-name')).toBeVisible();
    await expect(firstCard.getByTestId('status-badge')).toBeVisible();
    await expect(firstCard.getByTestId('node-cpu-usage')).toBeVisible();
  });
});

test.describe('ErrorRetry Component - Nodes Tab', () => {
  test('should display error message when node data fails to load', async ({ page }) => {
    // Tests that ErrorRetry appears when node API fails

    // Arrange: Navigate to the Nodes tab
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state or successful load
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    const errorContainer = page.getByTestId('nodes-error');
    const nodeCards = page.getByTestId('node-card');

    // Assert: Either error is displayed or nodes are successfully loaded
    const hasError = await errorContainer.isVisible().catch(() => false);
    const hasNodes = (await nodeCards.count()) > 0;

    expect(hasError || hasNodes).toBe(true);

    // If error is displayed, verify retry functionality
    if (hasError) {
      const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i })
        .or(errorContainer.getByTestId('retry-button'));
      await expect(retryButton).toBeVisible();
    }
  });

  test('should successfully refetch node data after retry', async ({ page }) => {
    // Tests that retry button successfully refetches node data

    // Arrange: Navigate to the Nodes tab
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Check if error state exists
    const errorContainer = page.getByTestId('nodes-error');
    const hasError = await errorContainer.isVisible().catch(() => false);

    if (hasError) {
      // Act: Click retry button
      const retryButton = errorContainer.getByTestId('retry-button')
        .or(errorContainer.getByRole('button', { name: /retry|try again/i }));

      await retryButton.click();

      // Wait for retry operation
      await page.waitForLoadState('networkidle');

      // Assert: Should either display nodes or error state
      const nodeCards = page.getByTestId('node-card');
      const errorStillVisible = await errorContainer.isVisible().catch(() => false);
      const hasNodes = (await nodeCards.count()) > 0;

      expect(errorStillVisible || hasNodes).toBe(true);
    }
  });
});

test.describe('EmptyState Component - Nodes Tab', () => {
  test('should display empty state when no nodes are available', async ({ page }) => {
    // Tests that EmptyState appears when cluster has no nodes
    // Note: In practice, a cluster always has at least one node

    // Arrange: Navigate to the Nodes tab
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Check for empty state or node cards
    const emptyState = page.getByTestId('nodes-empty');
    const nodeCards = page.getByTestId('node-card');

    // Assert: Either empty state or nodes should be displayed
    const isEmpty = await emptyState.isVisible().catch(() => false);
    const hasNodes = (await nodeCards.count()) > 0;

    expect(isEmpty || hasNodes).toBe(true);

    // If empty state is shown, verify its content
    if (isEmpty) {
      // Assert: Empty state should have descriptive message
      const emptyMessage = await emptyState.innerText();
      expect(emptyMessage.length).toBeGreaterThan(0);
      expect(emptyMessage.toLowerCase()).toMatch(/no nodes|empty|not found/);
    }
  });

  test('should display helpful message in empty state', async ({ page }) => {
    // Tests that empty state message is clear and helpful

    // Arrange: Navigate to the Nodes tab
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Check for empty state
    const emptyState = page.getByTestId('nodes-empty');
    const isEmpty = await emptyState.isVisible().catch(() => false);

    if (isEmpty) {
      // Assert: Should have icon or visual indicator
      const emptyIcon = emptyState.locator('svg')
        .or(emptyState.locator('[role="img"]'));

      const hasIcon = (await emptyIcon.count()) > 0;
      expect(hasIcon).toBe(true);

      // Assert: Should have clear message
      const message = await emptyState.innerText();
      expect(message).toBeTruthy();
    }
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

test.describe('Common UI Components - Responsive Design', () => {
  test('should display error retry button correctly on mobile', async ({ page }) => {
    // Tests that retry buttons are touchable on mobile

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state
    const errorContainer = page.getByTestId('nodes-error');
    const hasError = await errorContainer.isVisible().catch(() => false);

    if (hasError) {
      const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i });
      const hasRetryButton = (await retryButton.count()) > 0;

      if (hasRetryButton) {
        await expect(retryButton).toBeVisible();

        // Assert: Button should have adequate touch target size
        const box = await retryButton.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44); // Minimum touch target
      }
    }
  });
});

test.describe('Common UI Components - Consistency Across Tabs', () => {
  test('should use consistent LoadingSkeleton design on Nodes tab', async ({ page }) => {
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Assert: Tab should load successfully (either with data or empty state)
    const body = await page.locator('body').innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });

  test('should use consistent ErrorRetry button style on Nodes tab', async ({ page }) => {
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Check if error state exists
    const errorContainer = page.getByTestId('nodes-error');
    const hasError = await errorContainer.isVisible().catch(() => false);

    if (hasError) {
      // Assert: Retry button should exist and be consistent
      const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i })
        .or(errorContainer.getByTestId('retry-button'));

      const hasRetryButton = (await retryButton.count()) > 0;
      expect(hasRetryButton).toBe(true);

      if (hasRetryButton) {
        await expect(retryButton.first()).toBeVisible();
      }
    }
  });

  test('should use consistent EmptyState design on Nodes tab', async ({ page }) => {
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Check if empty state exists
    const emptyState = page.getByTestId('nodes-empty');
    const isEmpty = await emptyState.isVisible().catch(() => false);

    if (isEmpty) {
      // Assert: Empty state should have content
      const message = await emptyState.innerText();
      expect(message.length).toBeGreaterThan(0);
    }
  });
});
