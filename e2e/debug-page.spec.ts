import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Debug Page - Full Feature Validation
 *
 * Tests verify the complete Debug Page functionality including:
 * - Page rendering and layout structure
 * - API log display from DebugContext
 * - Detail view interaction with tabs (Response, Request, Metadata)
 * - Clipboard copy functionality
 * - Empty state handling
 *
 * Related Issue: DLD-347 - Task 4-1: E2E Test - Debug Page (skipped)
 * Parent Issue: DLD-341 - Debug Page API Response Feature
 *
 * TODO: Activate when DLD-341 implementation is complete
 */

test.describe.skip('Debug Page - Page Rendering', () => {
  test('should render DebugPage component when accessing /debug route', async ({ page }) => {
    // Tests that navigating to /debug renders the Debug Page component

    // Arrange & Act: Navigate to /debug route
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Debug page container should be visible
    const debugPage = page.getByTestId('debug-page')
      .or(page.locator('[data-testid*="debug"]').first());
    await expect(debugPage).toBeVisible();

    // Assert: URL should be /debug
    expect(page.url()).toContain('/debug');
  });

  test('should display endpoint list area on the left side', async ({ page }) => {
    // Tests that the left panel with endpoint list exists

    // Arrange & Act: Navigate to /debug route
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Left panel (endpoint list area) should be visible
    const leftPanel = page.getByTestId('debug-left-panel')
      .or(page.getByTestId('endpoint-list-panel'))
      .or(page.getByTestId('endpoint-list').locator('..'));
    await expect(leftPanel).toBeVisible();

    // Assert: Endpoint list should exist within left panel
    const endpointList = page.getByTestId('endpoint-list')
      .or(leftPanel.locator('[role="list"]'));
    await expect(endpointList).toBeVisible();
  });

  test('should display detail view area on the right side', async ({ page }) => {
    // Tests that the right panel with detail view exists

    // Arrange & Act: Navigate to /debug route
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Right panel (detail view area) should be visible
    const rightPanel = page.getByTestId('debug-right-panel')
      .or(page.getByTestId('detail-view-panel'))
      .or(page.getByTestId('endpoint-detail-view').locator('..'));
    await expect(rightPanel).toBeVisible();
  });
});

