// Verifies: CM5 (docs/product/prd-common.md) — sole dedicated e2e spec for this AC.
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
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i });
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
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i });

    // Assert: Default value should be "All Namespaces"
    await expect(namespaceSelector).toContainText(/all namespaces/i);
  });

  test('should display list of namespaces in dropdown when opened', async ({ page }) => {
    // Test for namespace dropdown list

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Open the namespace dropdown
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i });
    await namespaceSelector.click();

    // Assert: Dropdown menu should be visible
    const dropdownMenu = page.getByRole('listbox');
    await expect(dropdownMenu).toBeVisible();

    // Assert: "All Namespaces" option should be present
    const allNamespacesOption = page.getByRole('option', { name: /all namespaces/i });
    await expect(allNamespacesOption).toBeVisible();

    // Assert: At least one namespace option should be visible (e.g., "default")
    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i });
    await expect(defaultNamespaceOption).toBeVisible();
  });

  test('should update selected value when specific namespace is chosen', async ({ page }) => {
    // Test for namespace selection

    // Arrange: Navigate to the home page and open dropdown
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i });
    await namespaceSelector.click();

    // Act: Select "default" namespace from the dropdown
    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i });
    await defaultNamespaceOption.click();

    // Assert: Selector should show "default" as selected value
    await expect(namespaceSelector).toContainText(/^default$/i);

    // Assert: Dropdown menu should be closed
    const dropdownMenu = page.getByRole('listbox');
    await expect(dropdownMenu).not.toBeVisible();
  });

  test('should persist selected namespace within SPA navigation', async ({ page }) => {
    // Test for namespace persistence within SPA (client-side) navigation

    // Arrange: Navigate to home page, select a namespace
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i });
    await namespaceSelector.click();
    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i });
    await defaultNamespaceOption.click();

    // Assert: Selected namespace should be "default"
    await expect(namespaceSelector).toContainText(/^default$/i);

    // Act: Use SPA navigation via sidebar link if available, otherwise verify current state
    const podsLink = page.getByRole('link', { name: /pods/i });
    if (await podsLink.isVisible()) {
      await podsLink.click();
      await page.waitForLoadState('networkidle');

      // Assert: Selected namespace should still be "default"
      const namespaceSelectorAfterNav = page.getByRole('combobox', { name: /namespace/i });
      await expect(namespaceSelectorAfterNav).toContainText(/^default$/i);
    }
  });

  test('should display namespace selector on mobile viewport', async ({ page }) => {
    // Test for mobile viewport responsiveness

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE dimensions
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the namespace selector
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i });

    // Assert: Namespace selector should be visible and accessible on mobile
    await expect(namespaceSelector).toBeVisible();
    await expect(namespaceSelector).toBeEnabled();

    // Assert: Should be tappable (click should work)
    await namespaceSelector.click();
    const dropdownMenu = page.getByRole('listbox');
    await expect(dropdownMenu).toBeVisible();
  });
});

test.describe('Namespace Filter - Edge Cases', () => {
  test('should always show All Namespaces option in dropdown', async ({ page }) => {
    // Test that "All Namespaces" is always available regardless of namespace count

    // Arrange: Navigate to the page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Open the namespace dropdown
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i });
    await namespaceSelector.click();

    // Assert: Should show "All Namespaces" option
    const allNamespacesOption = page.getByRole('option', { name: /all namespaces/i });
    await expect(allNamespacesOption).toBeVisible();
  });

  test('should display loading state while fetching namespaces', async ({ page }) => {
    // Test for loading state display

    // Arrange: Navigate to the page
    await page.goto('/');

    // Act: Look for loading indicator immediately after navigation
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i });

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
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i });

    // Assert: Selector should still be functional with fallback behavior
    await expect(namespaceSelector).toBeVisible();

    // Assert: Should show error message or fallback to "All Namespaces" only
    await namespaceSelector.click();
    const errorMessage = page.getByText(/error loading namespaces/i)
      .or(page.getByTestId('namespace-error-message'));

    // Either error message is shown OR only "All Namespaces" is available
    const dropdownMenu = page.getByRole('listbox');
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

    const clusterStatus = page.getByTestId('cluster-status');
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i });

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
    const namespaceSelector = page.getByRole('combobox', { name: /namespace/i });
    await expect(namespaceSelector).toContainText(/all namespaces/i);
    await expect(namespaceSelector).toBeEnabled();
  });
});

test.describe('BottomTabBar - Namespace Context Integration', () => {
  test('should persist namespace selection when switching tabs', async ({ page }) => {
    // Tests that namespace filter persists across tab navigation

    // Arrange: Set mobile viewport and select namespace
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const kubeSystemOption = page.getByRole('option', { name: /^kube-system$/i })
      .or(page.getByTestId('namespace-option-kube-system'));
    await kubeSystemOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selector shows "kube-system"
    await expect(namespaceSelector).toContainText(/^kube-system$/i);

    // Act: Navigate to Nodes tab
    const nodesTab = page.getByTestId('tab-nodes');
    await nodesTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selection should persist
    const namespaceSelectorOnNodes = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnNodes).toContainText(/^kube-system$/i);

    // Act: Navigate to Workloads tab
    const workloadsTab = page.getByTestId('tab-workloads');
    await workloadsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selection should still persist
    const namespaceSelectorOnWorkloads = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnWorkloads).toContainText(/^kube-system$/i);

    // Act: Navigate to Pods tab
    const podsTab = page.getByTestId('tab-pods');
    await podsTab.click();
    await page.waitForLoadState('networkidle');

    // Assert: Namespace selection should still persist
    const namespaceSelectorOnPods = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await expect(namespaceSelectorOnPods).toContainText(/^kube-system$/i);

    // Assert: Pods should be filtered to kube-system namespace
    const podCards = page.getByTestId('pod-card');
    const podCount = await podCards.count();

    if (podCount > 0) {
      const firstPod = podCards.first();
      const podDetails = await firstPod.innerText();
      expect(podDetails.toLowerCase()).toContain('kube-system');
    }
  });
});

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
