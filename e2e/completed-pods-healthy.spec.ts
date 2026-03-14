import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Completed (Succeeded) Pods Health Status
 *
 * Verifies the fix: completed pods (phase=Succeeded) should be treated as healthy
 * and must NOT appear in the unhealthy pods list.
 *
 * Test Fixtures:
 * - completed-pod.yaml: A pod with restartPolicy=Never that exits 0 (Succeeded phase)
 * - unhealthy-pod.yaml: 4 unhealthy pods in dashboard-test namespace (ImagePullBackOff)
 */

test.describe('Completed Pods - API Health Classification', () => {
  test('should not include completed (Succeeded) pods in unhealthy pods endpoint', async ({ request }) => {
    // Act: Fetch unhealthy pods from the API
    const response = await request.get('/api/pods/unhealthy?ns=dashboard-test');

    // Assert: Response should be successful
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const unhealthyPods = await response.json();
    expect(Array.isArray(unhealthyPods)).toBeTruthy();

    // Assert: completed-job-pod should NOT appear in unhealthy pods
    const completedPod = unhealthyPods.find(
      (pod: { name: string }) => pod.name === 'completed-job-pod'
    );
    expect(completedPod).toBeUndefined();
  });

  test('should include completed (Succeeded) pods in all pods endpoint', async ({ request }) => {
    // Act: Fetch all pods from the API
    const response = await request.get('/api/pods/all?ns=dashboard-test');

    // Assert: Response should be successful
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const allPods = await response.json();
    expect(Array.isArray(allPods)).toBeTruthy();

    // Assert: completed-job-pod should appear in all pods list
    const completedPod = allPods.find(
      (pod: { name: string }) => pod.name === 'completed-job-pod'
    );
    expect(completedPod).toBeDefined();

    // Assert: Status should be "Succeeded" (not "Completed" or other)
    expect(completedPod.status).toBe('Succeeded');
  });

  test('should still include truly unhealthy pods in unhealthy pods endpoint', async ({ request }) => {
    // Act: Fetch unhealthy pods from the API
    const response = await request.get('/api/pods/unhealthy?ns=dashboard-test');

    // Assert: Response should be successful
    expect(response.ok()).toBeTruthy();
    const unhealthyPods = await response.json();

    // Assert: ImagePullBackOff pods should still appear as unhealthy
    const unhealthyTestPods = unhealthyPods.filter(
      (pod: { name: string }) => pod.name.startsWith('unhealthy-test-pod-')
    );
    expect(unhealthyTestPods.length).toBe(4);

    // Assert: Each unhealthy pod should have ImagePullBackOff status
    for (const pod of unhealthyTestPods) {
      expect(pod.status).toMatch(/ImagePullBackOff|ErrImagePull/);
    }
  });
});

test.describe('Completed Pods - UI Display', () => {
  test('should not show completed pods in UnhealthyPodPreview', async ({ page }) => {
    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the UnhealthyPodPreview component
    const unhealthyPodPreview = page.getByTestId('unhealthy-pod-preview');
    await expect(unhealthyPodPreview).toBeVisible();

    // Act: Get all unhealthy pod items
    const unhealthyPodItems = unhealthyPodPreview.getByTestId('unhealthy-pod-item');
    const itemCount = await unhealthyPodItems.count();

    // Assert: None of the unhealthy pod items should be the completed pod
    for (let i = 0; i < itemCount; i++) {
      const podItem = unhealthyPodItems.nth(i);
      const podName = podItem.getByTestId('unhealthy-pod-name');
      const nameText = await podName.innerText();
      expect(nameText).not.toBe('completed-job-pod');
    }
  });

  test('should show completed pods with Succeeded status in Pods page', async ({ page }) => {
    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get all pod cards
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();

    // Act: Find the completed-job-pod card
    let foundCompletedPod = false;
    for (let i = 0; i < cardCount; i++) {
      const podCard = podCards.nth(i);
      const podName = podCard.getByTestId('pod-name');
      const nameText = await podName.innerText();

      if (nameText === 'completed-job-pod') {
        foundCompletedPod = true;

        // Assert: Status badge should show "Succeeded"
        const statusBadge = podCard.getByTestId('status-badge');
        await expect(statusBadge).toBeVisible();
        const statusText = await statusBadge.innerText();
        expect(statusText).toBe('Succeeded');
        break;
      }
    }

    // Assert: Completed pod should be found in the all pods list
    expect(foundCompletedPod).toBe(true);
  });
});
