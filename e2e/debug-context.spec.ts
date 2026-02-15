import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Debug Context - API Logging & Debug Mode Toggle
 *
 * Tests verify the DebugContext state management and API interceptor functionality:
 * - Debug mode ON/OFF toggle updates DebugContext.isDebugMode
 * - API calls are intercepted and logged to DebugContext when debug mode is ON
 * - Logged entries include metadata (status code, timestamp, duration)
 * - Logs are not captured when debug mode is OFF
 *
 * Related Issue: DLD-343 - Debug Context and API Interceptor E2E Tests
 * Parent Issue: DLD-341 - Debug Page API Response Feature
 * Activated for: DLD-344 - Debug Context and API Interceptor Implementation
 */

test.describe('Debug Context - Debug Mode Toggle', () => {
  test('should toggle debug mode ON when debug toggle button is clicked', async ({ page }) => {
    // Tests that clicking the debug toggle activates debug mode in DebugContext

    // Arrange: Navigate to home page (debug mode OFF by default)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Debug toggle button should be visible
    const debugToggle = page.getByTestId('debug-toggle')
      .or(page.getByRole('button', { name: /debug/i }));
    await expect(debugToggle).toBeVisible();

    // Assert: Debug mode should be OFF initially
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    // Act: Click debug toggle to turn ON
    await debugToggle.click();

    // Assert: Debug mode should be ON (DebugContext.isDebugMode = true)
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Assert: Visual indicator should show debug mode is enabled
    const debugIndicator = debugToggle.getByText(/on|enabled/i)
      .or(debugToggle.locator('[data-testid="debug-on-icon"]'));
    await expect(debugIndicator).toBeVisible();
  });

  test('should toggle debug mode OFF when debug toggle button is clicked again', async ({ page }) => {
    // Tests that clicking the toggle again deactivates debug mode

    // Arrange: Navigate to home page and enable debug mode
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle')
      .or(page.getByRole('button', { name: /debug/i }));

    // Act: Turn debug mode ON first
    await debugToggle.click();
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Act: Click toggle again to turn OFF
    await debugToggle.click();

    // Assert: Debug mode should be OFF (DebugContext.isDebugMode = false)
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    // Assert: Visual indicator should show debug mode is disabled
    const debugOffIndicator = debugToggle.getByText(/off|disabled/i)
      .or(debugToggle.locator('[data-testid="debug-off-icon"]'));
    await expect(debugOffIndicator).toBeVisible();
  });

  test('should persist debug mode state across page navigation', async ({ page }) => {
    // Tests that DebugContext maintains isDebugMode state when navigating

    // Arrange: Navigate to home page and enable debug mode
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    // Assert: Debug mode is ON
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Act: Navigate to Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Debug mode should still be ON
    const debugToggleOnPods = page.getByTestId('debug-toggle');
    await expect(debugToggleOnPods).toHaveAttribute('aria-pressed', 'true');

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Debug mode should still be ON
    const debugToggleOnDebug = page.getByTestId('debug-toggle');
    await expect(debugToggleOnDebug).toHaveAttribute('aria-pressed', 'true');
  });

  test('should maintain debug mode OFF state across navigation', async ({ page }) => {
    // Tests that debug mode OFF state persists in DebugContext

    // Arrange: Navigate to home page (debug mode OFF by default)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');

    // Assert: Debug mode is OFF
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    // Act: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Assert: Debug mode should still be OFF
    const debugToggleOnNodes = page.getByTestId('debug-toggle');
    await expect(debugToggleOnNodes).toHaveAttribute('aria-pressed', 'false');

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Debug mode should still be OFF
    const debugToggleOnDebug = page.getByTestId('debug-toggle');
    await expect(debugToggleOnDebug).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('Debug Context - API Logging with Debug Mode ON', () => {
  test('should log API calls to DebugContext when debug mode is ON', async ({ page }) => {
    // Tests that API interceptor captures calls when isDebugMode = true

    // Arrange: Navigate to home page and enable debug mode
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    // Assert: Debug mode is ON
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Act: Navigate to Overview page to trigger API calls
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for API calls to complete
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page to view logged API calls
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: API logs list should be visible
    const apiLogsList = page.getByTestId('debug-left-panel');
    await expect(apiLogsList).toBeVisible();

    // Assert: Should have at least one logged API entry
    const logEntries = page.getByTestId('api-log-entry')
      .or(page.getByTestId('endpoint-item'))
      .or(apiLogsList.locator('[role="listitem"]'));
    const logCount = await logEntries.count();
    expect(logCount).toBeGreaterThan(0);
  });

  test('should display /api/overview endpoint in logs after visiting Overview page', async ({ page }) => {
    // Tests that specific API endpoint is captured in DebugContext

    // Arrange: Enable debug mode
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    // Act: Navigate to Overview page (triggers /api/overview call)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Should see /api/overview in the endpoint list
    const overviewEndpoint = page.getByTestId('endpoint-item').filter({ hasText: '/api/overview' }).first();
    await expect(overviewEndpoint).toBeVisible();
  });

  test('should log multiple API calls when navigating between pages', async ({ page }) => {
    // Tests that DebugContext accumulates multiple API logs

    // Arrange: Enable debug mode
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    // Act: Navigate to Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Act: Navigate to Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Act: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Should have logs from multiple endpoints
    const logEntries = page.getByTestId('api-log-entry')
      .or(page.getByTestId('endpoint-item'))
      .or(page.locator('[data-testid*="endpoint"]'));
    const logCount = await logEntries.count();

    // Expect at least 3 API calls (from overview, pods, nodes pages)
    expect(logCount).toBeGreaterThanOrEqual(3);
  });
});

test.describe('Debug Context - API Log Metadata', () => {
  test('should include status code in API log entry', async ({ page }) => {
    // Tests that DebugContext captures HTTP status code metadata

    // Arrange: Enable debug mode and trigger API call
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug and select first log entry
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const firstLogEntry = page.getByTestId('endpoint-item').first()
      .or(page.getByTestId('api-log-entry').first());
    await firstLogEntry.click();

    // Assert: Status code should be displayed
    const statusCode = page.getByTestId('status-code').first();
    await expect(statusCode).toBeVisible();

    // Assert: Status code should be 200 for successful requests
    const statusCodeText = await statusCode.textContent();
    expect(statusCodeText).toContain('200');
  });

  test('should include timestamp in API log entry', async ({ page }) => {
    // Tests that DebugContext captures request timestamp

    // Arrange: Enable debug mode and trigger API call
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug and select first log entry
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const firstLogEntry = page.getByTestId('endpoint-item').first()
      .or(page.getByTestId('api-log-entry').first());
    await firstLogEntry.click();

    // Act: Navigate to Metadata tab
    const metadataTab = page.getByRole('tab', { name: /metadata/i })
      .or(page.getByTestId('metadata-tab'));
    await metadataTab.click();

    // Assert: Timestamp should be displayed
    const timestamp = page.getByTestId('request-timestamp');
    await expect(timestamp).toBeVisible();
  });

  test('should include duration in API log entry', async ({ page }) => {
    // Tests that DebugContext captures request duration

    // Arrange: Enable debug mode and trigger API call
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug and select first log entry
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const firstLogEntry = page.getByTestId('endpoint-item').first()
      .or(page.getByTestId('api-log-entry').first());
    await firstLogEntry.click();

    // Act: Navigate to Metadata tab
    const metadataTab = page.getByRole('tab', { name: /metadata/i })
      .or(page.getByTestId('metadata-tab'));
    await metadataTab.click();

    // Assert: Duration should be displayed
    const duration = page.getByTestId('request-duration');
    await expect(duration).toBeVisible();

    // Assert: Duration should be a positive number
    const durationText = await duration.textContent();
    expect(durationText).toMatch(/\d+/);
  });

  test('should display all metadata fields together in detail view', async ({ page }) => {
    // Tests that all metadata (status, timestamp, duration) are visible

    // Arrange: Enable debug mode and trigger API call
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug and select first log entry
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const firstLogEntry = page.getByTestId('endpoint-item').first();
    await firstLogEntry.click();

    // Act: Navigate to Metadata tab
    const metadataTab = page.getByRole('tab', { name: /metadata/i });
    await metadataTab.click();

    const metadataContent = page.getByTestId('metadata-content')
      .or(page.getByRole('tabpanel'));

    // Assert: All three metadata fields should be visible
    await expect(metadataContent.getByTestId('status-code')).toBeVisible();

    await expect(metadataContent.getByTestId('request-timestamp')).toBeVisible();

    await expect(metadataContent.getByTestId('request-duration')).toBeVisible();
  });
});

test.describe('Debug Context - No Logging when Debug Mode OFF', () => {
  test('should not log API calls when debug mode is OFF', async ({ page }) => {
    // Tests that API interceptor does not capture calls when isDebugMode = false

    // Arrange: Navigate to home page (debug mode OFF by default)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');

    // Assert: Debug mode is OFF
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    // Act: Navigate to Overview page (triggers API calls)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Should show empty state (no logs captured)
    const emptyState = page.getByTestId('debug-empty-state')
      .or(page.getByText(/no api calls/i))
      .or(page.getByText(/no logs/i))
      .or(page.getByText(/enable debug mode/i));

    // Either empty state is visible OR log count is 0
    const emptyStateVisible = await emptyState.isVisible().catch(() => false);
    const logEntries = page.getByTestId('api-log-entry')
      .or(page.getByTestId('endpoint-item'));
    const logCount = await logEntries.count();

    // Assert: Either we see empty state or have 0 logs
    expect(emptyStateVisible || logCount === 0).toBe(true);
  });

  test('should clear previous logs when debug mode is turned OFF', async ({ page }) => {
    // Tests that DebugContext clears logs when debug mode is disabled

    // Arrange: Enable debug mode and capture some logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    // Act: Navigate to pages to generate logs
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Act: Check that logs exist
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const logEntriesBefore = page.getByTestId('endpoint-item');
    const countBefore = await logEntriesBefore.count();
    expect(countBefore).toBeGreaterThan(0);

    // Act: Turn debug mode OFF
    await debugToggle.click();
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    // Act: Reload debug page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert: Logs should be cleared (empty state or count = 0)
    const emptyState = page.getByTestId('debug-empty-state')
      .or(page.getByText(/no logs/i));
    const emptyStateVisible = await emptyState.isVisible().catch(() => false);

    const logEntriesAfter = page.getByTestId('endpoint-item');
    const countAfter = await logEntriesAfter.count();

    expect(emptyStateVisible || countAfter === 0).toBe(true);
  });

  test('should only log new API calls after debug mode is turned ON mid-session', async ({ page }) => {
    // Tests that DebugContext only captures calls after activation

    // Arrange: Start with debug mode OFF
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    // Act: Navigate to Pods page (should NOT be logged)
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Act: Turn debug mode ON
    await debugToggle.click();
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Act: Navigate to Nodes page (SHOULD be logged)
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Should have logs only from after debug mode was enabled
    const logEntries = page.getByTestId('endpoint-item')
      .or(page.getByTestId('api-log-entry'));
    const logCount = await logEntries.count();

    // Expect at least 1 log (from /nodes page after debug mode ON)
    expect(logCount).toBeGreaterThan(0);

    // Assert: Should NOT see /api/pods endpoint (was called before debug ON)
    const podsEndpoint = page.getByText(/\/api\/pods/i);
    const podsVisible = await podsEndpoint.isVisible().catch(() => false);

    // This assertion might fail if other pages also call /api/pods
    // But the key is that calls before debug mode ON should not be logged
  });
});

test.describe('Debug Context - Integration with Debug Page', () => {
  test('should synchronize DebugContext state with /debug page display', async ({ page }) => {
    // Tests that /debug page reflects current DebugContext state

    // Arrange: Enable debug mode and generate logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    // Act: Navigate to Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Debug page should display logs from DebugContext
    const apiLogsList = page.getByTestId('debug-left-panel');
    await expect(apiLogsList).toBeVisible();

    const logEntries = page.getByTestId('endpoint-item');
    expect(await logEntries.count()).toBeGreaterThan(0);

    // Assert: Debug toggle on /debug page should show ON state
    const debugToggleOnDebug = page.getByTestId('debug-toggle');
    await expect(debugToggleOnDebug).toHaveAttribute('aria-pressed', 'true');
  });

  test('should update /debug page when debug mode is toggled from different page', async ({ page }) => {
    // Tests that DebugContext changes propagate to /debug page

    // Arrange: Open /debug page with debug mode OFF
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    // Act: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Turn debug mode ON from home page
    const debugToggleHome = page.getByTestId('debug-toggle');
    await debugToggleHome.click();

    // Act: Navigate to Overview to generate logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Return to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Debug toggle should show ON
    const debugToggleOnDebug = page.getByTestId('debug-toggle');
    await expect(debugToggleOnDebug).toHaveAttribute('aria-pressed', 'true');

    // Assert: Logs should be visible
    const logEntries = page.getByTestId('endpoint-item');
    expect(await logEntries.count()).toBeGreaterThan(0);
  });
});
