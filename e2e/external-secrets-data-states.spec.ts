// Verifies: ES4 (docs/product/prd-external-secrets.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Group 4: UI — Empty / Error / Loading states
// ---------------------------------------------------------------------------
test.describe('External Secrets Tab - Empty, Error & Loading States', () => {
  test('should display EmptyState when the selected namespace has no ExternalSecrets', async ({ page }) => {
    await page.goto('/external-secrets');
    await page.waitForLoadState('networkidle');

    // Switch to dashboard-empty (no ExternalSecret resources)
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const emptyNamespaceOption = page.getByRole('option', { name: /^dashboard-empty$/i })
      .or(page.getByTestId('namespace-option-dashboard-empty'));
    await emptyNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    const emptyState = page.getByTestId('no-external-secrets-message')
      .or(page.getByTestId('empty-state').first());
    await expect(emptyState).toBeVisible();

    expect(await page.getByTestId('external-secret-card').count()).toBe(0);
  });

  test('should display ErrorRetry component with retry button when the API returns an error', async ({ page }) => {
    let shouldFail = true;
    await page.route('**/api/external-secrets**', async route => {
      if (shouldFail) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/external-secrets');
    await page.waitForLoadState('networkidle');

    const errorRetry = page.getByTestId('external-secrets-error')
      .or(page.getByTestId('error-retry'));
    await expect(errorRetry).toBeVisible();

    const retryButton = errorRetry.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    expect(await page.getByTestId('external-secret-card').count()).toBe(0);

    // Allow next call to succeed and retry
    shouldFail = false;
    await retryButton.click();
    await page.waitForLoadState('networkidle');

    await expect(errorRetry).not.toBeVisible();
  });

  test('should display LoadingSkeleton with aria-busy="true" while ExternalSecrets are being fetched', async ({ page }) => {
    await page.route('**/api/external-secrets**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/external-secrets');

    const loadingSkeleton = page.getByTestId('external-secrets-loading')
      .or(page.getByTestId('loading-skeleton').first());
    await expect(loadingSkeleton).toBeVisible();
    await expect(loadingSkeleton).toHaveAttribute('aria-busy', 'true');
  });
});
