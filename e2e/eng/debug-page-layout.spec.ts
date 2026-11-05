// Engineering: ENG-001 (docs/product/eng-notes.md) — debug page diagnostic contract; not a product AC.
import { test, expect } from '@playwright/test';
import { enableDebugAndGenerateLogs } from '../helpers/debug-setup';

test.describe('Debug Page - Layout Structure', () => {
  test('should render DebugPage component when accessing /debug route', async ({ page }) => {
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const debugPage = page.getByTestId('debug-page');
    await expect(debugPage).toBeVisible();

    const debugTitle = page.getByTestId('debug-page-title');
    await expect(debugTitle).toBeVisible();
  });

  test('should display left panel with endpoint list area', async ({ page }) => {
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const leftPanel = page.getByTestId('debug-left-panel');
    await expect(leftPanel).toBeVisible();

    const endpointList = page.getByTestId('endpoint-list');
    await expect(endpointList).toBeVisible();
  });

  test('should display right panel with detail view area', async ({ page }) => {
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const rightPanel = page.getByTestId('debug-right-panel');
    await expect(rightPanel).toBeVisible();
  });
});

test.describe('Debug Page - API Log Display', () => {
  test('should display log entries with method, URL, status code, and duration', async ({ page }) => {
    await enableDebugAndGenerateLogs(page);

    const overviewEndpoint = page.getByTestId('endpoint-item')
      .filter({ hasText: '/api/overview' })
      .first();
    await expect(overviewEndpoint).toBeVisible();

    const firstLogEntry = page.getByTestId('endpoint-item').first();
    await expect(firstLogEntry).toContainText(/GET/i);

    await expect(firstLogEntry).toContainText(/\/api\//i);

    const statusCode = page.getByTestId('status-code').first();
    await expect(statusCode).toBeVisible();
    await expect(statusCode).toContainText('200');

    const durationText = await firstLogEntry.textContent();
    expect(durationText).toMatch(/\d+\s*(ms|s)/i);
  });
});

test.describe('Debug Page - Endpoint Selection', () => {
  test('should highlight selected endpoint when clicked', async ({ page }) => {
    await enableDebugAndGenerateLogs(page);

    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    await expect(firstEndpoint).toHaveClass(/bg-cyan-50|selected|active/);

    const hasLeftBorder = await firstEndpoint.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.borderLeftWidth !== '0px' && style.borderLeftWidth !== '';
    });
    expect(hasLeftBorder).toBe(true);
  });
});

test.describe('Debug Page - Empty State', () => {
  test('should display empty state message when no API calls are recorded', async ({ page }) => {
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const emptyState = page.getByTestId('debug-empty-state');
    await expect(emptyState).toBeVisible();

    await expect(emptyState).toContainText(/navigate to other pages to see api logs/i);
  });
});
