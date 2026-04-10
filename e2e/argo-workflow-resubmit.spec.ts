import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Argo Workflow Resubmit Feature
 *
 * These tests verify the behavior of the workflow resubmit functionality,
 * accessible from the workflow detail page via a Resubmit button.
 * Clicking the Resubmit button opens a confirmation dialog.
 * Confirming the dialog sends a POST request to the backend,
 * creates a new workflow with the same template and parameters,
 * then navigates to the new workflow's detail page.
 *
 * Test Fixtures (test/fixtures/):
 * - workflow-succeeded.yaml: data-processing-succeeded (Succeeded, dashboard-test)
 * - workflow-failed.yaml: data-processing-failed (Failed, dashboard-test)
 * - workflow-running.yaml: data-processing-running (Running, dashboard-test)
 * All reference workflowTemplateRef: data-processing-with-params.
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
// Group 1: Resubmit Button Visibility
// ---------------------------------------------------------------------------

test.describe('Argo Workflow Resubmit - Button Visibility', () => {
  test('should display Resubmit button on workflow detail page', async ({ page }) => {
    // Arrange: Navigate to a workflow detail page
    await gotoWorkflowDetail(page, 'data-processing-running');

    // Assert: Resubmit button should be visible in the header
    const resubmitButton = page.getByTestId('workflow-resubmit-button');
    await expect(resubmitButton).toBeVisible();
    await expect(resubmitButton).toContainText('Resubmit');
  });

  test('should display Resubmit button for succeeded workflow', async ({ page }) => {
    // Arrange: Navigate to a succeeded workflow detail page
    await gotoWorkflowDetail(page, 'data-processing-succeeded');

    // Assert: Resubmit button should be visible
    const resubmitButton = page.getByTestId('workflow-resubmit-button');
    await expect(resubmitButton).toBeVisible();
  });

  test('should display Resubmit button for failed workflow', async ({ page }) => {
    // Arrange: Navigate to a failed workflow detail page
    await gotoWorkflowDetail(page, 'data-processing-failed');

    // Assert: Resubmit button should be visible
    const resubmitButton = page.getByTestId('workflow-resubmit-button');
    await expect(resubmitButton).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 2: Confirmation Dialog
// ---------------------------------------------------------------------------

test.describe('Argo Workflow Resubmit - Confirmation Dialog', () => {
  test('should show confirmation dialog when Resubmit button is clicked', async ({ page }) => {
    // Arrange: Navigate to workflow detail
    await gotoWorkflowDetail(page, 'data-processing-succeeded');

    // Act: Click Resubmit button
    const resubmitButton = page.getByTestId('workflow-resubmit-button');
    await resubmitButton.click();

    // Assert: Confirmation dialog should be visible
    const confirmDialog = page.getByTestId('workflow-resubmit-confirm-dialog');
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
    await gotoWorkflowDetail(page, 'data-processing-succeeded');
    await page.getByTestId('workflow-resubmit-button').click();

    const confirmDialog = page.getByTestId('workflow-resubmit-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Assert: Confirm button should be visible and enabled
    const confirmButton = confirmDialog.getByTestId('confirm-button');
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled();
    await expect(confirmButton).toContainText('Resubmit');

    // Assert: Cancel button should be visible and enabled
    const cancelButton = confirmDialog.getByTestId('cancel-button');
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();
    await expect(cancelButton).toContainText('Cancel');
  });

  test('should display workflow name and namespace in dialog', async ({ page }) => {
    // Arrange: Navigate to workflow detail and open dialog
    await gotoWorkflowDetail(page, 'data-processing-succeeded');
    await page.getByTestId('workflow-resubmit-button').click();

    const confirmDialog = page.getByTestId('workflow-resubmit-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Assert: Dialog should mention the workflow name
    const dialogText = await confirmDialog.innerText();
    expect(dialogText).toContain('data-processing-succeeded');

    // Assert: Dialog should mention the namespace
    expect(dialogText).toContain('dashboard-test');
  });

  test('should close dialog when Cancel button is clicked', async ({ page }) => {
    // Arrange: Navigate to workflow detail and open dialog
    await gotoWorkflowDetail(page, 'data-processing-succeeded');
    await page.getByTestId('workflow-resubmit-button').click();

    const confirmDialog = page.getByTestId('workflow-resubmit-confirm-dialog');
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
    await gotoWorkflowDetail(page, 'data-processing-succeeded');
    await page.getByTestId('workflow-resubmit-button').click();

    const confirmDialog = page.getByTestId('workflow-resubmit-confirm-dialog');
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

test.describe('Argo Workflow Resubmit - Accessibility', () => {
  test('should have proper accessibility attributes on confirmation dialog', async ({ page }) => {
    // Arrange: Navigate to workflow detail and open dialog
    await gotoWorkflowDetail(page, 'data-processing-succeeded');
    await page.getByTestId('workflow-resubmit-button').click();

    const confirmDialog = page.getByTestId('workflow-resubmit-confirm-dialog');
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
    await gotoWorkflowDetail(page, 'data-processing-succeeded');
    await page.getByTestId('workflow-resubmit-button').click();

    const confirmDialog = page.getByTestId('workflow-resubmit-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Act: Press Escape to close
    await page.keyboard.press('Escape');

    // Assert: Dialog should be closed via keyboard
    await expect(confirmDialog).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 4: Resubmit Execution
// ---------------------------------------------------------------------------

test.describe('Argo Workflow Resubmit - Execution', () => {
  test('should resubmit workflow and navigate to new workflow detail', async ({ page }) => {
    // Arrange: Navigate to a succeeded workflow detail page
    await gotoWorkflowDetail(page, 'data-processing-succeeded');

    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    // Capture the original workflow name
    const originalName = await page.getByTestId('workflow-detail-name').innerText();
    expect(originalName).toBe('data-processing-succeeded');

    // Act: Click Resubmit button
    await page.getByTestId('workflow-resubmit-button').click();

    const confirmDialog = page.getByTestId('workflow-resubmit-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Act: Confirm resubmit
    await confirmDialog.getByTestId('confirm-button').click();

    // Assert: Wait for the workflow detail name to change (navigation + data load)
    await expect(page.getByTestId('workflow-detail-name')).not.toHaveText(originalName, { timeout: 15000 });

    // Assert: The new workflow name should start with the template name prefix
    const newName = await page.getByTestId('workflow-detail-name').innerText();
    expect(newName).toMatch(/^data-processing-with-params-/);
  });

  test('should display error message in dialog when resubmit API fails', async ({ page }) => {
    // This test uses API interception to simulate a server error
    await gotoWorkflowDetail(page, 'data-processing-succeeded');

    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    await page.route('**/api/argo/workflows/*/resubmit', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to resubmit workflow' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.getByTestId('workflow-resubmit-button').click();

    const confirmDialog = page.getByTestId('workflow-resubmit-confirm-dialog');
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByTestId('confirm-button').click();

    // Assert: Error message should appear in the dialog
    const errorMessage = confirmDialog.getByTestId('error-message');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Assert: Should remain on the detail page
    await expect(detailPage).toBeVisible();
  });
});
