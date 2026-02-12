import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Deployment Restart Feature
 *
 * TDD Red Phase: Tests written - components not yet implemented.
 * These tests define the expected behavior of the Deployment restart functionality,
 * including displaying deployment cards, showing deployment information, and handling
 * restart confirmation dialog interactions.
 *
 * Test Fixture: nginx-test Deployment in dashboard-test namespace (2 replicas)
 * This fixture is applied to the Kind cluster before tests run.
 */

test.describe('Workloads Tab - Deployment Card Display', () => {
  test('should display workloads page when navigating to /workloads', async ({ page }) => {
    // Tests that Workloads page is accessible and renders correctly

    // Arrange: Navigate to the Workloads page
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Assert: Workloads page should be visible
    const workloadsPage = page.getByTestId('workloads-page');
    await expect(workloadsPage).toBeVisible();

    // Assert: Page should have appropriate title/heading
    const pageHeading = page.getByRole('heading', { name: /workloads/i });
    await expect(pageHeading).toBeVisible();
  });

  test('should display deployment cards for all cluster deployments', async ({ page }) => {
    // Tests that DeploymentCard components are rendered for each deployment

    // Arrange: Navigate to the Workloads page
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Locate the workloads page container
    const workloadsPage = page.getByTestId('workloads-page');
    await expect(workloadsPage).toBeVisible();

    // Assert: Should display at least one deployment card (nginx-test fixture)
    const deploymentCards = page.getByTestId('deployment-card');
    const cardCount = await deploymentCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: First deployment card should be visible
    await expect(deploymentCards.first()).toBeVisible();
  });

  test('should display nginx-test deployment from test fixture', async ({ page }) => {
    // Tests that the test fixture deployment (nginx-test) is displayed

    // Arrange: Navigate to the Workloads page
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Get all deployment cards
    const deploymentCards = page.getByTestId('deployment-card');
    const cardCount = await deploymentCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Act: Search for nginx-test deployment
    let foundNginxDeployment = false;
    for (let i = 0; i < cardCount; i++) {
      const deploymentCard = deploymentCards.nth(i);
      const deploymentName = deploymentCard.getByTestId('deployment-name');
      const nameText = await deploymentName.innerText();

      // Assert: If nginx-test deployment found
      if (nameText === 'nginx-test') {
        foundNginxDeployment = true;
        await expect(deploymentCard).toBeVisible();
        break;
      }
    }

    // Assert: nginx-test deployment should exist in the cluster
    expect(foundNginxDeployment).toBe(true);
  });
});

test.describe('Workloads Tab - DeploymentCard Information Display', () => {
  test('should display deployment name in DeploymentCard', async ({ page }) => {
    // Tests that DeploymentCard displays the deployment name

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

    // Assert: Deployment name should be visible
    const deploymentName = nginxDeploymentCard.getByTestId('deployment-name');
    await expect(deploymentName).toBeVisible();

    // Assert: Deployment name should be nginx-test
    const nameText = await deploymentName.innerText();
    expect(nameText).toBe('nginx-test');
  });

  test('should display deployment namespace in DeploymentCard', async ({ page }) => {
    // Tests that DeploymentCard displays the deployment namespace

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

    // Assert: Deployment namespace should be visible
    const deploymentNamespace = nginxDeploymentCard.getByTestId('deployment-namespace');
    await expect(deploymentNamespace).toBeVisible();

    // Assert: Deployment namespace should be dashboard-test
    const namespaceText = await deploymentNamespace.innerText();
    expect(namespaceText).toBe('dashboard-test');
  });

  test('should display deployment ready ratio in DeploymentCard', async ({ page }) => {
    // Tests that DeploymentCard displays the ready/total replica ratio

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

    // Assert: Deployment ready ratio should be visible
    const deploymentReady = nginxDeploymentCard.getByTestId('deployment-ready');
    await expect(deploymentReady).toBeVisible();

    // Assert: Ready ratio should be 2/2 (fixture has 2 replicas)
    const readyText = await deploymentReady.innerText();
    expect(readyText).toMatch(/2\/2/);
  });

  test('should display all deployment information together', async ({ page }) => {
    // Tests that DeploymentCard displays name, namespace, and ready ratio together

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

    // Assert: All information elements should be visible
    const deploymentName = nginxDeploymentCard.getByTestId('deployment-name');
    const deploymentNamespace = nginxDeploymentCard.getByTestId('deployment-namespace');
    const deploymentReady = nginxDeploymentCard.getByTestId('deployment-ready');

    await expect(deploymentName).toBeVisible();
    await expect(deploymentNamespace).toBeVisible();
    await expect(deploymentReady).toBeVisible();

    // Assert: Verify values are correct
    expect(await deploymentName.innerText()).toBe('nginx-test');
    expect(await deploymentNamespace.innerText()).toBe('dashboard-test');
    expect(await deploymentReady.innerText()).toMatch(/2\/2/);
  });
});

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
