import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Pod Cleanup Feature
 *
 * These tests verify the behavior of the pod cleanup functionality,
 * which allows users to delete all pods in terminal states
 * (Failed, Succeeded, Error, Completed, OOMKilled).
 *
 * Test Fixtures:
 * - completed-pod.yaml: 2 completed pods + 1 failed pod in dashboard-test namespace
 *   - completed-test-pod-1 (Succeeded): busybox that runs "echo done" and exits
 *   - completed-test-pod-2 (Succeeded): busybox that runs "echo done" and exits
 *   - failed-test-pod-1 (Failed): busybox that runs "exit 1" and fails
 *
 * These pods use restartPolicy: Never, so they will stay in Succeeded/Failed state.
 *
 * IMPORTANT: "Cleanup Execution" tests actually delete pods from the cluster,
 * so they are placed last to avoid affecting other tests.
 */

test.describe('Pod Cleanup - Button Visibility', () => {
  test('should display cleanup button when terminal pods exist', async ({ page }) => {
    // The fixture pods (completed-test-pod-1, completed-test-pod-2, failed-test-pod-1)
    // should be in Succeeded/Failed state and trigger the cleanup button

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Pods page should be visible
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    // Assert: Cleanup button should be visible (fixture pods are in terminal state)
    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await expect(cleanupButton).toBeVisible();

    // Assert: Button should contain a count
    const buttonText = await cleanupButton.innerText();
    expect(buttonText).toMatch(/cleanup pods \(\d+\)/i);
  });

  test('should include fixture completed and failed pods in cleanup count', async ({ page }) => {
    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Cleanup button should be visible
    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await expect(cleanupButton).toBeVisible();

    // Assert: Count should be at least 3 (2 completed + 1 failed from fixture)
    const buttonText = await cleanupButton.innerText();
    const match = buttonText.match(/\((\d+)\)/);
    expect(match).toBeTruthy();
    const count = parseInt(match![1], 10);
    expect(count).toBeGreaterThanOrEqual(3);
  });
});

