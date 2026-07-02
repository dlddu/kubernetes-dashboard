import { test, expect } from '@playwright/test';

test.describe('Namespace URL Deep Link', () => {
  test('should select the namespace from the /namespaces/<ns> path segment on load', async ({ page }) => {
    // Tests that a shared/bookmarked kube-style URL restores the namespace selection

    // Arrange & Act: Open a deep link with the namespace path segment
    await page.goto('/namespaces/kube-system/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Selector shows the namespace from the URL
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelector).toContainText(/^kube-system$/i);

    // Assert: Pods page renders with the pre-selected scope
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();
  });

  test('should rewrite the path to /namespaces/<ns> when a namespace is selected', async ({ page }) => {
    // Tests that picking a namespace produces a shareable URL

    // Arrange: Navigate to the overview with no namespace segment
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Select "kube-system" from the dropdown
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();
    const kubeSystemOption = page.getByRole('option', { name: /^kube-system$/i })
      .or(page.getByTestId('namespace-option-kube-system'));
    await kubeSystemOption.click();

    // Assert: URL carries the namespace as a path segment (kube API style)
    await expect(page).toHaveURL(/\/namespaces\/kube-system$/);
  });

  test('should drop the namespace segment when "All Namespaces" is selected', async ({ page }) => {
    // Tests that the default scope keeps the URL clean

    // Arrange: Open a deep link with a namespace selected
    await page.goto('/namespaces/kube-system/pods');
    await page.waitForLoadState('networkidle');

    // Act: Switch to "All Namespaces"
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();
    const allNamespacesOption = page.getByRole('option', { name: /all namespaces/i })
      .or(page.getByTestId('namespace-option-all'));
    await allNamespacesOption.click();

    // Assert: Selector shows "All Namespaces" and the segment is gone
    await expect(namespaceSelector).toContainText(/all namespaces/i);
    await expect(page).toHaveURL(/\/pods$/);
  });

  test('should keep the namespace segment in the URL when switching tabs', async ({ page }) => {
    // Tests that the URL stays a shareable deep link during in-app navigation

    // Arrange: Open the Pods tab scoped to kube-system
    await page.goto('/namespaces/kube-system/pods');
    await page.waitForLoadState('networkidle');

    // Act: Navigate to Workloads tab
    await page.getByTestId('tab-workloads').click();
    await page.waitForLoadState('networkidle');

    // Assert: The namespace segment follows the navigation
    await expect(page).toHaveURL(/\/namespaces\/kube-system\/workloads$/);

    // Act: Navigate to Secrets tab
    await page.getByTestId('tab-secrets').click();
    await page.waitForLoadState('networkidle');

    // Assert: Segment follows again and the selection is still applied
    await expect(page).toHaveURL(/\/namespaces\/kube-system\/secrets$/);
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelector).toContainText(/^kube-system$/i);
  });

  test('should keep cluster-scoped tabs unprefixed while preserving the selection', async ({ page }) => {
    // Tests kube API server semantics: nodes are not namespaced

    // Arrange: Open the Pods tab scoped to kube-system
    await page.goto('/namespaces/kube-system/pods');
    await page.waitForLoadState('networkidle');

    // Act: Navigate to the cluster-scoped Nodes tab
    await page.getByTestId('tab-nodes').click();
    await page.waitForLoadState('networkidle');

    // Assert: No namespace segment on /nodes, but the selection is kept
    await expect(page).toHaveURL(/\/nodes$/);
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelector).toContainText(/^kube-system$/i);

    // Act: Return to a namespaced tab
    await page.getByTestId('tab-pods').click();
    await page.waitForLoadState('networkidle');

    // Assert: The deep link picks the selection up again
    await expect(page).toHaveURL(/\/namespaces\/kube-system\/pods$/);
  });

  test('should scope resource tabs to the namespace given in the URL', async ({ page }) => {
    // Tests that a deep link applies to data fetching, not just the selector UI

    // Arrange & Act: Open the Pods tab scoped to kube-system via deep link
    // (the backend pods API receives the namespace as its `ns` query param)
    const podsRequest = page.waitForRequest((request) =>
      request.url().includes('/api/pods') && request.url().includes('ns=kube-system')
    );
    await page.goto('/namespaces/kube-system/pods');
    await page.waitForLoadState('networkidle');

    // Assert: The pods API was queried with the namespace from the URL
    await podsRequest;

    // Assert: Pods page is visible
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();
  });
});
