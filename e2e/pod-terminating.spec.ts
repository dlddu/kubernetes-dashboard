import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Pod Terminating Status
 *
 * These tests verify that pods in "Terminating" state (deletionTimestamp set)
 * are correctly displayed with "Terminating" status in the dashboard.
 *
 * Test Fixtures:
 * - terminating-pod.yaml: A pod with terminationGracePeriodSeconds=3600
 *   that is deleted during fixture setup, remaining in Terminating state.
 */

test.describe('Pod Terminating Status - Pods Page', () => {
  test('should display Terminating status for a pod being deleted', async ({ page }) => {
    // Tests that a pod with deletionTimestamp set shows "Terminating" status

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get all pod cards
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Act: Search for the terminating-test-pod
    let foundTerminatingPod = false;
    for (let i = 0; i < cardCount; i++) {
      const podCard = podCards.nth(i);
      const podName = await podCard.getByTestId('pod-name').innerText();

      if (podName === 'terminating-test-pod') {
        foundTerminatingPod = true;

        // Assert: Status badge should show "Terminating"
        const statusBadge = podCard.getByTestId('status-badge');
        const statusText = await statusBadge.innerText();
        expect(statusText).toBe('Terminating');
        break;
      }
    }

    // Assert: The terminating pod should be found in the pod list
    expect(foundTerminatingPod).toBe(true);
  });

  test('should display warning-style badge for Terminating status', async ({ page }) => {
    // Tests that Terminating pods show warning-style (yellow) status badge

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get all pod cards and find the terminating pod
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();

    for (let i = 0; i < cardCount; i++) {
      const podCard = podCards.nth(i);
      const statusBadge = podCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      if (statusText === 'Terminating') {
        // Assert: Status badge should have warning/yellow styling
        const badgeClasses = await statusBadge.getAttribute('class');
        expect(badgeClasses).toMatch(/yellow/i);
        return;
      }
    }

    // If no Terminating pod found, fail the test
    expect(false).toBe(true);
  });

  test('should display terminating pod in dashboard-test namespace', async ({ page }) => {
    // Tests that the terminating pod shows correct namespace

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Find the terminating-test-pod
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();

    for (let i = 0; i < cardCount; i++) {
      const podCard = podCards.nth(i);
      const podName = await podCard.getByTestId('pod-name').innerText();

      if (podName === 'terminating-test-pod') {
        // Assert: Pod should be in dashboard-test namespace
        const podNamespace = podCard.getByTestId('pod-namespace');
        await expect(podNamespace).toBeVisible();
        const namespaceText = await podNamespace.innerText();
        expect(namespaceText).toBe('dashboard-test');
        return;
      }
    }

    // If not found, fail the test
    expect(false).toBe(true);
  });
});

test.describe('Pod Terminating Status - Unhealthy Pods', () => {
  test('should include terminating pod in unhealthy pods list', async ({ page }) => {
    // Tests that a terminating pod is considered unhealthy and appears
    // in the unhealthy pods section on the overview page

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the UnhealthyPodPreview component
    const unhealthyPodPreview = page.getByTestId('unhealthy-pod-preview');
    await expect(unhealthyPodPreview).toBeVisible();

    // Act: Check if the terminating pod appears in unhealthy pod items
    // or can be found via the "view more" link on the Pods page
    const unhealthyPodItems = unhealthyPodPreview.getByTestId('unhealthy-pod-item');
    const itemCount = await unhealthyPodItems.count();

    let foundInPreview = false;
    for (let i = 0; i < itemCount; i++) {
      const podItem = unhealthyPodItems.nth(i);
      const podName = await podItem.getByTestId('unhealthy-pod-name').innerText();
      if (podName === 'terminating-test-pod') {
        foundInPreview = true;

        // Assert: Status badge should show Terminating
        const statusBadge = podItem.getByTestId('status-badge');
        const statusText = await statusBadge.innerText();
        expect(statusText).toBe('Terminating');
        break;
      }
    }

    // If not found in preview (limited to 3), verify via the API directly
    if (!foundInPreview) {
      const response = await page.request.get('/api/pods/unhealthy');
      expect(response.ok()).toBe(true);

      const pods = await response.json();
      const terminatingPod = pods.find(
        (pod: { name: string }) => pod.name === 'terminating-test-pod'
      );

      // Assert: Terminating pod should be in unhealthy pods API response
      expect(terminatingPod).toBeTruthy();
      expect(terminatingPod.status).toBe('Terminating');
    }
  });
});

test.describe('Pod Terminating Status - API Verification', () => {
  test('should return Terminating status from /api/pods/all endpoint', async ({ page }) => {
    // Tests that the API correctly returns "Terminating" for pods with deletionTimestamp

    // Arrange: Fetch all pods from the API
    const response = await page.request.get('/api/pods/all');
    expect(response.ok()).toBe(true);

    const pods = await response.json();

    // Act: Find the terminating-test-pod
    const terminatingPod = pods.find(
      (pod: { name: string }) => pod.name === 'terminating-test-pod'
    );

    // Assert: Pod should exist and have Terminating status
    expect(terminatingPod).toBeTruthy();
    expect(terminatingPod.status).toBe('Terminating');
    expect(terminatingPod.namespace).toBe('dashboard-test');
  });

  test('should return Terminating status from /api/pods/unhealthy endpoint', async ({ page }) => {
    // Tests that terminating pods are included in the unhealthy pods endpoint

    // Arrange: Fetch unhealthy pods from the API
    const response = await page.request.get('/api/pods/unhealthy');
    expect(response.ok()).toBe(true);

    const pods = await response.json();

    // Act: Find the terminating-test-pod
    const terminatingPod = pods.find(
      (pod: { name: string }) => pod.name === 'terminating-test-pod'
    );

    // Assert: Terminating pod should be in unhealthy pods list
    expect(terminatingPod).toBeTruthy();
    expect(terminatingPod.status).toBe('Terminating');
  });

  test('should return Terminating status when filtering by namespace', async ({ page }) => {
    // Tests that namespace filtering works correctly for terminating pods

    // Arrange: Fetch pods filtered by dashboard-test namespace
    const response = await page.request.get('/api/pods/all?ns=dashboard-test');
    expect(response.ok()).toBe(true);

    const pods = await response.json();

    // Act: Find the terminating-test-pod
    const terminatingPod = pods.find(
      (pod: { name: string }) => pod.name === 'terminating-test-pod'
    );

    // Assert: Pod should exist with Terminating status in namespace-filtered results
    expect(terminatingPod).toBeTruthy();
    expect(terminatingPod.status).toBe('Terminating');
  });
});