test.describe.skip('Debug Page - API Log Display', () => {
  test('should display /api/overview log entry after visiting Overview page', async ({ page }) => {
    // Tests that API calls are logged and displayed in the endpoint list

    // Arrange: Enable debug mode and navigate to Overview page to trigger API call
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle')
      .or(page.getByRole('button', { name: /debug/i }));
    await debugToggle.click();
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Act: Navigate to Overview page (triggers /api/overview call)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug to view logs
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Should display /api/overview endpoint in the list
    const overviewEndpoint = page.getByTestId('endpoint-item')
      .filter({ hasText: '/api/overview' })
      .first();
    await expect(overviewEndpoint).toBeVisible();
  });

  test('should display method, URL, status code, and duration for each log entry', async ({ page }) => {
    // Tests that each log entry shows required metadata

    // Arrange: Enable debug mode and trigger API calls
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: First endpoint item should exist
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await expect(firstEndpoint).toBeVisible();

    // Assert: Should display HTTP method (GET)
    const methodText = await firstEndpoint.textContent();
    expect(methodText).toMatch(/GET|POST|PUT|DELETE|PATCH/i);

    // Assert: Should display URL (/api/...)
    expect(methodText).toMatch(/\/api\//);

    // Assert: Should display status code (e.g., 200)
    expect(methodText).toMatch(/200|201|204|400|404|500/);

    // Assert: Should display duration (e.g., 123ms)
    expect(methodText).toMatch(/\d+\s*ms/i);
  });
});

test.describe.skip('Debug Page - Detail View Interaction', () => {
  test('should display detail view on the right when an endpoint is clicked', async ({ page }) => {
    // Tests that clicking an endpoint shows its details

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint in the list
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: Detail view should be visible
    const detailView = page.getByTestId('endpoint-detail-view')
      .or(page.getByTestId('debug-detail-view'))
      .or(page.getByRole('tabpanel'));
    await expect(detailView).toBeVisible();
  });

  test('should display Response tab with JSON syntax highlighting', async ({ page }) => {
    // Tests that Response tab shows JSON with syntax highlighting

    // Arrange: Enable debug mode, generate logs, and select an endpoint
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Response tab (might be selected by default)
    const responseTab = page.getByRole('tab', { name: /response/i })
      .or(page.getByTestId('response-tab'));
    await responseTab.click();

    // Assert: Response content should be visible
    const responseContent = page.getByTestId('response-content')
      .or(page.getByTestId('json-viewer'))
      .or(page.getByRole('tabpanel'));
    await expect(responseContent).toBeVisible();

    // Assert: Content should contain JSON structure (braces, brackets)
    const contentText = await responseContent.textContent();
    expect(contentText).toMatch(/[{}\[\]]/);
  });

  test('should display Request tab with method, URL, and params', async ({ page }) => {
    // Tests that Request tab shows HTTP method, URL, and query parameters

    // Arrange: Enable debug mode, generate logs, and select an endpoint
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Request tab
    const requestTab = page.getByRole('tab', { name: /request/i })
      .or(page.getByTestId('request-tab'));
    await requestTab.click();

    // Assert: Request content should be visible
    const requestContent = page.getByTestId('request-content')
      .or(page.getByRole('tabpanel'));
    await expect(requestContent).toBeVisible();

    // Assert: Should display HTTP method (GET, POST, etc.)
    const methodElement = requestContent.getByTestId('http-method')
      .or(requestContent.getByText(/GET|POST|PUT|DELETE|PATCH/));
    await expect(methodElement).toBeVisible();

    // Assert: Should display request URL
    const urlElement = requestContent.getByTestId('request-url')
      .or(requestContent.locator('text=/\\/api\\//'));
    await expect(urlElement).toBeVisible();
  });

  test('should display Metadata tab with timestamp, duration, status, content-type, and size', async ({ page }) => {
    // Tests that Metadata tab shows all required metadata fields

    // Arrange: Enable debug mode, generate logs, and select an endpoint
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Metadata tab
    const metadataTab = page.getByRole('tab', { name: /metadata/i })
      .or(page.getByTestId('metadata-tab'));
    await metadataTab.click();

    // Assert: Metadata content should be visible
    const metadataContent = page.getByTestId('metadata-content')
      .or(page.getByRole('tabpanel'));
    await expect(metadataContent).toBeVisible();

    // Assert: Should display timestamp
    const timestamp = metadataContent.getByTestId('request-timestamp')
      .or(metadataContent.getByText(/timestamp/i));
    await expect(timestamp).toBeVisible();

    // Assert: Should display duration
    const duration = metadataContent.getByTestId('request-duration')
      .or(metadataContent.getByText(/duration/i));
    await expect(duration).toBeVisible();

    // Assert: Should display status code
    const statusCode = metadataContent.getByTestId('status-code')
      .or(metadataContent.getByText(/status|200|404|500/i));
    await expect(statusCode).toBeVisible();

    // Assert: Should display content-type (optional, but common)
    const contentType = await metadataContent.getByText(/content-type|application\/json/i).isVisible().catch(() => false);

    // Assert: Should display size (optional, but common)
    const size = await metadataContent.getByText(/size|bytes/i).isVisible().catch(() => false);

    // At least one of content-type or size should be visible
    expect(contentType || size).toBeTruthy();
  });
});

test.describe.skip('Debug Page - Clipboard Copy Functionality', () => {
  test('should copy JSON to clipboard when Copy button is clicked', async ({ page }) => {
    // Tests clipboard copy functionality for response JSON

    // Arrange: Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Arrange: Enable debug mode, generate logs, and select an endpoint
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Ensure we're on Response tab
    const responseTab = page.getByRole('tab', { name: /response/i });
    await responseTab.click();

    // Act: Click Copy button
    const copyButton = page.getByTestId('copy-response-button')
      .or(page.getByRole('button', { name: /copy/i }));
    await copyButton.click();

    // Assert: Clipboard should contain JSON data
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toBeTruthy();
    expect(clipboardContent.length).toBeGreaterThan(0);

    // Assert: Content should be valid JSON
    expect(() => JSON.parse(clipboardContent)).not.toThrow();
  });

  test('should display "Copied!" feedback after copying', async ({ page }) => {
    // Tests that copy action provides visual feedback to user

    // Arrange: Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Arrange: Enable debug mode, generate logs, and select an endpoint
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Ensure we're on Response tab
    const responseTab = page.getByRole('tab', { name: /response/i });
    await responseTab.click();

    // Act: Click Copy button
    const copyButton = page.getByTestId('copy-response-button')
      .or(page.getByRole('button', { name: /copy/i }));
    await copyButton.click();

    // Assert: Should show success feedback message or icon change
    const successMessage = page.getByText(/copied|success/i)
      .or(copyButton.locator('[data-testid="copy-success-icon"]'))
      .or(copyButton.getByText(/copied/i));

    await expect(successMessage).toBeVisible({ timeout: 2000 });
  });
});

test.describe.skip('Debug Page - Empty State', () => {
  test('should display empty state message when no API calls have been logged', async ({ page }) => {
    // Tests that debug page shows empty state when DebugContext has no logs

    // Arrange: Navigate directly to /debug without enabling debug mode or making API calls
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Should show empty state message or placeholder
    const emptyState = page.getByTestId('debug-empty-state')
      .or(page.getByText(/no api calls/i))
      .or(page.getByText(/no logs/i))
      .or(page.getByText(/enable debug mode/i))
      .or(page.getByText(/start debugging/i));

    // Check if empty state is visible OR if there are no log entries
    const emptyStateVisible = await emptyState.isVisible().catch(() => false);
    const logEntries = page.getByTestId('api-log-entry')
      .or(page.getByTestId('endpoint-item'));
    const logCount = await logEntries.count();

    // Assert: Either empty state is visible OR log count is 0
    expect(emptyStateVisible || logCount === 0).toBe(true);

    // If empty state is visible, verify it has meaningful content
    if (emptyStateVisible) {
      const emptyStateText = await emptyState.textContent();
      expect(emptyStateText?.length).toBeGreaterThan(0);
    }
  });
});
