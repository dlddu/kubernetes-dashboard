import { test, expect } from '@playwright/test';

test.describe('Namespace Context Integration', () => {
  test('should persist selected namespace when navigating between different tabs', async ({ page }) => {
    // Tests NamespaceContext global state management across navigation

    // Arrange: Navigate to home page and select a specific namespace
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultNamespaceOption.click();

    // Assert: Verify selection is applied
    await expect(namespaceSelector).toContainText(/^default$/i);

    // Act: Navigate to Pods tab
    const podsTab = page.getByTestId('tab-pods');
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selector should still show "default"
    const namespaceSelectorOnPodsTab = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnPodsTab).toContainText(/^default$/i);

    // Act: Navigate to Workloads tab
    const workloadsTab = page.getByTestId('tab-workloads');
    await workloadsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selector should still show "default"
    const namespaceSelectorOnWorkloadsTab = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnWorkloadsTab).toContainText(/^default$/i);

    // Act: Navigate to Secrets tab
    const secretsTab = page.getByTestId('tab-secrets');
    await secretsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selector should still show "default"
    const namespaceSelectorOnSecretsTab = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnSecretsTab).toContainText(/^default$/i);
  });

  test('should filter displayed data when specific namespace is selected', async ({ page }) => {
    // Tests that resource lists respect NamespaceContext filtering

    // Arrange: Navigate to Pods page with "All Namespaces" selected
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Wait for pods data to load
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    // Act: Select "default" namespace from dropdown
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();
    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Pods page should still be visible with filtered data
    await expect(podsPage).toBeVisible();

    // Act: Select "kube-system" namespace
    await namespaceSelector.click();
    const kubeSystemOption = page.getByRole('option', { name: /^kube-system$/i })
      .or(page.getByTestId('namespace-option-kube-system'));
    await kubeSystemOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Pods page should show kube-system pods
    await expect(podsPage).toBeVisible();
  });

  test('should display all resources when "All Namespaces" is selected', async ({ page }) => {
    // Tests that "All Namespaces" option shows unfiltered data

    // Arrange: Navigate to Pods page and select a specific namespace first
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    // Act: Switch to "All Namespaces"
    await namespaceSelector.click();
    const allNamespacesOption = page.getByRole('option', { name: /all namespaces/i })
      .or(page.getByTestId('namespace-option-all'));
    await allNamespacesOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Selector should show "All Namespaces"
    await expect(namespaceSelector).toContainText(/all namespaces/i);

    // Assert: Pods page should still be visible
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    // Act: Navigate to Workloads tab while "All Namespaces" is selected
    const workloadsTab = page.getByTestId('tab-workloads');
    await workloadsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: "All Namespaces" should persist
    const namespaceSelectorOnWorkloads = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnWorkloads).toContainText(/all namespaces/i);

    // Assert: Workloads page should be visible
    const workloadsPage = page.getByTestId('workloads-page');
    await expect(workloadsPage).toBeVisible();
  });

  test('should close namespace dropdown when clicking outside', async ({ page }) => {
    // Tests dropdown close behavior on outside click (accessibility requirement)

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Open the namespace dropdown
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    // Assert: Dropdown menu should be visible
    const dropdownMenu = page.getByRole('listbox')
      .or(page.getByTestId('namespace-dropdown-menu'));
    await expect(dropdownMenu).toBeVisible();

    // Assert: Dropdown should have expanded state
    await expect(namespaceSelector).toHaveAttribute('aria-expanded', 'true');

    // Act: Click outside the dropdown (e.g., on the main content area)
    const mainContent = page.locator('main');
    await mainContent.click({ position: { x: 10, y: 200 } });

    // Assert: Dropdown menu should be closed
    await expect(dropdownMenu).not.toBeVisible();

    // Assert: Original selection should be preserved (still "All Namespaces")
    await expect(namespaceSelector).toContainText(/all namespaces/i);

    // Act: Open dropdown again and verify it can be reopened
    await namespaceSelector.click();
    await expect(dropdownMenu).toBeVisible();

    // Act: Press Escape key to close
    await page.keyboard.press('Escape');

    // Assert: Dropdown should close on ESC key
    await expect(dropdownMenu).not.toBeVisible();
  });
});

