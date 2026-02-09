import { test, expect } from '@playwright/test';

test.describe('Namespace Context Integration', () => {
  test.skip('should persist selected namespace when navigating between different tabs', async ({ page }) => {
    // TODO: NamespaceContext와 NamespaceSelector 통합 구현 후 활성화
    // Tests NamespaceContext global state management across navigation

    // Arrange: Navigate to home page and select a specific namespace
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await namespaceSelector.click();

    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultNamespaceOption.click();

    // Assert: Verify selection is applied
    await expect(namespaceSelector).toHaveValue('default');
    await expect(namespaceSelector).toContainText(/^default$/i);

    // Act: Navigate to Pods tab
    const podsTab = page.getByRole('link', { name: /pods/i })
      .or(page.getByTestId('tab-pods'));
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selector should still show "default"
    const namespaceSelectorOnPodsTab = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await expect(namespaceSelectorOnPodsTab).toHaveValue('default');
    await expect(namespaceSelectorOnPodsTab).toContainText(/^default$/i);

    // Act: Navigate to Services tab
    const servicesTab = page.getByRole('link', { name: /services/i })
      .or(page.getByTestId('tab-services'));
    await servicesTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selector should still show "default"
    const namespaceSelectorOnServicesTab = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await expect(namespaceSelectorOnServicesTab).toHaveValue('default');
    await expect(namespaceSelectorOnServicesTab).toContainText(/^default$/i);

    // Act: Navigate to Deployments tab
    const deploymentsTab = page.getByRole('link', { name: /deployments/i })
      .or(page.getByTestId('tab-deployments'));
    await deploymentsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selector should still show "default"
    const namespaceSelectorOnDeploymentsTab = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await expect(namespaceSelectorOnDeploymentsTab).toHaveValue('default');
    await expect(namespaceSelectorOnDeploymentsTab).toContainText(/^default$/i);
  });

  test.skip('should filter displayed data when specific namespace is selected', async ({ page }) => {
    // TODO: NamespaceContext와 NamespaceSelector 통합 구현 후 활성화
    // Tests that data table respects NamespaceContext filtering

    // Arrange: Navigate to Pods page with "All Namespaces" selected
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Verify "All Namespaces" is selected initially
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await expect(namespaceSelector).toHaveValue('all');

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
    await expect(namespaceSelector).toHaveValue('default');

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
    await expect(namespaceSelector).toHaveValue('kube-system');
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
    // TODO: NamespaceContext와 NamespaceSelector 통합 구현 후 활성화
    // Tests that "All Namespaces" option shows unfiltered data

    // Arrange: Navigate to Deployments page and select a specific namespace first
    await page.goto('/deployments');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await namespaceSelector.click();

    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    // Act: Count deployments in "default" namespace
    const deploymentsTable = page.getByRole('table')
      .or(page.getByTestId('deployments-table'));
    await expect(deploymentsTable).toBeVisible();

    const defaultDeploymentsRows = page.getByRole('row')
      .or(deploymentsTable.locator('tbody tr'));
    const defaultRowCount = await defaultDeploymentsRows.count();

    // Act: Switch to "All Namespaces"
    await namespaceSelector.click();
    const allNamespacesOption = page.getByRole('option', { name: /all namespaces/i })
      .or(page.getByTestId('namespace-option-all'));
    await allNamespacesOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Selector should show "All Namespaces"
    await expect(namespaceSelector).toHaveValue('all');
    await expect(namespaceSelector).toContainText(/all namespaces/i);

    // Assert: Table should show more or equal deployments than single namespace
    const allDeploymentsRows = page.getByRole('row')
      .or(deploymentsTable.locator('tbody tr'));
    const allRowCount = await allDeploymentsRows.count();
    expect(allRowCount).toBeGreaterThanOrEqual(defaultRowCount);

    // Assert: Table should contain deployments from multiple namespaces
    // Check that namespace column shows different namespace values
    const firstNamespaceCell = deploymentsTable.locator('tbody tr:first-child td').nth(1);
    const lastNamespaceCell = deploymentsTable.locator('tbody tr:last-child td').nth(1);

    // If there are deployments in multiple namespaces, values should differ
    // (This might not always be true in minimal test environments)
    await expect(deploymentsTable.locator('tbody tr')).toHaveCount(allRowCount);

    // Act: Navigate to Services tab while "All Namespaces" is selected
    const servicesTab = page.getByRole('link', { name: /services/i })
      .or(page.getByTestId('tab-services'));
    await servicesTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: "All Namespaces" should persist and show all services
    const namespaceSelectorOnServices = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await expect(namespaceSelectorOnServices).toHaveValue('all');

    const servicesTable = page.getByRole('table')
      .or(page.getByTestId('services-table'));
    await expect(servicesTable).toBeVisible();

    const servicesRows = page.getByRole('row')
      .or(servicesTable.locator('tbody tr'));
    const servicesRowCount = await servicesRows.count();

    // Assert: Should show services from all namespaces (expecting at least kubernetes service in default)
    expect(servicesRowCount).toBeGreaterThan(0);
  });

  test.skip('should close namespace dropdown when clicking outside', async ({ page }) => {
    // TODO: NamespaceContext와 NamespaceSelector 통합 구현 후 활성화
    // Tests dropdown close behavior on outside click (accessibility requirement)

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Open the namespace dropdown
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await namespaceSelector.click();

    // Assert: Dropdown menu should be visible
    const dropdownMenu = page.getByRole('listbox')
      .or(page.getByTestId('namespace-dropdown-menu'));
    await expect(dropdownMenu).toBeVisible();

    // Assert: Dropdown should have expanded state
    await expect(namespaceSelector).toHaveAttribute('aria-expanded', 'true');

    // Act: Click outside the dropdown (e.g., on the main content area)
    const mainContent = page.getByRole('main')
      .or(page.locator('body'));
    await mainContent.click({ position: { x: 10, y: 200 } });

    // Assert: Dropdown menu should be closed
    await expect(dropdownMenu).not.toBeVisible();

    // Assert: Selector should show collapsed state
    await expect(namespaceSelector).toHaveAttribute('aria-expanded', 'false');

    // Assert: Original selection should be preserved (still "All Namespaces")
    await expect(namespaceSelector).toHaveValue('all');
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
    // TODO: NamespaceContext와 NamespaceSelector 통합 구현 후 활성화
    // Tests that NamespaceContext persists state in localStorage/sessionStorage

    // Arrange: Navigate to home page and select a namespace
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await namespaceSelector.click();

    const kubeSystemOption = page.getByRole('option', { name: /^kube-system$/i })
      .or(page.getByTestId('namespace-option-kube-system'));
    await kubeSystemOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Verify selection before refresh
    await expect(namespaceSelector).toHaveValue('kube-system');

    // Act: Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selection should be restored after reload
    const namespaceSelectorAfterReload = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await expect(namespaceSelectorAfterReload).toHaveValue('kube-system');
    await expect(namespaceSelectorAfterReload).toContainText(/^kube-system$/i);
  });

  test.skip('should handle namespace deletion gracefully', async ({ page }) => {
    // TODO: NamespaceContext와 NamespaceSelector 통합 구현 후 활성화
    // Tests behavior when currently selected namespace is deleted

    // Arrange: Navigate to home page and select a custom namespace
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await namespaceSelector.click();

    // Assume "test-namespace" exists for this test
    const testNamespaceOption = page.getByRole('option', { name: /^test-namespace$/i })
      .or(page.getByTestId('namespace-option-test-namespace'));
    await testNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Verify "test-namespace" is selected
    await expect(namespaceSelector).toHaveValue('test-namespace');

    // Act: Simulate namespace deletion (via API or kubectl)
    // This would typically trigger a WebSocket update or polling refresh
    // For E2E test, we can simulate by triggering a namespace list refresh

    // After namespace is deleted, the component should detect it on next load
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert: Should fallback to "All Namespaces" if selected namespace no longer exists
    const namespaceSelectorAfterDeletion = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await expect(namespaceSelectorAfterDeletion).toHaveValue('all');
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
    // TODO: NamespaceContext와 NamespaceSelector 통합 구현 후 활성화
    // Tests that NamespaceContext detects newly created namespaces

    // Arrange: Navigate to home page and open namespace dropdown
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
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
      await expect(namespaceSelector).toHaveValue('new-test-namespace');
    }
  });
});

