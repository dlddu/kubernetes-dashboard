// Verifies: WL3 (docs/product/prd-workloads.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

test.describe('Workloads Tab - Restart Confirmation Dialog', () => {
  test('should display Confirm and Cancel buttons in dialog', async ({ page }) => {
    // Tests that confirmation dialog has both Confirm and Cancel buttons

    // Arrange: Navigate to the Workloads page
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Get the nginx-test deployment card and click Restart
    const deploymentCards = page.getByTestId('deployment-card');
    const cardCount = await deploymentCards.count();
    let nginxDeploymentCard = null;

    for (let i = 0; i < cardCount; i++) {
      const card = deploymentCards.nth(i);
      const nameElement = card.getByTestId('deployment-name');
      const nameText = await nameElement.innerText();
      if (nameText === 'nginx-test') {
        nginxDeploymentCard = card;
        break;
      }
    }

    expect(nginxDeploymentCard).toBeTruthy();
    if (!nginxDeploymentCard) return;

    const restartButton = nginxDeploymentCard.getByTestId('restart-button');
    await restartButton.click();

    // Act: Locate the confirmation dialog
    const confirmDialog = page.getByTestId('restart-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Assert: Confirm button should be visible
    const confirmButton = confirmDialog.getByTestId('confirm-button');
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled();

    // Assert: Cancel button should be visible
    const cancelButton = confirmDialog.getByTestId('cancel-button');
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();

    // Assert: Buttons should have appropriate text
    const confirmText = await confirmButton.innerText();
    const cancelText = await cancelButton.innerText();
    expect(confirmText.toLowerCase()).toMatch(/confirm|yes|restart/);
    expect(cancelText.toLowerCase()).toMatch(/cancel|no/);
  });

  test('should show "Restarting..." state when Confirm button is clicked', async ({ page }) => {
    // Tests that confirming restart shows a loading/restarting state

    // Arrange: Intercept the restart API to keep the "Restarting..." state visible
    // Without this, the API may complete too fast for the assertion to observe the state
    // mock-exception: LAT — 'Restarting…' 전이 상태 관측 위해 restart 응답 지연; 실 restart는 즉시 완료·파괴적이라 실행 안 함 (docs/e2e-mocking-policy.md)
    await page.route('**/api/deployments/**/restart', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Restart initiated' }) });
    });

    // Arrange: Navigate to the Workloads page
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Get the nginx-test deployment card and click Restart
    const deploymentCards = page.getByTestId('deployment-card');
    const cardCount = await deploymentCards.count();
    let nginxDeploymentCard = null;

    for (let i = 0; i < cardCount; i++) {
      const card = deploymentCards.nth(i);
      const nameElement = card.getByTestId('deployment-name');
      const nameText = await nameElement.innerText();
      if (nameText === 'nginx-test') {
        nginxDeploymentCard = card;
        break;
      }
    }

    expect(nginxDeploymentCard).toBeTruthy();
    if (!nginxDeploymentCard) return;

    const restartButton = nginxDeploymentCard.getByTestId('restart-button');
    await restartButton.click();

    // Act: Locate the confirmation dialog and click Confirm
    const confirmDialog = page.getByTestId('restart-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    const confirmButton = confirmDialog.getByTestId('confirm-button');
    await confirmButton.click();

    // Assert: Should show "Restarting..." state in the confirm button
    await expect(confirmButton).toHaveAttribute('aria-busy', 'true');

    // Assert: The text should indicate restarting state
    await expect(confirmButton).toContainText(/restarting/i);
  });

  test('should close dialog when Cancel button is clicked', async ({ page }) => {
    // Tests that clicking Cancel closes the confirmation dialog without restarting

    // Arrange: Navigate to the Workloads page
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Get the nginx-test deployment card and click Restart
    const deploymentCards = page.getByTestId('deployment-card');
    const cardCount = await deploymentCards.count();
    let nginxDeploymentCard = null;

    for (let i = 0; i < cardCount; i++) {
      const card = deploymentCards.nth(i);
      const nameElement = card.getByTestId('deployment-name');
      const nameText = await nameElement.innerText();
      if (nameText === 'nginx-test') {
        nginxDeploymentCard = card;
        break;
      }
    }

    expect(nginxDeploymentCard).toBeTruthy();
    if (!nginxDeploymentCard) return;

    const restartButton = nginxDeploymentCard.getByTestId('restart-button');
    await restartButton.click();

    // Act: Locate the confirmation dialog
    const confirmDialog = page.getByTestId('restart-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Act: Click the Cancel button
    const cancelButton = confirmDialog.getByTestId('cancel-button');
    await cancelButton.click();

    // Assert: Dialog should be closed/hidden
    await expect(confirmDialog).not.toBeVisible();

    // Assert: Should not show restarting state
    const restartingIndicator = page.getByText(/restarting/i);
    const restartingVisible = await restartingIndicator.count() > 0
      ? await restartingIndicator.isVisible().catch(() => false)
      : false;
    expect(restartingVisible).toBe(false);

    // Assert: Deployment card should still be visible and unchanged
    await expect(nginxDeploymentCard).toBeVisible();
  });

  test('should maintain deployment information during dialog interaction', async ({ page }) => {
    // Tests that deployment information remains consistent during dialog opening/closing

    // Arrange: Navigate to the Workloads page
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Get the nginx-test deployment card
    const deploymentCards = page.getByTestId('deployment-card');
    const cardCount = await deploymentCards.count();
    let nginxDeploymentCard = null;

    for (let i = 0; i < cardCount; i++) {
      const card = deploymentCards.nth(i);
      const nameElement = card.getByTestId('deployment-name');
      const nameText = await nameElement.innerText();
      if (nameText === 'nginx-test') {
        nginxDeploymentCard = card;
        break;
      }
    }

    expect(nginxDeploymentCard).toBeTruthy();
    if (!nginxDeploymentCard) return;

    // Act: Store original deployment information
    const originalName = await nginxDeploymentCard.getByTestId('deployment-name').innerText();
    const originalNamespace = await nginxDeploymentCard.getByTestId('deployment-namespace').innerText();
    const originalReady = await nginxDeploymentCard.getByTestId('deployment-ready').innerText();

    // Act: Open and close dialog
    const restartButton = nginxDeploymentCard.getByTestId('restart-button');
    await restartButton.click();

    const confirmDialog = page.getByTestId('restart-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    const cancelButton = confirmDialog.getByTestId('cancel-button');
    await cancelButton.click();

    await expect(confirmDialog).not.toBeVisible();

    // Assert: Deployment information should remain unchanged
    const currentName = await nginxDeploymentCard.getByTestId('deployment-name').innerText();
    const currentNamespace = await nginxDeploymentCard.getByTestId('deployment-namespace').innerText();
    const currentReady = await nginxDeploymentCard.getByTestId('deployment-ready').innerText();

    expect(currentName).toBe(originalName);
    expect(currentNamespace).toBe(originalNamespace);
    expect(currentReady).toBe(originalReady);
  });
});