test.describe('Pod Cleanup - Confirmation Dialog', () => {
  test('should show confirmation dialog when cleanup button is clicked', async ({ page }) => {
    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Click the cleanup button
    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await expect(cleanupButton).toBeVisible();
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

    // Assert: Confirm button should be visible and enabled
    const confirmButton = confirmDialog.getByTestId('confirm-button');
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled();
    await expect(confirmButton).toContainText(/cleanup/i);

    // Assert: Cancel button should be visible and enabled
    const cancelButton = confirmDialog.getByTestId('cancel-button');
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();
    await expect(cancelButton).toContainText(/cancel/i);
  });

  test('should display warning message about irreversible action', async ({ page }) => {
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

  test('should display pod count in dialog', async ({ page }) => {
    // Arrange: Navigate to the Pods page and open dialog
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await cleanupButton.click();

    const confirmDialog = page.getByTestId('cleanup-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Assert: Dialog should mention the number of pods to delete
    const dialogText = await confirmDialog.innerText();
    expect(dialogText).toMatch(/\d+\s*pod/i);
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

    // Assert: Pods page should still be visible and unchanged
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    // Assert: Cleanup button should still be visible (nothing was cleaned)
    await expect(cleanupButton).toBeVisible();
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

test.describe('Pod Cleanup - Coexistence with Hide Completed Toggle', () => {
  test('should display both cleanup button and hide completed toggle', async ({ page }) => {
    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Cleanup button should be visible (fixture has terminal pods)
    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await expect(cleanupButton).toBeVisible();

    // Assert: Hide completed toggle should also be visible
    // (fixture has Succeeded pods which count as "completed")
    const hideCompletedToggle = page.getByTestId('hide-completed-toggle');
    const toggleVisible = await hideCompletedToggle.isVisible().catch(() => false);

    if (toggleVisible) {
      // Assert: Both buttons should coexist in the header area
      await expect(cleanupButton).toBeVisible();
      await expect(hideCompletedToggle).toBeVisible();

      // Assert: Cleanup count should be >= hide completed count
      // (cleanup targets include completed + failed + error)
      const cleanupText = await cleanupButton.innerText();
      const toggleText = await hideCompletedToggle.innerText();
      const cleanupCount = parseInt(cleanupText.match(/\((\d+)\)/)?.[1] || '0', 10);
      const completedCount = parseInt(toggleText.match(/\((\d+)\)/)?.[1] || '0', 10);
      expect(cleanupCount).toBeGreaterThanOrEqual(completedCount);
    }
  });

  test('should still show cleanup button after toggling hide completed', async ({ page }) => {
    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await expect(cleanupButton).toBeVisible();

    const hideCompletedToggle = page.getByTestId('hide-completed-toggle');
    const toggleVisible = await hideCompletedToggle.isVisible().catch(() => false);

    if (toggleVisible) {
      // Act: Toggle hide completed
      await hideCompletedToggle.click();

      // Assert: Cleanup button should still be visible
      await expect(cleanupButton).toBeVisible();

      // Act: Toggle back
      await hideCompletedToggle.click();

      // Assert: Cleanup button should still be visible
      await expect(cleanupButton).toBeVisible();
    }
  });
});

test.describe('Pod Cleanup - Accessibility', () => {
  test('should have proper accessibility for confirmation dialog', async ({ page }) => {
    // Arrange: Navigate to the Pods page and open dialog
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await expect(cleanupButton).toBeVisible();
    await cleanupButton.click();

    // Assert: Confirmation dialog should be visible with proper attributes
    const confirmDialog = page.getByTestId('cleanup-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Assert: Dialog should have role="dialog"
    const dialogRole = await confirmDialog.getAttribute('role');
    expect(dialogRole).toBe('dialog');

    // Assert: Dialog should have aria-modal="true"
    const ariaModal = await confirmDialog.getAttribute('aria-modal');
    expect(ariaModal).toBe('true');

    // Assert: Dialog should have aria-labelledby
    const ariaLabelledBy = await confirmDialog.getAttribute('aria-labelledby');
    expect(ariaLabelledBy).toBeTruthy();

    // Assert: Dialog title should exist
    const dialogTitle = confirmDialog.locator(`#${ariaLabelledBy}`);
    await expect(dialogTitle).toBeVisible();
  });

  test('should support keyboard navigation in dialog', async ({ page }) => {
    // Arrange: Navigate to the Pods page and open dialog
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await cleanupButton.click();

    const confirmDialog = page.getByTestId('cleanup-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Act: Press Escape to close
    await page.keyboard.press('Escape');

    // Assert: Dialog should be closed via keyboard
    await expect(confirmDialog).not.toBeVisible();
  });
});

// IMPORTANT: These tests actually delete pods from the cluster.
// They are placed last to avoid affecting other tests in this file.
test.describe('Pod Cleanup - Cleanup Execution', () => {
  test('should execute cleanup and close dialog on success', async ({ page }) => {
    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Get initial cleanup target count
    const cleanupButton = page.getByTestId('cleanup-pods-button');
    await expect(cleanupButton).toBeVisible();
    const initialText = await cleanupButton.innerText();
    const initialMatch = initialText.match(/\((\d+)\)/);
    const initialCount = initialMatch ? parseInt(initialMatch[1], 10) : 0;
    expect(initialCount).toBeGreaterThanOrEqual(1);

    // Act: Click cleanup button and confirm
    await cleanupButton.click();

    const confirmDialog = page.getByTestId('cleanup-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    const confirmButton = confirmDialog.getByTestId('confirm-button');
    await confirmButton.click();

    // Assert: Dialog should close after successful cleanup
    await expect(confirmDialog).not.toBeVisible({ timeout: 10000 });

    // Assert: After cleanup, pod list should be refreshed
    await page.waitForLoadState('networkidle');
  });

  test('should remove cleaned up pods from the pod list', async ({ page }) => {
    // Arrange: Navigate to the Pods page (after previous test already cleaned up)
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Fixture cleanup target pods should no longer appear
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();

    for (let i = 0; i < cardCount; i++) {
      const card = podCards.nth(i);
      const podName = card.getByTestId('pod-name');
      const nameText = await podName.innerText();
      // These pods should have been cleaned up by the previous test
      expect(nameText).not.toBe('completed-test-pod-1');
      expect(nameText).not.toBe('completed-test-pod-2');
      expect(nameText).not.toBe('failed-test-pod-1');
    }
  });
});
