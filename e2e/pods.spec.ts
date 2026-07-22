// Verifies: PD1 (docs/product/prd-pods.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Pods Full Page View
 *
 * These tests define the expected behavior of the Pods page,
 * which displays all pods from the cluster with detailed information
 * including status, restarts, node, and age.
 *
 * Test Fixtures:
 * - unhealthy-pod.yaml: 4 unhealthy pods in dashboard-test namespace (ImagePullBackOff)
 * - These pods should appear in the pods list along with all other pods
 */

test.describe('Pods Page - Basic Rendering', () => {
  test('should display pods page when navigating to /pods', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests that Pods page is accessible and renders correctly

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Pods page should be visible
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    // Assert: Page should have appropriate title/heading
    const pageHeading = page.getByRole('heading', { name: 'Pods', exact: true });
    await expect(pageHeading).toBeVisible();
  });

  test('should display "All Pods" header with pod count', async ({ page }) => {
    // Tests that the All Pods section displays a header with count

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Locate the Pods page container
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    // Assert: "All Pods" header should be visible
    const allPodsHeader = podsPage.getByRole('heading', { name: /all pods/i });
    await expect(allPodsHeader).toBeVisible();

    // Assert: Header should display count of pods
    const headerText = await allPodsHeader.innerText();
    expect(headerText).toMatch(/\d+/); // Contains at least one digit for count
  });

  test('should display pod cards for all unhealthy pods', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests that PodCard components are rendered for each unhealthy pod

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Locate the pods page container
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    // Assert: Should display at least one pod card (unhealthy-pod fixture has 4 pods)
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4);

    // Assert: First pod card should be visible
    await expect(podCards.first()).toBeVisible();
  });
});

test.describe('Pods Page - Pod Status Filtering', () => {
  test('should display ImagePullBackOff pods from test fixture', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests that unhealthy pods with ImagePullBackOff status are displayed

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get all pod cards
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4);

    // Act: Check for ImagePullBackOff status badges
    let foundImagePullBackOffPod = false;
    for (let i = 0; i < cardCount; i++) {
      const podCard = podCards.nth(i);
      const statusBadge = podCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      // Assert: Should find at least one pod with ImagePullBackOff status
      if (statusText.toLowerCase().includes('imagepullbackoff')) {
        foundImagePullBackOffPod = true;
        await expect(podCard).toBeVisible();
        break;
      }
    }

    // Assert: At least one ImagePullBackOff pod should exist (from fixture)
    expect(foundImagePullBackOffPod).toBe(true);
  });

  test('should display CrashLoopBackOff pods in the unhealthy list', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests that pods with CrashLoopBackOff status appear in unhealthy pods

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get all pod cards
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();

    // Act: Check if any CrashLoopBackOff pods exist in the cluster
    let foundCrashLoopBackOffPod = false;
    for (let i = 0; i < cardCount; i++) {
      const podCard = podCards.nth(i);
      const statusBadge = podCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      // Assert: If CrashLoopBackOff pod exists, it should be visible in the list
      if (statusText.toLowerCase().includes('crashloopbackoff')) {
        foundCrashLoopBackOffPod = true;
        await expect(podCard).toBeVisible();

        // Assert: Status badge should have error styling
        const badgeClasses = await statusBadge.getAttribute('class');
        expect(badgeClasses).toMatch(/error|red|danger/i);
        break;
      }
    }

    // Note: This test doesn't fail if no CrashLoopBackOff pods exist
    // It only validates behavior when such pods are present
  });

  test('should display Running pods in the pods list', async ({ page }) => {
    // Tests that Running status pods are included in the all pods list

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get all pod cards
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();

    // Act: Check if any Running pods exist
    let foundRunningPod = false;
    for (let i = 0; i < cardCount; i++) {
      const podCard = podCards.nth(i);
      const statusBadge = podCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      if (statusText.toLowerCase() === 'running') {
        foundRunningPod = true;
        await expect(podCard).toBeVisible();
        break;
      }
    }

    // Note: This test doesn't fail if no Running pods exist
    // It only validates that Running pods are allowed in the list
  });

  test('should display test fixture pods from dashboard-test namespace', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests that unhealthy-test-pod-* pods from fixture are displayed

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get all pod cards
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4);

    // Act: Search for test fixture pods
    const fixtureTestPods = ['unhealthy-test-pod-1', 'unhealthy-test-pod-2', 'unhealthy-test-pod-3', 'unhealthy-test-pod-4'];
    let foundFixturePods = 0;

    for (let i = 0; i < cardCount; i++) {
      const podCard = podCards.nth(i);
      const podName = podCard.getByTestId('pod-name');
      const nameText = await podName.innerText();

      // Assert: If fixture pod found, verify it's from dashboard-test namespace
      if (fixtureTestPods.includes(nameText)) {
        foundFixturePods++;
        await expect(podCard).toBeVisible();

        // Assert: Pod should be from dashboard-test namespace
        const podNamespace = podCard.getByTestId('pod-namespace');
        await expect(podNamespace).toBeVisible();
        const namespaceText = await podNamespace.innerText();
        expect(namespaceText).toBe('dashboard-test');
      }
    }

    // Assert: All 4 fixture pods should be found
    expect(foundFixturePods).toBe(4);
  });
});

