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

    let releaseRestart!: () => void;
    const restartGate = new Promise<void>(resolve => { releaseRestart = resolve; });
    // mock-exception: LAT — 실 응답은 즉시 완료돼 'Restarting…' 관측까지 지연. 해제 후 전용 0-replica Deployment에 실 restart 요청을 전달한다.
    await page.route('**/api/deployments/dashboard-mock-policy/restart-policy-target/restart', async route => {
      await restartGate;
      await route.continue();
    });

    // Arrange: Navigate to the Workloads page
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // This fixture owns the real restart mutation; other tests keep nginx-test.
    const deploymentCards = page.getByTestId('deployment-card');
    const cardCount = await deploymentCards.count();
    let restartDeploymentCard = null;

    for (let i = 0; i < cardCount; i++) {
      const card = deploymentCards.nth(i);
      const nameElement = card.getByTestId('deployment-name');
      const nameText = await nameElement.innerText();
      if (nameText === 'restart-policy-target') {
        restartDeploymentCard = card;
        break;
      }
    }

    expect(restartDeploymentCard).toBeTruthy();
    if (!restartDeploymentCard) return;

    const restartButton = restartDeploymentCard.getByTestId('restart-button');
    await restartButton.click();

    // Act: Locate the confirmation dialog and click Confirm
    const confirmDialog = page.getByTestId('restart-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    const confirmButton = confirmDialog.getByTestId('confirm-button');
    const responsePromise = page.waitForResponse(response =>
      new URL(response.url()).pathname ===
        '/api/deployments/dashboard-mock-policy/restart-policy-target/restart' &&
      response.request().method() === 'POST',
    );
    const [assertions, response] = await Promise.allSettled([
      (async () => {
        try {
          await confirmButton.click();
          await expect(confirmButton).toHaveAttribute('aria-busy', 'true');
          await expect(confirmButton).toContainText(/restarting/i);
        } finally {
          releaseRestart();
        }
      })(),
      responsePromise,
    ]);
    if (response.status === 'rejected') throw response.reason;
    expect(response.value.status()).toBe(200);
    if (assertions.status === 'rejected') throw assertions.reason;
    await expect(confirmDialog).not.toBeVisible();
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
