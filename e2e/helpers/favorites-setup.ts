import { Page } from '@playwright/test';

/**
 * Sets the namespace favorites in localStorage.
 * Stores the given namespaces array under the 'namespace-favorites' key
 * using JSON.stringify, matching the pattern used by FavoritesContext.
 */
export async function setFavorites(page: Page, namespaces: string[]): Promise<void> {
  await page.evaluate((values: string[]) => {
    localStorage.setItem('namespace-favorites', JSON.stringify(values));
  }, namespaces);
}

/**
 * Removes the 'namespace-favorites' key from localStorage.
 * Use this in beforeEach / afterEach to ensure a clean state between tests.
 */
export async function clearFavorites(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('namespace-favorites');
  });
}