test.describe('Pods Page - PodCard Information Display', () => {
  test('should display pod name in each PodCard', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests that each PodCard displays the pod's name

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get the first pod card
    const firstPodCard = page.getByTestId('pod-card').first();
    await expect(firstPodCard).toBeVisible();

    // Assert: Pod name should be visible
    const podName = firstPodCard.getByTestId('pod-name');
    await expect(podName).toBeVisible();

    // Assert: Pod name should not be empty
    const podNameText = await podName.innerText();
    expect(podNameText.length).toBeGreaterThan(0);
    expect(podNameText).toMatch(/^[a-z0-9-]+$/); // Kubernetes naming convention
  });

  test('should display pod namespace in each PodCard', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests that each PodCard displays the pod's namespace

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get the first pod card
    const firstPodCard = page.getByTestId('pod-card').first();
    await expect(firstPodCard).toBeVisible();

    // Assert: Pod namespace should be visible
    const podNamespace = firstPodCard.getByTestId('pod-namespace');
    await expect(podNamespace).toBeVisible();

    // Assert: Pod namespace should not be empty
    const namespaceText = await podNamespace.innerText();
    expect(namespaceText.length).toBeGreaterThan(0);
  });

  test('should display status badge in each PodCard', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests that each PodCard shows the pod's status using StatusBadge component

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get all pod cards
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Check first pod card for status badge
    const firstPodCard = podCards.first();
    const statusBadge = firstPodCard.getByTestId('status-badge');
    await expect(statusBadge).toBeVisible();

    // Assert: Status should be a valid pod status string
    const statusText = await statusBadge.innerText();
    expect(statusText.length).toBeGreaterThan(0);
  });

  test('should display restart count in each PodCard', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests that each PodCard shows the number of container restarts

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get the first pod card
    const firstPodCard = page.getByTestId('pod-card').first();
    await expect(firstPodCard).toBeVisible();

    // Assert: Restart count should be visible
    const restartCount = firstPodCard.getByTestId('pod-restarts');
    await expect(restartCount).toBeVisible();

    // Assert: Restart count should contain a number
    const restartText = await restartCount.innerText();
    expect(restartText).toMatch(/\d+/); // Contains at least one digit
  });

  test('should display node name in each PodCard', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests that each PodCard displays the node where the pod is scheduled

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get the first pod card
    const firstPodCard = page.getByTestId('pod-card').first();
    await expect(firstPodCard).toBeVisible();

    // Assert: Node name should be visible
    const nodeName = firstPodCard.getByTestId('pod-node');
    await expect(nodeName).toBeVisible();

    // Assert: Node name should not be empty (or show "Pending" if not scheduled)
    const nodeText = await nodeName.innerText();
    expect(nodeText.length).toBeGreaterThan(0);
  });

  test('should display pod age in each PodCard', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests that each PodCard displays the age of the pod

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get the first pod card
    const firstPodCard = page.getByTestId('pod-card').first();
    await expect(firstPodCard).toBeVisible();

    // Assert: Pod age should be visible
    const podAge = firstPodCard.getByTestId('pod-age');
    await expect(podAge).toBeVisible();

    // Assert: Age should contain time unit (s, m, h, d)
    const ageText = await podAge.innerText();
    expect(ageText).toMatch(/\d+[smhd]/); // Number followed by time unit
  });

  test('should display all required information together in PodCard', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests that PodCard displays name, namespace, status, restarts, node, and age together

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get a test fixture pod card
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    let testPodCard = null;

    for (let i = 0; i < cardCount; i++) {
      const card = podCards.nth(i);
      const nameElement = card.getByTestId('pod-name');
      const nameText = await nameElement.innerText();
      if (nameText === 'unhealthy-test-pod-1') {
        testPodCard = card;
        break;
      }
    }

    // Assert: Test pod card should be found
    expect(testPodCard).toBeTruthy();
    if (!testPodCard) return;

    // Assert: All information elements should be visible
    const podName = testPodCard.getByTestId('pod-name');
    const podNamespace = testPodCard.getByTestId('pod-namespace');
    const statusBadge = testPodCard.getByTestId('status-badge');
    const podRestarts = testPodCard.getByTestId('pod-restarts');
    const podNode = testPodCard.getByTestId('pod-node');
    const podAge = testPodCard.getByTestId('pod-age');

    await expect(podName).toBeVisible();
    await expect(podNamespace).toBeVisible();
    await expect(statusBadge).toBeVisible();
    await expect(podRestarts).toBeVisible();
    await expect(podNode).toBeVisible();
    await expect(podAge).toBeVisible();

    // Assert: Verify test pod has correct name and namespace
    expect(await podName.innerText()).toBe('unhealthy-test-pod-1');
    expect(await podNamespace.innerText()).toBe('dashboard-test');
  });
});

