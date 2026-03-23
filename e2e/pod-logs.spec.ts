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

/**
 * E2E Tests for Pod Logs API (DLD-699)
 *
 * Tests written in skip state pending DLD-699 implementation.
 * These tests define the expected behavior of the pod logs retrieval API
 * endpoint: GET /api/pods/logs/{namespace}/{name}
 *
 * Activation: Remove test.skip() calls after DLD-699 implementation.
 *
 * Related issues:
 *   DLD-699 - 작업 3-1: [로그 조회 API] e2e 테스트 작성 (skipped)
 *   DLD-694 - Pod Log 조회 기능 추가 (parent)
 *
 * Test Fixtures:
 *   - unhealthy-pod.yaml: 4 unhealthy pods in dashboard-test namespace
 *   - Default test target: busybox-test in dashboard-test namespace (running pod with log output)
 *   - Each fixture pod has at least 1 container defined in its spec
 */

// ------------------------------------------------------------
// API Tests: GET /api/pods/logs/{namespace}/{name}
// ------------------------------------------------------------

test.describe('Pod Logs API - GET /api/pods/logs/{namespace}/{name}', () => {
  test('should return 200 with text/plain logs for a valid pod', async ({ request }) => {
    // Arrange
    const namespace = 'dashboard-test';
    const podName = 'busybox-test';

    // Act
    const response = await request.get(`/api/pods/logs/${namespace}/${podName}`);

    // Assert
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');

    const body = await response.text();
    expect(body.length).toBeGreaterThan(0);
  });

  test('should return logs for a specific container when container query param is provided', async ({ request }) => {
    // Arrange: Fetch pod details first to get a valid container name
    const namespace = 'dashboard-test';
    const podName = 'busybox-test';
    const podsResponse = await request.get('/api/pods/all?ns=dashboard-test');
    expect(podsResponse.ok()).toBeTruthy();

    const pods = await podsResponse.json();
    const targetPod = pods.find((pod: { name: string }) => pod.name === podName);
    expect(targetPod).toBeDefined();
    expect(Array.isArray(targetPod.containers)).toBeTruthy();
    expect(targetPod.containers.length).toBeGreaterThanOrEqual(1);

    const containerName = targetPod.containers[0];

    // Act
    const response = await request.get(
      `/api/pods/logs/${namespace}/${podName}?container=${containerName}`
    );

    // Assert
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');

    const body = await response.text();
    expect(body.length).toBeGreaterThan(0);
  });

  test('should return only the last 10 lines when tailLines=10 query param is provided', async ({ request }) => {
    // Arrange
    const namespace = 'dashboard-test';
    const podName = 'busybox-test';

    // Act
    const response = await request.get(
      `/api/pods/logs/${namespace}/${podName}?tailLines=10`
    );

    // Assert
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');

    const body = await response.text();
    expect(body.length).toBeGreaterThan(0);

    // Assert: Response must contain at most 10 lines
    const lines = body.trimEnd().split('\n');
    expect(lines.length).toBeLessThanOrEqual(10);
  });

  test('should return 404 when the requested pod does not exist', async ({ request }) => {
    // Arrange
    const namespace = 'dashboard-test';
    const podName = 'nonexistent-pod-xyz';

    // Act
    const response = await request.get(`/api/pods/logs/${namespace}/${podName}`);

    // Assert
    expect(response.status()).toBe(404);
  });

  test('should return 400 when the requested container does not exist in the pod', async ({ request }) => {
    // Arrange
    const namespace = 'dashboard-test';
    const podName = 'unhealthy-test-pod-1';
    const containerName = 'nonexistent-container-xyz';

    // Act
    const response = await request.get(
      `/api/pods/logs/${namespace}/${podName}?container=${containerName}`
    );

    // Assert: Expect 400 Bad Request or an appropriate client error
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});

/**
 * E2E Tests for Pod Log Streaming API (DLD-701)
 *
 * Tests written in skip state pending DLD-701 implementation.
 * These tests define the expected behavior of the pod log streaming API
 * endpoint: GET /api/pods/logs/{namespace}/{name}?follow=true
 *
 * Activation: Remove test.skip() calls after DLD-701 implementation.
 *
 * Related issues:
 *   DLD-701 - 작업 4-1: [스트리밍 API] e2e 테스트 작성 (skipped)
 *   DLD-694 - Pod Log 조회 기능 추가 (parent)
 *
 * Test Fixtures:
 *   - pod.yaml: busybox-test pod in dashboard-test namespace (running pod with log output)
 *   - Default test target: busybox-test in dashboard-test namespace
 *   - Container name: busybox
 */

// ------------------------------------------------------------
// API Tests: GET /api/pods/logs/{namespace}/{name}?follow=true (SSE streaming)
// ------------------------------------------------------------

test.describe('Pod Log Streaming API - GET /api/pods/logs/{namespace}/{name}?follow=true', () => {
  test('should establish SSE stream connection and receive initial log events', async ({ page, baseURL }) => {
    // Arrange
    const namespace = 'dashboard-test';
    const podName = 'busybox-test';
    const streamUrl = `${baseURL}/api/pods/logs/${namespace}/${podName}?follow=true`;

    // Navigate to dashboard so browser has proper origin for fetch/EventSource
    await page.goto(baseURL!);

    // Act: Connect to SSE stream via EventSource in browser context and collect events
    const result = await page.evaluate(async (url) => {
      return new Promise<{ connected: boolean; contentType: string | null; events: string[] }>((resolve) => {
        const events: string[] = [];
        let contentType: string | null = null;
        let connected = false;

        // Use fetch to inspect headers before reading stream
        fetch(url)
          .then((response) => {
            connected = response.ok;
            contentType = response.headers.get('content-type');

            const reader = response.body?.getReader();
            if (!reader) {
              resolve({ connected, contentType, events });
              return;
            }

            // Read a small portion to confirm stream is live
            reader.read().then(({ value }) => {
              if (value) {
                events.push(new TextDecoder().decode(value));
              }
              reader.cancel();
              resolve({ connected, contentType, events });
            });
          })
          .catch(() => {
            resolve({ connected: false, contentType: null, events: [] });
          });

        // Timeout safety: resolve after 5 seconds if no data arrives
        setTimeout(() => resolve({ connected, contentType, events }), 5000);
      });
    }, streamUrl);

    // Assert: SSE connection should be established with correct content type
    expect(result.connected).toBe(true);
    expect(result.contentType).toContain('text/event-stream');
  });

  test('should receive at least one log event within 5 seconds of stream connection', async ({ page, baseURL }) => {
    // Arrange
    const namespace = 'dashboard-test';
    const podName = 'busybox-test';
    const streamUrl = `${baseURL}/api/pods/logs/${namespace}/${podName}?follow=true`;

    // Navigate to dashboard so browser has proper origin for fetch/EventSource
    await page.goto(baseURL!);

    // Act: Connect to SSE stream and wait for at least one data event
    const receivedEvents = await page.evaluate(async (url) => {
      return new Promise<string[]>((resolve) => {
        const events: string[] = [];

        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
          events.push(event.data);
          // Close after receiving at least one event
          eventSource.close();
          resolve(events);
        };

        eventSource.addEventListener('log', (event) => {
          events.push((event as MessageEvent).data);
          eventSource.close();
          resolve(events);
        });

        eventSource.onerror = () => {
          eventSource.close();
          resolve(events);
        };

        // Timeout: resolve after 5 seconds even if no events received
        setTimeout(() => {
          eventSource.close();
          resolve(events);
        }, 5000);
      });
    }, streamUrl);

    // Assert: At least one log event must be received within the timeout
    expect(receivedEvents.length).toBeGreaterThanOrEqual(1);
    expect(receivedEvents[0].length).toBeGreaterThan(0);
  });

  test('should clean up server-side stream resources when client disconnects', async ({ page, baseURL }) => {
    // Arrange
    const namespace = 'dashboard-test';
    const podName = 'busybox-test';
    const streamUrl = `${baseURL}/api/pods/logs/${namespace}/${podName}?follow=true`;

    // Navigate to dashboard so browser has proper origin for fetch/EventSource
    await page.goto(baseURL!);

    // Act: Connect to SSE stream, receive at least one event, then close the connection
    const streamResult = await page.evaluate(async (url) => {
      return new Promise<{ receivedBeforeClose: number; closedSuccessfully: boolean }>((resolve) => {
        let receivedBeforeClose = 0;
        let closedSuccessfully = false;

        const eventSource = new EventSource(url);

        const closeAndResolve = () => {
          eventSource.close();
          closedSuccessfully = eventSource.readyState === EventSource.CLOSED;
          resolve({ receivedBeforeClose, closedSuccessfully });
        };

        eventSource.onmessage = (event) => {
          if (event.data) {
            receivedBeforeClose++;
          }
          // Close after first event to simulate client disconnect
          closeAndResolve();
        };

        eventSource.addEventListener('log', (event) => {
          if ((event as MessageEvent).data) {
            receivedBeforeClose++;
          }
          closeAndResolve();
        });

        eventSource.onerror = () => {
          closeAndResolve();
        };

        // Timeout safety
        setTimeout(closeAndResolve, 5000);
      });
    }, streamUrl);

    // Assert: Client must have received at least one event before closing
    expect(streamResult.receivedBeforeClose).toBeGreaterThanOrEqual(1);

    // Assert: EventSource must report CLOSED state after close() is called
    expect(streamResult.closedSuccessfully).toBe(true);

    // Act: Verify the server accepts new connections after previous client disconnected
    // (indicates server-side cleanup occurred and resources are not leaked)
    const reconnectResult = await page.evaluate(async (url) => {
      return new Promise<{ connected: boolean }>((resolve) => {
        const eventSource = new EventSource(url);

        eventSource.onopen = () => {
          eventSource.close();
          resolve({ connected: true });
        };

        eventSource.onerror = () => {
          eventSource.close();
          resolve({ connected: false });
        };

        setTimeout(() => {
          eventSource.close();
          resolve({ connected: false });
        }, 5000);
      });
    }, streamUrl);

    // Assert: Server must accept a new SSE connection after previous client disconnected
    expect(reconnectResult.connected).toBe(true);
  });
});

/**
 * E2E Tests for PodLogPanel UI Component (DLD-703)
 *
 * Tests written in skip state pending DLD-703 implementation.
 * These tests define the expected behavior of the PodLogPanel slide-over
 * component that appears when a user clicks a Pod card on the Pods page.
 *
 * Activation: Remove test.describe.skip() call after DLD-703 implementation.
 *
 * Related issues:
 *   DLD-703 - 작업 5-1: [PodLogPanel UI] e2e 테스트 작성 (skipped)
 *   DLD-694 - Pod Log 조회 기능 추가 (parent)
 *
 * Component structure (from pod-log-panel.jsx wireframe):
 *   - Backdrop: fixed overlay behind the panel (data-testid="log-panel-backdrop")
 *   - LogPanel: slide-over from right side (data-testid="log-panel")
 *     - Header: title, StatusBadge, pod namespace/name, container selector, Follow button
 *     - Log viewer: dark-background monospace area (data-testid="log-panel-log-viewer")
 *     - Footer: selected container name + streaming indicator
 *
 * Test Fixtures:
 *   - unhealthy-pod.yaml: 4 unhealthy pods in dashboard-test namespace
 *   - multi-container fixture: pod with 2+ containers (e.g., unhealthy-test-pod-1)
 *   - busybox-test: running pod in dashboard-test namespace with log output
 */

// ------------------------------------------------------------
// UI Tests: PodLogPanel — open and content display
// ------------------------------------------------------------

test.describe('PodLogPanel UI - panel open and content display', () => {
  test('should slide in the log panel when a pod card is clicked', async ({ page }) => {
    // Arrange: Navigate to the Pods page and wait for pod cards to render
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    await expect(firstPodCard).toBeVisible();

    // Act: Click the first pod card to open the log panel
    await firstPodCard.click();

    // Assert: Log panel should become visible after click
    const logPanel = page.getByTestId('log-panel');
    await expect(logPanel).toBeVisible();

    // Assert: Backdrop overlay should also be visible
    const backdrop = page.getByTestId('log-panel-backdrop');
    await expect(backdrop).toBeVisible();
  });

  test('should display pod name, namespace, and status badge in the log panel header', async ({ page }) => {
    // Arrange: Navigate to the Pods page and locate a known fixture pod card
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Act: Find unhealthy-test-pod-1 and click it to open the log panel
    let targetCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = podCards.nth(i);
      const nameText = await card.getByTestId('pod-name').innerText();
      if (nameText === 'unhealthy-test-pod-1') {
        targetCard = card;
        break;
      }
    }

    expect(targetCard).toBeTruthy();
    if (!targetCard) return;

    await targetCard.click();

    // Assert: Log panel should be visible
    const logPanel = page.getByTestId('log-panel');
    await expect(logPanel).toBeVisible();

    // Assert: Panel title should read "Pod Logs"
    const panelTitle = logPanel.getByTestId('log-panel-title');
    await expect(panelTitle).toBeVisible();
    await expect(panelTitle).toContainText('Pod Logs');

    // Assert: Pod info area should show namespace/name format
    const podInfo = logPanel.getByTestId('log-panel-pod-info');
    await expect(podInfo).toBeVisible();
    const podInfoText = await podInfo.innerText();
    expect(podInfoText).toContain('dashboard-test');
    expect(podInfoText).toContain('unhealthy-test-pod-1');

    // Assert: Status badge should reflect the pod's current status
    const statusBadge = logPanel.getByTestId('status-badge');
    await expect(statusBadge).toBeVisible();
    const statusText = await statusBadge.innerText();
    expect(statusText.length).toBeGreaterThan(0);
  });

  test('should display log content in the log viewer area', async ({ page }) => {
    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Click the first pod card to open the log panel
    const firstPodCard = page.getByTestId('pod-card').first();
    await expect(firstPodCard).toBeVisible();
    await firstPodCard.click();

    // Assert: Log panel should be visible
    const logPanel = page.getByTestId('log-panel');
    await expect(logPanel).toBeVisible();

    // Assert: Log viewer should be visible and not empty
    const logViewer = logPanel.getByTestId('log-panel-log-viewer');
    await expect(logViewer).toBeVisible();

    // Wait for logs to load (API call completes after panel opens)
    await page.waitForLoadState('networkidle');

    // Assert: Log viewer should contain at least one line of text
    const logContent = await logViewer.innerText();
    expect(logContent.trim().length).toBeGreaterThan(0);
  });
});

