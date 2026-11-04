import { test, expect } from '@playwright/test';

type PageParam = Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] : never;

async function gotoWorkflowDetail(page: PageParam, workflowName: string) {
  await page.goto('/argo');
  await page.waitForLoadState('networkidle');

  const templateCard = page.getByTestId('workflow-template-card').filter({ hasText: 'data-processing-with-params' });
  await expect(templateCard).toBeVisible();
  await templateCard.click();
  await page.waitForLoadState('networkidle');

  await expect(page.getByTestId('workflow-runs-page')).toBeVisible();

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

test.describe('Argo Workflow Resubmit - Button Visibility', () => {
  test('should display Resubmit button on workflow detail page', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-running');

    const resubmitButton = page.getByTestId('workflow-resubmit-button');
    await expect(resubmitButton).toBeVisible();
    await expect(resubmitButton).toContainText('Resubmit');
  });

  test('should display Resubmit button for succeeded workflow', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-succeeded');

    const resubmitButton = page.getByTestId('workflow-resubmit-button');
    await expect(resubmitButton).toBeVisible();
  });

  test('should display Resubmit button for failed workflow', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-failed');

    const resubmitButton = page.getByTestId('workflow-resubmit-button');
    await expect(resubmitButton).toBeVisible();
  });
});

test.describe('Argo Workflow Resubmit - Confirmation Dialog', () => {
  test('should show confirmation dialog when Resubmit button is clicked', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-succeeded');

    const resubmitButton = page.getByTestId('workflow-resubmit-button');
    await resubmitButton.click();

    const confirmDialog = page.getByTestId('workflow-resubmit-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    const dialogRole = await confirmDialog.getAttribute('role');
    expect(dialogRole).toBe('dialog');

    const ariaModal = await confirmDialog.getAttribute('aria-modal');
    expect(ariaModal).toBe('true');
  });

  test('should display Confirm and Cancel buttons in dialog', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-succeeded');
    await page.getByTestId('workflow-resubmit-button').click();

    const confirmDialog = page.getByTestId('workflow-resubmit-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    const confirmButton = confirmDialog.getByTestId('confirm-button');
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled();
    await expect(confirmButton).toContainText('Resubmit');

    const cancelButton = confirmDialog.getByTestId('cancel-button');
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();
    await expect(cancelButton).toContainText('Cancel');
  });

  test('should display workflow name and namespace in dialog', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-succeeded');
    await page.getByTestId('workflow-resubmit-button').click();

    const confirmDialog = page.getByTestId('workflow-resubmit-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    const dialogText = await confirmDialog.innerText();
    expect(dialogText).toContain('data-processing-succeeded');

    expect(dialogText).toContain('dashboard-test');
  });

  test('should close dialog when Cancel button is clicked', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-succeeded');
    await page.getByTestId('workflow-resubmit-button').click();

    const confirmDialog = page.getByTestId('workflow-resubmit-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    const cancelButton = confirmDialog.getByTestId('cancel-button');
    await cancelButton.click();

    await expect(confirmDialog).not.toBeVisible();

    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();
  });

  test('should close dialog when Escape key is pressed', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-succeeded');
    await page.getByTestId('workflow-resubmit-button').click();

    const confirmDialog = page.getByTestId('workflow-resubmit-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(confirmDialog).not.toBeVisible();
  });
});

test.describe('Argo Workflow Resubmit - Accessibility', () => {
  test('should have proper accessibility attributes on confirmation dialog', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-succeeded');
    await page.getByTestId('workflow-resubmit-button').click();

    const confirmDialog = page.getByTestId('workflow-resubmit-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    const dialogRole = await confirmDialog.getAttribute('role');
    expect(dialogRole).toBe('dialog');

    const ariaModal = await confirmDialog.getAttribute('aria-modal');
    expect(ariaModal).toBe('true');

    const ariaLabelledBy = await confirmDialog.getAttribute('aria-labelledby');
    expect(ariaLabelledBy).toBeTruthy();

    const dialogTitle = confirmDialog.locator(`#${ariaLabelledBy}`);
    await expect(dialogTitle).toBeVisible();
  });

  test('should support keyboard navigation in dialog', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-succeeded');
    await page.getByTestId('workflow-resubmit-button').click();

    const confirmDialog = page.getByTestId('workflow-resubmit-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(confirmDialog).not.toBeVisible();
  });
});

test.describe('Argo Workflow Resubmit - Execution', () => {
  test('should resubmit workflow and navigate to new workflow detail', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-succeeded');

    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    const originalName = await page.getByTestId('workflow-detail-name').innerText();
    expect(originalName).toBe('data-processing-succeeded');

    await page.getByTestId('workflow-resubmit-button').click();

    const confirmDialog = page.getByTestId('workflow-resubmit-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    await confirmDialog.getByTestId('confirm-button').click();

    await expect(page.getByTestId('workflow-detail-name')).not.toHaveText(originalName, { timeout: 15000 });

    const newName = await page.getByTestId('workflow-detail-name').innerText();
    expect(newName).toMatch(/^data-processing-with-params-/);
  });

  test('should display error message in dialog when resubmit API fails', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-succeeded');

    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    // mock-exception: ERR — resubmit API 실패(500) 시 에러 메시지 검증; 실클러스터가 요청 시점에 500을 내게 만들 수 없음 (docs/e2e-mocking-policy.md)
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

    const errorMessage = confirmDialog.getByTestId('error-message');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    await expect(detailPage).toBeVisible();
  });
});
