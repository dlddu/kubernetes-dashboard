import { test, expect } from '@playwright/test';

test.describe('Namespace Filter - URL Deep Link', () => {
  test('should preselect namespace from URL query param on load', async ({ page }) => {
    await page.goto('/?namespace=default');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i });
    await expect(namespaceSelector).toContainText(/^default$/i);
  });

  test('should reflect namespace selection in URL query param', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i });
    await namespaceSelector.click();
    await page.getByRole('option', { name: /^default$/i }).click();

    await expect(page).toHaveURL(/[?&]namespace=default/);

    await namespaceSelector.click();
    await page.getByRole('option', { name: /all namespaces/i }).click();

    await expect(page).not.toHaveURL(/[?&]namespace=/);
  });

  test('should keep namespace query param across tab navigation', async ({ page }) => {
    await page.goto('/?namespace=default');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('tab-pods').click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/pods\?.*namespace=default/);
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i });
    await expect(namespaceSelector).toContainText(/^default$/i);
  });
});

test.describe('Namespace Context Integration - Edge Cases', () => {
  test('should persist namespace selection after page refresh via URL param', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const kubeSystemOption = page.getByRole('option', { name: /^kube-system$/i })
      .or(page.getByTestId('namespace-option-kube-system'));
    await kubeSystemOption.click();
    await page.waitForLoadState('networkidle');

    await expect(namespaceSelector).toContainText(/^kube-system$/i);
    await expect(page).toHaveURL(/[?&]namespace=kube-system/);

    await page.reload();
    await page.waitForLoadState('networkidle');

    const namespaceSelectorAfterReload = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorAfterReload).toContainText(/^kube-system$/i);
  });
});
