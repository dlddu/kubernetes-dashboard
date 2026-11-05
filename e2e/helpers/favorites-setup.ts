import { Page } from '@playwright/test';

export async function setFavorites(page: Page, namespaces: string[]): Promise<void> {
  await page.evaluate((values: string[]) => {
    localStorage.setItem('namespace-favorites', JSON.stringify(values));
  }, namespaces);
}

export async function clearFavorites(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('namespace-favorites');
  });
}
