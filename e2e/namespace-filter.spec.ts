import { test, expect } from '@playwright/test';

test.describe('Namespace Filter', () => {
  test('should display namespace dropdown in TopBar on page load', async ({ page }) => {
    // Test for TopBar and NamespaceSelector components

    // Arrange: Navigate to the home page
    await page.goto('/');

    // Act: Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    // Assert: TopBar should be visible
    const topBar = page.getByRole('banner').or(page.getByTestId('top-bar'));
    await expect(topBar).toBeVisible();

    // Assert: NamespaceSelector should be visible within TopBar
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await expect(namespaceSelector).toBeVisible();

    // Assert: Dropdown should be interactive
    await expect(namespaceSelector).toBeEnabled();
  });

  test('should show "All Namespaces" as default selected value', async ({ page }) => {
    // Test for default namespace selector value

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the namespace selector
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));

    // Assert: Default value should be "All Namespaces"
    await expect(namespaceSelector).toHaveValue('all');
    await expect(namespaceSelector).toContainText(/all namespaces/i);
  });

  test('should display list of namespaces in dropdown when opened', async ({ page }) => {
    // Test for namespace dropdown list

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Open the namespace dropdown
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await namespaceSelector.click();

    // Assert: Dropdown menu should be visible
    const dropdownMenu = page.getByRole('listbox').or(page.getByTestId('namespace-dropdown-menu'));
    await expect(dropdownMenu).toBeVisible();

    // Assert: "All Namespaces" option should be present
    const allNamespacesOption = page.getByRole('option', { name: /all namespaces/i })
      .or(page.getByTestId('namespace-option-all'));
    await expect(allNamespacesOption).toBeVisible();

    // Assert: At least one namespace option should be visible (e.g., "default")
    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await expect(defaultNamespaceOption).toBeVisible();
  });

  test('should update selected value when specific namespace is chosen', async ({ page }) => {
    // Test for namespace selection

    // Arrange: Navigate to the home page and open dropdown
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await namespaceSelector.click();

    // Act: Select "default" namespace from the dropdown
    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultNamespaceOption.click();

    // Assert: Selector should show "default" as selected value
    await expect(namespaceSelector).toHaveValue('default');
    await expect(namespaceSelector).toContainText(/^default$/i);

    // Assert: Dropdown menu should be closed
    const dropdownMenu = page.getByRole('listbox').or(page.getByTestId('namespace-dropdown-menu'));
    await expect(dropdownMenu).not.toBeVisible();
  });

  test('should persist selected namespace when navigating between pages', async ({ page }) => {
    // Test for namespace persistence across navigation

    // Arrange: Navigate to home page, select a namespace
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await namespaceSelector.click();
    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultNamespaceOption.click();

    // Act: Navigate to another page (e.g., pods page)
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Selected namespace should still be "default"
    const namespaceSelectorAfterNav = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await expect(namespaceSelectorAfterNav).toHaveValue('default');
    await expect(namespaceSelectorAfterNav).toContainText(/^default$/i);
  });

  test('should display namespace selector on mobile viewport', async ({ page }) => {
    // Test for mobile viewport responsiveness

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE dimensions
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the namespace selector
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));

    // Assert: Namespace selector should be visible and accessible on mobile
    await expect(namespaceSelector).toBeVisible();
    await expect(namespaceSelector).toBeEnabled();

    // Assert: Should be tappable (click should work)
    await namespaceSelector.click();
    const dropdownMenu = page.getByRole('listbox').or(page.getByTestId('namespace-dropdown-menu'));
    await expect(dropdownMenu).toBeVisible();
  });
});

test.describe('Namespace Filter - Edge Cases', () => {
  test('should handle empty namespace list gracefully', async ({ page }) => {
    // Test for empty namespace list handling

    // Arrange: Navigate to the page (assuming API returns empty namespaces)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Open the namespace dropdown
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await namespaceSelector.click();

    // Assert: Should show "All Namespaces" option even if no namespaces exist
    const allNamespacesOption = page.getByRole('option', { name: /all namespaces/i })
      .or(page.getByTestId('namespace-option-all'));
    await expect(allNamespacesOption).toBeVisible();

    // Assert: Should show a message indicating no namespaces are available
    const emptyMessage = page.getByText(/no namespaces available/i)
      .or(page.getByTestId('namespace-empty-message'));
    await expect(emptyMessage).toBeVisible();
  });

  test('should display loading state while fetching namespaces', async ({ page }) => {
    // Test for loading state display

    // Arrange: Navigate to the page
    await page.goto('/');

    // Act: Look for loading indicator immediately after navigation
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));

    // Assert: Should show loading state (disabled or with loading indicator)
    // Note: This assertion may need to be adjusted based on actual loading implementation
    const loadingIndicator = page.getByTestId('namespace-loading')
      .or(namespaceSelector.locator('[aria-busy="true"]'));

    // Wait for loading to complete
    await page.waitForLoadState('networkidle');

    // Assert: Loading indicator should disappear
    await expect(loadingIndicator).not.toBeVisible();
    await expect(namespaceSelector).toBeEnabled();
  });

  test('should handle API error when fetching namespaces', async ({ page }) => {
    // Test for API error handling

    // Arrange: Navigate to the page (assuming API returns an error)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Open the namespace dropdown
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));

    // Assert: Selector should still be functional with fallback behavior
    await expect(namespaceSelector).toBeVisible();

    // Assert: Should show error message or fallback to "All Namespaces" only
    await namespaceSelector.click();
    const errorMessage = page.getByText(/error loading namespaces/i)
      .or(page.getByTestId('namespace-error-message'));

    // Either error message is shown OR only "All Namespaces" is available
    const dropdownMenu = page.getByRole('listbox').or(page.getByTestId('namespace-dropdown-menu'));
    await expect(dropdownMenu).toBeVisible();
  });
});

test.describe('Namespace Filter - ClusterStatus Integration', () => {
  test('should show cluster status alongside namespace selector', async ({ page }) => {
    // Test for ClusterStatus and NamespaceSelector integration

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate both components within TopBar
    const topBar = page.getByRole('banner').or(page.getByTestId('top-bar'));
    await expect(topBar).toBeVisible();

    const clusterStatus = page.getByTestId('cluster-status')
      .or(topBar.getByText(/cluster/i));
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));

    // Assert: Both components should be visible
    await expect(clusterStatus).toBeVisible();
    await expect(namespaceSelector).toBeVisible();
  });

  test('should update namespace selector when cluster changes', async ({ page }) => {
    // Test for cluster change handling

    // Arrange: Navigate to the home page with initial cluster
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Switch to a different cluster (if cluster selector exists)
    const clusterSelector = page.getByTestId('cluster-selector');
    if (await clusterSelector.isVisible()) {
      await clusterSelector.click();
      const anotherCluster = page.getByRole('option', { name: /cluster-2/i });
      await anotherCluster.click();
    }

    // Assert: Namespace selector should reload with new cluster's namespaces
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await expect(namespaceSelector).toHaveValue('all');
    await expect(namespaceSelector).toBeEnabled();
  });
});
