import { test, expect } from '@playwright/test';
import { enableDebugAndGenerateLogs } from './helpers/debug-setup';

/**
 * E2E Tests for Debug Page - Layout and Endpoint List Display
 *
 * Tests verify the DebugPage component UI layout and API log visualization:
 * - Page renders with correct structure (left/right panels)
 * - Endpoint list displays captured API calls
 * - Each log entry shows method, URL, status code, duration
 * - Endpoint selection highlights the selected item
 * - Empty state displays when no API calls are logged
 *
 * Related Issue: DLD-393 - Activated from DLD-392
 * Parent Issue: DLD-341 - Debug Page API Response Feature
 *
 * Activated for DLD-393 implementation
 */

test.describe('Debug Page - Layout Structure', () => {
  test('should render DebugPage component when accessing /debug route', async ({ page }) => {
    // Tests that /debug route correctly renders the DebugPage component

    // Act: Navigate to /debug route
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: DebugPage component should be visible
    const debugPage = page.getByTestId('debug-page');
    await expect(debugPage).toBeVisible();

    // Assert: Page should have proper heading
    const debugTitle = page.getByTestId('debug-page-title');
    await expect(debugTitle).toBeVisible();
  });

  test('should display left panel with endpoint list area', async ({ page }) => {
    // Tests that DebugPage has a left panel for displaying endpoint list

    // Arrange: Navigate to /debug
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Left panel should exist and be visible
    const leftPanel = page.getByTestId('debug-left-panel');
    await expect(leftPanel).toBeVisible();

    // Assert: Left panel should contain endpoint list component
    const endpointList = page.getByTestId('endpoint-list');
    await expect(endpointList).toBeVisible();
  });

  test('should display right panel with detail view area', async ({ page }) => {
    // Tests that DebugPage has a right panel for displaying API call details

    // Arrange: Navigate to /debug
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Right panel should exist and be visible
    const rightPanel = page.getByTestId('debug-right-panel');
    await expect(rightPanel).toBeVisible();
  });
});

test.describe('Debug Page - API Log Display', () => {
  test.beforeEach(async ({ page }) => {
    await enableDebugAndGenerateLogs(page);
  });

  test('should display /api/overview log entry after visiting Overview page', async ({ page }) => {
    // Tests that DebugContext captures and displays API calls from page navigation

    // Assert: Should display /api/overview endpoint in the list
    const overviewEndpoint = page.getByTestId('endpoint-item')
      .filter({ hasText: '/api/overview' })
      .first();
    await expect(overviewEndpoint).toBeVisible();
  });

  test('should display HTTP method (GET) for each log entry', async ({ page }) => {
    // Tests that each API log entry shows the HTTP method

    // Assert: First log entry should display HTTP method (GET)
    const firstLogEntry = page.getByTestId('endpoint-item').first();
    await expect(firstLogEntry).toContainText(/GET/i);
  });

  test('should display URL for each log entry', async ({ page }) => {
    // Tests that each API log entry shows the request URL

    // Assert: First log entry should display URL path
    const firstLogEntry = page.getByTestId('endpoint-item').first();
    await expect(firstLogEntry).toContainText(/\/api\//i);
  });

  test('should display status code for each log entry', async ({ page }) => {
    // Tests that each API log entry shows the HTTP status code

    // Assert: Log entry should display status code
    const statusCode = page.getByTestId('status-code').first();
    await expect(statusCode).toBeVisible();

    // Assert: Status code should be 200 for successful requests
    await expect(statusCode).toContainText('200');
  });

  test('should display duration for each log entry', async ({ page }) => {
    // Tests that each API log entry shows the request duration

    // Assert: Log entry should display duration
    const firstLogEntry = page.getByTestId('endpoint-item').first();
    const durationText = await firstLogEntry.textContent();

    // Duration should be a number with time unit (ms, s)
    expect(durationText).toMatch(/\d+\s*(ms|s)/i);
  });
});

test.describe('Debug Page - Endpoint Selection', () => {
  test('should highlight selected endpoint when clicked', async ({ page }) => {
    // Tests that clicking an endpoint applies visual highlight (cyan-50 background + left border)

    // Arrange: Enable debug mode and generate API logs
    await enableDebugAndGenerateLogs(page);

    // Act: Click first endpoint in the list
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: Selected endpoint should have cyan-50 background
    await expect(firstEndpoint).toHaveClass(/bg-cyan-50|selected|active/);

    // Assert: Selected endpoint should have left border indicator
    // (This can be verified via computed styles or specific data-attribute)
    const hasLeftBorder = await firstEndpoint.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.borderLeftWidth !== '0px' && style.borderLeftWidth !== '';
    });
    expect(hasLeftBorder).toBe(true);
  });
});

test.describe('Debug Page - Empty State', () => {
  test('should display empty state message when no API calls are recorded', async ({ page }) => {
    // Tests that /debug page shows empty state when DebugContext has no logs

    // Arrange: Navigate directly to /debug without enabling debug mode or making API calls
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Should display empty state message
    const emptyState = page.getByTestId('debug-empty-state');
    await expect(emptyState).toBeVisible();

    // Assert: Empty state should contain guidance text
    await expect(emptyState).toContainText(/navigate to other pages to see api logs/i);
  });
});
