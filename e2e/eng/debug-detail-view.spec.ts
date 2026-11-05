// Engineering: ENG-001 (docs/product/eng-notes.md) — debug page diagnostic contract; not a product AC.
import { test, expect } from '@playwright/test';
import { enableDebugAndGenerateLogs } from '../helpers/debug-setup';

test.describe('Debug Page - Detail View', () => {
  test.beforeEach(async ({ page }) => {
    await enableDebugAndGenerateLogs(page);
  });

  test('should display detail view when endpoint is clicked', async ({ page }) => {
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    const detailView = page.getByTestId('detail-view');
    await expect(detailView).toBeVisible();

    const rightPanel = page.getByTestId('debug-right-panel');
    const detailViewInPanel = rightPanel.getByTestId('detail-view');
    await expect(detailViewInPanel).toBeVisible();
  });

  test('should display Response tab with JSON content and syntax highlighting', async ({ page }) => {
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    const responseTab = page.getByRole('tab', { name: /response/i });
    await expect(responseTab).toHaveAttribute('aria-selected', 'true');

    const responseContent = page.getByTestId('response-content');
    await expect(responseContent).toBeVisible();

    const contentText = await responseContent.textContent();
    expect(contentText).toMatch(/[\{\}\[\]]/); // JSON structure characters

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

    const overviewEndpoint = page.getByTestId('endpoint-item').filter({ hasText: /\/api\/overview/ }).first();
    await overviewEndpoint.click();

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
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    const requestTab = page.getByRole('tab', { name: /request/i });
    await requestTab.click();

    await expect(requestTab).toHaveAttribute('aria-selected', 'true');

    const responseTab = page.getByRole('tab', { name: /response/i });
    await expect(responseTab).toHaveAttribute('aria-selected', 'false');

    const requestContent = page.getByTestId('request-content');
    await expect(requestContent).toContainText(/GET|POST|PUT|DELETE|PATCH/i);

    await expect(requestContent).toContainText(/\/api\//i);

    const paramsSection = requestContent.getByText(/params|parameters/i);
    const hasParams = await paramsSection.isVisible().catch(() => false);
    const contentTextReq = await requestContent.textContent();
    const hasQueryString = contentTextReq?.includes('?') || false;
    expect(hasParams || hasQueryString || contentTextReq?.includes('none')).toBe(true);
  });

  test('should display Metadata tab with all fields', async ({ page }) => {
    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    const metadataTab = page.getByRole('tab', { name: /metadata/i });
    await metadataTab.click();

    await expect(metadataTab).toHaveAttribute('aria-selected', 'true');

    const metadataContent = page.getByTestId('metadata-content');

    const timestamp = metadataContent.getByTestId('request-timestamp');
    await expect(timestamp).toBeVisible();

    const duration = metadataContent.getByTestId('request-duration');
    await expect(duration).toBeVisible();
    const durationText = await duration.textContent();
    expect(durationText).toMatch(/\d+/);

    const statusCode = metadataContent.getByTestId('status-code');
    await expect(statusCode).toBeVisible();
    await expect(statusCode).toContainText('200');

    await expect(metadataContent).toContainText(/content-type/i);
    await expect(metadataContent).toContainText(/application\/json/i);

    await expect(metadataContent).toContainText(/size|bytes/i);
    const metadataText = await metadataContent.textContent();
    expect(metadataText).toMatch(/\d+\s*(bytes|kb|mb)/i);
  });

  test('should copy tab contents to clipboard', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    const copyButton = page.getByTestId('copy-button')
      .or(page.getByRole('button', { name: /copy/i }));
    await expect(copyButton).toBeVisible();

    await copyButton.click();

    const responseClipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(responseClipboard).toBeTruthy();
    expect(responseClipboard.length).toBeGreaterThan(0);
    expect(() => JSON.parse(responseClipboard)).not.toThrow();

    const requestTab = page.getByRole('tab', { name: /request/i });
    await requestTab.click();

    const copyButtonReq = page.getByTestId('copy-button');
    await copyButtonReq.click();

    const requestClipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(requestClipboard).toBeTruthy();
    expect(requestClipboard).toMatch(/GET|POST|PUT|DELETE|PATCH/);
    expect(requestClipboard).toContain('/api/');
  });

  test('should show and auto-hide "Copied!" feedback message', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const firstEndpoint = page.getByTestId('endpoint-item').first();
    await firstEndpoint.click();

    const copyButton = page.getByTestId('copy-button');
    await copyButton.click();

    const copiedMessage = page.getByText(/copied!/i);
    await expect(copiedMessage).toBeVisible({ timeout: 2000 });

    await expect(copiedMessage).not.toBeVisible({ timeout: 3000 });
  });
});
