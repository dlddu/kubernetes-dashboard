// Engineering: ENG-001 (docs/product/eng-notes.md) — debug page diagnostic contract; not a product AC.
import { test, expect } from '@playwright/test';

test.describe('Debug Page - Back Button Rendering', () => {
  test('should render back button on /debug page', async ({ page }) => {
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const backButton = page.getByTestId('debug-back-button');
    await expect(backButton).toBeVisible();
  });

  test('should display "Back" text', async ({ page }) => {
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const backButton = page.getByTestId('debug-back-button');
    await expect(backButton).toContainText('Back');
  });

  test('should display a chevron icon inside the button', async ({ page }) => {
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const backButton = page.getByTestId('debug-back-button');
    const svg = backButton.locator('svg');
    await expect(svg).toBeVisible();
  });

  test('should be positioned next to the page title', async ({ page }) => {
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const backButton = page.getByTestId('debug-back-button');
    const title = page.getByTestId('debug-page-title');

    await expect(backButton).toBeVisible();
    await expect(title).toBeVisible();

    const backBox = await backButton.boundingBox();
    const titleBox = await title.boundingBox();
    expect(backBox).not.toBeNull();
    expect(titleBox).not.toBeNull();
    expect(backBox!.x).toBeLessThan(titleBox!.x);
  });
});

test.describe('Debug Page - Back Button Navigation', () => {
  test('should navigate back to home page when arriving from /', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const backButton = page.getByTestId('debug-back-button');
    await backButton.click();

    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/debug');
  });

  test('should navigate back to /pods when arriving from /pods', async ({ page }) => {
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const backButton = page.getByTestId('debug-back-button');
    await backButton.click();

    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/pods');
  });

  test('should navigate back to /nodes when arriving from /nodes', async ({ page }) => {
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    const backButton = page.getByTestId('debug-back-button');
    await backButton.click();

    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/nodes');
  });
});
