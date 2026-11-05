import { Page, expect } from '@playwright/test';

export async function enableDebugAndGenerateLogs(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const debugToggle = page.getByTestId('debug-toggle');
  await debugToggle.click();

  // Reload the page to trigger /api/overview call with debug interception active.
  // The initial page load's API calls happen before debug mode is enabled,
  // so a reload is needed to capture them in the debug log.
  await page.reload();
  await page.waitForLoadState('networkidle');

  await page.goto('/debug');
  await expect(page.getByTestId('endpoint-item').first()).toBeVisible({ timeout: 5000 });
}