// ------------------------------------------------------------
// UI Tests: PodLogPanel — multi-container support
// ------------------------------------------------------------

test.describe('PodLogPanel UI - multi-container pod support', () => {
  test('should display container selector dropdown for a multi-container pod', async ({ page }) => {
    // Arrange: Navigate to the Pods page and find a multi-container pod
    // (unhealthy-test-pod-1 is expected to have 2+ containers per fixture)
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Act: Find a pod whose container count badge shows >= 2 and click it
    let multiContainerCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = podCards.nth(i);
      const containersText = await card.getByTestId('pod-containers').innerText();
      const containerCount = parseInt(containersText.replace(/\D/g, ''), 10);
      if (containerCount >= 2) {
        multiContainerCard = card;
        break;
      }
    }

    expect(multiContainerCard).toBeTruthy();
    if (!multiContainerCard) return;

    await multiContainerCard.click();

    // Assert: Log panel should be visible
    const logPanel = page.getByTestId('log-panel');
    await expect(logPanel).toBeVisible();

    // Assert: Container selector dropdown should be visible for multi-container pods
    const containerSelector = logPanel.getByTestId('log-panel-container-selector');
    await expect(containerSelector).toBeVisible();
  });

  test('should reload logs when a different container is selected from the dropdown', async ({ page }) => {
    // Arrange: Navigate to the Pods page and open a multi-container pod log panel
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();

    // Act: Find a pod with 2+ containers
    let multiContainerCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = podCards.nth(i);
      const containersText = await card.getByTestId('pod-containers').innerText();
      const containerCount = parseInt(containersText.replace(/\D/g, ''), 10);
      if (containerCount >= 2) {
        multiContainerCard = card;
        break;
      }
    }

    expect(multiContainerCard).toBeTruthy();
    if (!multiContainerCard) return;

    await multiContainerCard.click();

    const logPanel = page.getByTestId('log-panel');
    await expect(logPanel).toBeVisible();

    const containerSelector = logPanel.getByTestId('log-panel-container-selector');
    await expect(containerSelector).toBeVisible();

    // Act: Record the initial log content before switching container
    const logViewer = logPanel.getByTestId('log-panel-log-viewer');
    await page.waitForLoadState('networkidle');
    const initialLogContent = await logViewer.innerText();

    // Act: Select the second option in the container dropdown
    await containerSelector.selectOption({ index: 1 });

    // Wait for new logs to load after container switch
    await page.waitForLoadState('networkidle');

    // Assert: Footer should show the newly selected container name
    const footer = logPanel.getByTestId('log-panel-footer');
    await expect(footer).toBeVisible();
    const footerText = await footer.innerText();
    expect(footerText.length).toBeGreaterThan(0);

    // Assert: Log viewer should still be visible (logs reloaded)
    await expect(logViewer).toBeVisible();
    const updatedLogContent = await logViewer.innerText();

    // Assert: Log content area should have been refreshed
    // (content may differ or remain the same depending on the container,
    //  but the viewer must remain visible and non-empty after switch)
    expect(updatedLogContent.trim().length).toBeGreaterThan(0);
    expect(updatedLogContent).not.toBe(initialLogContent);
  });

  test('should reset follow state when container is switched during active follow', async ({ page }) => {
    // Arrange: Navigate to Pods page and find a multi-container pod
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    let multiContainerCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = podCards.nth(i);
      const containersText = await card.getByTestId('pod-containers').innerText();
      const containerCount = parseInt(containersText.replace(/\D/g, ''), 10);
      if (containerCount >= 2) {
        multiContainerCard = card;
        break;
      }
    }

    expect(multiContainerCard).toBeTruthy();
    if (!multiContainerCard) return;

    await multiContainerCard.click();

    const logPanel = page.getByTestId('log-panel');
    await expect(logPanel).toBeVisible();

    const containerSelector = logPanel.getByTestId('log-panel-container-selector');
    await expect(containerSelector).toBeVisible();

    // Act: Enable Follow mode
    const followButton = logPanel.getByTestId('log-panel-follow-button');
    await followButton.click();

    // Assert: Streaming indicator should appear
    const streamingIndicator = logPanel.getByTestId('log-panel-streaming-indicator');
    await expect(streamingIndicator).toBeVisible();

    // Act: Switch to a different container
    await containerSelector.selectOption({ index: 1 });

    // Assert: Follow state should be reset — streaming indicator hidden
    await expect(streamingIndicator).not.toBeVisible();

    // Assert: Follow button should show "Follow" (not "Unfollow")
    await expect(followButton).toContainText('Follow');
    await expect(followButton).not.toContainText('Unfollow');
  });
});

