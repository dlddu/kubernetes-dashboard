import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Debug Page - Detail View with Tabs, JSON Syntax Highlighting & Copy
 *
 * Tests verify the detail view panel functionality when an endpoint is selected:
 * - Detail view displays when endpoint is clicked
 * - Response tab shows JSON with syntax highlighting (key, string, number colors)
 * - Request tab displays HTTP method, URL, and query parameters
 * - Metadata tab shows timestamp, duration, status code, content-type, response size
 * - Copy button copies active tab content to clipboard
 * - Copy feedback message appears and disappears after 1.5 seconds
 *
 * Related Issue: DLD-395 - Debug Detail View Implementation & E2E Activation
 * Parent Issue: DLD-341 - Debug Page API Response Feature
 *
 * Status: ACTIVE - Implementation completed
 */

test.describe('Debug Page - Detail View Display', () => {
  test('should display detail view when endpoint is clicked', async ({ page }) => {
    // Tests that clicking an endpoint in the list shows the detail view panel

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint in the list
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: Detail view should be visible
    const detailView = page.getByTestId('detail-view');
    await expect(detailView).toBeVisible();
  });

  test('should display detail view in right panel area', async ({ page }) => {
    // Tests that detail view is rendered within the right panel container

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: Right panel should contain detail view
    const rightPanel = page.getByTestId('debug-right-panel');
    const detailView = rightPanel.getByTestId('detail-view');
    await expect(detailView).toBeVisible();
  });
});

test.describe('Debug Page - Response Tab', () => {
  test('should display Response tab as active by default', async ({ page }) => {
    // Tests that Response tab is selected when detail view first opens

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: Response tab should be active (aria-selected="true")
    const responseTab = page.getByRole('tab', { name: /response/i });
    await expect(responseTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display JSON content in Response tab', async ({ page }) => {
    // Tests that Response tab shows JSON response data

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: Response tab content should be visible
    const responseContent = page.getByTestId('response-content');
    await expect(responseContent).toBeVisible();

    // Assert: Should contain JSON-like content (braces, quotes, colons)
    const contentText = await responseContent.textContent();
    expect(contentText).toMatch(/[\{\}\[\]]/); // JSON structure characters
  });

  test('should apply syntax highlighting to JSON keys', async ({ page }) => {
    // Tests that JSON object keys have distinct color styling

    // Arrange: Grant clipboard permissions (needed for copy functionality)
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click an endpoint that returns a JSON object (not an array)
    // /api/namespaces returns a string array which has no object keys,
    // so we select /api/overview which returns a JSON object with keys.
    const overviewEndpoint = page.getByTestId('endpoint-item').filter({ hasText: /\/api\/overview/ }).first();
    await overviewEndpoint.click();

    // Assert: JSON keys should have specific color styling
    const responseContent = page.getByTestId('response-content');
    const jsonKeys = responseContent.locator('.json-key')
      .or(responseContent.locator('[class*="key"]'))
      .or(responseContent.locator('span').filter({ hasText: /"[^"]+":/ }));

    // Check that at least one key element exists
    const keyCount = await jsonKeys.count();
    expect(keyCount).toBeGreaterThan(0);

    // Verify first key has color styling (non-default text color)
    const firstKey = jsonKeys.first();
    const hasColor = await firstKey.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.color !== '' && style.color !== 'rgb(0, 0, 0)';
    });
    expect(hasColor).toBe(true);
  });

  test('should apply syntax highlighting to JSON string values', async ({ page }) => {
    // Tests that JSON string values have distinct color styling

    // Arrange: Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: JSON string values should have color styling different from keys
    const responseContent = page.getByTestId('response-content');
    const jsonStrings = responseContent.locator('.json-string')
      .or(responseContent.locator('[class*="string"]'));

    // Check that string elements exist
    const stringCount = await jsonStrings.count();
    expect(stringCount).toBeGreaterThan(0);

    // Verify string values have color styling
    const firstString = jsonStrings.first();
    const hasColor = await firstString.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.color !== '' && style.color !== 'rgb(0, 0, 0)';
    });
    expect(hasColor).toBe(true);
  });

  test('should apply syntax highlighting to JSON number values', async ({ page }) => {
    // Tests that JSON number values have distinct color styling

    // Arrange: Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: JSON number values should have color styling
    const responseContent = page.getByTestId('response-content');
    const jsonNumbers = responseContent.locator('.json-number')
      .or(responseContent.locator('[class*="number"]'));

    // Check that number elements exist (response might contain numbers)
    const numberCount = await jsonNumbers.count();

    // If numbers exist, verify they have color styling
    if (numberCount > 0) {
      const firstNumber = jsonNumbers.first();
      const hasColor = await firstNumber.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.color !== '' && style.color !== 'rgb(0, 0, 0)';
      });
      expect(hasColor).toBe(true);
    }
  });
});