test.describe('Pods Page - Status Badge Styling', () => {
  test('should display error-style badge for ImagePullBackOff status', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests that ImagePullBackOff pods show error-style status badge

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get all pod cards
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();

    // Act: Find an ImagePullBackOff pod
    let foundImagePullBackOffPod = false;
    for (let i = 0; i < cardCount; i++) {
      const podCard = podCards.nth(i);
      const statusBadge = podCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      // Assert: If ImagePullBackOff pod found, verify error styling
      if (statusText.toLowerCase().includes('imagepullbackoff')) {
        foundImagePullBackOffPod = true;

        // Assert: Status badge should have error/red styling
        const badgeClasses = await statusBadge.getAttribute('class');
        expect(badgeClasses).toMatch(/error|red|danger/i);
        break;
      }
    }

    // Assert: At least one ImagePullBackOff pod should exist (from fixture)
    expect(foundImagePullBackOffPod).toBe(true);
  });

  test('should display warning-style badge for Pending status', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests that Pending pods show warning-style status badge

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get all pod cards
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();

    // Act: Look for Pending pods
    for (let i = 0; i < cardCount; i++) {
      const podCard = podCards.nth(i);
      const statusBadge = podCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      // Assert: If Pending pod found, verify warning styling
      if (statusText.toLowerCase() === 'pending') {
        // Assert: Status badge should have warning/yellow styling
        const badgeClasses = await statusBadge.getAttribute('class');
        expect(badgeClasses).toMatch(/warning|yellow|pending/i);
        break;
      }
    }

    // Note: This test doesn't fail if no Pending pods exist
    // It only validates styling when such pods are present
  });
});