// ------------------------------------------------------------
// UI Tests: PodLogPanel — Follow (streaming) mode
// ------------------------------------------------------------

test.describe('PodLogPanel UI - Follow streaming mode', () => {
  test('should show streaming indicator in footer when Follow button is clicked', async ({ page }) => {
    // Arrange: Navigate to the Pods page and open the log panel
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    await expect(firstPodCard).toBeVisible();
    await firstPodCard.click();

    const logPanel = page.getByTestId('log-panel');
    await expect(logPanel).toBeVisible();

    // Act: Click the Follow button to enable streaming mode
    const followButton = logPanel.getByTestId('log-panel-follow-button');
    await expect(followButton).toBeVisible();
    await followButton.click();

    // Assert: Follow button should show active/streaming state
    // (pulse animation class applied when follow mode is active)
    const followButtonClasses = await followButton.getAttribute('class');
    expect(followButtonClasses).toMatch(/pulse|active|streaming/i);

    // Assert: Streaming indicator should appear in the footer
    const streamingIndicator = logPanel.getByTestId('log-panel-streaming-indicator');
    await expect(streamingIndicator).toBeVisible();

    // Assert: Streaming indicator should contain "Streaming live" text
    const indicatorText = await streamingIndicator.innerText();
    expect(indicatorText.toLowerCase()).toContain('streaming live');
  });

  test('should stop streaming and hide indicator when Follow is toggled off', async ({ page }) => {
    // Arrange: Open verbose-log-test pod (outputs 1 line/sec while streaming)
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    let targetCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = podCards.nth(i);
      const nameText = await card.getByTestId('pod-name').innerText();
      if (nameText === 'verbose-log-test') {
        targetCard = card;
        break;
      }
    }
    expect(targetCard).toBeTruthy();
    await targetCard!.click();

    const logPanel = page.getByTestId('log-panel');
    await expect(logPanel).toBeVisible();

    // Act: Enable Follow mode
    const followButton = logPanel.getByTestId('log-panel-follow-button');
    await expect(followButton).toBeVisible();
    await followButton.click();

    // Assert: Streaming indicator should appear
    const streamingIndicator = logPanel.getByTestId('log-panel-streaming-indicator');
    await expect(streamingIndicator).toBeVisible();

    // Wait for streaming lines to arrive
    await page.waitForTimeout(2000);

    // Record current line count
    const logViewer = logPanel.getByTestId('log-panel-log-viewer');
    const lineCountBefore = await logViewer.evaluate((el) => el.querySelectorAll('div').length);

    // Act: Toggle Follow off
    await followButton.click();

    // Assert: Streaming indicator should disappear
    await expect(streamingIndicator).not.toBeVisible();

    // Assert: Button text should be "Follow" (not "Unfollow")
    await expect(followButton).toContainText('Follow');
    await expect(followButton).not.toContainText('Unfollow');

    // Assert: Pulse animation should be removed
    const buttonClasses = await followButton.getAttribute('class');
    expect(buttonClasses).not.toContain('animate-pulse');

    // Wait and verify no new lines are added (streaming actually stopped)
    await page.waitForTimeout(3000);
    const lineCountAfter = await logViewer.evaluate((el) => el.querySelectorAll('div').length);
    expect(lineCountAfter).toBe(lineCountBefore);
  });

  test('should toggle button text and styling between Follow and Unfollow states', async ({ page }) => {
    // Arrange: Open any pod's log panel
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    await expect(firstPodCard).toBeVisible();
    await firstPodCard.click();

    const logPanel = page.getByTestId('log-panel');
    await expect(logPanel).toBeVisible();

    const followButton = logPanel.getByTestId('log-panel-follow-button');
    await expect(followButton).toBeVisible();

    // Assert: Initial state — inactive
    await expect(followButton).toContainText('Follow');
    const initialClasses = await followButton.getAttribute('class');
    expect(initialClasses).toContain('bg-gray-700');
    expect(initialClasses).not.toContain('animate-pulse');

    // Act: Click Follow to activate
    await followButton.click();

    // Assert: Active state
    await expect(followButton).toContainText('Unfollow');
    const activeClasses = await followButton.getAttribute('class');
    expect(activeClasses).toContain('bg-blue-600');
    expect(activeClasses).toContain('animate-pulse');

    // Act: Click again to deactivate
    await followButton.click();

    // Assert: Back to inactive state
    await expect(followButton).toContainText('Follow');
    await expect(followButton).not.toContainText('Unfollow');
    const resetClasses = await followButton.getAttribute('class');
    expect(resetClasses).toContain('bg-gray-700');
    expect(resetClasses).not.toContain('animate-pulse');
  });

  test('should re-enable streaming when Follow is toggled on → off → on again', async ({ page }) => {
    // Arrange: Open verbose-log-test pod (outputs 1 line/sec while streaming)
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    let targetCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = podCards.nth(i);
      const nameText = await card.getByTestId('pod-name').innerText();
      if (nameText === 'verbose-log-test') {
        targetCard = card;
        break;
      }
    }
    expect(targetCard).toBeTruthy();
    await targetCard!.click();

    const logPanel = page.getByTestId('log-panel');
    await expect(logPanel).toBeVisible();

    const followButton = logPanel.getByTestId('log-panel-follow-button');
    const logViewer = logPanel.getByTestId('log-panel-log-viewer');

    // ---- Phase 1: Follow ON ----
    await followButton.click();

    const streamingIndicator = logPanel.getByTestId('log-panel-streaming-indicator');
    await expect(streamingIndicator).toBeVisible();
    await expect(followButton).toContainText('Unfollow');

    // Wait for streaming lines to arrive
    await page.waitForTimeout(2000);

    // ---- Phase 2: Follow OFF ----
    await followButton.click();

    await expect(streamingIndicator).not.toBeVisible();
    await expect(followButton).toContainText('Follow');
    await expect(followButton).not.toContainText('Unfollow');

    // Record line count while streaming is stopped
    const lineCountAfterOff = await logViewer.evaluate((el) => el.querySelectorAll('div').length);

    // Wait to confirm no new lines while off
    await page.waitForTimeout(2000);
    const lineCountStillOff = await logViewer.evaluate((el) => el.querySelectorAll('div').length);
    expect(lineCountStillOff).toBe(lineCountAfterOff);

    // ---- Phase 3: Follow ON again ----
    await followButton.click();

    await expect(streamingIndicator).toBeVisible();
    await expect(followButton).toContainText('Unfollow');

    // Assert: Button should have active styling again
    const reactivatedClasses = await followButton.getAttribute('class');
    expect(reactivatedClasses).toContain('bg-blue-600');
    expect(reactivatedClasses).toContain('animate-pulse');

    // Wait for new streaming lines to arrive
    await page.waitForTimeout(3000);

    // Assert: New lines should have been added (streaming is active again)
    const lineCountAfterReOn = await logViewer.evaluate((el) => el.querySelectorAll('div').length);
    expect(lineCountAfterReOn).toBeGreaterThan(lineCountStillOff);

    // ---- Log order consistency check ----
    // verbose-log-test outputs lines with ISO timestamps at the start:
    //   "2026-03-22T10:00:00Z INFO [stream] live log event 1742644800"
    // Extract all timestamps and verify they are in non-decreasing order.
    const timestamps = await logViewer.evaluate((el) => {
      const lines = el.innerText.split('\n').filter((l: string) => l.trim().length > 0);
      const isoRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/;
      return lines
        .map((l: string) => {
          const m = l.match(isoRegex);
          return m ? m[1] : null;
        })
        .filter((t: string | null): t is string => t !== null);
    });

    // Must have enough timestamped lines to make the check meaningful
    expect(timestamps.length).toBeGreaterThanOrEqual(3);

    // Assert: Every timestamp must be >= the previous one (chronological order)
    for (let i = 1; i < timestamps.length; i++) {
      const prev = new Date(timestamps[i - 1]).getTime();
      const curr = new Date(timestamps[i]).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  test('should preserve all existing log lines after Follow is toggled off then back on', async ({ page }) => {
    // Arrange: Open verbose-log-test pod (outputs 300 initial lines + 1 line/sec streaming)
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    let targetCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = podCards.nth(i);
      const nameText = await card.getByTestId('pod-name').innerText();
      if (nameText === 'verbose-log-test') {
        targetCard = card;
        break;
      }
    }
    expect(targetCard).toBeTruthy();
    await targetCard!.click();

    const logPanel = page.getByTestId('log-panel');
    await expect(logPanel).toBeVisible();

    const followButton = logPanel.getByTestId('log-panel-follow-button');
    const logViewer = logPanel.getByTestId('log-panel-log-viewer');

    // ---- Phase 1: Enable Follow and let streaming lines accumulate ----
    await followButton.click();

    const streamingIndicator = logPanel.getByTestId('log-panel-streaming-indicator');
    await expect(streamingIndicator).toBeVisible();
    await expect(followButton).toContainText('Unfollow');

    // Wait for streaming lines to arrive beyond the initial batch
    await page.waitForTimeout(3000);

    // ---- Phase 2: Capture sentinel lines before toggling off ----
    // Sample the first, middle, and last lines actually present in the viewer.
    // We avoid relying on specific "[line N]" markers because tailLines=100
    // means the initial batch lines may have scrolled out of range.
    const capturedLines = await logViewer.evaluate((el) => {
      const allLines = el.innerText.split('\n').filter((l: string) => l.trim().length > 0);
      if (allLines.length === 0) return [];
      const mid = Math.floor(allLines.length / 2);
      // Pick 3 distinct lines: first, middle, last
      const sampled = [allLines[0], allLines[mid], allLines[allLines.length - 1]];
      // De-duplicate in case there are very few lines
      return [...new Set(sampled)];
    });

    // Sanity: viewer must have at least some lines
    expect(capturedLines.length).toBeGreaterThanOrEqual(1);

    const lineCountBeforeOff = await logViewer.evaluate(
      (el) => el.innerText.split('\n').filter((l: string) => l.trim().length > 0).length
    );

    // ---- Phase 3: Toggle Follow OFF ----
    await followButton.click();

    await expect(streamingIndicator).not.toBeVisible();
    await expect(followButton).toContainText('Follow');
    await expect(followButton).not.toContainText('Unfollow');

    // ---- Phase 4: Toggle Follow back ON and wait for new lines ----
    await followButton.click();

    await expect(streamingIndicator).toBeVisible();
    await expect(followButton).toContainText('Unfollow');

    await page.waitForTimeout(3000);

    // ---- Assert: Every previously captured sentinel line is still present ----
    const logContentAfterReOn = await logViewer.innerText();

    for (const line of capturedLines) {
      expect(logContentAfterReOn).toContain(line);
    }

    // ---- Assert: Total line count did not decrease (no lines dropped) ----
    const lineCountAfterReOn = await logViewer.evaluate(
      (el) => el.innerText.split('\n').filter((l: string) => l.trim().length > 0).length
    );
    expect(lineCountAfterReOn).toBeGreaterThanOrEqual(lineCountBeforeOff);

    // ---- Assert: New streaming lines appeared (streaming resumed) ----
    expect(lineCountAfterReOn).toBeGreaterThan(lineCountBeforeOff);
  });

  test('should display live streamed log content from the pod during follow mode', async ({ page }) => {
    // Arrange: Open verbose-log-test pod (outputs "[stream] live log event" every 1 second)
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    let targetCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = podCards.nth(i);
      const nameText = await card.getByTestId('pod-name').innerText();
      if (nameText === 'verbose-log-test') {
        targetCard = card;
        break;
      }
    }
    expect(targetCard).toBeTruthy();
    await targetCard!.click();

    const logPanel = page.getByTestId('log-panel');
    await expect(logPanel).toBeVisible();

    // Act: Enable Follow mode and wait for streaming lines
    const followButton = logPanel.getByTestId('log-panel-follow-button');
    await followButton.click();

    const streamingIndicator = logPanel.getByTestId('log-panel-streaming-indicator');
    await expect(streamingIndicator).toBeVisible();

    // Wait for live streaming events to arrive (1 line/sec)
    await page.waitForTimeout(3000);

    // Assert: Log viewer should contain real pod output with "[stream] live log event"
    const logViewer = logPanel.getByTestId('log-panel-log-viewer');
    const logContent = await logViewer.innerText();
    expect(logContent).toContain('[stream] live log event');
  });
});

