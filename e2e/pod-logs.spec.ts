import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Pod Containers Field (DLD-697)
 *
 * Tests activated after DLD-698 implementation.
 * These tests define the expected behavior of the containers field
 * added to the PodDetails API response and the container count
 * display on the UnhealthyPodCard UI component.
 *
 * Activation: Remove skip annotations after DLD-698 implementation.
 *
 * Related issues:
 *   DLD-697 - 작업 2-1: [containers 필드] e2e 테스트 작성 (skipped)
 *   DLD-698 - 작업 2-2: [containers 필드] 구현 및 e2e 테스트 활성화
 *   DLD-694 - Pod Log 조회 기능 추가 (parent)
 *
 * Test Fixtures:
 *   - unhealthy-pod.yaml: 4 unhealthy pods in dashboard-test namespace
 *   - Each fixture pod has at least 1 container defined in its spec
 */

// ------------------------------------------------------------
// API Tests: GET /api/pods/all — containers field
// ------------------------------------------------------------

test.describe('Pods API - containers field', () => {
  test('should include containers array in every pod object', async ({ request }) => {
    // Arrange: Fetch all pods from the API
    const response = await request.get('/api/pods/all');

    // Assert: Response should be successful
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const pods = await response.json();

    // Assert: Response must be a non-empty array
    expect(Array.isArray(pods)).toBeTruthy();
    expect(pods.length).toBeGreaterThan(0);

    // Assert: Every pod object must have a containers array
    for (const pod of pods) {
      expect(pod).toHaveProperty('containers');
      expect(Array.isArray(pod.containers)).toBeTruthy();
    }
  });

  test('should have at least one container name per pod', async ({ request }) => {
    // Arrange: Fetch all pods from the API
    const response = await request.get('/api/pods/all');

    expect(response.ok()).toBeTruthy();

    const pods = await response.json();
    expect(Array.isArray(pods)).toBeTruthy();
    expect(pods.length).toBeGreaterThan(0);

    // Assert: Every pod must have at least 1 container name
    for (const pod of pods) {
      expect(Array.isArray(pod.containers)).toBeTruthy();
      expect(pod.containers.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('should include only non-empty string values in containers array', async ({ request }) => {
    // Arrange: Fetch all pods from the API
    const response = await request.get('/api/pods/all');

    expect(response.ok()).toBeTruthy();

    const pods = await response.json();
    expect(Array.isArray(pods)).toBeTruthy();
    expect(pods.length).toBeGreaterThan(0);

    // Assert: Each container name must be a non-empty string
    for (const pod of pods) {
      expect(Array.isArray(pod.containers)).toBeTruthy();
      for (const containerName of pod.containers) {
        expect(typeof containerName).toBe('string');
        expect(containerName.length).toBeGreaterThan(0);
      }
    }
  });

  test('should include containers array for fixture pods in dashboard-test namespace', async ({ request }) => {
    // Arrange: Fetch pods filtered to dashboard-test namespace
    const response = await request.get('/api/pods/all?ns=dashboard-test');

    expect(response.ok()).toBeTruthy();

    const pods = await response.json();
    expect(Array.isArray(pods)).toBeTruthy();

    // Assert: At least 4 fixture pods must exist in dashboard-test
    expect(pods.length).toBeGreaterThanOrEqual(4);

    // Assert: Each fixture pod must expose a containers array with at least 1 entry
    const fixturePodNames = [
      'unhealthy-test-pod-1',
      'unhealthy-test-pod-2',
      'unhealthy-test-pod-3',
      'unhealthy-test-pod-4',
    ];

    for (const fixtureName of fixturePodNames) {
      const fixturePod = pods.find((pod: { name: string }) => pod.name === fixtureName);
      expect(fixturePod).toBeDefined();

      expect(Array.isArray(fixturePod.containers)).toBeTruthy();
      expect(fixturePod.containers.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('should preserve all existing pod fields alongside containers', async ({ request }) => {
    // Arrange: Fetch all pods from the API
    const response = await request.get('/api/pods/all');

    expect(response.ok()).toBeTruthy();

    const pods = await response.json();
    expect(Array.isArray(pods)).toBeTruthy();
    expect(pods.length).toBeGreaterThan(0);

    // Assert: Existing fields must still be present after adding containers
    const firstPod = pods[0];
    expect(firstPod).toHaveProperty('name');
    expect(firstPod).toHaveProperty('namespace');
    expect(firstPod).toHaveProperty('status');
    expect(firstPod).toHaveProperty('restarts');
    expect(firstPod).toHaveProperty('node');
    expect(firstPod).toHaveProperty('age');
    expect(firstPod).toHaveProperty('containers');
  });
});

// ------------------------------------------------------------
// UI Tests: Pod card — container count display
// ------------------------------------------------------------

test.describe('PodCard UI - container count display', () => {
  test('should display container count on each pod card', async ({ page }) => {
    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get the first pod card
    const firstPodCard = page.getByTestId('pod-card').first();
    await expect(firstPodCard).toBeVisible();

    // Assert: Container count element should be visible
    const podContainers = firstPodCard.getByTestId('pod-containers');
    await expect(podContainers).toBeVisible();
  });

  test('should display a numeric container count on each pod card', async ({ page }) => {
    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get the first pod card
    const firstPodCard = page.getByTestId('pod-card').first();
    await expect(firstPodCard).toBeVisible();

    // Assert: Container count should show at least one digit
    const podContainers = firstPodCard.getByTestId('pod-containers');
    await expect(podContainers).toBeVisible();

    const containersText = await podContainers.innerText();
    expect(containersText).toMatch(/\d+/); // Contains at least one digit
  });

  test('should display container count of 1 or more for every pod card', async ({ page }) => {
    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get all pod cards
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Every pod card must show a container count >= 1
    for (let i = 0; i < cardCount; i++) {
      const podCard = podCards.nth(i);
      const podContainers = podCard.getByTestId('pod-containers');
      await expect(podContainers).toBeVisible();

      const containersText = await podContainers.innerText();
      const containerCount = parseInt(containersText.replace(/\D/g, ''), 10);
      expect(containerCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('should display container count for fixture pods from dashboard-test namespace', async ({ page }) => {
    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get all pod cards
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4);

    // Act: Find the first fixture pod card
    let fixturePodCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = podCards.nth(i);
      const nameText = await card.getByTestId('pod-name').innerText();
      if (nameText === 'unhealthy-test-pod-1') {
        fixturePodCard = card;
        break;
      }
    }

    // Assert: Fixture pod must have container count visible
    expect(fixturePodCard).toBeTruthy();
    if (!fixturePodCard) return;

    const podContainers = fixturePodCard.getByTestId('pod-containers');
    await expect(podContainers).toBeVisible();

    const containersText = await podContainers.innerText();
    const containerCount = parseInt(containersText.replace(/\D/g, ''), 10);
    expect(containerCount).toBeGreaterThanOrEqual(1);
  });

  test('should display all required pod card fields including container count', async ({ page }) => {
    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Find the unhealthy-test-pod-1 card
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    let testPodCard = null;

    for (let i = 0; i < cardCount; i++) {
      const card = podCards.nth(i);
      const nameText = await card.getByTestId('pod-name').innerText();
      if (nameText === 'unhealthy-test-pod-1') {
        testPodCard = card;
        break;
      }
    }

    expect(testPodCard).toBeTruthy();
    if (!testPodCard) return;

    // Assert: All existing fields plus new container count must be visible
    await expect(testPodCard.getByTestId('pod-name')).toBeVisible();
    await expect(testPodCard.getByTestId('pod-namespace')).toBeVisible();
    await expect(testPodCard.getByTestId('status-badge')).toBeVisible();
    await expect(testPodCard.getByTestId('pod-restarts')).toBeVisible();
    await expect(testPodCard.getByTestId('pod-node')).toBeVisible();
    await expect(testPodCard.getByTestId('pod-age')).toBeVisible();

    // Assert: New container count field must also be visible
    await expect(testPodCard.getByTestId('pod-containers')).toBeVisible();
  });
});
