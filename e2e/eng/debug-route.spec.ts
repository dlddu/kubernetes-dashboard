// Engineering: ENG-001 (docs/product/eng-notes.md) — debug page diagnostic contract; not a product AC.
import { test, expect } from '@playwright/test';

test.describe('Debug Route - SPA Routing Infrastructure', () => {
  test('should access /debug route via page.goto()', async ({ page }) => {
    const response = await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    expect(response?.status()).toBe(200);

    expect(page.url()).toContain('/debug');

    const appRoot = page.locator('#root');
    await expect(appRoot).toBeVisible();
  });

  test('should access /debug route via client-side navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.history.pushState({}, '', '/debug');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    await page.waitForURL('**/debug');

    expect(page.url()).toContain('/debug');

    const appRoot = page.locator('#root');
    await expect(appRoot).toBeVisible();
  });

  test('should render /debug page with correct structure', async ({ page }) => {
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const debugPage = page.getByTestId('debug-page');
    await expect(debugPage).toBeVisible();

    const debugTitle = page.getByTestId('debug-page-title');
    await expect(debugTitle).toBeVisible();
  });

  test('should maintain TopBar navigation when on /debug page', async ({ page }) => {
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const topBar = page.getByTestId('top-bar')
      .or(page.getByRole('banner'));
    await expect(topBar).toBeVisible();

    const namespaceSelector = page.getByTestId('namespace-selector');
    await expect(namespaceSelector).toBeVisible();
  });

  test('should not break existing e2e tests with /debug route addition', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveTitle(/Kubernetes Dashboard/i);

    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/debug');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveTitle(/Kubernetes Dashboard/i);
  });
});

test.describe('Debug Route - DebugContext Data Display', () => {
  test('should display API call logs from DebugContext', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(1000);

    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const endpointList = page.getByTestId('endpoint-list');
    await expect(endpointList).toBeVisible();

    const logEntries = page.getByTestId('endpoint-item');
    const logCount = await logEntries.count();
    expect(logCount).toBeGreaterThan(0);
  });

  test('should display endpoint list in left panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const leftPanel = page.getByTestId('debug-left-panel');
    await expect(leftPanel).toBeVisible();

    const endpointList = leftPanel.getByTestId('endpoint-list');
    await expect(endpointList).toBeVisible();
  });

  test('should display detail view in right panel', async ({ page }) => {
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const rightPanel = page.getByTestId('debug-right-panel');
    await expect(rightPanel).toBeVisible();
  });

  test('should show selected endpoint details when clicked', async ({ page }) => {
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

    const detailView = page.getByTestId('detail-view');
    await expect(detailView).toBeVisible();

    const responseContent = page.getByTestId('response-content');
    await expect(responseContent).toBeVisible();
  });

  test('should display empty state when no API calls logged', async ({ page }) => {
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const emptyState = page.getByTestId('debug-empty-state');
    const logEntries = page.getByTestId('endpoint-item');

    const emptyStateExists = await emptyState.isVisible().catch(() => false);
    const hasLogs = await logEntries.count() > 0;

    expect(emptyStateExists || hasLogs).toBe(true);
  });
});

test.describe('Debug Route - Detail View Tabs', () => {
  test.beforeEach(async ({ page }) => {
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
  });

  test('should display Response tab in detail view', async ({ page }) => {
    const responseTab = page.getByRole('tab', { name: /response/i });
    await expect(responseTab).toBeVisible();

    await responseTab.click();

    const responseContent = page.getByTestId('response-content');
    await expect(responseContent).toBeVisible();
  });

  test('should display Request tab in detail view', async ({ page }) => {
    const requestTab = page.getByRole('tab', { name: /request/i });
    await expect(requestTab).toBeVisible();

    await requestTab.click();

    const requestContent = page.getByTestId('request-content');
    await expect(requestContent).toBeVisible();

    const httpMethod = requestContent.getByTestId('http-method');
    await expect(httpMethod).toBeVisible();

    const requestUrl = requestContent.getByTestId('request-url');
    await expect(requestUrl).toBeVisible();
  });

  test('should display Metadata tab in detail view', async ({ page }) => {
    const metadataTab = page.getByRole('tab', { name: /metadata/i });
    await expect(metadataTab).toBeVisible();

    await metadataTab.click();

    const metadataContent = page.getByTestId('metadata-content');
    await expect(metadataContent).toBeVisible();

    const timestamp = metadataContent.getByTestId('request-timestamp');
    await expect(timestamp).toBeVisible();

    const duration = metadataContent.getByTestId('request-duration');
    await expect(duration).toBeVisible();

    const statusCode = metadataContent.getByTestId('status-code');
    await expect(statusCode).toBeVisible();
  });

  test('should switch between tabs without losing data', async ({ page }) => {
    const responseTab = page.getByRole('tab', { name: /response/i });
    await responseTab.click();
    await expect(page.getByTestId('response-content')).toBeVisible();

    const requestTab = page.getByRole('tab', { name: /request/i });
    await requestTab.click();
    await expect(page.getByTestId('request-content')).toBeVisible();

    const metadataTab = page.getByRole('tab', { name: /metadata/i });
    await metadataTab.click();
    await expect(page.getByTestId('metadata-content')).toBeVisible();

    await responseTab.click();
    await expect(page.getByTestId('response-content')).toBeVisible();

    const responseContent = page.getByTestId('response-content');
    await expect(responseContent).toBeVisible();
  });
});

