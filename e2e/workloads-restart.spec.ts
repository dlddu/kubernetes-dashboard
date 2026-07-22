// Verifies: WL2 (docs/product/prd-workloads.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

test.describe('Workloads Tab - Deployment Restart Button', () => {
  test('should display Restart button in DeploymentCard', async ({ page }) => {
    // Tests that DeploymentCard displays a Restart button

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

    // Assert: nginx-test deployment card should be found
    expect(nginxDeploymentCard).toBeTruthy();
    if (!nginxDeploymentCard) return;

    // Assert: Restart button should be visible
    const restartButton = nginxDeploymentCard.getByTestId('restart-button');
    await expect(restartButton).toBeVisible();

    // Assert: Restart button should be enabled
    await expect(restartButton).toBeEnabled();

    // Assert: Button should have appropriate text
    const buttonText = await restartButton.innerText();
    expect(buttonText.toLowerCase()).toMatch(/restart/);
  });

  test('should show confirmation dialog when Restart button is clicked', async ({ page }) => {
    // Tests that clicking Restart button opens a confirmation dialog

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

    // Assert: nginx-test deployment card should be found
    expect(nginxDeploymentCard).toBeTruthy();
    if (!nginxDeploymentCard) return;

    // Act: Click the Restart button
    const restartButton = nginxDeploymentCard.getByTestId('restart-button');
    await restartButton.click();

    // Assert: Confirmation dialog should be visible
    const confirmDialog = page.getByTestId('restart-confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    // Assert: Dialog should contain deployment name for context
    const dialogText = await confirmDialog.innerText();
    expect(dialogText.toLowerCase()).toMatch(/nginx-test/);
  });
});

test.describe('Workloads Tab - Deployment Restart Accessibility', () => {
  test('should have proper accessibility for Restart button', async ({ page }) => {
    // Tests ARIA attributes and keyboard accessibility for Restart button

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

    // Assert: Restart button should have role="button"
    const restartButton = nginxDeploymentCard.getByTestId('restart-button');
    const buttonRole = await restartButton.getAttribute('role');
    expect(buttonRole === 'button' || await restartButton.evaluate(el => el.tagName.toLowerCase() === 'button')).toBe(true);

    // Assert: Button should have descriptive aria-label or text
    const ariaLabel = await restartButton.getAttribute('aria-label');
    const buttonText = await restartButton.innerText();
    const hasAccessibleName = !!(ariaLabel || buttonText.length > 0);
    expect(hasAccessibleName).toBe(true);
  });

  test('should have proper accessibility for confirmation dialog', async ({ page }) => {
    // Tests ARIA attributes for confirmation dialog

    // Arrange: Navigate to the Workloads page
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Get the nginx-test deployment card and open dialog
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

    // Assert: Dialog should have role="dialog" or role="alertdialog"
    const dialogRole = await confirmDialog.getAttribute('role');
    expect(dialogRole === 'dialog' || dialogRole === 'alertdialog').toBe(true);

    // Assert: Dialog should have aria-modal="true" for modal dialogs
    const ariaModal = await confirmDialog.getAttribute('aria-modal');
    expect(ariaModal).toBe('true');

    // Assert: Dialog should have aria-labelledby or aria-label
    const ariaLabelledBy = await confirmDialog.getAttribute('aria-labelledby');
    const ariaLabel = await confirmDialog.getAttribute('aria-label');
    expect(ariaLabelledBy || ariaLabel).toBeTruthy();
  });
});