// ------------------------------------------------------------
// UI Tests: PodLogPanel — auto-scroll behavior
// ------------------------------------------------------------

test.describe('PodLogPanel UI - auto-scroll behavior', () => {
  // Helper: find and click the verbose-log-test pod card to open its log panel.
  // This pod outputs 300 initial lines + 1 line/sec streaming, ensuring the
  // log viewer is scrollable without any API interception.
  async function openVerboseLogPanel(page: import('@playwright/test').Page) {
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();

    let targetCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = podCards.nth(i);
      const nameText = await card.getByTestId('pod-name').innerText();
      if (nameText === 'verbose-log-test') {
        targetCard = card;
        break;
      }
    }

    expect(targetCard).toBeTruthy();
    await targetCard!.click();

    const logPanel = page.getByTestId('log-panel');
    await expect(logPanel).toBeVisible();

    const logViewer = logPanel.getByTestId('log-panel-log-viewer');
    await expect(logViewer).toBeVisible();

    // Wait for initial logs (300 lines) to render
    await expect(logViewer.locator('div').first()).toBeVisible();

    // Confirm the log viewer has enough content to be scrollable
    await expect.poll(async () => {
      return logViewer.evaluate((el) => el.scrollHeight > el.clientHeight);
    }).toBe(true);

    return { logPanel, logViewer };
  }

  test('should auto-scroll to bottom when Follow mode is active and new logs arrive', async ({ page }) => {
    const { logPanel, logViewer } = await openVerboseLogPanel(page);

    // Act: Enable Follow mode to start streaming
    const followButton = logPanel.getByTestId('log-panel-follow-button');
    await followButton.click();

    // Assert: Streaming indicator should be visible
    const streamingIndicator = logPanel.getByTestId('log-panel-streaming-indicator');
    await expect(streamingIndicator).toBeVisible();

    // Wait for live streaming log events to arrive (verbose-log-test emits 1 line/sec)
    await page.waitForTimeout(3000);

    // Assert: Log viewer should be scrolled to the bottom (auto-scroll active)
    const distanceFromBottom = await logViewer.evaluate((el) => {
      return el.scrollHeight - el.scrollTop - el.clientHeight;
    });
    expect(distanceFromBottom).toBeLessThan(20);
  });

  test('should pause auto-scroll when user scrolls up during Follow mode', async ({ page }) => {
    const { logPanel, logViewer } = await openVerboseLogPanel(page);

    // Act: Enable Follow mode
    const followButton = logPanel.getByTestId('log-panel-follow-button');
    await followButton.click();

    // Wait for streaming to start producing live logs
    await page.waitForTimeout(2000);

    // Act: Manually scroll up using mouse wheel to simulate user reading older logs
    await logViewer.hover();
    await page.mouse.wheel(0, -10000);

    // Allow the scroll and React state to settle
    await page.waitForTimeout(500);

    // Verify we actually scrolled away from the bottom
    const scrolledAway = await logViewer.evaluate((el) => {
      return el.scrollHeight - el.scrollTop - el.clientHeight > 20;
    });
    expect(scrolledAway).toBe(true);

    // Wait for more streaming events to arrive (1 line/sec)
    await page.waitForTimeout(3000);

    // Assert: Scroll position should NOT have jumped to bottom (auto-scroll paused)
    const distanceFromBottom = await logViewer.evaluate((el) => {
      return el.scrollHeight - el.scrollTop - el.clientHeight;
    });
    expect(distanceFromBottom).toBeGreaterThan(20);
  });

  test('should resume auto-scroll when user scrolls back to bottom during Follow mode', async ({ page }) => {
    const { logPanel, logViewer } = await openVerboseLogPanel(page);

    // Act: Enable Follow mode
    const followButton = logPanel.getByTestId('log-panel-follow-button');
    await followButton.click();

    await page.waitForTimeout(2000);

    // Act: Scroll up to pause auto-scroll using mouse wheel
    await logViewer.hover();
    await page.mouse.wheel(0, -10000);
    await page.waitForTimeout(500);

    // Act: Scroll back to bottom to resume auto-scroll using mouse wheel
    await page.mouse.wheel(0, 10000);
    await page.waitForTimeout(500);

    // Wait for new streaming events to arrive
    await page.waitForTimeout(3000);

    // Assert: Log viewer should be at the bottom again (auto-scroll resumed)
    const distanceFromBottom = await logViewer.evaluate((el) => {
      return el.scrollHeight - el.scrollTop - el.clientHeight;
    });
    expect(distanceFromBottom).toBeLessThan(20);
  });
});