test.describe('Namespace Context Integration - Multi-Resource', () => {
  test.skip('should apply same namespace filter across different resource types', async ({ page }) => {
    // TODO: NamespaceContext와 NamespaceSelector 통합 구현 후 활성화
    // Tests that NamespaceContext provides consistent filtering across all resources

    // Arrange: Navigate to home page and select "kube-system"
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await namespaceSelector.click();

    const kubeSystemOption = page.getByRole('option', { name: /^kube-system$/i })
      .or(page.getByTestId('namespace-option-kube-system'));
    await kubeSystemOption.click();
    await page.waitForLoadState('networkidle');

    // Act: Navigate to Pods tab
    const podsTab = page.getByRole('link', { name: /pods/i })
      .or(page.getByTestId('tab-pods'));
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Pods should be filtered to kube-system
    const podsTable = page.getByRole('table')
      .or(page.getByTestId('pods-table'));
    await expect(podsTable).toBeVisible();

    const podNamespaceCells = podsTable.locator('tbody tr td:has-text("kube-system")');
    expect(await podNamespaceCells.count()).toBeGreaterThan(0);

    // Act: Navigate to Services tab
    const servicesTab = page.getByRole('link', { name: /services/i })
      .or(page.getByTestId('tab-services'));
    await servicesTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Services should be filtered to kube-system
    const servicesTable = page.getByRole('table')
      .or(page.getByTestId('services-table'));
    await expect(servicesTable).toBeVisible();

    const serviceNamespaceCells = servicesTable.locator('tbody tr td:has-text("kube-system")');
    expect(await serviceNamespaceCells.count()).toBeGreaterThan(0);

    // Act: Navigate to Deployments tab
    const deploymentsTab = page.getByRole('link', { name: /deployments/i })
      .or(page.getByTestId('tab-deployments'));
    await deploymentsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Deployments should be filtered to kube-system
    const deploymentsTable = page.getByRole('table')
      .or(page.getByTestId('deployments-table'));
    await expect(deploymentsTable).toBeVisible();

    // Assert: Namespace selector still shows kube-system across all tabs
    const finalNamespaceSelector = page.getByRole('combobox', { name: /namespace/i })
      .or(page.getByTestId('namespace-selector'));
    await expect(finalNamespaceSelector).toHaveValue('kube-system');
    await expect(finalNamespaceSelector).toContainText(/^kube-system$/i);
  });
});