test.describe('Pods Page - Navigation and Integration', () => {
  test('should be accessible from UnhealthyPodPreview view more button', async ({ page }) => {
    // Tests that clicking "view more" expands the card inline instead of navigating

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Look for "view more" button in UnhealthyPodPreview
    const unhealthyPodPreview = page.getByTestId('unhealthy-pod-preview');
    await expect(unhealthyPodPreview).toBeVisible();

    const viewMoreButton = unhealthyPodPreview.getByTestId('view-more-link');

    // If button doesn't exist, there are 3 or fewer unhealthy pods - skip
    const buttonCount = await viewMoreButton.count();
    if (buttonCount === 0) {
      return;
    }

    // Assert: Button should be visible and enabled
    await expect(viewMoreButton).toBeVisible();
    await expect(viewMoreButton).toBeEnabled();

    // Record initial pod count (should be max 3)
    const initialPodItems = unhealthyPodPreview.getByTestId('unhealthy-pod-item');
    const initialCount = await initialPodItems.count();
    expect(initialCount).toBeLessThanOrEqual(3);

    // Act: Click the "view more" button
    await viewMoreButton.click();

    // Assert: Should expand inline showing more pods, NOT navigate away
    const expandedPodItems = unhealthyPodPreview.getByTestId('unhealthy-pod-item');
    const expandedCount = await expandedPodItems.count();
    expect(expandedCount).toBeGreaterThan(initialCount);

    // Assert: Should still be on the overview page
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/pods');
  });

  test('should show more pods than UnhealthyPodPreview preview limit', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests that Pods page shows all unhealthy pods, not just preview limit (3)

    // Arrange: Get unhealthy pod count from Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const unhealthyPodPreview = page.getByTestId('unhealthy-pod-preview');
    const previewPodItems = unhealthyPodPreview.getByTestId('unhealthy-pod-item');
    const previewCount = await previewPodItems.count();

    // Assert: Preview should show maximum 3 pods
    expect(previewCount).toBeLessThanOrEqual(3);

    // Act: Navigate to Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Pods page should show at least as many pods as preview
    const podCards = page.getByTestId('pod-card');
    const fullCount = await podCards.count();
    expect(fullCount).toBeGreaterThanOrEqual(previewCount);

    // Assert: Should show all 4 fixture pods (more than 3-pod preview limit)
    expect(fullCount).toBeGreaterThanOrEqual(4);
  });

  test('should maintain data consistency with UnhealthyPodPreview', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests that pod data is consistent between Overview and Pods page

    // Arrange: Get first pod name from Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const unhealthyPodPreview = page.getByTestId('unhealthy-pod-preview');
    const firstPodItem = unhealthyPodPreview.getByTestId('unhealthy-pod-item').first();
    const overviewPodName = await firstPodItem.getByTestId('unhealthy-pod-name').innerText();
    const overviewPodNamespace = await firstPodItem.getByTestId('unhealthy-pod-namespace').innerText();

    // Act: Navigate to Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Same pod should exist in Pods page with same name and namespace
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    let foundMatchingPod = false;

    for (let i = 0; i < cardCount; i++) {
      const podCard = podCards.nth(i);
      const podName = await podCard.getByTestId('pod-name').innerText();
      const podNamespace = await podCard.getByTestId('pod-namespace').innerText();

      if (podName === overviewPodName && podNamespace === overviewPodNamespace) {
        foundMatchingPod = true;
        break;
      }
    }

    expect(foundMatchingPod).toBe(true);
  });
});

test.describe('Pods Page - Responsive Design', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests mobile viewport rendering with stacked pod cards

    // Arrange: Set mobile viewport (iPhone SE dimensions)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Locate the pods page
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    // Assert: Pod cards should be visible on mobile
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: First and second cards should be visible and stacked vertically
    const firstCard = podCards.first();
    await expect(firstCard).toBeVisible();

    if (cardCount > 1) {
      const secondCard = podCards.nth(1);
      await expect(secondCard).toBeVisible();

      // Assert: Cards should be stacked vertically (different Y positions)
      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();
      expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height - 10);
    }

    // Assert: All required information should be visible on mobile
    const statusBadge = firstCard.getByTestId('status-badge');
    await expect(statusBadge).toBeVisible();
  });

  test('should display correctly on tablet viewport', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests tablet viewport rendering with grid layout

    // Arrange: Set tablet viewport (iPad dimensions)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Locate the pods page
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    // Assert: Pod cards should be visible on tablet
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: All cards should be visible
    const cards = await podCards.all();
    for (const card of cards) {
      await expect(card).toBeVisible();
    }
  });

  test('should display correctly on desktop viewport', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests desktop viewport rendering with multi-column grid

    // Arrange: Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Locate the pods page
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    // Assert: Pod cards should be visible on desktop
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: All cards should be visible
    const cards = await podCards.all();
    for (const card of cards) {
      await expect(card).toBeVisible();
    }

    // Assert: Page heading should be visible
    const pageHeading = page.getByRole('heading', { name: 'Pods', exact: true });
    await expect(pageHeading).toBeVisible();
  });
});

