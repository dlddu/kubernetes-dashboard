import { test, expect } from '@playwright/test';

test.describe('Namespace URL Deep Link', () => {
  test('should select the namespace from the URL query param on load', async ({ page }) => {
    // Tests that a shared/bookmarked URL restores the namespace selection

    // Arrange & Act: Open a deep link with the namespace query param
    await page.goto('/pods?namespace=kube-system');
    await page.waitForLoadState('networkidle');

    // Assert: Selector shows the namespace from the URL
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelector).toContainText(/^kube-system$/i);

    // Assert: Pods page renders with the pre-selected scope
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();
  });

  test('should write the selected namespace to the URL query param', async ({ page }) => {
    // Tests that picking a namespace produces a shareable URL

    // Arrange: Navigate to home page with no query param
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Select "kube-system" from the dropdown
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();
    const kubeSystemOption = page.getByRole('option', { name: /^kube-system$/i })
      .or(page.getByTestId('namespace-option-kube-system'));
    await kubeSystemOption.click();

    // Assert: URL contains the namespace query param
    await expect(page).toHaveURL(/[?&]namespace=kube-system/);
  });

  test('should remove the namespace query param when "All Namespaces" is selected', async ({ page }) => {
    // Tests that the default scope keeps the URL clean

    // Arrange: Open a deep link with a namespace selected
    await page.goto('/pods?namespace=kube-system');
    await page.waitForLoadState('networkidle');

    // Act: Switch to "All Namespaces"
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();
    const allNamespacesOption = page.getByRole('option', { name: /all namespaces/i })
      .or(page.getByTestId('namespace-option-all'));
    await allNamespacesOption.click();

    // Assert: Selector shows "All Namespaces" and the param is gone
    await expect(namespaceSelector).toContainText(/all namespaces/i);
    await expect(page).not.toHaveURL(/[?&]namespace=/);
  });

  test('should keep the namespace query param in the URL when switching tabs', async ({ page }) => {
    // Tests that the URL stays a shareable deep link during in-app navigation

    // Arrange: Navigate to home page and select "kube-system"
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();
    const kubeSystemOption = page.getByRole('option', { name: /^kube-system$/i })
      .or(page.getByTestId('namespace-option-kube-system'));
    await kubeSystemOption.click();
    await expect(page).toHaveURL(/[?&]namespace=kube-system/);

    // Act: Navigate to Pods tab
    await page.getByTestId('tab-pods').click();
    await page.waitForLoadState('networkidle');

    // Assert: Path changes but the namespace param is restored
    await expect(page).toHaveURL(/\/pods\?.*namespace=kube-system/);

    // Act: Navigate to Workloads tab
    await page.getByTestId('tab-workloads').click();
    await page.waitForLoadState('networkidle');

    // Assert: Param follows the navigation again
    await expect(page).toHaveURL(/\/workloads\?.*namespace=kube-system/);

    // Assert: Selection is still applied
    await expect(namespaceSelector).toContainText(/^kube-system$/i);
  });

  test('should scope resource tabs to the namespace given in the URL', async ({ page }) => {
    // Tests that a deep link applies to data fetching, not just the selector UI

    // Arrange & Act: Open the Pods tab scoped to kube-system via deep link
    // (the backend pods API receives the namespace as its `ns` query param)
    const podsRequest = page.waitForRequest((request) =>
      request.url().includes('/api/pods') && request.url().includes('ns=kube-system')
    );
    await page.goto('/pods?namespace=kube-system');
    await page.waitForLoadState('networkidle');

    // Assert: The pods API was queried with the namespace from the URL
    await podsRequest;

    // Assert: Pods page is visible
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();
  });
});