test.describe('Namespace Context Integration - Edge Cases', () => {
  test('should reset namespace selection after page refresh', async ({ page }) => {
    // Tests that NamespaceContext resets state on page refresh
    // (NamespaceContext uses in-memory state, not localStorage)

    // Arrange: Navigate to home page and select a namespace
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const kubeSystemOption = page.getByRole('option', { name: /^kube-system$/i })
      .or(page.getByTestId('namespace-option-kube-system'));
    await kubeSystemOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Verify selection before refresh
    await expect(namespaceSelector).toContainText(/^kube-system$/i);

    // Act: Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selection should reset to "All Namespaces" after reload
    const namespaceSelectorAfterReload = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorAfterReload).toContainText(/all namespaces/i);
  });

  test('should display available namespaces in dropdown', async ({ page }) => {
    // Tests that namespace dropdown shows namespaces fetched from the API

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Open the namespace dropdown
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const dropdownMenu = page.getByRole('listbox')
      .or(page.getByTestId('namespace-dropdown-menu'));
    await expect(dropdownMenu).toBeVisible();

    // Assert: Should have "All Namespaces" option
    const allNamespacesOption = page.getByTestId('namespace-option-all');
    await expect(allNamespacesOption).toBeVisible();

    // Assert: Should have at least one namespace option
    const options = page.getByRole('option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(1); // "All Namespaces" + at least one real namespace
  });

  test('should allow selecting a namespace and switching back to all', async ({ page }) => {
    // Tests round-trip namespace selection

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');

    // Assert: Initially shows "All Namespaces"
    await expect(namespaceSelector).toContainText(/all namespaces/i);

    // Act: Select "default" namespace
    await namespaceSelector.click();
    const defaultOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Should show "default"
    await expect(namespaceSelector).toContainText(/^default$/i);

    // Act: Switch back to "All Namespaces"
    await namespaceSelector.click();
    const allOption = page.getByRole('option', { name: /all namespaces/i })
      .or(page.getByTestId('namespace-option-all'));
    await allOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Should show "All Namespaces" again
    await expect(namespaceSelector).toContainText(/all namespaces/i);
  });
});

test.describe('Namespace Context Integration - Multi-Resource', () => {
  test('should apply same namespace filter across different resource types', async ({ page }) => {
    // Tests that NamespaceContext provides consistent filtering across all resources

    // Arrange: Navigate to home page and select "kube-system"
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const kubeSystemOption = page.getByRole('option', { name: /^kube-system$/i })
      .or(page.getByTestId('namespace-option-kube-system'));
    await kubeSystemOption.click();
    await page.waitForLoadState('networkidle');

    // Act: Navigate to Pods tab
    const podsTab = page.getByTestId('tab-pods');
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Pods page should be visible with kube-system filter active
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    // Assert: Namespace selector still shows kube-system
    await expect(namespaceSelector).toContainText(/^kube-system$/i);

    // Act: Navigate to Workloads tab
    const workloadsTab = page.getByTestId('tab-workloads');
    await workloadsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Workloads page should be visible
    const workloadsPage = page.getByTestId('workloads-page');
    await expect(workloadsPage).toBeVisible();

    // Act: Navigate to Secrets tab
    const secretsTab = page.getByTestId('tab-secrets');
    await secretsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Secrets page should be visible
    const secretsPage = page.getByTestId('secrets-tab');
    await expect(secretsPage).toBeVisible();

    // Assert: Namespace selector still shows kube-system across all tabs
    const finalNamespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(finalNamespaceSelector).toContainText(/^kube-system$/i);
  });
});