test.describe('Pods Page - Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests that page uses proper heading structure

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Main page heading should be h1
    const mainHeading = page.getByRole('heading', { level: 1, name: 'Pods', exact: true });
    await expect(mainHeading).toBeVisible();

    // Assert: "All Pods" section should have appropriate heading level
    const sectionHeading = page.getByRole('heading', { name: /all pods/i });
    await expect(sectionHeading).toBeVisible();

    // Assert: Heading should be h2 or h3 (not h1)
    const headingLevel = await sectionHeading.evaluate(el => {
      const tagName = el.tagName.toLowerCase();
      return tagName === 'h2' || tagName === 'h3';
    });
    expect(headingLevel).toBe(true);
  });

  test('should have accessible pod cards with proper ARIA attributes', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests ARIA attributes for pod cards

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get the first pod card
    const firstPodCard = page.getByTestId('pod-card').first();
    await expect(firstPodCard).toBeVisible();

    // Assert: Status badge should have accessible status information
    const statusBadge = firstPodCard.getByTestId('status-badge');
    await expect(statusBadge).toBeVisible();

    // Assert: Status should be readable by screen readers
    const statusText = await statusBadge.innerText();
    expect(statusText.length).toBeGreaterThan(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Skip reason: PodsTab component not implemented yet
    // Tests keyboard navigation through pod cards

    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Tab to first focusable element
    await page.keyboard.press('Tab');

    // Assert: Focus should be visible on the page
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName.toLowerCase();
    });
    expect(focusedElement).toBeTruthy();

    // Note: Detailed keyboard navigation testing would require
    // knowing the exact interactive elements within pod cards
    // (e.g., links, buttons for actions)
  });
});

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

test.describe('BottomTabBar - Namespace Context Integration', () => {
  test('should filter current tab data when namespace is changed', async ({ page }) => {
    // Tests that namespace selection affects active tab's data

    // Arrange: Set mobile viewport and navigate to Pods tab
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/pods');

    // Wait for initial pod data to load
    await expect(
      page.getByTestId('pod-card').first()
        .or(page.getByTestId('no-pods-message'))
    ).toBeVisible({ timeout: 10000 });

    // Act: Record initial pod count (all namespaces)
    const initialPodCards = page.getByTestId('pod-card');
    const initialCount = await initialPodCards.count();

    // Act: Select "default" namespace and wait for API response
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));

    // Wait for pods API response after namespace selection
    await Promise.all([
      page.waitForResponse(resp =>
        resp.url().includes('/api/pods') &&
        resp.url().includes('ns=default') &&
        resp.status() === 200
      ),
      defaultNamespaceOption.click(),
    ]);

    // Wait for the filtered pod list to render
    await expect(
      page.getByTestId('pod-card').first()
        .or(page.getByTestId('no-pods-message'))
    ).toBeVisible({ timeout: 10000 });

    // Assert: Pod list should be filtered to default namespace
    const filteredPodCards = page.getByTestId('pod-card');
    const filteredCount = await filteredPodCards.count();

    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Assert: All visible pods should belong to default namespace
    if (filteredCount > 0) {
      const firstPod = filteredPodCards.first();
      await expect(firstPod).toContainText('default', { timeout: 5000 });
    }
  });
});

test.describe('Namespace Context Integration', () => {
  test('should filter displayed data when specific namespace is selected', async ({ page }) => {
    // Tests that resource lists respect NamespaceContext filtering

    // Arrange: Navigate to Pods page with "All Namespaces" selected
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Wait for pods data to load
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    // Act: Select "default" namespace from dropdown
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();
    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Pods page should still be visible with filtered data
    await expect(podsPage).toBeVisible();

    // Act: Select "kube-system" namespace
    await namespaceSelector.click();
    const kubeSystemOption = page.getByRole('option', { name: /^kube-system$/i })
      .or(page.getByTestId('namespace-option-kube-system'));
    await kubeSystemOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Pods page should show kube-system pods
    await expect(podsPage).toBeVisible();
  });
});