test.describe('Debug Page - Request Tab', () => {
  test('should switch to Request tab when clicked', async ({ page }) => {
    // Tests that clicking Request tab changes the active tab

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Request tab
    const requestTab = page.getByRole('tab', { name: /request/i });
    await requestTab.click();

    // Assert: Request tab should be active
    await expect(requestTab).toHaveAttribute('aria-selected', 'true');

    // Assert: Response tab should no longer be active
    const responseTab = page.getByRole('tab', { name: /response/i });
    await expect(responseTab).toHaveAttribute('aria-selected', 'false');
  });

  test('should display HTTP method in Request tab', async ({ page }) => {
    // Tests that Request tab shows the HTTP method (GET, POST, etc.)

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Request tab
    const requestTab = page.getByRole('tab', { name: /request/i });
    await requestTab.click();

    // Assert: Request content should show HTTP method
    const requestContent = page.getByTestId('request-content');
    await expect(requestContent).toContainText(/GET|POST|PUT|DELETE|PATCH/i);
  });

  test('should display request URL in Request tab', async ({ page }) => {
    // Tests that Request tab shows the full request URL

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Request tab
    const requestTab = page.getByRole('tab', { name: /request/i });
    await requestTab.click();

    // Assert: Request content should show URL
    const requestContent = page.getByTestId('request-content');
    await expect(requestContent).toContainText(/\/api\//i);
  });

  test('should display query parameters in Request tab', async ({ page }) => {
    // Tests that Request tab shows URL query parameters if present

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Request tab
    const requestTab = page.getByRole('tab', { name: /request/i });
    await requestTab.click();

    // Assert: Request content should contain params section
    const requestContent = page.getByTestId('request-content');

    // Check if "Params" or "Parameters" section exists
    const paramsSection = requestContent.getByText(/params|parameters/i);
    const hasParams = await paramsSection.isVisible().catch(() => false);

    // Either params section exists, or URL contains query string
    const contentText = await requestContent.textContent();
    const hasQueryString = contentText?.includes('?') || false;

    // At minimum, Request tab should mention params even if none present
    expect(hasParams || hasQueryString || contentText?.includes('none')).toBe(true);
  });
});

test.describe('Debug Page - Metadata Tab', () => {
  test('should switch to Metadata tab when clicked', async ({ page }) => {
    // Tests that clicking Metadata tab changes the active tab

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Metadata tab
    const metadataTab = page.getByRole('tab', { name: /metadata/i });
    await metadataTab.click();

    // Assert: Metadata tab should be active
    await expect(metadataTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display timestamp in Metadata tab', async ({ page }) => {
    // Tests that Metadata tab shows request timestamp

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Metadata tab
    const metadataTab = page.getByRole('tab', { name: /metadata/i });
    await metadataTab.click();

    // Assert: Timestamp should be visible
    const metadataContent = page.getByTestId('metadata-content');
    const timestamp = metadataContent.getByTestId('request-timestamp');
    await expect(timestamp).toBeVisible();
  });

  test('should display duration in Metadata tab', async ({ page }) => {
    // Tests that Metadata tab shows request duration

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Metadata tab
    const metadataTab = page.getByRole('tab', { name: /metadata/i });
    await metadataTab.click();

    // Assert: Duration should be visible
    const metadataContent = page.getByTestId('metadata-content');
    const duration = metadataContent.getByTestId('request-duration');
    await expect(duration).toBeVisible();

    // Assert: Duration should contain numeric value
    const durationText = await duration.textContent();
    expect(durationText).toMatch(/\d+/);
  });

  test('should display status code in Metadata tab', async ({ page }) => {
    // Tests that Metadata tab shows HTTP status code

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Metadata tab
    const metadataTab = page.getByRole('tab', { name: /metadata/i });
    await metadataTab.click();

    // Assert: Status code should be visible
    const metadataContent = page.getByTestId('metadata-content');
    const statusCode = metadataContent.getByTestId('status-code');
    await expect(statusCode).toBeVisible();

    // Assert: Status code should be 200 for successful requests
    await expect(statusCode).toContainText('200');
  });

  test('should display content-type in Metadata tab', async ({ page }) => {
    // Tests that Metadata tab shows response content-type header

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Metadata tab
    const metadataTab = page.getByRole('tab', { name: /metadata/i });
    await metadataTab.click();

    // Assert: Content-type should be visible
    const metadataContent = page.getByTestId('metadata-content');
    await expect(metadataContent).toContainText(/content-type/i);

    // Assert: Should show JSON content type for API responses
    await expect(metadataContent).toContainText(/application\/json/i);
  });

  test('should display response size in Metadata tab', async ({ page }) => {
    // Tests that Metadata tab shows response body size

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Metadata tab
    const metadataTab = page.getByRole('tab', { name: /metadata/i });
    await metadataTab.click();

    // Assert: Response size should be visible
    const metadataContent = page.getByTestId('metadata-content');
    await expect(metadataContent).toContainText(/size|bytes/i);

    // Assert: Size value should be numeric
    const contentText = await metadataContent.textContent();
    expect(contentText).toMatch(/\d+\s*(bytes|kb|mb)/i);
  });
});

test.describe('Debug Page - Copy to Clipboard', () => {
  test('should display Copy button in detail view', async ({ page }) => {
    // Tests that Copy button is visible when detail view is open

    // Arrange: Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: Copy button should be visible
    const copyButton = page.getByTestId('copy-button')
      .or(page.getByRole('button', { name: /copy/i }));
    await expect(copyButton).toBeVisible();
  });

  test('should copy Response tab content to clipboard when Copy button clicked', async ({ page }) => {
    // Tests that clicking Copy button copies active tab (Response) content

    // Arrange: Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint (Response tab is active by default)
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Copy button
    const copyButton = page.getByTestId('copy-button')
      .or(page.getByRole('button', { name: /copy/i }));
    await copyButton.click();

    // Assert: Clipboard should contain JSON data
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toBeTruthy();
    expect(clipboardContent.length).toBeGreaterThan(0);

    // Assert: Clipboard content should be valid JSON
    expect(() => JSON.parse(clipboardContent)).not.toThrow();
  });

  test('should copy Request tab content to clipboard when Request tab is active', async ({ page }) => {
    // Tests that Copy button copies Request tab content when that tab is active

    // Arrange: Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Switch to Request tab
    const requestTab = page.getByRole('tab', { name: /request/i });
    await requestTab.click();

    // Act: Click Copy button
    const copyButton = page.getByTestId('copy-button');
    await copyButton.click();

    // Assert: Clipboard should contain request information
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toBeTruthy();

    // Assert: Should contain HTTP method and URL
    expect(clipboardContent).toMatch(/GET|POST|PUT|DELETE|PATCH/);
    expect(clipboardContent).toContain('/api/');
  });

  test('should display "Copied!" feedback after clicking Copy button', async ({ page }) => {
    // Tests that Copy button shows success feedback message

    // Arrange: Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Copy button
    const copyButton = page.getByTestId('copy-button');
    await copyButton.click();

    // Assert: "Copied!" message should appear
    const copiedMessage = page.getByText(/copied!/i);
    await expect(copiedMessage).toBeVisible({ timeout: 2000 });
  });

  test('should hide "Copied!" feedback after 1.5 seconds', async ({ page }) => {
    // Tests that success feedback message disappears automatically

    // Arrange: Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Arrange: Enable debug mode and generate API logs
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await debugToggle.click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Act: Navigate to /debug page
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Copy button
    const copyButton = page.getByTestId('copy-button');
    await copyButton.click();

    // Assert: "Copied!" message should be visible initially
    const copiedMessage = page.getByText(/copied!/i);
    await expect(copiedMessage).toBeVisible({ timeout: 2000 });

    // Act: Wait for 1.5 seconds (feedback timeout)
    await page.waitForTimeout(1500);

    // Assert: "Copied!" message should disappear
    await expect(copiedMessage).not.toBeVisible({ timeout: 1000 });
  });
});
