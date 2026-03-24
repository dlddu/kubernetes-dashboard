import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Pod Cleanup Feature
 *
 * These tests verify the behavior of the pod cleanup functionality,
 * which allows users to delete all pods in terminal states
 * (Failed, Succeeded, Error, Completed, OOMKilled).
 *
 * Test Fixtures:
 * - unhealthy-pod.yaml: 4 unhealthy pods in dashboard-test namespace (ImagePullBackOff)
 * - These pods are NOT cleanup targets (ImagePullBackOff is a waiting state, not terminal)
 *
 * The cleanup button visibility depends on whether there are pods in terminal states
 * (Failed, Succeeded, Error, Completed, OOMKilled) in the cluster.
 */

test.describe('Pod Cleanup - Button Visibility', () => {
  test('should not show cleanup button when no terminal pods exist', async ({ page }) => {
    // Arrange: Mock API to return only running pods (no cleanup targets)
    await page.route('**/api/pods/all*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            name: 'running-pod-1',
            namespace: 'default',
            status: 'Running',
            restarts: 0,
            node: 'node-1',
            age: '2h',
            containers: ['app'],
            initContainers: [],
          },
        ]),
      });
    });

    // Act: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Cleanup button should NOT be visible
    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await expect(cleanupButton).not.toBeVisible();
  });

  test('should show cleanup button when failed pods exist', async ({ page }) => {
    // Arrange: Mock API to return pods with a failed pod
    await page.route('**/api/pods/all*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            name: 'running-pod-1',
            namespace: 'default',
            status: 'Running',
            restarts: 0,
            node: 'node-1',
            age: '2h',
            containers: ['app'],
            initContainers: [],
          },
          {
            name: 'failed-pod-1',
            namespace: 'default',
            status: 'Failed',
            restarts: 3,
            node: 'node-1',
            age: '1h',
            containers: ['app'],
            initContainers: [],
          },
        ]),
      });
    });

    // Act: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Cleanup button should be visible with count
    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await expect(cleanupButton).toBeVisible();
    await expect(cleanupButton).toContainText('1');
  });

  test('should show correct count for multiple cleanup target pods', async ({ page }) => {
    // Arrange: Mock API to return pods with multiple terminal states
    await page.route('**/api/pods/all*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            name: 'running-pod',
            namespace: 'default',
            status: 'Running',
            restarts: 0,
            node: 'node-1',
            age: '2h',
            containers: ['app'],
            initContainers: [],
          },
          {
            name: 'failed-pod',
            namespace: 'default',
            status: 'Failed',
            restarts: 3,
            node: 'node-1',
            age: '1h',
            containers: ['app'],
            initContainers: [],
          },
          {
            name: 'succeeded-pod',
            namespace: 'default',
            status: 'Succeeded',
            restarts: 0,
            node: 'node-1',
            age: '30m',
            containers: ['job'],
            initContainers: [],
          },
          {
            name: 'error-pod',
            namespace: 'default',
            status: 'Error',
            restarts: 5,
            node: 'node-1',
            age: '45m',
            containers: ['app'],
            initContainers: [],
          },
        ]),
      });
    });

    // Act: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Cleanup button should show count of 3 (failed + succeeded + error)
    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await expect(cleanupButton).toBeVisible();
    await expect(cleanupButton).toContainText('3');
  });
});

