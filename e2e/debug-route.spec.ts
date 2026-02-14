import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Debug Page - API Response Inspection Feature
 *
 * Tests verify that the /debug route is accessible and properly configured
 * in the SPA routing infrastructure before implementation.
 *
 * Related Issue: DLD-342 - Infrastructure check for /debug route testing
 * Parent Issue: DLD-341 - Debug Page API Response Feature
 *
 * TODO: Activate when DLD-341 implementation is complete
 */

test.describe.skip('Debug Route - SPA Routing Infrastructure', () => {
  test('should access /debug route via page.goto()', async ({ page }) => {
    // Tests that Playwright can navigate directly to /debug route

    // Act: Navigate to /debug route
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Page should load successfully (200 status)
    // SPA routing should serve index.html for /debug
    const response = await page.goto('/debug');
    expect(response?.status()).toBe(200);

    // Assert: URL should be /debug
    expect(page.url()).toContain('/debug');

    // Assert: Page should render React app root
    const appRoot = page.locator('#root');
    await expect(appRoot).toBeVisible();
  });

  test('should access /debug route via client-side navigation', async ({ page }) => {
    // Tests that React Router can navigate to /debug using window.history.pushState

    // Arrange: Start from home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Navigate to /debug via client-side routing
    await page.evaluate(() => {
      window.history.pushState({}, '', '/debug');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Wait for React Router to process the navigation
    await page.waitForTimeout(500);

    // Assert: URL should be /debug
    expect(page.url()).toContain('/debug');

    // Assert: React app should still be mounted
    const appRoot = page.locator('#root');
    await expect(appRoot).toBeVisible();
  });

  test('should render /debug page with correct structure', async ({ page }) => {
    // Tests that /debug page renders with expected layout components

    // Arrange: Navigate to /debug
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Debug page container should be visible
    const debugPage = page.getByTestId('debug-page')
      .or(page.locator('[data-testid*="debug"]').first());
    await expect(debugPage).toBeVisible();

    // Assert: Page should have a title or heading
    const debugTitle = page.getByRole('heading', { name: /debug/i })
      .or(page.getByTestId('debug-page-title'));
    await expect(debugTitle).toBeVisible();
  });

  test('should maintain TopBar navigation when on /debug page', async ({ page }) => {
    // Tests that TopBar remains accessible on /debug page

    // Arrange: Navigate to /debug
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: TopBar should be visible
    const topBar = page.getByTestId('top-bar')
      .or(page.getByRole('banner'));
    await expect(topBar).toBeVisible();

    // Assert: Namespace selector should be visible
    const namespaceSelector = page.getByTestId('namespace-selector');
    await expect(namespaceSelector).toBeVisible();
  });

  test('should not break existing e2e tests with /debug route addition', async ({ page }) => {
    // Tests that adding /debug route doesn't affect other routes

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Home page should load normally
    await expect(page).toHaveTitle(/Kubernetes Dashboard/i);

    // Act: Navigate to /pods
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Pods page should load normally
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    // Act: Navigate to /nodes
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Assert: Nodes page should load normally
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Act: Navigate to /debug
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Debug page should load normally
    expect(page.url()).toContain('/debug');

    // Act: Navigate back to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Home page should still work
    await expect(page).toHaveTitle(/Kubernetes Dashboard/i);
  });
});

test.describe.skip('Debug Route - DebugContext Data Display', () => {
  test('should display API call logs from DebugContext', async ({ page }) => {
    // Tests that debug page displays captured API logs

    // Arrange: Navigate to home to trigger some API calls
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for initial API calls to complete
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Debug page should show API call logs
    const apiLogsList = page.getByTestId('api-logs-list')
      .or(page.getByTestId('endpoint-list'));
    await expect(apiLogsList).toBeVisible();

    // Assert: Should have at least one API log entry
    const logEntries = page.getByTestId('api-log-entry')
      .or(page.locator('[data-testid*="endpoint-item"]'));
    const logCount = await logEntries.count();
    expect(logCount).toBeGreaterThan(0);
  });

  test('should display endpoint list in left panel', async ({ page }) => {
    // Tests that debug page has two-panel layout with endpoint list

    // Arrange: Navigate to /debug
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Left panel with endpoint list should exist
    const leftPanel = page.getByTestId('debug-left-panel')
      .or(page.getByTestId('endpoint-list-panel'));
    await expect(leftPanel).toBeVisible();

    // Assert: Endpoint list should be in left panel
    const endpointList = leftPanel.getByTestId('endpoint-list')
      .or(leftPanel.locator('[role="list"]'));
    await expect(endpointList).toBeVisible();
  });

  test('should display detail view in right panel', async ({ page }) => {
    // Tests that debug page has detail view panel

    // Arrange: Navigate to /debug
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Right panel with detail view should exist
    const rightPanel = page.getByTestId('debug-right-panel')
      .or(page.getByTestId('detail-view-panel'));
    await expect(rightPanel).toBeVisible();
  });

  test('should show selected endpoint details when clicked', async ({ page }) => {
    // Tests that clicking an endpoint displays its details

    // Arrange: Navigate to /debug with some API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint in the list
    const firstEndpoint = page.getByTestId('api-log-entry').first()
      .or(page.getByTestId('endpoint-item').first());
    await firstEndpoint.click();

    // Assert: Detail view should show endpoint information
    const detailView = page.getByTestId('endpoint-detail-view')
      .or(page.getByTestId('debug-detail-view'));
    await expect(detailView).toBeVisible();

    // Assert: Should display endpoint URL
    const endpointUrl = detailView.getByTestId('endpoint-url')
      .or(detailView.locator('text=/\\/api\\//'));
    await expect(endpointUrl).toBeVisible();
  });

  test('should display empty state when no API calls logged', async ({ page }) => {
    // Tests empty state display when DebugContext has no logs

    // Arrange: Navigate directly to /debug without making API calls
    // (In practice, this might be hard to achieve as the app may auto-fetch data)
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Should show empty state message or placeholder
    const emptyState = page.getByTestId('debug-empty-state')
      .or(page.getByText(/no api calls/i))
      .or(page.getByText(/no logs/i));

    // Note: This assertion is conditional on whether auto-fetching happens
    const emptyStateExists = await emptyState.isVisible().catch(() => false);
    const logEntries = page.getByTestId('api-log-entry');
    const hasLogs = await logEntries.count() > 0;

    // Either we have logs OR we show empty state
    expect(emptyStateExists || hasLogs).toBe(true);
  });
});

test.describe.skip('Debug Route - Detail View Tabs', () => {
  test('should display Response tab in detail view', async ({ page }) => {
    // Tests that Response tab exists and shows JSON response

    // Arrange: Navigate to /debug with API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Select an endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: Response tab should exist
    const responseTab = page.getByRole('tab', { name: /response/i })
      .or(page.getByTestId('response-tab'));
    await expect(responseTab).toBeVisible();

    // Act: Click Response tab (might be selected by default)
    await responseTab.click();

    // Assert: Response content should be visible
    const responseContent = page.getByTestId('response-content')
      .or(page.getByTestId('json-viewer'));
    await expect(responseContent).toBeVisible();
  });

  test('should display Request tab in detail view', async ({ page }) => {
    // Tests that Request tab shows HTTP method, URL, and params

    // Arrange: Navigate to /debug with API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Select an endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: Request tab should exist
    const requestTab = page.getByRole('tab', { name: /request/i })
      .or(page.getByTestId('request-tab'));
    await expect(requestTab).toBeVisible();

    // Act: Click Request tab
    await requestTab.click();

    // Assert: Request details should be visible
    const requestContent = page.getByTestId('request-content');
    await expect(requestContent).toBeVisible();

    // Assert: Should show HTTP method
    const httpMethod = requestContent.getByTestId('http-method')
      .or(requestContent.getByText(/GET|POST|PUT|DELETE|PATCH/));
    await expect(httpMethod).toBeVisible();

    // Assert: Should show URL
    const requestUrl = requestContent.getByTestId('request-url')
      .or(requestContent.locator('text=/\\/api\\//'));
    await expect(requestUrl).toBeVisible();
  });

  test('should display Metadata tab in detail view', async ({ page }) => {
    // Tests that Metadata tab shows timestamp, duration, status code

    // Arrange: Navigate to /debug with API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Select an endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: Metadata tab should exist
    const metadataTab = page.getByRole('tab', { name: /metadata/i })
      .or(page.getByTestId('metadata-tab'));
    await expect(metadataTab).toBeVisible();

    // Act: Click Metadata tab
    await metadataTab.click();

    // Assert: Metadata content should be visible
    const metadataContent = page.getByTestId('metadata-content');
    await expect(metadataContent).toBeVisible();

    // Assert: Should show timestamp
    const timestamp = metadataContent.getByTestId('request-timestamp')
      .or(metadataContent.getByText(/timestamp/i));
    await expect(timestamp).toBeVisible();

    // Assert: Should show duration
    const duration = metadataContent.getByTestId('request-duration')
      .or(metadataContent.getByText(/duration|time/i));
    await expect(duration).toBeVisible();

    // Assert: Should show status code
    const statusCode = metadataContent.getByTestId('status-code')
      .or(metadataContent.getByText(/status|200|404|500/i));
    await expect(statusCode).toBeVisible();
  });

  test('should switch between tabs without losing data', async ({ page }) => {
    // Tests that tab switching preserves displayed data

    // Arrange: Navigate to /debug with API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Select an endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Response tab
    const responseTab = page.getByRole('tab', { name: /response/i });
    await responseTab.click();
    await expect(page.getByTestId('response-content')).toBeVisible();

    // Act: Click Request tab
    const requestTab = page.getByRole('tab', { name: /request/i });
    await requestTab.click();
    await expect(page.getByTestId('request-content')).toBeVisible();

    // Act: Click Metadata tab
    const metadataTab = page.getByRole('tab', { name: /metadata/i });
    await metadataTab.click();
    await expect(page.getByTestId('metadata-content')).toBeVisible();

    // Act: Go back to Response tab
    await responseTab.click();
    await expect(page.getByTestId('response-content')).toBeVisible();

    // Assert: Response content should still be visible (data not lost)
    const responseContent = page.getByTestId('response-content');
    await expect(responseContent).toBeVisible();
  });
});

test.describe.skip('Debug Route - TopBar Debug Toggle', () => {
  test('should display Debug ON/OFF toggle in TopBar', async ({ page }) => {
    // Tests that TopBar has debug mode toggle button

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Debug toggle button should exist in TopBar
    const debugToggle = page.getByTestId('debug-toggle')
      .or(page.getByRole('button', { name: /debug/i }));
    await expect(debugToggle).toBeVisible();
  });

  test('should toggle debug mode ON when button is clicked', async ({ page }) => {
    // Tests debug mode activation

    // Arrange: Navigate to home page (debug mode OFF by default)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Click debug toggle button
    const debugToggle = page.getByTestId('debug-toggle')
      .or(page.getByRole('button', { name: /debug/i }));
    await debugToggle.click();

    // Assert: Debug mode should be ON
    // Check for visual indicator (e.g., button state, icon change, text change)
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');
    // OR
    await expect(debugToggle).toContainText(/debug on|enabled/i);
  });

  test('should toggle debug mode OFF when button is clicked again', async ({ page }) => {
    // Tests debug mode deactivation

    // Arrange: Navigate to home page and enable debug mode
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click(); // Turn ON

    // Act: Click toggle again to turn OFF
    await debugToggle.click();

    // Assert: Debug mode should be OFF
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');
    // OR
    await expect(debugToggle).toContainText(/debug off|disabled/i);
  });

  test('should only capture API calls when debug mode is ON', async ({ page }) => {
    // Tests that debugFetch only logs when debug mode is enabled

    // Arrange: Navigate to /debug with debug mode OFF
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Should have minimal or no logs (depending on implementation)
    const logEntriesOff = page.getByTestId('api-log-entry');
    const countOff = await logEntriesOff.count();

    // Act: Turn debug mode ON
    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    // Act: Trigger API calls by navigating
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Return to debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Should have more logs now
    const logEntriesOn = page.getByTestId('api-log-entry');
    const countOn = await logEntriesOn.count();

    expect(countOn).toBeGreaterThanOrEqual(countOff);
  });

  test('should persist debug mode state across page navigation', async ({ page }) => {
    // Tests that debug mode state persists in DebugContext

    // Arrange: Enable debug mode on home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click(); // Turn ON

    // Assert: Debug mode is ON
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Act: Navigate to /pods
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Debug mode should still be ON
    const debugToggleOnPods = page.getByTestId('debug-toggle');
    await expect(debugToggleOnPods).toHaveAttribute('aria-pressed', 'true');

    // Act: Navigate to /debug
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Debug mode should still be ON
    const debugToggleOnDebug = page.getByTestId('debug-toggle');
    await expect(debugToggleOnDebug).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe.skip('Debug Route - Copy to Clipboard Feature', () => {
  test('should have copy button for Response JSON', async ({ page }) => {
    // Tests that Response tab has clipboard copy functionality

    // Arrange: Navigate to /debug and select an endpoint
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Go to Response tab
    const responseTab = page.getByRole('tab', { name: /response/i });
    await responseTab.click();

    // Assert: Copy button should exist
    const copyButton = page.getByTestId('copy-response-button')
      .or(page.getByRole('button', { name: /copy/i }));
    await expect(copyButton).toBeVisible();
  });

  test('should copy Response JSON to clipboard when copy button clicked', async ({ page }) => {
    // Tests clipboard copy functionality

    // Arrange: Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Arrange: Navigate to /debug and select an endpoint
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    const responseTab = page.getByRole('tab', { name: /response/i });
    await responseTab.click();

    // Act: Click copy button
    const copyButton = page.getByTestId('copy-response-button');
    await copyButton.click();

    // Assert: Clipboard should contain JSON data
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toBeTruthy();
    expect(clipboardContent.length).toBeGreaterThan(0);

    // Assert: Should be valid JSON
    expect(() => JSON.parse(clipboardContent)).not.toThrow();
  });

  test('should show success feedback after copying', async ({ page }) => {
    // Tests that copy action provides user feedback

    // Arrange: Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Arrange: Navigate to /debug and select an endpoint
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    const responseTab = page.getByRole('tab', { name: /response/i });
    await responseTab.click();

    // Act: Click copy button
    const copyButton = page.getByTestId('copy-response-button');
    await copyButton.click();

    // Assert: Should show success message or icon change
    const successMessage = page.getByText(/copied|success/i)
      .or(copyButton.locator('[data-testid="copy-success-icon"]'));

    await expect(successMessage).toBeVisible({ timeout: 2000 });
  });

  test('should have copy button for Request details', async ({ page }) => {
    // Tests that Request tab has clipboard copy functionality

    // Arrange: Navigate to /debug and select an endpoint
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Go to Request tab
    const requestTab = page.getByRole('tab', { name: /request/i });
    await requestTab.click();

    // Assert: Copy button should exist
    const copyButton = page.getByTestId('copy-request-button')
      .or(page.getByRole('button', { name: /copy/i }));
    await expect(copyButton).toBeVisible();
  });
});

test.describe.skip('Debug Route - Accessibility', () => {
  test('should have proper ARIA labels for debug page elements', async ({ page }) => {
    // Tests accessibility of debug page structure

    // Arrange: Navigate to /debug
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Debug page should have main landmark
    const mainContent = page.getByRole('main')
      .or(page.getByTestId('debug-page'));
    await expect(mainContent).toBeVisible();

    // Assert: Endpoint list should have proper role
    const endpointList = page.getByTestId('endpoint-list')
      .or(page.getByRole('list'));
    await expect(endpointList).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tests keyboard navigation support for debug page

    // Arrange: Navigate to /debug with API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Tab to first endpoint
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Act: Press Enter to select endpoint
    await page.keyboard.press('Enter');

    // Assert: Detail view should show
    const detailView = page.getByTestId('endpoint-detail-view');
    await expect(detailView).toBeVisible();
  });

  test('should have proper tab panel ARIA attributes', async ({ page }) => {
    // Tests that tab interface is accessible

    // Arrange: Navigate to /debug and select an endpoint
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: Tab list should have proper role
    const tabList = page.getByRole('tablist');
    await expect(tabList).toBeVisible();

    // Assert: Each tab should have proper attributes
    const responseTab = page.getByRole('tab', { name: /response/i });
    await expect(responseTab).toHaveAttribute('aria-selected', 'true');

    // Assert: Tab panels should have proper role
    const tabPanel = page.getByRole('tabpanel');
    await expect(tabPanel).toBeVisible();
  });
});
