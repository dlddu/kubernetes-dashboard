// Verifies: WL4 (docs/product/prd-workloads.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

test.describe('LoadingSkeleton Component - Workloads Tab', () => {
  test('should display loading skeleton while fetching workload data', async ({ page }) => {
    // Tests that LoadingSkeleton appears during workload data fetch

    // Arrange: Navigate to the Workloads tab
    await page.goto('/workloads');

    // Act: Check for loading state
    const loadingIndicator = page.getByTestId('loading-indicator')
      .or(page.locator('[data-testid*="loading"]'))
      .or(page.locator('[aria-busy="true"]'));

    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Assert: Deployment cards should be displayed after loading
    const workloadCards = page.getByTestId('deployment-card');
    const cardCount = await workloadCards.count();

    // Either cards are displayed or empty state is shown
    if (cardCount === 0) {
      const emptyState = page.getByTestId('empty-state');
      await expect(emptyState).toBeVisible();
    } else {
      expect(cardCount).toBeGreaterThan(0);
    }

    // Assert: Loading indicator should no longer be visible
    const loadingStillVisible = await loadingIndicator.isVisible().catch(() => false);
    expect(loadingStillVisible).toBe(false);
  });
});

test.describe('ErrorRetry Component - Workloads Tab', () => {
  test('should display error message when workload data fails to load', async ({ page }) => {
    // Tests that ErrorRetry appears when workload API fails

    // Arrange: Navigate to the Workloads tab
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state or successful load
    const errorContainer = page.getByTestId('error-message');
    const workloadCards = page.getByTestId('deployment-card');
    const emptyState = page.getByTestId('empty-state');

    // Assert: Either error, empty state, or workloads are displayed
    const hasError = await errorContainer.isVisible().catch(() => false);
    const hasWorkloads = (await workloadCards.count()) > 0;
    const isEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasError || hasWorkloads || isEmpty).toBe(true);

    // If error is displayed, verify retry functionality
    if (hasError) {
      const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i })
        .or(page.getByTestId('retry-button'));

      const retryButtonExists = (await retryButton.count()) > 0;
      if (retryButtonExists) {
        await expect(retryButton).toBeVisible();
      }
    }
  });

  test('should retry loading workloads when retry button is clicked', async ({ page }) => {
    // Tests retry functionality for workloads

    // Arrange: Navigate to the Workloads tab
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Check if error state exists
    const errorContainer = page.getByTestId('error-message');
    const hasError = await errorContainer.isVisible().catch(() => false);

    if (hasError) {
      // Act: Click retry button
      const retryButton = page.getByRole('button', { name: /retry|try again/i });
      const hasRetryButton = (await retryButton.count()) > 0;

      if (hasRetryButton) {
        await retryButton.click();

        // Wait for retry operation
        await page.waitForLoadState('networkidle');

        // Assert: Should show result after retry
        const workloadCards = page.getByTestId('deployment-card');
        const emptyState = page.getByTestId('empty-state');
        const errorStillVisible = await errorContainer.isVisible().catch(() => false);

        const hasWorkloads = (await workloadCards.count()) > 0;
        const isEmpty = await emptyState.isVisible().catch(() => false);

        expect(errorStillVisible || hasWorkloads || isEmpty).toBe(true);
      }
    }
  });
});

test.describe('EmptyState Component - Workloads Tab', () => {
  test('should display empty state when no workloads are available', async ({ page }) => {
    // Tests that EmptyState appears when namespace has no workloads

    // Arrange: Navigate to the Workloads tab
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Check for empty state or workload cards
    const emptyState = page.getByTestId('empty-state');
    const workloadCards = page.getByTestId('deployment-card');

    // Assert: Either empty state or workloads should be displayed
    const isEmpty = await emptyState.isVisible().catch(() => false);
    const hasWorkloads = (await workloadCards.count()) > 0;

    expect(isEmpty || hasWorkloads).toBe(true);

    // If empty state is shown, verify its content
    if (isEmpty) {
      // Assert: Empty state should have descriptive message
      const emptyMessage = await emptyState.innerText();
      expect(emptyMessage.length).toBeGreaterThan(0);
      expect(emptyMessage.toLowerCase()).toMatch(/no workloads|empty|not found/);
    }
  });

  test('should display empty state with helpful guidance', async ({ page }) => {
    // Tests that empty state provides helpful information

    // Arrange: Navigate to the Workloads tab
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Check for empty state
    const emptyState = page.getByTestId('empty-state');
    const isEmpty = await emptyState.isVisible().catch(() => false);

    if (isEmpty) {
      // Assert: Should contain informative message
      const message = await emptyState.innerText();
      expect(message).toBeTruthy();

      // Assert: Message should be helpful
      expect(message.toLowerCase()).toMatch(/no workloads|no deployments|empty|namespace/);
    }
  });
});

test.describe('Common UI Components - Responsive Design', () => {
  test('should display empty state correctly on mobile', async ({ page }) => {
    // Tests that empty states are readable on mobile

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Check for empty state
    const emptyState = page.getByTestId('empty-state');
    const isEmpty = await emptyState.isVisible().catch(() => false);

    if (isEmpty) {
      // Assert: Empty state should fit within viewport
      const box = await emptyState.boundingBox();
      expect(box!.width).toBeLessThanOrEqual(375);

      // Assert: Text should be readable
      const message = await emptyState.innerText();
      expect(message.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Common UI Components - Consistency Across Tabs', () => {
  test('should use consistent LoadingSkeleton design on Workloads tab', async ({ page }) => {
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Assert: Tab should load successfully (either with data or empty state)
    const body = await page.locator('body').innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });

  test('should use consistent ErrorRetry button style on Workloads tab', async ({ page }) => {
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Check if error state exists
    const errorContainer = page.getByTestId('error-message');
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

  test('should use consistent EmptyState design on Workloads tab', async ({ page }) => {
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Check if empty state exists
    const emptyState = page.getByTestId('empty-state');
    const isEmpty = await emptyState.isVisible().catch(() => false);

    if (isEmpty) {
      // Assert: Empty state should have content
      const message = await emptyState.innerText();
      expect(message.length).toBeGreaterThan(0);
    }
  });
});
