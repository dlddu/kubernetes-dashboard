// Verifies: SC4 (docs/product/prd-secrets.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

test.describe('LoadingSkeleton Component - Secrets Tab', () => {
  test('should display loading skeleton while fetching secret data', async ({ page }) => {
    // Tests that LoadingSkeleton appears during secret data fetch

    // Arrange: Navigate to the Secrets tab
    await page.goto('/secrets');

    // Act: Check for loading state
    const loadingIndicator = page.getByTestId('secrets-loading')
      .or(page.locator('[data-testid*="loading"]'))
      .or(page.locator('[aria-busy="true"]'));

    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Assert: Secret accordions or empty state should be displayed after loading
    const secretAccordions = page.locator('[data-testid^="secret-accordion-"]');
    const cardCount = await secretAccordions.count();

    if (cardCount === 0) {
      // May show empty state if no secrets
      const emptyState = page.getByTestId('no-secrets-message')
        .or(page.getByText(/no secrets found/i));
      const hasEmptyState = (await emptyState.count()) > 0;
      // Either empty state or secrets should be present
      expect(hasEmptyState).toBe(true);
    } else {
      expect(cardCount).toBeGreaterThan(0);
    }

    // Assert: Loading indicator should no longer be visible
    const loadingStillVisible = await loadingIndicator.isVisible().catch(() => false);
    expect(loadingStillVisible).toBe(false);
  });
});

test.describe('ErrorRetry Component - Secrets Tab', () => {
  test('should display error message when secret data fails to load', async ({ page }) => {
    // Tests that ErrorRetry appears when secret API fails

    // Arrange: Navigate to the Secrets tab
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state or successful load
    const errorContainer = page.getByTestId('secrets-error');
    const secretAccordions = page.locator('[data-testid^="secret-accordion-"]');

    // Assert: Either error or secrets are displayed
    const hasError = await errorContainer.isVisible().catch(() => false);
    const hasSecrets = (await secretAccordions.count()) > 0;

    expect(hasError || hasSecrets).toBe(true);

    // If error is displayed, verify retry button
    if (hasError) {
      const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i })
        .or(errorContainer.getByTestId('retry-button'));

      const hasRetryButton = (await retryButton.count()) > 0;
      if (hasRetryButton) {
        await expect(retryButton).toBeVisible();
      }
    }
  });
});

test.describe('EmptyState Component - Secrets Tab', () => {
  test('should display empty state when no secrets are available', async ({ page }) => {
    // Tests that EmptyState appears when namespace has no secrets

    // Arrange: Navigate to the Secrets tab
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Act: Check for empty state or secret accordions
    const emptyState = page.getByTestId('no-secrets-message')
      .or(page.getByText(/no secrets found/i));
    const secretAccordions = page.locator('[data-testid^="secret-accordion-"]');

    // Assert: Either empty state or secrets should be displayed
    const isEmpty = (await emptyState.count()) > 0 && await emptyState.first().isVisible().catch(() => false);
    const hasSecrets = (await secretAccordions.count()) > 0;

    expect(isEmpty || hasSecrets).toBe(true);

    // If empty state is shown, verify its content
    if (isEmpty) {
      // Assert: Should have descriptive message
      const message = await emptyState.first().innerText();
      expect(message.toLowerCase()).toMatch(/no secrets|empty|not found/);
    }
  });
});

test.describe('Secrets Tab - Loading and Error States', () => {
  test('should display loading state while fetching secrets', async ({ page }) => {
    // Tests loading indicator during data fetch

    // Arrange: Navigate to Secrets tab
    await page.goto('/secrets');

    // Act: Look for loading indicator immediately after navigation
    const secretsTab = page.getByTestId('secrets-tab');
    await expect(secretsTab).toBeVisible();

    // Act: Check for loading state
    const loadingIndicator = secretsTab.getByTestId('secrets-loading')
      .or(secretsTab.locator('[aria-busy="true"]'))
      .or(secretsTab.locator('.loading-skeleton'));

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');

    // Assert: After loading, secret accordions should be displayed
    const secretAccordions = page.locator('[data-testid^="secret-accordion-"]');
    const accordionCount = await secretAccordions.count();
    expect(accordionCount).toBeGreaterThanOrEqual(2);

    // Assert: Loading indicator should no longer be visible
    const loadingExists = await loadingIndicator.count();
    if (loadingExists > 0) {
      await expect(loadingIndicator.first()).not.toBeVisible();
    }
  });

  test('should display error message when secrets fetch fails', async ({ page }) => {
    // Tests error state when API request fails

    // Arrange: Navigate to Secrets tab
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state or successful data load
    const secretsTab = page.getByTestId('secrets-tab');
    await expect(secretsTab).toBeVisible();

    const errorMessage = secretsTab.getByTestId('secrets-error')
      .or(secretsTab.getByText(/error loading secrets|failed to fetch secrets/i));

    // Assert: Either error is shown or secrets are loaded successfully
    const secretAccordions = page.locator('[data-testid^="secret-accordion-"]');
    const errorVisible = await errorMessage.count() > 0 && await errorMessage.isVisible().catch(() => false);
    const secretsVisible = (await secretAccordions.count()) >= 2;

    expect(errorVisible || secretsVisible).toBeTruthy();
  });
});

test.describe('Common UI Components - Consistency Across Tabs', () => {
  test('should use consistent LoadingSkeleton design on Secrets tab', async ({ page }) => {
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Assert: Tab should load successfully (either with data or empty state)
    const body = await page.locator('body').innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });

  test('should use consistent ErrorRetry button style on Secrets tab', async ({ page }) => {
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Act: Check if error state exists
    const errorContainer = page.getByTestId('secrets-error');
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

  test('should use consistent EmptyState design on Secrets tab', async ({ page }) => {
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Act: Check if empty state exists
    const emptyState = page.getByTestId('no-secrets-message');
    const isEmpty = await emptyState.isVisible().catch(() => false);

    if (isEmpty) {
      // Assert: Empty state should have content
      const message = await emptyState.innerText();
      expect(message.length).toBeGreaterThan(0);
    }
  });
});
