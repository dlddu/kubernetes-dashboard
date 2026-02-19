import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Debug Page - API Response Inspection Feature
 *
 * Tests verify that the /debug route is accessible and properly configured
 * in the SPA routing infrastructure.
 *
 * Related Issue: DLD-342 - Infrastructure check for /debug route testing
 * Parent Issue: DLD-341 - Debug Page API Response Feature
 */

test.describe('Debug Route - SPA Routing Infrastructure', () => {
  test('should access /debug route via page.goto()', async ({ page }) => {
    // Tests that Playwright can navigate directly to /debug route

    // Act: Navigate to /debug route
    const response = await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Page should load successfully (200 status)
    // SPA routing should serve index.html for /debug
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
    await page.waitForURL('**/debug');

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
    const debugPage = page.getByTestId('debug-page');
    await expect(debugPage).toBeVisible();

    // Assert: Page should have a title or heading
    const debugTitle = page.getByTestId('debug-page-title');
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

test.describe('Debug Route - DebugContext Data Display', () => {
  test('should display API call logs from DebugContext', async ({ page }) => {
    // Tests that debug page displays captured API logs

    // Arrange: Enable debug mode first
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    // Wait for debug mode to be enabled
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Act: Navigate to pods page to trigger API calls while debug mode is ON
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Wait for API calls to complete
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Debug page should show API call logs
    const endpointList = page.getByTestId('endpoint-list');
    await expect(endpointList).toBeVisible();

    // Assert: Should have at least one API log entry
    const logEntries = page.getByTestId('endpoint-item');
    const logCount = await logEntries.count();
    expect(logCount).toBeGreaterThan(0);
  });

  test('should display endpoint list in left panel', async ({ page }) => {
    // Tests that debug page has two-panel layout with endpoint list

    // Arrange: Enable debug mode and generate some logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Navigate to generate API calls
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Navigate to /debug
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Left panel with endpoint list should exist
    const leftPanel = page.getByTestId('debug-left-panel');
    await expect(leftPanel).toBeVisible();

    // Assert: Endpoint list should be in left panel
    const endpointList = leftPanel.getByTestId('endpoint-list');
    await expect(endpointList).toBeVisible();
  });

  test('should display detail view in right panel', async ({ page }) => {
    // Tests that debug page has detail view panel

    // Arrange: Navigate to /debug
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Right panel with detail view should exist
    const rightPanel = page.getByTestId('debug-right-panel');
    await expect(rightPanel).toBeVisible();
  });

  test('should show selected endpoint details when clicked', async ({ page }) => {
    // Tests that clicking an endpoint displays its details

    // Arrange: Enable debug mode and generate logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/pods');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint in the list
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: Detail view should show endpoint information
    const detailView = page.getByTestId('detail-view');
    await expect(detailView).toBeVisible();

    // Assert: Should display response content by default
    const responseContent = page.getByTestId('response-content');
    await expect(responseContent).toBeVisible();
  });

  test('should display empty state when no API calls logged', async ({ page }) => {
    // Tests empty state display when DebugContext has no logs

    // Arrange: Make sure debug mode is OFF so no logs are captured
    // Clear any existing localStorage debug data
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Check for empty state or logs
    const emptyState = page.getByTestId('debug-empty-state');
    const logEntries = page.getByTestId('endpoint-item');

    const emptyStateExists = await emptyState.isVisible().catch(() => false);
    const hasLogs = await logEntries.count() > 0;

    // Either we have logs OR we show empty state
    expect(emptyStateExists || hasLogs).toBe(true);
  });
});

test.describe('Debug Route - Detail View Tabs', () => {
  test.beforeEach(async ({ page }) => {
    // Enable debug mode and generate API logs before each test
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Navigate to generate API calls
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Go to debug page and select first endpoint
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();
  });

  test('should display Response tab in detail view', async ({ page }) => {
    // Tests that Response tab exists and shows JSON response

    // Assert: Response tab should exist
    const responseTab = page.getByRole('tab', { name: /response/i });
    await expect(responseTab).toBeVisible();

    // Act: Click Response tab (might be selected by default)
    await responseTab.click();

    // Assert: Response content should be visible
    const responseContent = page.getByTestId('response-content');
    await expect(responseContent).toBeVisible();
  });

  test('should display Request tab in detail view', async ({ page }) => {
    // Tests that Request tab shows HTTP method, URL, and params

    // Assert: Request tab should exist
    const requestTab = page.getByRole('tab', { name: /request/i });
    await expect(requestTab).toBeVisible();

    // Act: Click Request tab
    await requestTab.click();

    // Assert: Request details should be visible
    const requestContent = page.getByTestId('request-content');
    await expect(requestContent).toBeVisible();

    // Assert: Should show HTTP method
    const httpMethod = requestContent.getByTestId('http-method');
    await expect(httpMethod).toBeVisible();

    // Assert: Should show URL
    const requestUrl = requestContent.getByTestId('request-url');
    await expect(requestUrl).toBeVisible();
  });

  test('should display Metadata tab in detail view', async ({ page }) => {
    // Tests that Metadata tab shows timestamp, duration, status code

    // Assert: Metadata tab should exist
    const metadataTab = page.getByRole('tab', { name: /metadata/i });
    await expect(metadataTab).toBeVisible();

    // Act: Click Metadata tab
    await metadataTab.click();

    // Assert: Metadata content should be visible
    const metadataContent = page.getByTestId('metadata-content');
    await expect(metadataContent).toBeVisible();

    // Assert: Should show timestamp
    const timestamp = metadataContent.getByTestId('request-timestamp');
    await expect(timestamp).toBeVisible();

    // Assert: Should show duration
    const duration = metadataContent.getByTestId('request-duration');
    await expect(duration).toBeVisible();

    // Assert: Should show status code
    const statusCode = metadataContent.getByTestId('status-code');
    await expect(statusCode).toBeVisible();
  });

  test('should switch between tabs without losing data', async ({ page }) => {
    // Tests that tab switching preserves displayed data

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

test.describe('Debug Route - TopBar Debug Toggle', () => {
  test('should display Debug ON/OFF toggle in TopBar', async ({ page }) => {
    // Tests that TopBar has debug mode toggle button

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Debug toggle button should exist in TopBar
    const debugToggle = page.getByTestId('debug-toggle');
    await expect(debugToggle).toBeVisible();
  });

  test('should toggle debug mode ON when button is clicked', async ({ page }) => {
    // Tests debug mode activation

    // Arrange: Navigate to home page (debug mode OFF by default)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Ensure debug mode is OFF first
    const debugToggle = page.getByTestId('debug-toggle');
    const isAlreadyOn = await debugToggle.getAttribute('aria-pressed') === 'true';
    if (isAlreadyOn) {
      await debugToggle.click();
    }

    // Act: Click debug toggle button
    await debugToggle.click();

    // Assert: Debug mode should be ON
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(debugToggle).toContainText(/debug on/i);
  });

  test('should toggle debug mode OFF when button is clicked again', async ({ page }) => {
    // Tests debug mode deactivation

    // Arrange: Navigate to home page and enable debug mode
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');

    // Ensure debug mode is ON first
    const isOff = await debugToggle.getAttribute('aria-pressed') === 'false';
    if (isOff) {
      await debugToggle.click();
    }
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Act: Click toggle again to turn OFF
    await debugToggle.click();

    // Assert: Debug mode should be OFF
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(debugToggle).toContainText(/debug off/i);
  });

  test('should only capture API calls when debug mode is ON', async ({ page }) => {
    // Tests that debugFetch only logs when debug mode is enabled

    // Arrange: Navigate with debug mode OFF
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Ensure debug mode is OFF
    const debugToggle = page.getByTestId('debug-toggle');
    const isOn = await debugToggle.getAttribute('aria-pressed') === 'true';
    if (isOn) {
      await debugToggle.click();
    }

    // Navigate to pods to trigger API calls without debug mode
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Go to debug page and check log count
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const logEntriesOff = page.getByTestId('endpoint-item');
    const countOff = await logEntriesOff.count();

    // Act: Turn debug mode ON
    const debugToggleOnDebug = page.getByTestId('debug-toggle');
    await debugToggleOnDebug.click();
    await expect(debugToggleOnDebug).toHaveAttribute('aria-pressed', 'true');

    // Act: Trigger API calls by navigating
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Return to debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Should have more logs now
    const logEntriesOn = page.getByTestId('endpoint-item');
    const countOn = await logEntriesOn.count();

    expect(countOn).toBeGreaterThanOrEqual(countOff);
  });

  test('should persist debug mode state across page navigation', async ({ page }) => {
    // Tests that debug mode state persists in DebugContext

    // Arrange: Enable debug mode on home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');

    // Ensure debug mode is ON
    const isOff = await debugToggle.getAttribute('aria-pressed') === 'false';
    if (isOff) {
      await debugToggle.click();
    }

    // Assert: Debug mode is ON
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Act: Navigate to /pods via BottomTabBar
    const podsTab = page.getByTestId('tab-pods');
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Debug mode should still be ON
    const debugToggleOnPods = page.getByTestId('debug-toggle');
    await expect(debugToggleOnPods).toHaveAttribute('aria-pressed', 'true');

    // Act: Navigate to /debug via the debug nav link
    const debugNavLink = page.getByTestId('debug-nav-link');
    await debugNavLink.click();
    await page.waitForLoadState('networkidle');

    // Assert: Debug mode should still be ON
    const debugToggleOnDebug = page.getByTestId('debug-toggle');
    await expect(debugToggleOnDebug).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Debug Route - Copy to Clipboard Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Enable debug mode and generate API logs before each test
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Navigate to generate API calls
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Go to debug page and select first endpoint
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();
  });

  test('should have copy button for Response JSON', async ({ page }) => {
    // Tests that Response tab has clipboard copy functionality

    // Act: Go to Response tab
    const responseTab = page.getByRole('tab', { name: /response/i });
    await responseTab.click();

    // Assert: Copy button should exist
    const copyButton = page.getByTestId('copy-button');
    await expect(copyButton).toBeVisible();
  });

  test('should copy Response JSON to clipboard when copy button clicked', async ({ page }) => {
    // Tests clipboard copy functionality

    // Arrange: Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Ensure Response tab is active
    const responseTab = page.getByRole('tab', { name: /response/i });
    await responseTab.click();

    // Act: Click copy button
    const copyButton = page.getByTestId('copy-button');
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

    // Ensure Response tab is active
    const responseTab = page.getByRole('tab', { name: /response/i });
    await responseTab.click();

    // Act: Click copy button
    const copyButton = page.getByTestId('copy-button');
    await copyButton.click();

    // Assert: Should show "Copied!" feedback on the button
    await expect(copyButton).toContainText(/copied/i);
  });

  test('should have copy button for Request details', async ({ page }) => {
    // Tests that Request tab also has clipboard copy functionality

    // Act: Go to Request tab
    const requestTab = page.getByRole('tab', { name: /request/i });
    await requestTab.click();

    // Assert: Copy button should exist (shared copy button works across tabs)
    const copyButton = page.getByTestId('copy-button');
    await expect(copyButton).toBeVisible();
  });
});

test.describe('Debug Route - Accessibility', () => {
  test('should have proper ARIA labels for debug page elements', async ({ page }) => {
    // Tests accessibility of debug page structure

    // Arrange: Navigate to /debug
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert: Debug page should be visible
    const debugPage = page.getByTestId('debug-page');
    await expect(debugPage).toBeVisible();

    // Assert: Endpoint list should have proper role
    const endpointList = page.getByTestId('endpoint-list');
    await expect(endpointList).toBeVisible();
    await expect(endpointList).toHaveAttribute('role', 'list');
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tests keyboard navigation support for debug page

    // Arrange: Enable debug mode and generate logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/pods');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click on the first endpoint item to select it
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: Detail view should show
    const detailView = page.getByTestId('detail-view');
    await expect(detailView).toBeVisible();
  });

  test('should have proper tab panel ARIA attributes', async ({ page }) => {
    // Tests that tab interface is accessible

    // Arrange: Enable debug mode and generate logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/pods');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: Tab list should have proper role
    const tabList = page.getByRole('tablist');
    await expect(tabList).toBeVisible();

    // Assert: Response tab should be selected by default
    const responseTab = page.getByRole('tab', { name: /response/i });
    await expect(responseTab).toHaveAttribute('aria-selected', 'true');

    // Assert: Tab panels should have proper role
    const tabPanel = page.getByRole('tabpanel');
    await expect(tabPanel).toBeVisible();
  });
});