test.describe('Pod Cleanup - Confirmation Dialog', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API to return pods with cleanup targets
    await page.route('**/api/pods/all*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            name: 'running-pod',
            namespace: 'default',
            status: 'Running',
            restarts: 0,
            node: 'node-1',
            age: '2h',
            containers: ['app'],
            initContainers: [],
          },
          {
            name: 'failed-pod',
            namespace: 'default',
            status: 'Failed',
            restarts: 3,
            node: 'node-1',
            age: '1h',
            containers: ['app'],
            initContainers: [],
          },
          {
            name: 'succeeded-pod',
            namespace: 'default',
            status: 'Succeeded',
            restarts: 0,
            node: 'node-1',
            age: '30m',
            containers: ['job'],
            initContainers: [],
          },
        ]),
      });
    });
  });

  test('should show confirmation dialog when cleanup button is clicked', async ({ page }) => {
    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Click the cleanup button
    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await cleanupButton.click();

    // Assert: Confirmation dialog should be visible
    const confirmDialog = page.getByTestId('cleanup-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Assert: Dialog should have role="dialog"
    const dialogRole = await confirmDialog.getAttribute('role');
    expect(dialogRole).toBe('dialog');

    // Assert: Dialog should have aria-modal="true"
    const ariaModal = await confirmDialog.getAttribute('aria-modal');
    expect(ariaModal).toBe('true');
  });

  test('should display Confirm and Cancel buttons in dialog', async ({ page }) => {
    // Arrange: Navigate to the Pods page and open dialog
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await cleanupButton.click();

    const confirmDialog = page.getByTestId('cleanup-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Assert: Confirm button should be visible
    const confirmButton = confirmDialog.getByTestId('confirm-button');
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled();
    await expect(confirmButton).toContainText(/cleanup/i);

    // Assert: Cancel button should be visible
    const cancelButton = confirmDialog.getByTestId('cancel-button');
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();
    await expect(cancelButton).toContainText(/cancel/i);
  });

  test('should display warning message in dialog', async ({ page }) => {
    // Arrange: Navigate to the Pods page and open dialog
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await cleanupButton.click();

    const confirmDialog = page.getByTestId('cleanup-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Assert: Dialog should contain warning about irreversible action
    const dialogText = await confirmDialog.innerText();
    expect(dialogText.toLowerCase()).toMatch(/cannot be undone/);

    // Assert: Dialog should mention what will be deleted
    expect(dialogText.toLowerCase()).toMatch(/failed|error|completed/);
  });

  test('should close dialog when Cancel button is clicked', async ({ page }) => {
    // Arrange: Navigate to the Pods page and open dialog
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await cleanupButton.click();

    const confirmDialog = page.getByTestId('cleanup-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Act: Click Cancel
    const cancelButton = confirmDialog.getByTestId('cancel-button');
    await cancelButton.click();

    // Assert: Dialog should be closed
    await expect(confirmDialog).not.toBeVisible();

    // Assert: Pods page should still be visible
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();
  });

  test('should close dialog when Escape key is pressed', async ({ page }) => {
    // Arrange: Navigate to the Pods page and open dialog
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await cleanupButton.click();

    const confirmDialog = page.getByTestId('cleanup-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Act: Press Escape key
    await page.keyboard.press('Escape');

    // Assert: Dialog should be closed
    await expect(confirmDialog).not.toBeVisible();
  });
});

test.describe('Pod Cleanup - Cleanup Execution', () => {
  test('should show "Cleaning up..." state when Confirm button is clicked', async ({ page }) => {
    // Arrange: Mock APIs
    await page.route('**/api/pods/all*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            name: 'failed-pod',
            namespace: 'default',
            status: 'Failed',
            restarts: 3,
            node: 'node-1',
            age: '1h',
            containers: ['app'],
            initContainers: [],
          },
        ]),
      });
    });

    // Intercept cleanup API to keep the "Cleaning up..." state visible
    await page.route('**/api/pods/cleanup*', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ deleted: 1, failed: [] }),
      });
    });

    // Act: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Click cleanup button and confirm
    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await cleanupButton.click();

    const confirmDialog = page.getByTestId('cleanup-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    const confirmButton = confirmDialog.getByTestId('confirm-button');
    await confirmButton.click();

    // Assert: Should show "Cleaning up..." state
    await expect(confirmButton).toHaveAttribute('aria-busy', 'true');
    await expect(confirmButton).toContainText(/cleaning up/i);

    // Assert: Cancel button should be disabled during processing
    const cancelButton = confirmDialog.getByTestId('cancel-button');
    await expect(cancelButton).toBeDisabled();
  });

  test('should close dialog and refresh pods after successful cleanup', async ({ page }) => {
    let apiCallCount = 0;

    // Arrange: Mock pods API (first call returns failed pod, second returns empty)
    await page.route('**/api/pods/all*', async route => {
      apiCallCount++;
      if (apiCallCount <= 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              name: 'failed-pod',
              namespace: 'default',
              status: 'Failed',
              restarts: 3,
              node: 'node-1',
              age: '1h',
              containers: ['app'],
              initContainers: [],
            },
          ]),
        });
      } else {
        // After cleanup, return empty list
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });

    // Mock cleanup API
    await page.route('**/api/pods/cleanup*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ deleted: 1 }),
      });
    });

    // Act: Navigate and perform cleanup
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await cleanupButton.click();

    const confirmDialog = page.getByTestId('cleanup-confirm-dialog');
    const confirmButton = confirmDialog.getByTestId('confirm-button');
    await confirmButton.click();

    // Assert: Dialog should close after successful cleanup
    await expect(confirmDialog).not.toBeVisible();

    // Assert: Cleanup button should no longer be visible (no cleanup targets)
    await expect(cleanupButton).not.toBeVisible();
  });

  test('should display error message when cleanup fails', async ({ page }) => {
    // Arrange: Mock pods API
    await page.route('**/api/pods/all*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            name: 'failed-pod',
            namespace: 'default',
            status: 'Failed',
            restarts: 3,
            node: 'node-1',
            age: '1h',
            containers: ['app'],
            initContainers: [],
          },
        ]),
      });
    });

    // Mock cleanup API to return error
    await page.route('**/api/pods/cleanup*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to cleanup pods' }),
      });
    });

    // Act: Navigate and attempt cleanup
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await cleanupButton.click();

    const confirmDialog = page.getByTestId('cleanup-confirm-dialog');
    const confirmButton = confirmDialog.getByTestId('confirm-button');
    await confirmButton.click();

    // Assert: Error message should be displayed in the dialog
    const errorMessage = confirmDialog.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();

    // Assert: Dialog should remain open on error
    await expect(confirmDialog).toBeVisible();

    // Assert: Cancel button should be enabled to dismiss
    const cancelButton = confirmDialog.getByTestId('cancel-button');
    await expect(cancelButton).toBeEnabled();
  });
});

