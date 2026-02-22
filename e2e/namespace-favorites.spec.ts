import { test, expect } from '@playwright/test';
import { setFavorites, clearFavorites } from './helpers/favorites-setup';

/**
 * E2E Tests for Namespace Favorites
 *
 * TDD Red Phase: Tests written - FavoritesContext not yet implemented.
 * These tests define the expected behavior of the namespace favorites feature,
 * which allows users to pin frequently used namespaces for quick access.
 * Covers happy path, persistence, UI rendering, and edge cases.
 *
 * Helper module: e2e/helpers/favorites-setup.ts
 * - setFavorites(page, namespaces): seeds localStorage with 'namespace-favorites'
 * - clearFavorites(page): removes 'namespace-favorites' from localStorage
 *
 * Related Issue: DLD-453 - e2e 테스트 환경 준비
 */

// TODO: Activate when FavoritesContext and favorites UI are implemented
test.describe.skip('Namespace Favorites - Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await clearFavorites(page);
  });

  test.afterEach(async ({ page }) => {
    await clearFavorites(page);
  });

  test('should display favorited namespaces in the favorites section of the namespace selector', async ({ page }) => {
    // Tests that namespaces stored as favorites are rendered in a dedicated favorites section

    // Arrange: Seed favorites via localStorage helper
    await setFavorites(page, ['default', 'kube-system']);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Act: Open the namespace selector
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    // Assert: Favorites section is visible in the dropdown
    const favoritesSection = page.getByTestId('namespace-favorites-section');
    await expect(favoritesSection).toBeVisible();

    // Assert: Each favorited namespace appears in the favorites section
    await expect(favoritesSection.getByTestId('namespace-favorite-item-default')).toBeVisible();
    await expect(favoritesSection.getByTestId('namespace-favorite-item-kube-system')).toBeVisible();
  });

  test('should allow adding a namespace to favorites via the star icon', async ({ page }) => {
    // Tests that clicking the favorite star icon on a namespace option adds it to favorites

    // Arrange: Navigate to the home page with no favorites set
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    // Act: Click the favorite toggle on the "default" namespace option
    const defaultOption = page.getByTestId('namespace-option-default');
    const favoriteToggle = defaultOption.getByTestId('namespace-favorite-toggle');
    await favoriteToggle.click();

    // Assert: The "default" namespace is now favorited (toggle shows active state)
    await expect(favoriteToggle).toHaveAttribute('aria-pressed', 'true');

    // Assert: localStorage was updated with 'default' in the favorites array
    const stored = await page.evaluate(() => localStorage.getItem('namespace-favorites'));
    expect(JSON.parse(stored ?? '[]')).toContain('default');
  });

  test('should allow removing a namespace from favorites via the star icon', async ({ page }) => {
    // Tests that clicking an already-active favorite toggle removes it from favorites

    // Arrange: Seed "default" as an existing favorite
    await setFavorites(page, ['default']);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Act: Open the selector and click the active favorite toggle for "default"
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultOption = page.getByTestId('namespace-option-default');
    const favoriteToggle = defaultOption.getByTestId('namespace-favorite-toggle');
    await favoriteToggle.click();

    // Assert: Toggle is no longer active
    await expect(favoriteToggle).toHaveAttribute('aria-pressed', 'false');

    // Assert: localStorage no longer contains "default"
    const stored = await page.evaluate(() => localStorage.getItem('namespace-favorites'));
    expect(JSON.parse(stored ?? '[]')).not.toContain('default');
  });

  test('should persist favorites across page reload', async ({ page }) => {
    // Tests that favorites seeded in localStorage survive a full page reload

    // Arrange: Seed favorites and reload
    await setFavorites(page, ['default', 'dashboard-test']);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert: localStorage still contains the favorites after reload
    const stored = await page.evaluate(() => localStorage.getItem('namespace-favorites'));
    const favorites: string[] = JSON.parse(stored ?? '[]');
    expect(favorites).toContain('default');
    expect(favorites).toContain('dashboard-test');

    // Act: Open the namespace selector
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    // Assert: Favorites section still shows the persisted namespaces
    const favoritesSection = page.getByTestId('namespace-favorites-section');
    await expect(favoritesSection).toBeVisible();
    await expect(favoritesSection.getByTestId('namespace-favorite-item-default')).toBeVisible();
    await expect(favoritesSection.getByTestId('namespace-favorite-item-dashboard-test')).toBeVisible();
  });
});

