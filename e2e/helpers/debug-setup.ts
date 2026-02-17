import { Page, expect } from '@playwright/test';

/**
 * Enables debug mode and generates API logs by navigating through the app.
 * Replaces the repeated 7-step setup pattern and fragile waitForTimeout(1000) calls
 * with a deterministic wait for endpoint-item visibility on the /debug page.
 */
export async function enableDebugAndGenerateLogs(page: Page): Promise<void> {
  // Navigate to home page
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Enable debug mode
  const debugToggle = page.getByTestId('debug-toggle');
  await debugToggle.click();

  // Navigate to overview to trigger API calls with debug interception active
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Navigate to /debug and wait for log entries to appear
  // This replaces waitForTimeout(1000) with a deterministic condition
  await page.goto('/debug');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('endpoint-item').first()).toBeVisible({ timeout: 5000 });
}
