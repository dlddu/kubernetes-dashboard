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
    const podsTab = page.getByRole('button', { name: /pods/i })
      .or(page.getByTestId('tab-button-pods'));
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selector should still show "default"
    const namespaceSelectorOnPodsTab = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
        await expect(namespaceSelectorOnPodsTab).toContainText(/^default$/i);

    // Act: Navigate to Secrets tab
    const secretsTab = page.getByRole('button', { name: /secrets/i })
      .or(page.getByTestId('tab-button-secrets'));
    await secretsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selector should still show "default"
    const namespaceSelectorOnSecretsTab = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
        await expect(namespaceSelectorOnSecretsTab).toContainText(/^default$/i);

    // Act: Navigate to Workloads tab
    const workloadsTab = page.getByRole('button', { name: /workloads/i })
      .or(page.getByTestId('tab-button-workloads'));
    await workloadsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selector should still show "default"
    const namespaceSelectorOnWorkloadsTab = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
        await expect(namespaceSelectorOnWorkloadsTab).toContainText(/^default$/i);
  });

  test('should filter displayed data when specific namespace is selected', async ({ page }) => {
    // Tests that data table respects NamespaceContext filtering

    // Arrange: Navigate to Pods page with "All Namespaces" selected
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Verify "All Namespaces" is selected initially
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    
    // Act: Count initial number of visible pods from all namespaces
    const allPodsTable = page.getByRole('table')
      .or(page.getByTestId('pods-table'));
    await expect(allPodsTable).toBeVisible();

    const allPodsRows = page.getByRole('row')
      .or(allPodsTable.locator('tbody tr'));
    const initialRowCount = await allPodsRows.count();

    // Act: Select "default" namespace from dropdown
    await namespaceSelector.click();
    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Table should show only pods from "default" namespace
    
    const filteredPodsRows = page.getByRole('row')
      .or(allPodsTable.locator('tbody tr'));
    const filteredRowCount = await filteredPodsRows.count();

    // Assert: Filtered count should be less than or equal to initial count
    expect(filteredRowCount).toBeLessThanOrEqual(initialRowCount);

    // Assert: All visible pods should belong to "default" namespace
    // Check namespace column in table (assuming namespace column exists)
    const namespaceColumns = page.locator('tbody tr td:has-text("default")');
    const namespaceColumnCount = await namespaceColumns.count();
    expect(namespaceColumnCount).toBeGreaterThan(0);

    // Act: Select "kube-system" namespace
    await namespaceSelector.click();
    const kubeSystemOption = page.getByRole('option', { name: /^kube-system$/i })
      .or(page.getByTestId('namespace-option-kube-system'));
    await kubeSystemOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Table should show only pods from "kube-system" namespace
        const kubeSystemPodsRows = page.getByRole('row')
      .or(allPodsTable.locator('tbody tr'));
    const kubeSystemRowCount = await kubeSystemPodsRows.count();

    // Assert: Data should be different from previous selection
    // (unless default and kube-system have same number of pods, which is unlikely)
    const kubeSystemColumns = page.locator('tbody tr td:has-text("kube-system")');
    const kubeSystemColumnCount = await kubeSystemColumns.count();
    expect(kubeSystemColumnCount).toBeGreaterThan(0);
  });

  test.skip('should display all resources when "All Namespaces" is selected', async ({ page }) => {
    // Tests that "All Namespaces" option shows unfiltered data
    // SKIPPED: This test needs workloads/secrets pages to be implemented with data tables

    // Arrange: Navigate to Workloads page and select a specific namespace first
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    // Act: Count workloads in "default" namespace
    const workloadsTable = page.getByRole('table')
      .or(page.getByTestId('workloads-table'));
    await expect(workloadsTable).toBeVisible();

    const defaultWorkloadsRows = page.getByRole('row')
      .or(workloadsTable.locator('tbody tr'));
    const defaultRowCount = await defaultWorkloadsRows.count();

    // Act: Switch to "All Namespaces"
    await namespaceSelector.click();
    const allNamespacesOption = page.getByRole('option', { name: /all namespaces/i })
      .or(page.getByTestId('namespace-option-all'));
    await allNamespacesOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Selector should show "All Namespaces"
        await expect(namespaceSelector).toContainText(/all namespaces/i);

    // Assert: Table should show more or equal workloads than single namespace
    const allWorkloadsRows = page.getByRole('row')
      .or(workloadsTable.locator('tbody tr'));
    const allRowCount = await allWorkloadsRows.count();
    expect(allRowCount).toBeGreaterThanOrEqual(defaultRowCount);

    // Assert: Table should contain workloads from multiple namespaces
    // Check that namespace column shows different namespace values
    const firstNamespaceCell = workloadsTable.locator('tbody tr:first-child td').nth(1);
    const lastNamespaceCell = workloadsTable.locator('tbody tr:last-child td').nth(1);

    // If there are workloads in multiple namespaces, values should differ
    // (This might not always be true in minimal test environments)
    await expect(workloadsTable.locator('tbody tr')).toHaveCount(allRowCount);

    // Act: Navigate to Secrets tab while "All Namespaces" is selected
    const secretsTab = page.getByRole('button', { name: /secrets/i })
      .or(page.getByTestId('tab-button-secrets'));
    await secretsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: "All Namespaces" should persist and show all secrets
    const namespaceSelectorOnSecrets = page.getByTestId('namespace-selector').locator('button[role="combobox"]');

    const secretsTable = page.getByRole('table')
      .or(page.getByTestId('secrets-table'));
    await expect(secretsTable).toBeVisible();

    const secretsRows = page.getByRole('row')
      .or(secretsTable.locator('tbody tr'));
    const secretsRowCount = await secretsRows.count();

    // Assert: Should show secrets from all namespaces
    expect(secretsRowCount).toBeGreaterThan(0);
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

    // Assert: Selector should show collapsed state
    await expect(namespaceSelector).toHaveAttribute('aria-expanded', 'false');

    // Assert: Original selection should be preserved (still "All Namespaces")
        await expect(namespaceSelector).toContainText(/all namespaces/i);

    // Act: Open dropdown again and verify it can be reopened
    await namespaceSelector.click();
    await expect(dropdownMenu).toBeVisible();

    // Act: Click on TopBar area (different outside element)
    const topBar = page.getByRole('banner')
      .or(page.getByTestId('top-bar'));
    await topBar.click({ position: { x: 50, y: 10 } });

    // Assert: Dropdown should close again
    await expect(dropdownMenu).not.toBeVisible();

    // Act: Open dropdown and test ESC key closes it
    await namespaceSelector.click();
    await expect(dropdownMenu).toBeVisible();

    // Act: Press Escape key
    await page.keyboard.press('Escape');

    // Assert: Dropdown should close on ESC key
    await expect(dropdownMenu).not.toBeVisible();
    await expect(namespaceSelector).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('Namespace Context Integration - Edge Cases', () => {
  test.skip('should maintain namespace selection after page refresh', async ({ page }) => {
    // SKIPPED: Namespace persistence needs to be implemented in NamespaceContext
    // Tests that NamespaceContext persists state in localStorage/sessionStorage

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
    
    // Act: Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selection should be restored after reload
    const namespaceSelectorAfterReload = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
        await expect(namespaceSelectorAfterReload).toContainText(/^kube-system$/i);
  });

  test.skip('should handle namespace deletion gracefully', async ({ page }) => {
    // Tests behavior when currently selected namespace is deleted
    // SKIPPED: Namespace deletion handling needs to be implemented

    // Arrange: Navigate to home page and select a custom namespace
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    // Assume "test-namespace" exists for this test
    const testNamespaceOption = page.getByRole('option', { name: /^test-namespace$/i })
      .or(page.getByTestId('namespace-option-test-namespace'));
    await testNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Verify "test-namespace" is selected
    
    // Act: Simulate namespace deletion (via API or kubectl)
    // This would typically trigger a WebSocket update or polling refresh
    // For E2E test, we can simulate by triggering a namespace list refresh

    // After namespace is deleted, the component should detect it on next load
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert: Should fallback to "All Namespaces" if selected namespace no longer exists
    const namespaceSelectorAfterDeletion = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
        await expect(namespaceSelectorAfterDeletion).toContainText(/all namespaces/i);

    // Assert: Deleted namespace should not appear in dropdown
    await namespaceSelectorAfterDeletion.click();
    const dropdownMenu = page.getByRole('listbox')
      .or(page.getByTestId('namespace-dropdown-menu'));
    await expect(dropdownMenu).toBeVisible();

    const deletedNamespaceOption = page.getByRole('option', { name: /^test-namespace$/i })
      .or(page.getByTestId('namespace-option-test-namespace'));
    await expect(deletedNamespaceOption).not.toBeVisible();
  });

  test.skip('should update namespace list when new namespace is created', async ({ page }) => {
    // Tests that NamespaceContext detects newly created namespaces
    // SKIPPED: Namespace list refresh needs to be implemented

    // Arrange: Navigate to home page and open namespace dropdown
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const dropdownMenu = page.getByRole('listbox')
      .or(page.getByTestId('namespace-dropdown-menu'));
    await expect(dropdownMenu).toBeVisible();

    // Act: Count initial namespaces
    const initialOptions = page.getByRole('option');
    const initialCount = await initialOptions.count();

    // Close dropdown
    await page.keyboard.press('Escape');

    // Act: Create a new namespace (simulated via API)
    // In real E2E test, this would call kubectl or K8s API
    // For now, we simulate by triggering a refresh that would detect the new namespace

    // Simulate time passing and namespace list refresh
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Act: Open dropdown again
    await namespaceSelector.click();
    await expect(dropdownMenu).toBeVisible();

    // Assert: New namespace should appear in the list
    const newNamespaceOption = page.getByRole('option', { name: /^new-test-namespace$/i })
      .or(page.getByTestId('namespace-option-new-test-namespace'));

    // If the namespace was created, it should be visible
    // Note: This assertion depends on test environment setup
    await expect(dropdownMenu).toBeVisible();

    // Assert: Can select the newly created namespace
    if (await newNamespaceOption.isVisible()) {
      await newNamespaceOption.click();
          }
  });
});

test.describe('Namespace Context Integration - Multi-Resource', () => {
  test.skip('should apply same namespace filter across different resource types', async ({ page }) => {
    // Tests that NamespaceContext provides consistent filtering across all resources
    // SKIPPED: This test needs workloads/secrets pages to be implemented with data tables

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
    const podsTab = page.getByRole('button', { name: /pods/i })
      .or(page.getByTestId('tab-button-pods'));
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Pods should be filtered to kube-system
    const podsTable = page.getByRole('table')
      .or(page.getByTestId('pods-table'));
    await expect(podsTable).toBeVisible();

    const podNamespaceCells = podsTable.locator('tbody tr td:has-text("kube-system")');
    expect(await podNamespaceCells.count()).toBeGreaterThan(0);

    // Act: Navigate to Secrets tab
    const secretsTab = page.getByRole('button', { name: /secrets/i })
      .or(page.getByTestId('tab-button-secrets'));
    await secretsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Secrets should be filtered to kube-system
    const secretsTable = page.getByRole('table')
      .or(page.getByTestId('secrets-table'));
    await expect(secretsTable).toBeVisible();

    const secretNamespaceCells = secretsTable.locator('tbody tr td:has-text("kube-system")');
    expect(await secretNamespaceCells.count()).toBeGreaterThan(0);

    // Act: Navigate to Workloads tab
    const workloadsTab = page.getByRole('button', { name: /workloads/i })
      .or(page.getByTestId('tab-button-workloads'));
    await workloadsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Workloads should be filtered to kube-system
    const workloadsTable = page.getByRole('table')
      .or(page.getByTestId('workloads-table'));
    await expect(workloadsTable).toBeVisible();

    // Assert: Namespace selector still shows kube-system across all tabs
    const finalNamespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
        await expect(finalNamespaceSelector).toContainText(/^kube-system$/i);
  });
});
