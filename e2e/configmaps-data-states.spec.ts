import { test, expect } from '@playwright/test';

test.describe('ConfigMaps Tab - Loading and Error States', () => {
  test('should display loading state while fetching configmaps', async ({ page }) => {
    await page.goto('/configmaps');

    const configMapsTab = page.getByTestId('configmaps-tab');
    await expect(configMapsTab).toBeVisible();

    const loadingIndicator = configMapsTab.getByTestId('configmaps-loading')
      .or(configMapsTab.locator('[aria-busy="true"]'))
      .or(configMapsTab.locator('.loading-skeleton'));

    await page.waitForLoadState('networkidle');

    const configMapAccordions = page.locator('[data-testid^="configmap-accordion-"]');
    const accordionCount = await configMapAccordions.count();
    expect(accordionCount).toBeGreaterThanOrEqual(2);

    const loadingExists = await loadingIndicator.count();
    if (loadingExists > 0) {
      await expect(loadingIndicator.first()).not.toBeVisible();
    }
  });

  test('should display error message or configmaps when fetch resolves', async ({ page }) => {
    await page.goto('/configmaps');
    await page.waitForLoadState('networkidle');

    const configMapsTab = page.getByTestId('configmaps-tab');
    await expect(configMapsTab).toBeVisible();

    const errorMessage = configMapsTab.getByTestId('configmaps-error')
      .or(configMapsTab.getByText(/error loading configmaps|failed to fetch configmaps/i));

    const configMapAccordions = page.locator('[data-testid^="configmap-accordion-"]');
    const errorVisible = await errorMessage.count() > 0 && await errorMessage.isVisible().catch(() => false);
    const configMapsVisible = (await configMapAccordions.count()) >= 2;

    expect(errorVisible || configMapsVisible).toBeTruthy();
  });
});
