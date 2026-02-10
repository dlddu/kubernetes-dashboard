import { test, expect } from '@playwright/test';

/**
 * E2E Tests for UnhealthyPodPreview Component (DLD-325)
 *
 * TDD Red Phase: All tests are skipped until component is implemented.
 * These tests define the expected behavior of the UnhealthyPodPreview component.
 */
test.describe.skip('UnhealthyPodPreview Component', () => {
  test('should display up to 3 unhealthy pods in preview', async ({ page }) => {
    // Tests that UnhealthyPodPreview component limits display to maximum 3 pods

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the UnhealthyPodPreview component
    const unhealthyPodPreview = page.getByTestId('unhealthy-pod-preview');
    await expect(unhealthyPodPreview).toBeVisible();

    // Assert: Should display maximum 3 unhealthy pod items
    const unhealthyPodItems = unhealthyPodPreview.getByTestId('unhealthy-pod-item');
    const itemCount = await unhealthyPodItems.count();

    // Should show at least 1 pod (assuming test environment has unhealthy pods)
    // but no more than 3 pods
    expect(itemCount).toBeGreaterThanOrEqual(1);
    expect(itemCount).toBeLessThanOrEqual(3);

    // Assert: Each pod item should be visible
    const podItems = await unhealthyPodItems.all();
    for (const item of podItems) {
      await expect(item).toBeVisible();
    }
  });

  test('should display pod name, namespace, and status badge for each unhealthy pod', async ({ page }) => {
    // Tests that each pod item displays all required information

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the UnhealthyPodPreview component
    const unhealthyPodPreview = page.getByTestId('unhealthy-pod-preview');
    await expect(unhealthyPodPreview).toBeVisible();

    // Act: Get all unhealthy pod items
    const unhealthyPodItems = unhealthyPodPreview.getByTestId('unhealthy-pod-item');
    const itemCount = await unhealthyPodItems.count();

    // Assert: Should have at least 1 pod item to test
    expect(itemCount).toBeGreaterThanOrEqual(1);

    // Assert: Check each pod item has name, namespace, and status badge
    const firstPodItem = unhealthyPodItems.first();

    // Assert: Pod name should be visible
    const podName = firstPodItem.getByTestId('unhealthy-pod-name');
    await expect(podName).toBeVisible();
    const podNameText = await podName.innerText();
    expect(podNameText.length).toBeGreaterThan(0);

    // Assert: Pod namespace should be visible
    const podNamespace = firstPodItem.getByTestId('unhealthy-pod-namespace');
    await expect(podNamespace).toBeVisible();
    const podNamespaceText = await podNamespace.innerText();
    expect(podNamespaceText.length).toBeGreaterThan(0);

    // Assert: Status badge should be visible
    const statusBadge = firstPodItem.getByTestId('status-badge');
    await expect(statusBadge).toBeVisible();
    const statusText = await statusBadge.innerText();
    expect(statusText.length).toBeGreaterThan(0);

    // Assert: Status should indicate unhealthy state (e.g., "Failed", "Pending", "CrashLoopBackOff")
    expect(statusText).not.toBe('Running');
  });

  test('should display "all pods healthy" message when no unhealthy pods exist', async ({ page }) => {
    // Tests empty state when all pods are healthy

    // Note: This test requires a test environment with all healthy pods
    // or mocking the API response to return no unhealthy pods

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the UnhealthyPodPreview component
    const unhealthyPodPreview = page.getByTestId('unhealthy-pod-preview');
    await expect(unhealthyPodPreview).toBeVisible();

    // Act: Check if there are any unhealthy pod items
    const unhealthyPodItems = unhealthyPodPreview.getByTestId('unhealthy-pod-item');
    const itemCount = await unhealthyPodItems.count();

    // Assert: When no unhealthy pods exist, should show "all pods healthy" message
    if (itemCount === 0) {
      const allPodsHealthyMessage = unhealthyPodPreview.getByTestId('all-pods-healthy-message');
      await expect(allPodsHealthyMessage).toBeVisible();

      // Assert: Message should contain positive/healthy language
      const messageText = await allPodsHealthyMessage.innerText();
      expect(messageText.toLowerCase()).toMatch(/all|healthy|running|good/);
    } else {
      // If unhealthy pods exist, message should not be visible
      const allPodsHealthyMessage = unhealthyPodPreview.getByTestId('all-pods-healthy-message');
      await expect(allPodsHealthyMessage).not.toBeVisible();
    }
  });

  test('should navigate to Pods tab when "view more" link is clicked', async ({ page }) => {
    // Tests navigation from UnhealthyPodPreview to Pods tab

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the UnhealthyPodPreview component
    const unhealthyPodPreview = page.getByTestId('unhealthy-pod-preview');
    await expect(unhealthyPodPreview).toBeVisible();

    // Act: Locate the "view more" link
    const viewMoreLink = unhealthyPodPreview.getByTestId('view-more-link')
      .or(unhealthyPodPreview.getByRole('link', { name: /view more|see all|more pods/i }));
    await expect(viewMoreLink).toBeVisible();

    // Assert: Link should be clickable
    await expect(viewMoreLink).toBeEnabled();

    // Act: Click the "view more" link
    await viewMoreLink.click();

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');

    // Assert: Should navigate to Pods tab/page
    // URL should change to include "pods" route
    const currentUrl = page.url();
    expect(currentUrl.toLowerCase()).toContain('pods');

    // Assert: Pods tab should be active/visible
    const podsTab = page.getByTestId('pods-tab')
      .or(page.getByRole('tab', { name: /pods/i, selected: true }))
      .or(page.getByRole('heading', { name: /pods/i }));
    await expect(podsTab).toBeVisible();
  });
});
