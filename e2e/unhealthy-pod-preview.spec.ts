import { test, expect } from '@playwright/test';

/**
 * E2E Tests for UnhealthyPodPreview Component (DLD-325)
 *
 * TDD Red Phase: Tests activated - components ready for implementation.
 * These tests define the expected behavior of the UnhealthyPodPreview component.
 */
test.describe('UnhealthyPodPreview Component', () => {
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

  test('should expand card to show all unhealthy pods when "view more" button is clicked', async ({ page }) => {
    // Tests that clicking "view more" expands the card instead of navigating

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the UnhealthyPodPreview component
    const unhealthyPodPreview = page.getByTestId('unhealthy-pod-preview');
    await expect(unhealthyPodPreview).toBeVisible();

    // Act: Locate the "view more" button
    const viewMoreButton = unhealthyPodPreview.getByTestId('view-more-link');

    // Check if the button exists (only visible when more than 3 unhealthy pods)
    const buttonCount = await viewMoreButton.count();
    if (buttonCount === 0) {
      // If no button, there are 3 or fewer unhealthy pods - skip this test
      return;
    }

    await expect(viewMoreButton).toBeVisible();
    await expect(viewMoreButton).toBeEnabled();

    // Record initial pod count (should be max 3)
    const initialPodItems = unhealthyPodPreview.getByTestId('unhealthy-pod-item');
    const initialCount = await initialPodItems.count();
    expect(initialCount).toBeLessThanOrEqual(3);

    // Act: Click the "view more" button
    await viewMoreButton.click();

    // Assert: Should show more pods than before (card expanded)
    const expandedPodItems = unhealthyPodPreview.getByTestId('unhealthy-pod-item');
    const expandedCount = await expandedPodItems.count();
    expect(expandedCount).toBeGreaterThan(initialCount);

    // Assert: Should still be on the same page (URL should NOT change to /pods)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/pods');

    // Assert: Button text should change to "Show less"
    await expect(viewMoreButton).toContainText(/show less/i);

    // Act: Click "Show less" to collapse
    await viewMoreButton.click();

    // Assert: Should collapse back to max 3 pods
    const collapsedPodItems = unhealthyPodPreview.getByTestId('unhealthy-pod-item');
    const collapsedCount = await collapsedPodItems.count();
    expect(collapsedCount).toBeLessThanOrEqual(3);
  });
});
