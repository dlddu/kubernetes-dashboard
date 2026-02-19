import { Page, expect } from '@playwright/test';

/**
 * Enables debug mode and generates API logs by navigating through the app.
 * Replaces the repeated 7-step setup pattern and fragile waitForTimeout(1000) calls
 * with a deterministic wait for endpoint-item visibility on the /debug page.
 */
export async function enableDebugAndGenerateLogs(page: Page): Promise<void> {
  // Navigate to home page and wait for it to fully load
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Enable debug mode - API calls after this will be intercepted
  const debugToggle = page.getByTestId('debug-toggle');
  await debugToggle.click();

  // Navigate to /debug - this triggers API calls that get captured by the interceptor
  // The toBeVisible assertion retries automatically, so networkidle is not needed here
  await page.goto('/debug');
  await expect(page.getByTestId('endpoint-item').first()).toBeVisible({ timeout: 5000 });
}
