// Verifies: CM7 (docs/product/prd-common.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

test.describe('Namespace Filter - URL Deep Link', () => {
  test('should preselect namespace from URL query param on load', async ({ page }) => {
    // Arrange & Act: Navigate directly to a deep link with a namespace param
    await page.goto('/?namespace=default');
    await page.waitForLoadState('networkidle');

    // Assert: Selector should show the namespace from the URL
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i });
    await expect(namespaceSelector).toContainText(/^default$/i);
  });

  test('should reflect namespace selection in URL query param', async ({ page }) => {
    // Arrange: Navigate to home page and select a namespace
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i });
    await namespaceSelector.click();
    await page.getByRole('option', { name: /^default$/i }).click();

    // Assert: URL should contain the namespace query param
    await expect(page).toHaveURL(/[?&]namespace=default/);

    // Act: Select "All Namespaces" again
    await namespaceSelector.click();
    await page.getByRole('option', { name: /all namespaces/i }).click();

    // Assert: Namespace param should be removed from the URL
    await expect(page).not.toHaveURL(/[?&]namespace=/);
  });

  test('should keep namespace query param across tab navigation', async ({ page }) => {
    // Arrange: Load with a namespace deep link
    await page.goto('/?namespace=default');
    await page.waitForLoadState('networkidle');

    // Act: Navigate to the Pods tab via the bottom tab bar
    await page.getByTestId('tab-pods').click();
    await page.waitForLoadState('networkidle');

    // Assert: URL keeps the namespace param and the selector keeps the selection
    await expect(page).toHaveURL(/\/pods\?.*namespace=default/);
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i });
    await expect(namespaceSelector).toContainText(/^default$/i);
  });
});

test.describe('Namespace Context Integration - Edge Cases', () => {
  test('should persist namespace selection after page refresh via URL param', async ({ page }) => {
    // Tests that the namespace selection survives a page refresh because
    // NamespaceContext stores the selection in the ?namespace= URL param

    // Arrange: Navigate to home page and select a namespace
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const kubeSystemOption = page.getByRole('option', { name: /^kube-system$/i })
      .or(page.getByTestId('namespace-option-kube-system'));
    await kubeSystemOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Verify selection is reflected in the selector and the URL
    await expect(namespaceSelector).toContainText(/^kube-system$/i);
    await expect(page).toHaveURL(/[?&]namespace=kube-system/);

    // Act: Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selection should persist after reload (restored from the URL)
    const namespaceSelectorAfterReload = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorAfterReload).toContainText(/^kube-system$/i);
  });
});
