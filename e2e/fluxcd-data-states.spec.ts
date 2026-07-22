// Verifies: FX7 (docs/product/prd-fluxcd.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Group 3: UI — Loading, Empty & Error States
// ---------------------------------------------------------------------------
test.describe('FluxCD Tab - GitRepository List - Loading, Empty & Error States', () => {
  test('should display ErrorRetry component with retry button when the GitRepositories API returns an error', async ({ page }) => {
    // Arrange: Block ALL gitrepositories API calls with 500 until the flag is flipped.
    let shouldFail = true;
    await page.route('**/api/fluxcd/gitrepositories**', async route => {
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

    await page.goto('/flux');
    await page.waitForLoadState('networkidle');

    // Assert: ErrorRetry component is visible
    const errorRetry = page.getByTestId('error-retry');
    await expect(errorRetry).toBeVisible();
    await expect(errorRetry).toHaveAttribute('role', 'alert');

    // Assert: Retry button is present and enabled
    const retryButton = errorRetry.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    // Assert: No GitRepository cards are shown during error state
    const gitRepoCards = page.getByTestId('gitrepository-card');
    expect(await gitRepoCards.count()).toBe(0);

    // Act: Allow subsequent calls to succeed, then click retry
    shouldFail = false;
    await retryButton.click();
    await page.waitForLoadState('networkidle');

    // Assert: ErrorRetry is no longer visible after successful retry
    await expect(errorRetry).not.toBeVisible();
  });

  test('should display LoadingSkeleton with aria-busy="true" while GitRepositories are being fetched', async ({ page }) => {
    // Arrange: Intercept the gitrepositories API and delay the response
    await page.route('**/api/fluxcd/gitrepositories**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.continue();
    });

    await page.goto('/flux');

    // Assert: LoadingSkeleton is visible before the response arrives
    const loadingSkeleton = page.getByTestId('loading-skeleton');
    await expect(loadingSkeleton.first()).toBeVisible();
    await expect(loadingSkeleton.first()).toHaveAttribute('aria-busy', 'true');
  });
});

// ---------------------------------------------------------------------------
// Group 4: UI — EmptyState / ErrorRetry / LoadingSkeleton (테스트 5, 6, 7)
// TODO: Activate when DLD-744 is implemented.
// ---------------------------------------------------------------------------
test.describe('FluxCD Tab - Kustomization List - Loading, Empty & Error States', () => {
  test('should display EmptyState when CRD is not installed (dashboard-empty namespace)', async ({ page }) => {
    // Tests that EmptyState is rendered when the selected namespace has no Kustomizations.
    // Uses 'dashboard-empty' namespace which has no FluxCD CRD resources installed.
    // No API mocking — relies on the real cluster returning an empty list for that namespace.

    // Arrange: Navigate to the FluxCD tab
    await page.goto('/flux');
    await page.waitForLoadState('networkidle');

    // Act: Filter to the 'dashboard-empty' namespace (no Kustomizations)
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const emptyNamespaceOption = page.getByRole('option', { name: /^dashboard-empty$/i })
      .or(page.getByTestId('namespace-option-dashboard-empty'));
    await emptyNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: EmptyState component is visible (both GitRepository and Kustomization sections show empty state)
    const emptyState = page.getByTestId('empty-state').first();
    await expect(emptyState).toBeVisible();

    // Assert: No Kustomization cards are shown
    const kustomizationCards = page.getByTestId('kustomization-card');
    expect(await kustomizationCards.count()).toBe(0);
  });

  test('should display ErrorRetry component with retry button when the Kustomizations API returns an error', async ({ page }) => {
    // Tests that ErrorRetry is rendered on API failure and the retry button re-triggers the fetch.

    // Arrange: Block ALL kustomizations API calls with 500 until the flag is flipped.
    // Flag-based approach avoids race conditions when multiple concurrent fetches occur on mount.
    let shouldFail = true;
    await page.route('**/api/fluxcd/kustomizations**', async route => {
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

    // Act: Navigate to the FluxCD tab
    await page.goto('/flux');
    await page.waitForLoadState('networkidle');

    // Assert: ErrorRetry component is visible
    const errorRetry = page.getByTestId('error-retry');
    await expect(errorRetry).toBeVisible();

    // Assert: ErrorRetry has role="alert" for accessibility
    await expect(errorRetry).toHaveAttribute('role', 'alert');

    // Assert: Retry button is present and enabled
    const retryButton = errorRetry.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    // Assert: No Kustomization cards are shown during error state
    const kustomizationCards = page.getByTestId('kustomization-card');
    expect(await kustomizationCards.count()).toBe(0);

    // Act: Allow subsequent calls to succeed, then click retry
    shouldFail = false;
    await retryButton.click();
    await page.waitForLoadState('networkidle');

    // Assert: ErrorRetry is no longer visible after successful retry
    await expect(errorRetry).not.toBeVisible();
  });

  test('should display LoadingSkeleton with aria-busy="true" while Kustomizations are being fetched', async ({ page }) => {
    // Tests that LoadingSkeleton is shown during the API request.

    // Arrange: Intercept both APIs and delay responses to observe loading state
    await page.route('**/api/fluxcd/kustomizations**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    await page.route('**/api/fluxcd/gitrepositories**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.continue();
    });

    // Act: Navigate to the FluxCD tab (do not wait for networkidle — need to observe loading state)
    await page.goto('/flux');

    // Assert: LoadingSkeleton is visible before the response arrives
    const loadingSkeleton = page.getByTestId('loading-skeleton').first();
    await expect(loadingSkeleton).toBeVisible();

    // Assert: LoadingSkeleton has aria-busy="true" for accessibility
    await expect(loadingSkeleton).toHaveAttribute('aria-busy', 'true');
  });
});
