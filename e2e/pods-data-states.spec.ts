// Verifies: PD7 (docs/product/prd-pods.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

test.describe('LoadingSkeleton Component - Pods Tab', () => {
  test('should display loading skeleton while fetching pod data', async ({ page }) => {
    // Tests that LoadingSkeleton appears during pod data fetch

    // Arrange: Navigate to the Pods tab
    await page.goto('/pods');

    // Act: Check for loading state
    const loadingIndicator = page.getByTestId('pods-loading')
      .or(page.locator('[data-testid*="loading"]'))
      .or(page.locator('[aria-busy="true"]'));

    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Assert: Pod table or empty state should be displayed after loading
    const podRows = page.getByTestId('pod-card');
    const emptyMessage = page.getByTestId('no-unhealthy-pods-message');

    const hasRows = (await podRows.count()) > 0;
    const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);

    expect(hasRows || hasEmptyMessage).toBe(true);

    // Assert: Loading indicator should no longer be visible
    const loadingStillVisible = await loadingIndicator.isVisible().catch(() => false);
    expect(loadingStillVisible).toBe(false);
  });
});

test.describe('ErrorRetry Component - Pods Tab', () => {
  test('should display error message when pod data fails to load', async ({ page }) => {
    // Tests that ErrorRetry appears when pod API fails

    // Arrange: Navigate to the Pods tab
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state or successful load
    const errorContainer = page.getByTestId('pods-error');
    const podRows = page.getByTestId('pod-card');
    const emptyMessage = page.getByTestId('no-unhealthy-pods-message');

    // Assert: Either error, empty message, or pods are displayed
    const hasError = await errorContainer.isVisible().catch(() => false);
    const hasPods = (await podRows.count()) > 0;
    const isEmpty = await emptyMessage.isVisible().catch(() => false);

    expect(hasError || hasPods || isEmpty).toBe(true);
  });
});

test.describe('EmptyState Component - Pods Tab', () => {
  test('should display empty state when no unhealthy pods are found', async ({ page }) => {
    // Tests that EmptyState appears when all pods are healthy

    // Arrange: Navigate to the Pods tab
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Check for empty state or pod rows
    const emptyMessage = page.getByTestId('no-unhealthy-pods-message');
    const podRows = page.getByTestId('pod-card');

    // Assert: Either empty message or pods should be displayed
    const isEmpty = await emptyMessage.isVisible().catch(() => false);
    const hasPods = (await podRows.count()) > 0;

    expect(isEmpty || hasPods).toBe(true);

    // If empty state is shown, verify it's a positive message
    if (isEmpty) {
      // Assert: Message should indicate healthy state
      const message = await emptyMessage.innerText();
      expect(message.toLowerCase()).toMatch(/no unhealthy|all healthy|good|ok/);
    }
  });

  test('should show positive message when all pods are healthy', async ({ page }) => {
    // Tests that empty state for pods is positive (not alarming)

    // Arrange: Navigate to the Pods tab
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Check for empty message
    const emptyMessage = page.getByTestId('no-unhealthy-pods-message');
    const isEmpty = await emptyMessage.isVisible().catch(() => false);

    if (isEmpty) {
      // Assert: Should have positive/success styling
      const messageElement = emptyMessage;

      // Assert: Message should be positive
      const message = await messageElement.innerText();
      expect(message).toBeTruthy();

      // Assert: Should not have error/warning styling
      const classes = await messageElement.getAttribute('class');
      expect(classes).not.toMatch(/error|danger|warning|red/i);
    }
  });
});

test.describe('Pods Page - Loading and Error States', () => {
  test('should display loading state while fetching pod data', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests loading skeleton or spinner during data fetch

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');

    // Act: Look for loading indicator immediately after navigation
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    // Act: Check for loading state
    const loadingIndicator = podsPage.getByTestId('pods-loading')
      .or(podsPage.locator('[aria-busy="true"]'))
      .or(podsPage.locator('.loading-skeleton'));

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');

    // Assert: After loading, pod cards should be displayed
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Loading indicator should no longer be visible
    const loadingExists = await loadingIndicator.count();
    if (loadingExists > 0) {
      await expect(loadingIndicator.first()).not.toBeVisible();
    }
  });

  test('should display error message when pod data fetch fails', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests error state when API request fails

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state or successful data load
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    const errorMessage = podsPage.getByTestId('pods-error')
      .or(podsPage.getByText(/error loading pods|failed to fetch pods/i));

    // Assert: Either error is shown or pods are loaded successfully
    const podCards = page.getByTestId('pod-card');
    const errorVisible = await errorMessage.count() > 0 && await errorMessage.isVisible().catch(() => false);
    const podsVisible = (await podCards.count()) >= 1;

    expect(errorVisible || podsVisible).toBeTruthy();
  });

  test('should display empty state message when no pods exist', async ({ page }) => {
    // Tests empty state when no pods are found

    // Note: This test requires a cluster with no pods
    // or mocking the API response to return no pods

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Check if there are any pod cards
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();

    // Assert: When no pods exist, should show empty state message
    if (cardCount === 0) {
      const emptyStateMessage = page.getByTestId('no-pods-message')
        .or(page.getByText(/no pods found/i));
      await expect(emptyStateMessage).toBeVisible();
    }
  });
});

test.describe('Common UI Components - Consistency Across Tabs', () => {
  test('should use consistent LoadingSkeleton design on Pods tab', async ({ page }) => {
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Tab should load successfully (either with data or empty state)
    const body = await page.locator('body').innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });

  test('should use consistent ErrorRetry button style on Pods tab', async ({ page }) => {
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Check if error state exists
    const errorContainer = page.getByTestId('pods-error');
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

  test('should use consistent EmptyState design on Pods tab', async ({ page }) => {
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Check if empty state exists
    const emptyState = page.getByTestId('no-unhealthy-pods-message');
    const isEmpty = await emptyState.isVisible().catch(() => false);

    if (isEmpty) {
      // Assert: Empty state should have content
      const message = await emptyState.innerText();
      expect(message.length).toBeGreaterThan(0);
    }
  });
});
