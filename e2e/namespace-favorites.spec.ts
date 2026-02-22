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

test.describe('Namespace Favorites - Happy Path', () => {
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

test.describe('Namespace Favorites - Edge Cases', () => {
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
    //
    // E2E environment namespaces (kind cluster + fixtures):
    //   default, kube-system, kube-public, kube-node-lease, local-path-storage, dashboard-test
    // Seeding all 6 as favorites ensures that:
    //   - The favorites section is rendered (intersection with real namespaces is non-empty)
    //   - The rendered count can be verified against the cap of 5
    // If the cluster happens to have fewer than 6 of the expected namespaces available,
    // the test gracefully falls back: it still asserts that rendered count <= 5.

    // Arrange: Seed all known E2E namespaces as favorites (6 real namespaces, exceeds the cap of 5)
    await setFavorites(page, [
      'default',
      'kube-system',
      'kube-public',
      'kube-node-lease',
      'local-path-storage',
      'dashboard-test',
    ]);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Act: Open the namespace selector
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    // Assert: Favorites section exists (at least one of the seeded namespaces must exist in the cluster)
    const favoritesSection = page.getByTestId('namespace-favorites-section');
    await expect(favoritesSection).toBeVisible();

    // Assert: Rendered favorite items do not exceed the defined maximum
    const favoriteItems = favoritesSection.getByTestId(/^namespace-favorite-item-/);
    const renderedCount = await favoriteItems.count();
    expect(renderedCount).toBeLessThanOrEqual(5);
  });
});

