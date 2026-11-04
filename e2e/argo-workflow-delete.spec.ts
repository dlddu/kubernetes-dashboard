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

test.describe('Argo Workflow Delete - Button Visibility', () => {
  test('should display Delete button on workflow detail page', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-running');

    const deleteButton = page.getByTestId('workflow-delete-button');
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toContainText('Delete');
  });

  test('should display Delete button for succeeded workflow', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-succeeded');

    const deleteButton = page.getByTestId('workflow-delete-button');
    await expect(deleteButton).toBeVisible();
  });

  test('should display Delete button for failed workflow', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-failed');

    const deleteButton = page.getByTestId('workflow-delete-button');
    await expect(deleteButton).toBeVisible();
  });
});

test.describe('Argo Workflow Delete - Confirmation Dialog', () => {
  test('should show confirmation dialog when Delete button is clicked', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-running');

    const deleteButton = page.getByTestId('workflow-delete-button');
    await deleteButton.click();

    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    const dialogRole = await confirmDialog.getAttribute('role');
    expect(dialogRole).toBe('dialog');

    const ariaModal = await confirmDialog.getAttribute('aria-modal');
    expect(ariaModal).toBe('true');
  });

  test('should display Confirm and Cancel buttons in dialog', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-running');
    await page.getByTestId('workflow-delete-button').click();

    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    const confirmButton = confirmDialog.getByTestId('confirm-button');
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled();
    await expect(confirmButton).toContainText('Delete');

    const cancelButton = confirmDialog.getByTestId('cancel-button');
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();
    await expect(cancelButton).toContainText('Cancel');
  });

  test('should display workflow name and namespace in dialog', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-running');
    await page.getByTestId('workflow-delete-button').click();

    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    const dialogText = await confirmDialog.innerText();
    expect(dialogText).toContain('data-processing-running');

    expect(dialogText).toContain('dashboard-test');
  });

  test('should display warning about irreversible action', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-running');
    await page.getByTestId('workflow-delete-button').click();

    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    const dialogText = await confirmDialog.innerText();
    expect(dialogText.toLowerCase()).toMatch(/cannot be undone/);
  });

  test('should close dialog when Cancel button is clicked', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-running');
    await page.getByTestId('workflow-delete-button').click();

    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    const cancelButton = confirmDialog.getByTestId('cancel-button');
    await cancelButton.click();

    await expect(confirmDialog).not.toBeVisible();

    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();
  });

  test('should close dialog when Escape key is pressed', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-running');
    await page.getByTestId('workflow-delete-button').click();

    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(confirmDialog).not.toBeVisible();
  });
});

test.describe('Argo Workflow Delete - Accessibility', () => {
  test('should have proper accessibility attributes on confirmation dialog', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-running');
    await page.getByTestId('workflow-delete-button').click();

    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
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
    await gotoWorkflowDetail(page, 'data-processing-running');
    await page.getByTestId('workflow-delete-button').click();

    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(confirmDialog).not.toBeVisible();
  });
});

// IMPORTANT: This test creates a new workflow and then deletes it.
// It does NOT touch shared fixtures used by other parallel tests.
test.describe('Argo Workflow Delete - Execution', () => {
  test('should delete workflow and navigate back to workflow list', async ({ page }) => {
    await page.goto('/argo');
    await page.waitForLoadState('networkidle');

    const submitResult = await page.evaluate(async () => {
      const res = await fetch('/api/argo/workflow-templates/simple-template/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parameters: {} }),
      });
      return res.json() as Promise<{ name: string; namespace: string }>;
    });

    const createdName = submitResult.name;
    expect(createdName).toBeTruthy();

    const templateCard = page.getByTestId('workflow-template-card').filter({ hasText: 'simple-template' });
    await expect(templateCard).toBeVisible();
    await templateCard.click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('workflow-runs-page')).toBeVisible();

    await expect(page.getByTestId('workflow-run-card').first()).toBeVisible();
    const workflowCards = page.getByTestId('workflow-run-card');
    const cardCount = await workflowCards.count();
    let found = false;
    for (let i = 0; i < cardCount; i++) {
      const card = workflowCards.nth(i);
      const nameText = await card.getByTestId('workflow-run-name').innerText();
      if (nameText === createdName) {
        await card.click();
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    await page.getByTestId('workflow-delete-button').click();

    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByTestId('confirm-button').click();

    await expect(page.getByTestId('workflow-runs-page')).toBeVisible({ timeout: 15000 });

    await expect(detailPage).not.toBeVisible();

    await page.waitForLoadState('networkidle');
    const remainingCards = page.getByTestId('workflow-run-card');
    const remainingCount = await remainingCards.count();
    let foundDeleted = false;
    for (let i = 0; i < remainingCount; i++) {
      const nameText = await remainingCards.nth(i).getByTestId('workflow-run-name').innerText();
      if (nameText === createdName) {
        foundDeleted = true;
        break;
      }
    }
    expect(foundDeleted).toBe(false);
  });

  test('should display error message in dialog when delete API fails', async ({ page }) => {
    await gotoWorkflowDetail(page, 'data-processing-running');

    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    // mock-exception: ERR — 삭제 API 실패(500) 시 다이얼로그 에러 메시지 검증; 실클러스터가 요청 시점에 500을 내게 만들 수 없음 (docs/e2e-mocking-policy.md)
    await page.route('**/api/argo/workflows/**', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to delete workflow' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.getByTestId('workflow-delete-button').click();

    const confirmDialog = page.getByTestId('workflow-delete-confirm-dialog');
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByTestId('confirm-button').click();

    const errorMessage = confirmDialog.getByTestId('error-message');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    await expect(detailPage).toBeVisible();
  });
});
