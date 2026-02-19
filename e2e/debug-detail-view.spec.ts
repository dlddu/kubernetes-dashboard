import { test, expect } from '@playwright/test';
import { enableDebugAndGenerateLogs } from './helpers/debug-setup';

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

test.describe('Debug Page - Detail View', () => {
  test.beforeEach(async ({ page }) => {
    await enableDebugAndGenerateLogs(page);
  });

  test('should display detail view when endpoint is clicked', async ({ page }) => {
    // Act: Click first endpoint in the list
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: Detail view should be visible
    const detailView = page.getByTestId('detail-view');
    await expect(detailView).toBeVisible();

    // Assert: Right panel should contain detail view
    const rightPanel = page.getByTestId('debug-right-panel');
    const detailViewInPanel = rightPanel.getByTestId('detail-view');
    await expect(detailViewInPanel).toBeVisible();
  });

  test('should display Response tab with JSON content and syntax highlighting', async ({ page }) => {
    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: Response tab should be active by default (aria-selected="true")
    const responseTab = page.getByRole('tab', { name: /response/i });
    await expect(responseTab).toHaveAttribute('aria-selected', 'true');

    // Assert: Response tab content should be visible
    const responseContent = page.getByTestId('response-content');
    await expect(responseContent).toBeVisible();

    // Assert: Should contain JSON-like content (braces, quotes, colons)
    const contentText = await responseContent.textContent();
    expect(contentText).toMatch(/[\{\}\[\]]/); // JSON structure characters

    // Assert: JSON string values should have color styling
    const jsonStrings = responseContent.locator('.json-string')
      .or(responseContent.locator('[class*="string"]'));
    const stringCount = await jsonStrings.count();
    expect(stringCount).toBeGreaterThan(0);

    const firstString = jsonStrings.first();
    const stringHasColor = await firstString.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.color !== '' && style.color !== 'rgb(0, 0, 0)';
    });
    expect(stringHasColor).toBe(true);

    // Assert: JSON number values should have color styling (if present)
    const jsonNumbers = responseContent.locator('.json-number')
      .or(responseContent.locator('[class*="number"]'));
    const numberCount = await jsonNumbers.count();
    if (numberCount > 0) {
      const firstNumber = jsonNumbers.first();
      const numberHasColor = await firstNumber.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.color !== '' && style.color !== 'rgb(0, 0, 0)';
      });
      expect(numberHasColor).toBe(true);
    }

    // Act: Click /api/overview endpoint for JSON key highlighting check
    const overviewEndpoint = page.getByTestId('endpoint-item').filter({ hasText: /\/api\/overview/ }).first();
    await overviewEndpoint.click();

    // Assert: JSON keys should have specific color styling
    const jsonKeys = responseContent.locator('.json-key')
      .or(responseContent.locator('[class*="key"]'))
      .or(responseContent.locator('span').filter({ hasText: /"[^"]+":/ }));
    const keyCount = await jsonKeys.count();
    expect(keyCount).toBeGreaterThan(0);

    const firstKey = jsonKeys.first();
    const keyHasColor = await firstKey.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.color !== '' && style.color !== 'rgb(0, 0, 0)';
    });
    expect(keyHasColor).toBe(true);
  });

  test('should display Request tab with method, URL, and parameters', async ({ page }) => {
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

    // Assert: Request content should show HTTP method
    const requestContent = page.getByTestId('request-content');
    await expect(requestContent).toContainText(/GET|POST|PUT|DELETE|PATCH/i);

    // Assert: Request content should show URL
    await expect(requestContent).toContainText(/\/api\//i);

    // Assert: Request content should contain params section or query string
    const paramsSection = requestContent.getByText(/params|parameters/i);
    const hasParams = await paramsSection.isVisible().catch(() => false);
    const contentTextReq = await requestContent.textContent();
    const hasQueryString = contentTextReq?.includes('?') || false;
    expect(hasParams || hasQueryString || contentTextReq?.includes('none')).toBe(true);
  });

  test('should display Metadata tab with all fields', async ({ page }) => {
    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Metadata tab
    const metadataTab = page.getByRole('tab', { name: /metadata/i });
    await metadataTab.click();

    // Assert: Metadata tab should be active
    await expect(metadataTab).toHaveAttribute('aria-selected', 'true');

    // Assert: Metadata content area
    const metadataContent = page.getByTestId('metadata-content');

    // Assert: Timestamp should be visible
    const timestamp = metadataContent.getByTestId('request-timestamp');
    await expect(timestamp).toBeVisible();

    // Assert: Duration should be visible and contain numeric value
    const duration = metadataContent.getByTestId('request-duration');
    await expect(duration).toBeVisible();
    const durationText = await duration.textContent();
    expect(durationText).toMatch(/\d+/);

    // Assert: Status code should be visible and show 200
    const statusCode = metadataContent.getByTestId('status-code');
    await expect(statusCode).toBeVisible();
    await expect(statusCode).toContainText('200');

    // Assert: Content-type should show JSON
    await expect(metadataContent).toContainText(/content-type/i);
    await expect(metadataContent).toContainText(/application\/json/i);

    // Assert: Response size should be visible with numeric value
    await expect(metadataContent).toContainText(/size|bytes/i);
    const metadataText = await metadataContent.textContent();
    expect(metadataText).toMatch(/\d+\s*(bytes|kb|mb)/i);
  });

  test('should copy tab contents to clipboard', async ({ page }) => {
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Act: Click first endpoint (Response tab is active by default)
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Assert: Copy button should be visible
    const copyButton = page.getByTestId('copy-button')
      .or(page.getByRole('button', { name: /copy/i }));
    await expect(copyButton).toBeVisible();

    // Act: Click Copy button on Response tab
    await copyButton.click();

    // Assert: Clipboard should contain valid JSON data
    const responseClipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(responseClipboard).toBeTruthy();
    expect(responseClipboard.length).toBeGreaterThan(0);
    expect(() => JSON.parse(responseClipboard)).not.toThrow();

    // Act: Switch to Request tab and copy
    const requestTab = page.getByRole('tab', { name: /request/i });
    await requestTab.click();

    const copyButtonReq = page.getByTestId('copy-button');
    await copyButtonReq.click();

    // Assert: Clipboard should contain request information
    const requestClipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(requestClipboard).toBeTruthy();
    expect(requestClipboard).toMatch(/GET|POST|PUT|DELETE|PATCH/);
    expect(requestClipboard).toContain('/api/');
  });

  test('should show and auto-hide "Copied!" feedback message', async ({ page }) => {
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Act: Click first endpoint
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    // Act: Click Copy button
    const copyButton = page.getByTestId('copy-button');
    await copyButton.click();

    // Assert: "Copied!" message should appear
    const copiedMessage = page.getByText(/copied!/i);
    await expect(copiedMessage).toBeVisible({ timeout: 2000 });

    // Assert: "Copied!" message should disappear after the feedback timeout
    await expect(copiedMessage).not.toBeVisible({ timeout: 3000 });
  });
});