test.describe('Pod Cleanup - Cleanup Button with Real Cluster', () => {
  test('should display cleanup button on pods page if terminal pods exist', async ({ page }) => {
    // This test runs against the real cluster - it verifies the button renders
    // based on actual cluster state

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Pods page should be visible
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    // Act: Check if cleanup button is visible
    const cleanupButton = page.getByTestId('cleanup-pods-button');
    const buttonVisible = await cleanupButton.isVisible().catch(() => false);

    if (buttonVisible) {
      // Assert: Button should contain a count
      const buttonText = await cleanupButton.innerText();
      expect(buttonText).toMatch(/cleanup pods \(\d+\)/i);

      // Act: Click the button to verify dialog works
      await cleanupButton.click();

      // Assert: Confirmation dialog should appear
      const confirmDialog = page.getByTestId('cleanup-confirm-dialog');
      await expect(confirmDialog).toBeVisible();

      // Assert: Cancel to avoid actually deleting pods
      const cancelButton = confirmDialog.getByTestId('cancel-button');
      await cancelButton.click();

      // Assert: Dialog should close
      await expect(confirmDialog).not.toBeVisible();
    }

    // Note: If no terminal pods exist, the button won't be visible - that's OK
  });

  test('should coexist with hide completed toggle', async ({ page }) => {
    // Arrange: Mock API with both completed and failed pods
    await page.route('**/api/pods/all*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            name: 'running-pod',
            namespace: 'default',
            status: 'Running',
            restarts: 0,
            node: 'node-1',
            age: '2h',
            containers: ['app'],
            initContainers: [],
          },
          {
            name: 'succeeded-pod',
            namespace: 'default',
            status: 'Succeeded',
            restarts: 0,
            node: 'node-1',
            age: '30m',
            containers: ['job'],
            initContainers: [],
          },
          {
            name: 'failed-pod',
            namespace: 'default',
            status: 'Failed',
            restarts: 3,
            node: 'node-1',
            age: '1h',
            containers: ['app'],
            initContainers: [],
          },
        ]),
      });
    });

    // Act: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Both cleanup button and hide completed toggle should be visible
    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await expect(cleanupButton).toBeVisible();

    const hideCompletedToggle = page.getByTestId('hide-completed-toggle');
    await expect(hideCompletedToggle).toBeVisible();

    // Assert: Cleanup button shows 2 (failed + succeeded)
    await expect(cleanupButton).toContainText('2');

    // Assert: Hide completed toggle shows 1 (succeeded only)
    await expect(hideCompletedToggle).toContainText('1');
  });
});