test.describe('Namespace Favorites - Accessibility', () => {
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

test.describe('Namespace Favorites - Toggle Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await clearFavorites(page);
  });

  test.afterEach(async ({ page }) => {
    await clearFavorites(page);
  });

  test('should display Favorites section header and All section header when favorites exist', async ({ page }) => {
    // Tests that opening the dropdown with existing favorites renders both section headers

    // Arrange: Seed a favorite and reload so the UI reads from localStorage
    await setFavorites(page, ['default']);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Act: Open the namespace selector dropdown
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    // Assert: The listbox is visible
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();

    // Assert: Favorites section header is visible
    const favoritesHeader = page.getByTestId('namespace-favorites-header').or(
      listbox.getByText(/⭐\s*Favorites/i)
    );
    await expect(favoritesHeader).toBeVisible();

    // Assert: All section header is visible
    const allHeader = page.getByTestId('namespace-all-header').or(
      listbox.getByText(/^All$/i)
    );
    await expect(allHeader).toBeVisible();
  });

  test('should move namespace to Favorites section when star icon is clicked', async ({ page }) => {
    // Tests that clicking ⭐ on a namespace with no existing favorites adds it to the Favorites section

    // Arrange: Ensure no favorites exist and open the dropdown
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    // Assert: Favorites section is not yet visible before toggling
    const favoritesSection = page.getByTestId('namespace-favorites-section');
    await expect(favoritesSection).not.toBeVisible();

    // Act: Click the favorite toggle on the "default" namespace option
    const defaultOption = page.getByTestId('namespace-option-default');
    const favoriteToggle = defaultOption.getByTestId('namespace-favorite-toggle');
    await favoriteToggle.click();

    // Assert: Favorites section is now visible
    await expect(favoritesSection).toBeVisible();

    // Assert: "default" namespace appears in the Favorites section
    await expect(favoritesSection.getByTestId('namespace-favorite-item-default')).toBeVisible();
  });

  test('should remove namespace from Favorites section and restore it to All section when star is clicked again', async ({ page }) => {
    // Tests that clicking ⭐ on an already-favorited namespace removes it from Favorites and it reappears in All

    // Arrange: Seed "default" as an existing favorite and reload
    await setFavorites(page, ['default']);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Act: Open the namespace selector dropdown
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    // Assert: "default" is currently in the Favorites section
    const favoritesSection = page.getByTestId('namespace-favorites-section');
    await expect(favoritesSection.getByTestId('namespace-favorite-item-default')).toBeVisible();

    // Act: Click the active favorite toggle to remove it
    const defaultOption = page.getByTestId('namespace-option-default');
    const favoriteToggle = defaultOption.getByTestId('namespace-favorite-toggle');
    await favoriteToggle.click();

    // Assert: "default" is no longer in the Favorites section
    await expect(favoritesSection.getByTestId('namespace-favorite-item-default')).not.toBeVisible();

    // Assert: "default" namespace option is still visible in the All section
    await expect(defaultOption).toBeVisible();
  });

  test('should keep dropdown open after clicking the star icon', async ({ page }) => {
    // Tests that clicking ⭐ does not close the dropdown (favorite toggle is independent of namespace selection)

    // Arrange: Open the namespace selector dropdown
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();

    // Act: Click the favorite toggle on the "default" namespace option
    const defaultOption = page.getByTestId('namespace-option-default');
    const favoriteToggle = defaultOption.getByTestId('namespace-favorite-toggle');
    await favoriteToggle.click();

    // Assert: Dropdown listbox is still visible after clicking ⭐
    await expect(listbox).toBeVisible();
  });

  test('should select namespace and close dropdown when namespace text is clicked', async ({ page }) => {
    // Tests that clicking the namespace label/text selects the namespace and closes the dropdown (existing behavior unchanged)

    // Arrange: Open the namespace selector dropdown
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();

    // Act: Click the text/label area of the "default" namespace option (not the star icon)
    const defaultOption = page.getByTestId('namespace-option-default');
    const optionLabel = defaultOption.getByTestId('namespace-option-label-default').or(
      defaultOption.getByText(/^default$/i)
    );
    await optionLabel.click();

    // Assert: The namespace selector now shows "default" as selected
    await expect(namespaceSelector).toContainText(/^default$/i);

    // Assert: Dropdown listbox is closed after selection
    await expect(listbox).not.toBeVisible();
  });

  test('should persist favorites in localStorage and restore them after page reload', async ({ page }) => {
    // Tests that favorites written via the UI are stored in localStorage and survive a full page reload

    // Arrange: Open the dropdown and click ⭐ on "default" to add it as a favorite
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultOption = page.getByTestId('namespace-option-default');
    const favoriteToggle = defaultOption.getByTestId('namespace-favorite-toggle');
    await favoriteToggle.click();

    // Assert: localStorage contains "default" in favorites before reload
    const storedBefore = await page.evaluate(() => localStorage.getItem('namespace-favorites'));
    expect(JSON.parse(storedBefore ?? '[]')).toContain('default');

    // Act: Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert: localStorage still contains "default" after reload
    const storedAfter = await page.evaluate(() => localStorage.getItem('namespace-favorites'));
    expect(JSON.parse(storedAfter ?? '[]')).toContain('default');

    // Assert: Favorites section is visible with "default" after reload
    const namespaceSelector2 = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector2.click();

    const favoritesSection = page.getByTestId('namespace-favorites-section');
    await expect(favoritesSection).toBeVisible();
    await expect(favoritesSection.getByTestId('namespace-favorite-item-default')).toBeVisible();
  });

  test('should not display favorites that do not exist in the actual namespace list', async ({ page }) => {
    // Tests that a namespace stored in localStorage favorites but absent from the cluster is not shown in the UI

    // Arrange: Seed a non-existent namespace into favorites and reload
    await setFavorites(page, ['non-existent-namespace-xyz']);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Act: Open the namespace selector dropdown
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    // Assert: The stale/non-existent namespace is not rendered in the Favorites section
    const staleItem = page.getByTestId('namespace-favorite-item-non-existent-namespace-xyz');
    await expect(staleItem).not.toBeVisible();

    // Assert: No broken/empty favorite entry is displayed
    const favoritesSection = page.getByTestId('namespace-favorites-section');
    const favoriteItems = favoritesSection.getByTestId(/^namespace-favorite-item-/);
    const renderedCount = await favoriteItems.count();
    expect(renderedCount).toBe(0);
  });
});