// TODO: Activate when FavoritesContext and favorites UI are implemented
test.describe.skip('Namespace Favorites - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await clearFavorites(page);
  });

  test.afterEach(async ({ page }) => {
    await clearFavorites(page);
  });

  test('should not display favorites section when no namespaces are favorited', async ({ page }) => {
    // Tests that the favorites section is hidden when the favorites list is empty

    // Arrange: Ensure no favorites are set
    // (clearFavorites is called in beforeEach)

    // Act: Open the namespace selector
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    // Assert: Favorites section should not be visible
    const favoritesSection = page.getByTestId('namespace-favorites-section');
    await expect(favoritesSection).not.toBeVisible();
  });

  test('should handle corrupted localStorage value gracefully without crashing', async ({ page }) => {
    // Tests that the app recovers if 'namespace-favorites' contains invalid JSON

    // Arrange: Write a non-JSON string directly to localStorage
    await page.evaluate(() => {
      localStorage.setItem('namespace-favorites', 'this-is-not-json');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert: The app should still load without a crash (main content visible)
    const topBar = page.getByRole('banner').or(page.getByTestId('top-bar'));
    await expect(topBar).toBeVisible();

    // Assert: Namespace selector is still functional
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelector).toBeEnabled();
  });

  test('should ignore favorites that no longer exist as valid namespaces', async ({ page }) => {
    // Tests that a favorited namespace deleted from the cluster is not shown as a broken entry

    // Arrange: Seed a namespace name that does not exist in the cluster
    await setFavorites(page, ['non-existent-namespace-xyz']);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Act: Open the namespace selector
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    // Assert: The stale namespace is not rendered as a favorites item
    const staleItem = page.getByTestId('namespace-favorite-item-non-existent-namespace-xyz');
    await expect(staleItem).not.toBeVisible();
  });

  test('should limit the number of displayed favorites to a maximum', async ({ page }) => {
    // Tests that the UI caps the visible favorites list at a reasonable maximum (e.g. 5)

    // Arrange: Seed more favorites than the expected maximum
    await setFavorites(page, [
      'namespace-1',
      'namespace-2',
      'namespace-3',
      'namespace-4',
      'namespace-5',
      'namespace-6',
      'namespace-7',
    ]);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Act: Open the namespace selector
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    // Assert: Favorites section exists
    const favoritesSection = page.getByTestId('namespace-favorites-section');
    await expect(favoritesSection).toBeVisible();

    // Assert: Rendered favorite items do not exceed the defined maximum
    const favoriteItems = favoritesSection.getByTestId(/^namespace-favorite-item-/);
    const renderedCount = await favoriteItems.count();
    expect(renderedCount).toBeLessThanOrEqual(5);
  });
});

// TODO: Activate when FavoritesContext and favorites UI are implemented
test.describe.skip('Namespace Favorites - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await clearFavorites(page);
  });

  test.afterEach(async ({ page }) => {
    await clearFavorites(page);
  });

  test('should have accessible labels on the favorite toggle button', async ({ page }) => {
    // Tests that screen readers can identify the purpose of the favorite toggle

    // Arrange: Open the namespace selector dropdown
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    // Act: Locate the favorite toggle for "default" namespace
    const defaultOption = page.getByTestId('namespace-option-default');
    const favoriteToggle = defaultOption.getByTestId('namespace-favorite-toggle');

    // Assert: Toggle has an accessible label indicating its purpose
    await expect(favoriteToggle).toHaveAttribute('aria-label', /favorite/i);

    // Assert: Toggle exposes its pressed state via aria-pressed
    const ariaPressedValue = await favoriteToggle.getAttribute('aria-pressed');
    expect(['true', 'false']).toContain(ariaPressedValue);
  });

  test('should be operable using keyboard navigation', async ({ page }) => {
    // Tests that the favorite toggle can be activated via keyboard (Enter / Space)

    // Arrange: Open the namespace selector and focus the first namespace option
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    // Act: Tab to the favorite toggle inside the "default" option and press Space
    const defaultOption = page.getByTestId('namespace-option-default');
    const favoriteToggle = defaultOption.getByTestId('namespace-favorite-toggle');
    await favoriteToggle.focus();
    await page.keyboard.press('Space');

    // Assert: Toggle is now active after keyboard activation
    await expect(favoriteToggle).toHaveAttribute('aria-pressed', 'true');
  });
});