// ------------------------------------------------------------
// UI Tests: PodLogPanel — close interactions
// ------------------------------------------------------------

test.describe('PodLogPanel UI - panel close interactions', () => {
  test('should close the log panel when the backdrop is clicked', async ({ page }) => {
    // Arrange: Navigate to the Pods page and open the log panel
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    await expect(firstPodCard).toBeVisible();
    await firstPodCard.click();

    const logPanel = page.getByTestId('log-panel');
    await expect(logPanel).toBeVisible();

    const backdrop = page.getByTestId('log-panel-backdrop');
    await expect(backdrop).toBeVisible();

    // Act: Click the backdrop overlay to dismiss the panel
    await backdrop.click({ position: { x: 10, y: 10 } });

    // Assert: Log panel should no longer be visible after backdrop click
    await expect(logPanel).not.toBeVisible();

    // Assert: Backdrop should also be dismissed
    await expect(backdrop).not.toBeVisible();
  });

  test('should close the log panel when the X close button is clicked', async ({ page }) => {
    // Arrange: Navigate to the Pods page and open the log panel
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    await expect(firstPodCard).toBeVisible();
    await firstPodCard.click();

    const logPanel = page.getByTestId('log-panel');
    await expect(logPanel).toBeVisible();

    // Act: Click the X close button in the panel header
    const closeButton = logPanel.getByTestId('log-panel-close-button');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // Assert: Log panel should no longer be visible after close button click
    await expect(logPanel).not.toBeVisible();

    // Assert: The pods page should still be visible after panel is closed
    await expect(page.getByTestId('pod-card').first()).toBeVisible();
  });

  test('should stop streaming when panel is closed via X button during active follow', async ({ page }) => {
    // Arrange: Open verbose-log-test pod and start follow mode
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    let targetCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = podCards.nth(i);
      const nameText = await card.getByTestId('pod-name').innerText();
      if (nameText === 'verbose-log-test') {
        targetCard = card;
        break;
      }
    }
    expect(targetCard).toBeTruthy();
    await targetCard!.click();

    const logPanel = page.getByTestId('log-panel');
    await expect(logPanel).toBeVisible();

    // Act: Enable Follow mode
    const followButton = logPanel.getByTestId('log-panel-follow-button');
    await followButton.click();

    const streamingIndicator = logPanel.getByTestId('log-panel-streaming-indicator');
    await expect(streamingIndicator).toBeVisible();

    // Wait for streaming to be active
    await page.waitForTimeout(2000);

    // Act: Close the panel via X button
    const closeButton = logPanel.getByTestId('log-panel-close-button');
    await closeButton.click();

    // Assert: Panel should be closed
    await expect(logPanel).not.toBeVisible();

    // Act: Reopen the same pod to verify state was fully reset
    await targetCard!.click();

    const reopenedPanel = page.getByTestId('log-panel');
    await expect(reopenedPanel).toBeVisible();

    // Assert: Follow button should show "Follow" (not "Unfollow") — state was reset
    const reopenedFollowButton = reopenedPanel.getByTestId('log-panel-follow-button');
    await expect(reopenedFollowButton).toContainText('Follow');
    await expect(reopenedFollowButton).not.toContainText('Unfollow');

    // Assert: Streaming indicator should not be present
    const reopenedIndicator = reopenedPanel.locator('[data-testid="log-panel-streaming-indicator"]');
    await expect(reopenedIndicator).not.toBeVisible();
  });
});
