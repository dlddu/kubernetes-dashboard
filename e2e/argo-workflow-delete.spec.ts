import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Argo Workflow Delete Feature
 *
 * These tests verify the behavior of the workflow delete functionality,
 * accessible from the workflow detail page via a Delete button.
 * Clicking the Delete button opens a confirmation dialog.
 * Confirming the dialog sends a DELETE request to the backend,
 * then navigates back to the workflow list.
 *
 * Test Fixtures (test/fixtures/):
 * - workflow-succeeded.yaml: data-processing-succeeded (Succeeded, dashboard-test)
 * - workflow-failed.yaml: data-processing-failed (Failed, dashboard-test)
 * - workflow-running.yaml: data-processing-running (Running, dashboard-test)
 * All reference workflowTemplateRef: data-processing-with-params.
 *
 * IMPORTANT: "Delete Execution" tests actually delete a workflow from the cluster.
 * They are placed last to avoid affecting other tests.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type PageParam = Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] : never;

/**
 * Navigate to /argo, click the data-processing-with-params template card,
 * then click a specific workflow card by name to reach the detail page.
 */
async function gotoWorkflowDetail(page: PageParam, workflowName: string) {
  await page.goto('/argo');
  await page.waitForLoadState('networkidle');

  // Click template card
  const templateCard = page.getByTestId('workflow-template-card').filter({ hasText: 'data-processing-with-params' });
  await expect(templateCard).toBeVisible();
  await templateCard.click();
  await page.waitForLoadState('networkidle');

  // Wait for runs page
  await expect(page.getByTestId('workflow-runs-page')).toBeVisible();

  // Find and click the specific workflow card
  await expect(page.getByTestId('workflow-run-card').first()).toBeVisible();
  const workflowCards = page.getByTestId('workflow-run-card');
  const cardCount = await workflowCards.count();

  for (let i = 0; i < cardCount; i++) {
    const card = workflowCards.nth(i);
    const nameText = await card.getByTestId('workflow-run-name').innerText();
    if (nameText === workflowName) {
      await card.click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('workflow-detail-page')).toBeVisible();
      return;
    }
  }

  throw new Error(`Workflow card "${workflowName}" not found`);
}

// ---------------------------------------------------------------------------
// Group 1: Delete Button Visibility
// ---------------------------------------------------------------------------

