import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Debug Page - Back Button Navigation
 *
 * Tests verify the back button on /debug page:
 * - Button renders with correct text and icon
 * - Clicking navigates back to the previous page
 * - Works from different origin pages (/, /pods, /nodes)
 */

test.describe('Debug Page - Back Button Rendering', () => {
  test('should render back button on /debug page', async ({ page }) => {
    // Arrange & Act
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Assert
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

    // Both should be visible and share the same parent container
    await expect(backButton).toBeVisible();
    await expect(title).toBeVisible();

    // Back button should appear before (left of) the title
    const backBox = await backButton.boundingBox();
    const titleBox = await title.boundingBox();
    expect(backBox).not.toBeNull();
    expect(titleBox).not.toBeNull();
    expect(backBox!.x).toBeLessThan(titleBox!.x);
  });
});

test.describe('Debug Page - Back Button Navigation', () => {
  test('should navigate back to home page when arriving from /', async ({ page }) => {
    // Arrange: Start from home, then go to /debug
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act: Click back button
    const backButton = page.getByTestId('debug-back-button');
    await backButton.click();

    // Assert: Should return to home page
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/debug');
  });

  test('should navigate back to /pods when arriving from /pods', async ({ page }) => {
    // Arrange: Start from /pods, then go to /debug
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act
    const backButton = page.getByTestId('debug-back-button');
    await backButton.click();

    // Assert
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/pods');
  });

  test('should navigate back to /nodes when arriving from /nodes', async ({ page }) => {
    // Arrange: Start from /nodes, then go to /debug
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');
    await page.goto('/debug');
    await page.waitForLoadState('networkidle');

    // Act
    const backButton = page.getByTestId('debug-back-button');
    await backButton.click();

    // Assert
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/nodes');
  });
});
