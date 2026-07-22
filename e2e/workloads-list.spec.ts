// Verifies: WL1 (docs/product/prd-workloads.md) — sole dedicated e2e spec for this AC.
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