test.describe('Argo Workflow Delete - Button Visibility', () => {
  test('should display Delete button on workflow detail page', async ({ page }) => {
    // Arrange: Navigate to a workflow detail page
    await gotoWorkflowDetail(page, 'data-processing-running');

    // Assert: Delete button should be visible in the header
    const deleteButton = page.getByTestId('workflow-delete-button');
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toContainText('Delete');
  });

  test('should display Delete button for succeeded workflow', async ({ page }) => {
    // Arrange: Navigate to a succeeded workflow detail page
    await gotoWorkflowDetail(page, 'data-processing-succeeded');

    // Assert: Delete button should be visible
    const deleteButton = page.getByTestId('workflow-delete-button');
    await expect(deleteButton).toBeVisible();
  });

  test('should display Delete button for failed workflow', async ({ page }) => {
    // Arrange: Navigate to a failed workflow detail page
    await gotoWorkflowDetail(page, 'data-processing-failed');

    // Assert: Delete button should be visible
    const deleteButton = page.getByTestId('workflow-delete-button');
    await expect(deleteButton).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 2: Confirmation Dialog
// ---------------------------------------------------------------------------

test.describe('Argo Workflow Delete - Confirmation Dialog', () => {
  test('should show confirmation dialog when Delete button is clicked', async ({ page }) => {
    // Arrange: Navigate to workflow detail
    await gotoWorkflowDetail(page, 'data-processing-running');

    // Act: Click Delete button
    const deleteButton = page.getByTestId('workflow-delete-button');
    await deleteButton.click();

    // Assert: Confirmation dialog should be visible
    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Assert: Dialog should have role="dialog"
    const dialogRole = await confirmDialog.getAttribute('role');
    expect(dialogRole).toBe('dialog');

    // Assert: Dialog should have aria-modal="true"
    const ariaModal = await confirmDialog.getAttribute('aria-modal');
    expect(ariaModal).toBe('true');
  });

  test('should display Confirm and Cancel buttons in dialog', async ({ page }) => {
    // Arrange: Navigate to workflow detail and open dialog
    await gotoWorkflowDetail(page, 'data-processing-running');
    await page.getByTestId('workflow-delete-button').click();

    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Assert: Confirm button should be visible and enabled
    const confirmButton = confirmDialog.getByTestId('confirm-button');
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled();
    await expect(confirmButton).toContainText('Delete');

    // Assert: Cancel button should be visible and enabled
    const cancelButton = confirmDialog.getByTestId('cancel-button');
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();
    await expect(cancelButton).toContainText('Cancel');
  });

  test('should display workflow name and namespace in dialog', async ({ page }) => {
    // Arrange: Navigate to workflow detail and open dialog
    await gotoWorkflowDetail(page, 'data-processing-running');
    await page.getByTestId('workflow-delete-button').click();

    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Assert: Dialog should mention the workflow name
    const dialogText = await confirmDialog.innerText();
    expect(dialogText).toContain('data-processing-running');

    // Assert: Dialog should mention the namespace
    expect(dialogText).toContain('dashboard-test');
  });

  test('should display warning about irreversible action', async ({ page }) => {
    // Arrange: Navigate to workflow detail and open dialog
    await gotoWorkflowDetail(page, 'data-processing-running');
    await page.getByTestId('workflow-delete-button').click();

    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Assert: Dialog should contain warning
    const dialogText = await confirmDialog.innerText();
    expect(dialogText.toLowerCase()).toMatch(/cannot be undone/);
  });

  test('should close dialog when Cancel button is clicked', async ({ page }) => {
    // Arrange: Navigate to workflow detail and open dialog
    await gotoWorkflowDetail(page, 'data-processing-running');
    await page.getByTestId('workflow-delete-button').click();

    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Act: Click Cancel
    const cancelButton = confirmDialog.getByTestId('cancel-button');
    await cancelButton.click();

    // Assert: Dialog should be closed
    await expect(confirmDialog).not.toBeVisible();

    // Assert: Still on the detail page
    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();
  });

  test('should close dialog when Escape key is pressed', async ({ page }) => {
    // Arrange: Navigate to workflow detail and open dialog
    await gotoWorkflowDetail(page, 'data-processing-running');
    await page.getByTestId('workflow-delete-button').click();

    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Act: Press Escape key
    await page.keyboard.press('Escape');

    // Assert: Dialog should be closed
    await expect(confirmDialog).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 3: Accessibility
// ---------------------------------------------------------------------------

test.describe('Argo Workflow Delete - Accessibility', () => {
  test('should have proper accessibility attributes on confirmation dialog', async ({ page }) => {
    // Arrange: Navigate to workflow detail and open dialog
    await gotoWorkflowDetail(page, 'data-processing-running');
    await page.getByTestId('workflow-delete-button').click();

    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
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

    // Assert: Dialog title should exist and be visible
    const dialogTitle = confirmDialog.locator(`#${ariaLabelledBy}`);
    await expect(dialogTitle).toBeVisible();
  });

  test('should support keyboard navigation in dialog', async ({ page }) => {
    // Arrange: Navigate to workflow detail and open dialog
    await gotoWorkflowDetail(page, 'data-processing-running');
    await page.getByTestId('workflow-delete-button').click();

    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Act: Press Escape to close
    await page.keyboard.press('Escape');

    // Assert: Dialog should be closed via keyboard
    await expect(confirmDialog).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 4: Delete Execution
// IMPORTANT: This test actually deletes a workflow from the cluster.
// It is placed last to avoid affecting other tests.
// ---------------------------------------------------------------------------

test.describe('Argo Workflow Delete - Execution', () => {
  test('should delete workflow and navigate back to workflow list', async ({ page }) => {
    // Arrange: Navigate to the succeeded workflow detail
    // (using succeeded workflow to avoid deleting a running one)
    await gotoWorkflowDetail(page, 'data-processing-succeeded');

    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    // Act: Click Delete button
    const deleteButton = page.getByTestId('workflow-delete-button');
    await deleteButton.click();

    // Assert: Dialog should appear
    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Act: Confirm deletion
    const confirmButton = confirmDialog.getByTestId('confirm-button');
    await confirmButton.click();

    // Assert: Should navigate back to the workflow list page
    await expect(page.getByTestId('workflow-runs-page')).toBeVisible({ timeout: 15000 });

    // Assert: Detail page should no longer be visible
    await expect(detailPage).not.toBeVisible();

    // Assert: The deleted workflow should no longer appear in the list
    await page.waitForLoadState('networkidle');
    const workflowCards = page.getByTestId('workflow-run-card');
    const cardCount = await workflowCards.count();

    let foundDeleted = false;
    for (let i = 0; i < cardCount; i++) {
      const nameText = await workflowCards.nth(i).getByTestId('workflow-run-name').innerText();
      if (nameText === 'data-processing-succeeded') {
        foundDeleted = true;
        break;
      }
    }
    expect(foundDeleted).toBe(false);
  });
});
