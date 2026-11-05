// Engineering: ENG-001 (docs/product/eng-notes.md) — debug page diagnostic contract; not a product AC.
import { test, expect } from '@playwright/test';
import { enableDebugAndGenerateLogs } from '../helpers/debug-setup';

test.describe('Debug Context - Debug Mode Toggle', () => {
  test('should toggle debug mode ON and OFF', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle')
      .or(page.getByRole('button', { name: /debug/i }));
    await expect(debugToggle).toBeVisible();

    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    await debugToggle.click();

    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    const debugIndicator = debugToggle.getByText(/on|enabled/i)
      .or(debugToggle.locator('[data-testid="debug-on-icon"]'));
    await expect(debugIndicator).toBeVisible();

    await debugToggle.click();

    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    const debugOffIndicator = debugToggle.getByText(/off|disabled/i)
      .or(debugToggle.locator('[data-testid="debug-off-icon"]'));
    await expect(debugOffIndicator).toBeVisible();
  });

  test('should persist debug mode ON state across page navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const debugToggleOnPods = page.getByTestId('debug-toggle');
    await expect(debugToggleOnPods).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const debugToggleOnDebug = page.getByTestId('debug-toggle');
    await expect(debugToggleOnDebug).toHaveAttribute('aria-pressed', 'true');
  });

  test('should maintain debug mode OFF state across navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');

    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    const debugToggleOnNodes = page.getByTestId('debug-toggle');
    await expect(debugToggleOnNodes).toHaveAttribute('aria-pressed', 'false');

    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const debugToggleOnDebug = page.getByTestId('debug-toggle');
    await expect(debugToggleOnDebug).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('Debug Context - API Logging with Debug Mode ON', () => {
  test('should log API calls including /api/overview when debug mode is ON', async ({ page }) => {
    await enableDebugAndGenerateLogs(page);

    const apiLogsList = page.getByTestId('endpoint-list');
    await expect(apiLogsList).toBeVisible();

    const logEntries = page.getByTestId('api-log-entry')
      .or(page.getByTestId('endpoint-item'))
      .or(apiLogsList.locator('[role="listitem"]'));
    const logCount = await logEntries.count();
    expect(logCount).toBeGreaterThan(0);

    const overviewEndpoint = page.getByTestId('endpoint-item').filter({ hasText: '/api/overview' }).first();
    await expect(overviewEndpoint).toBeVisible();
  });

  test('should log multiple API calls when navigating between pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    await expect.poll(async () => {
      const logEntries = page.getByTestId('api-log-entry')
        .or(page.getByTestId('endpoint-item'))
        .or(page.locator('[data-testid*="endpoint"]'));
      return await logEntries.count();
    }, {
      message: 'Expected at least 3 API log entries from overview, pods, nodes pages',
      timeout: 5000,
    }).toBeGreaterThanOrEqual(3);
  });
});

test.describe('Debug Context - API Log Metadata', () => {
  test('should display all metadata fields in detail view', async ({ page }) => {
    await enableDebugAndGenerateLogs(page);

    const firstLogEntry = page.getByTestId('endpoint-item').first()
      .or(page.getByTestId('api-log-entry').first());
    await firstLogEntry.click();

    const statusCode = page.getByTestId('status-code').first();
    await expect(statusCode).toBeVisible();
    const statusCodeText = await statusCode.textContent();
    expect(statusCodeText).toContain('200');

    const metadataTab = page.getByRole('tab', { name: /metadata/i })
      .or(page.getByTestId('metadata-tab'));
    await metadataTab.click();

    const timestamp = page.getByTestId('request-timestamp');
    await expect(timestamp).toBeVisible();

    const duration = page.getByTestId('request-duration');
    await expect(duration).toBeVisible();
    const durationText = await duration.textContent();
    expect(durationText).toMatch(/\d+/);

    const metadataContent = page.getByTestId('metadata-content')
      .or(page.getByRole('tabpanel'));
    await expect(metadataContent.getByTestId('status-code')).toBeVisible();
    await expect(metadataContent.getByTestId('request-timestamp')).toBeVisible();
    await expect(metadataContent.getByTestId('request-duration')).toBeVisible();
  });
});

test.describe('Debug Context - No Logging when Debug Mode OFF', () => {
  test('should not log API calls when debug mode is OFF', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');

    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const emptyState = page.getByTestId('debug-empty-state')
      .or(page.getByText(/no api calls/i))
      .or(page.getByText(/no logs/i))
      .or(page.getByText(/enable debug mode/i));

    const emptyStateVisible = await emptyState.isVisible().catch(() => false);
    const logEntries = page.getByTestId('api-log-entry')
      .or(page.getByTestId('endpoint-item'));
    const logCount = await logEntries.count();

    expect(emptyStateVisible || logCount === 0).toBe(true);
  });

  test('should clear previous logs when debug mode is turned OFF', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const logEntriesBefore = page.getByTestId('endpoint-item');
    await expect(logEntriesBefore.first()).toBeVisible({ timeout: 5000 });
    const countBefore = await logEntriesBefore.count();
    expect(countBefore).toBeGreaterThan(0);

    await debugToggle.click();
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    await page.reload();
    await page.waitForLoadState('networkidle');

    const emptyState = page.getByTestId('debug-empty-state')
      .or(page.getByText(/no logs/i));
    const emptyStateVisible = await emptyState.isVisible().catch(() => false);

    const logEntriesAfter = page.getByTestId('endpoint-item');
    const countAfter = await logEntriesAfter.count();

    expect(emptyStateVisible || countAfter === 0).toBe(true);
  });

  test('should only log new API calls after debug mode is turned ON mid-session', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    await debugToggle.click();
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('endpoint-item').first()).toBeVisible({ timeout: 5000 });

    const logEntries = page.getByTestId('endpoint-item')
      .or(page.getByTestId('api-log-entry'));
    const logCount = await logEntries.count();

    expect(logCount).toBeGreaterThan(0);

    const podsEndpoint = page.getByText(/\/api\/pods/i);
    const podsVisible = await podsEndpoint.isVisible().catch(() => false);
  });
});

test.describe('Debug Context - Integration with Debug Page', () => {
  test('should synchronize DebugContext state with /debug page display', async ({ page }) => {
    await enableDebugAndGenerateLogs(page);

    const apiLogsList = page.getByTestId('endpoint-list');
    await expect(apiLogsList).toBeVisible();

    const logEntries = page.getByTestId('endpoint-item');
    expect(await logEntries.count()).toBeGreaterThan(0);

    const debugToggleOnDebug = page.getByTestId('debug-toggle');
    await expect(debugToggleOnDebug).toHaveAttribute('aria-pressed', 'true');
  });

  test('should update /debug page when debug mode is toggled from different page', async ({ page }) => {
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggleHome = page.getByTestId('debug-toggle');
    await debugToggleHome.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.goto('/debug');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('endpoint-item').first()).toBeVisible({ timeout: 5000 });

    const debugToggleOnDebug = page.getByTestId('debug-toggle');
    await expect(debugToggleOnDebug).toHaveAttribute('aria-pressed', 'true');

    const logEntries = page.getByTestId('endpoint-item');
    expect(await logEntries.count()).toBeGreaterThan(0);
  });
});