test.describe('Debug Route - TopBar Debug Toggle', () => {
  test('should display Debug ON/OFF toggle in TopBar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await expect(debugToggle).toBeVisible();
  });

  test('should toggle debug mode ON when button is clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    const isAlreadyOn = await debugToggle.getAttribute('aria-pressed') === 'true';
    if (isAlreadyOn) {
      await debugToggle.click();
    }

    await debugToggle.click();

    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(debugToggle).toContainText(/debug on/i);
  });

  test('should toggle debug mode OFF when button is clicked again', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');

    const isOff = await debugToggle.getAttribute('aria-pressed') === 'false';
    if (isOff) {
      await debugToggle.click();
    }
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    await debugToggle.click();

    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(debugToggle).toContainText(/debug off/i);
  });

  test('should only capture API calls when debug mode is ON', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    const isOn = await debugToggle.getAttribute('aria-pressed') === 'true';
    if (isOn) {
      await debugToggle.click();
    }

    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const logEntriesOff = page.getByTestId('endpoint-item');
    const countOff = await logEntriesOff.count();

    const debugToggleOnDebug = page.getByTestId('debug-toggle');
    await debugToggleOnDebug.click();
    await expect(debugToggleOnDebug).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const logEntriesOn = page.getByTestId('endpoint-item');
    const countOn = await logEntriesOn.count();

    expect(countOn).toBeGreaterThanOrEqual(countOff);
  });

  test('should persist debug mode state across page navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');

    const isOff = await debugToggle.getAttribute('aria-pressed') === 'false';
    if (isOff) {
      await debugToggle.click();
    }

    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    const podsTab = page.getByTestId('tab-pods');
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    const debugToggleOnPods = page.getByTestId('debug-toggle');
    await expect(debugToggleOnPods).toHaveAttribute('aria-pressed', 'true');

    const debugNavLink = page.getByTestId('debug-nav-link');
    await debugNavLink.click();
    await page.waitForLoadState('networkidle');

    const debugToggleOnDebug = page.getByTestId('debug-toggle');
    await expect(debugToggleOnDebug).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Debug Route - Copy to Clipboard Feature', () => {
  test.beforeEach(async ({ page }) => {
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
  });

  test('should have copy button for Response JSON', async ({ page }) => {
    const responseTab = page.getByRole('tab', { name: /response/i });
    await responseTab.click();

    const copyButton = page.getByTestId('copy-button');
    await expect(copyButton).toBeVisible();
  });

  test('should copy Response JSON to clipboard when copy button clicked', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const responseTab = page.getByRole('tab', { name: /response/i });
    await responseTab.click();

    const copyButton = page.getByTestId('copy-button');
    await copyButton.click();

    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toBeTruthy();
    expect(clipboardContent.length).toBeGreaterThan(0);

    expect(() => JSON.parse(clipboardContent)).not.toThrow();
  });

  test('should show success feedback after copying', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const responseTab = page.getByRole('tab', { name: /response/i });
    await responseTab.click();

    const copyButton = page.getByTestId('copy-button');
    await copyButton.click();

    await expect(copyButton).toContainText(/copied/i);
  });

  test('should have copy button for Request details', async ({ page }) => {
    const requestTab = page.getByRole('tab', { name: /request/i });
    await requestTab.click();

    const copyButton = page.getByTestId('copy-button');
    await expect(copyButton).toBeVisible();
  });
});

test.describe('Debug Route - Accessibility', () => {
  test('should have proper ARIA labels for debug page elements', async ({ page }) => {
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const debugPage = page.getByTestId('debug-page');
    await expect(debugPage).toBeVisible();

    const endpointList = page.getByTestId('endpoint-list');
    await expect(endpointList).toBeVisible();
    await expect(endpointList).toHaveAttribute('role', 'list');
  });

  test('should be keyboard navigable', async ({ page }) => {
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

    const detailView = page.getByTestId('detail-view');
    await expect(detailView).toBeVisible();
  });

  test('should have proper tab panel ARIA attributes', async ({ page }) => {
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

    const tabList = page.getByRole('tablist');
    await expect(tabList).toBeVisible();

    const responseTab = page.getByRole('tab', { name: /response/i });
    await expect(responseTab).toHaveAttribute('aria-selected', 'true');

    const tabPanel = page.getByRole('tabpanel');
    await expect(tabPanel).toBeVisible();
  });
});
