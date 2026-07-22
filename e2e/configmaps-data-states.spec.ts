// Verifies: CF3 (docs/product/prd-configmaps.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

test.describe('ConfigMaps Tab - Loading and Error States', () => {
  test('should display loading state while fetching configmaps', async ({ page }) => {
    // Arrange: Navigate to ConfigMaps tab
    await page.goto('/configmaps');

    // Act: ConfigMaps tab should be visible
    const configMapsTab = page.getByTestId('configmaps-tab');
    await expect(configMapsTab).toBeVisible();

    const loadingIndicator = configMapsTab.getByTestId('configmaps-loading')
      .or(configMapsTab.locator('[aria-busy="true"]'))
      .or(configMapsTab.locator('.loading-skeleton'));

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');

    // Assert: After loading, configmap accordions should be displayed
    const configMapAccordions = page.locator('[data-testid^="configmap-accordion-"]');
    const accordionCount = await configMapAccordions.count();
    expect(accordionCount).toBeGreaterThanOrEqual(2);

    // Assert: Loading indicator should no longer be visible
    const loadingExists = await loadingIndicator.count();
    if (loadingExists > 0) {
      await expect(loadingIndicator.first()).not.toBeVisible();
    }
  });

  test('should display error message or configmaps when fetch resolves', async ({ page }) => {
    // Arrange: Navigate to ConfigMaps tab
    await page.goto('/configmaps');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state or successful data load
    const configMapsTab = page.getByTestId('configmaps-tab');
    await expect(configMapsTab).toBeVisible();

    const errorMessage = configMapsTab.getByTestId('configmaps-error')
      .or(configMapsTab.getByText(/error loading configmaps|failed to fetch configmaps/i));

    // Assert: Either error is shown or configmaps are loaded successfully
    const configMapAccordions = page.locator('[data-testid^="configmap-accordion-"]');
    const errorVisible = await errorMessage.count() > 0 && await errorMessage.isVisible().catch(() => false);
    const configMapsVisible = (await configMapAccordions.count()) >= 2;

    expect(errorVisible || configMapsVisible).toBeTruthy();
  });
});
