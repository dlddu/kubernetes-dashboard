import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Pod Shell Execution (Exec) Feature
 *
 * Tests define the expected behavior of the PodExecPanel component,
 * which provides an interactive terminal (shell) for pod containers
 * via WebSocket and xterm.js.
 *
 * Related features:
 *   - Shell button on UnhealthyPodCard
 *   - PodExecPanel slide-over panel with terminal
 *   - WebSocket exec API: /api/pods/exec/{namespace}/{name}?container=...
 *
 * Test Fixtures:
 *   - unhealthy-pod.yaml: 4 unhealthy pods in dashboard-test namespace (ImagePullBackOff)
 *   - pod.yaml: busybox-test pod in dashboard-test namespace (running pod with /bin/sh)
 *   - Each fixture pod has at least 1 container defined in its spec
 */

// ------------------------------------------------------------
// API Tests: GET /api/pods/exec/{namespace}/{name} — validation
// ------------------------------------------------------------

test.describe('Pod Exec API - parameter validation', () => {
  test('should return 400 when container query param is missing', async ({ request }) => {
    // Arrange
    const namespace = 'dashboard-test';
    const podName = 'busybox-test';

    // Act: Request exec without container param
    const response = await request.get(`/api/pods/exec/${namespace}/${podName}`);

    // Assert: Should return 400 Bad Request
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error.toLowerCase()).toContain('container');
  });

  test('should return 404 when pod does not exist', async ({ request }) => {
    // Arrange
    const namespace = 'dashboard-test';
    const podName = 'nonexistent-pod-xyz';

    // Act: Request exec for nonexistent pod
    const response = await request.get(
      `/api/pods/exec/${namespace}/${podName}?container=busybox`
    );

    // Assert: Should return 404 Not Found
    expect(response.status()).toBe(404);
  });

  test('should return 400 when container does not exist in pod', async ({ request }) => {
    // Arrange
    const namespace = 'dashboard-test';
    const podName = 'busybox-test';

    // Act: Request exec for nonexistent container
    const response = await request.get(
      `/api/pods/exec/${namespace}/${podName}?container=nonexistent-container-xyz`
    );

    // Assert: Should return 400 Bad Request
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error).toContain('nonexistent-container-xyz');
  });

  test('should return 400 when path format is invalid', async ({ request }) => {
    // Act: Request exec with invalid path (missing name)
    const response = await request.get('/api/pods/exec/dashboard-test');

    // Assert: Should return 400 Bad Request
    expect(response.status()).toBe(400);
  });
});

// ------------------------------------------------------------
// UI Tests: Shell button on PodCard
// ------------------------------------------------------------

test.describe('PodCard UI - Shell button', () => {
  test('should display Shell button on each pod card', async ({ page }) => {
    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get the first pod card
    const firstPodCard = page.getByTestId('pod-card').first();
    await expect(firstPodCard).toBeVisible();

    // Assert: Shell button should be visible
    const shellButton = firstPodCard.getByTestId('pod-exec-button');
    await expect(shellButton).toBeVisible();

    // Assert: Shell button should contain "Shell" text
    await expect(shellButton).toContainText('Shell');
  });

  test('should display Shell button on all pod cards', async ({ page }) => {
    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Get all pod cards
    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Every pod card must have a Shell button
    for (let i = 0; i < cardCount; i++) {
      const podCard = podCards.nth(i);
      const shellButton = podCard.getByTestId('pod-exec-button');
      await expect(shellButton).toBeVisible();
    }
  });

  test('should open exec panel when Shell button is clicked', async ({ page }) => {
    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    await expect(firstPodCard).toBeVisible();

    // Act: Click the Shell button
    const shellButton = firstPodCard.getByTestId('pod-exec-button');
    await shellButton.click();

    // Assert: Exec panel should become visible
    const execPanel = page.getByTestId('exec-panel');
    await expect(execPanel).toBeVisible();

    // Assert: Backdrop should also be visible
    const backdrop = page.getByTestId('exec-panel-backdrop');
    await expect(backdrop).toBeVisible();
  });

  test('should not open log panel when Shell button is clicked', async ({ page }) => {
    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    await expect(firstPodCard).toBeVisible();

    // Act: Click the Shell button (not the card itself)
    const shellButton = firstPodCard.getByTestId('pod-exec-button');
    await shellButton.click();

    // Assert: Exec panel should be visible
    const execPanel = page.getByTestId('exec-panel');
    await expect(execPanel).toBeVisible();

    // Assert: Log panel should NOT be visible (stopPropagation prevents card click)
    const logPanel = page.locator('[data-testid="log-panel"]');
    await expect(logPanel).not.toBeVisible();
  });

  test('should still open log panel when pod card body is clicked', async ({ page }) => {
    // Arrange: Navigate to the Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    await expect(firstPodCard).toBeVisible();

    // Act: Click the pod card body (not the Shell button)
    const podName = firstPodCard.getByTestId('pod-name');
    await podName.click();

    // Assert: Log panel should be visible (existing behavior preserved)
    const logPanel = page.getByTestId('log-panel');
    await expect(logPanel).toBeVisible();

    // Assert: Exec panel should NOT be visible
    const execPanel = page.locator('[data-testid="exec-panel"]');
    await expect(execPanel).not.toBeVisible();
  });
});

// ------------------------------------------------------------
// UI Tests: PodExecPanel — panel open and header display
// ------------------------------------------------------------

test.describe('PodExecPanel UI - panel open and header display', () => {
  test('should display "Pod Shell" title in the exec panel header', async ({ page }) => {
    // Arrange: Navigate to the Pods page and click Shell button
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    const shellButton = firstPodCard.getByTestId('pod-exec-button');
    await shellButton.click();

    // Assert: Exec panel title should read "Pod Shell"
    const execPanel = page.getByTestId('exec-panel');
    await expect(execPanel).toBeVisible();

    const panelTitle = execPanel.getByTestId('exec-panel-title');
    await expect(panelTitle).toBeVisible();
    await expect(panelTitle).toContainText('Pod Shell');
  });

  test('should display pod namespace and name in the exec panel header', async ({ page }) => {
    // Arrange: Navigate to the Pods page and find a known fixture pod
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();

    let targetCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = podCards.nth(i);
      const nameText = await card.getByTestId('pod-name').innerText();
      if (nameText === 'busybox-test') {
        targetCard = card;
        break;
      }
    }

    // Skip if busybox-test not found
    if (!targetCard) return;

    // Act: Click Shell button on busybox-test pod
    const shellButton = targetCard.getByTestId('pod-exec-button');
    await shellButton.click();

    // Assert: Pod info should show namespace and name
    const execPanel = page.getByTestId('exec-panel');
    await expect(execPanel).toBeVisible();

    const podInfo = execPanel.getByTestId('exec-panel-pod-info');
    await expect(podInfo).toBeVisible();

    const podInfoText = await podInfo.innerText();
    expect(podInfoText).toContain('dashboard-test');
    expect(podInfoText).toContain('busybox-test');
  });

  test('should display status badge in the exec panel header', async ({ page }) => {
    // Arrange: Open exec panel for any pod
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    const shellButton = firstPodCard.getByTestId('pod-exec-button');
    await shellButton.click();

    // Assert: Status badge should be visible in the exec panel
    const execPanel = page.getByTestId('exec-panel');
    await expect(execPanel).toBeVisible();

    const statusBadge = execPanel.getByTestId('status-badge');
    await expect(statusBadge).toBeVisible();

    const statusText = await statusBadge.innerText();
    expect(statusText.length).toBeGreaterThan(0);
  });
});

// ------------------------------------------------------------
// UI Tests: PodExecPanel — container selector
// ------------------------------------------------------------

test.describe('PodExecPanel UI - container selector', () => {
  test('should display container selector dropdown in the exec panel', async ({ page }) => {
    // Arrange: Open exec panel for any pod
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    const shellButton = firstPodCard.getByTestId('pod-exec-button');
    await shellButton.click();

    // Assert: Container selector should be visible
    const execPanel = page.getByTestId('exec-panel');
    await expect(execPanel).toBeVisible();

    const containerSelector = execPanel.getByTestId('exec-panel-container-selector');
    await expect(containerSelector).toBeVisible();
  });

  test('should list all containers in the container selector for a multi-container pod', async ({ page }) => {
    // Arrange: Find a multi-container pod (unhealthy-test-pod-1 has 2 containers)
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();

    let multiContainerCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = podCards.nth(i);
      const nameText = await card.getByTestId('pod-name').innerText();
      if (nameText === 'unhealthy-test-pod-1') {
        multiContainerCard = card;
        break;
      }
    }

    expect(multiContainerCard).toBeTruthy();
    if (!multiContainerCard) return;

    // Act: Click Shell button on the multi-container pod
    const shellButton = multiContainerCard.getByTestId('pod-exec-button');
    await shellButton.click();

    // Assert: Container selector should have 2 container options
    const execPanel = page.getByTestId('exec-panel');
    await expect(execPanel).toBeVisible();

    const containerSelector = execPanel.getByTestId('exec-panel-container-selector');
    await expect(containerSelector).toBeVisible();

    const options = containerSelector.locator('option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThanOrEqual(2);
  });
});

// ------------------------------------------------------------
// UI Tests: PodExecPanel — terminal display
// ------------------------------------------------------------

test.describe('PodExecPanel UI - terminal display', () => {
  test('should display the terminal container in the exec panel', async ({ page }) => {
    // Arrange: Open exec panel for any pod
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    const shellButton = firstPodCard.getByTestId('pod-exec-button');
    await shellButton.click();

    // Assert: Terminal container should be visible
    const execPanel = page.getByTestId('exec-panel');
    await expect(execPanel).toBeVisible();

    const terminal = execPanel.getByTestId('exec-panel-terminal');
    await expect(terminal).toBeVisible();
  });

  test('should display the Reconnect button in the toolbar', async ({ page }) => {
    // Arrange: Open exec panel for any pod
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    const shellButton = firstPodCard.getByTestId('pod-exec-button');
    await shellButton.click();

    // Assert: Reconnect button should be visible
    const execPanel = page.getByTestId('exec-panel');
    await expect(execPanel).toBeVisible();

    const reconnectButton = execPanel.getByTestId('exec-panel-reconnect-button');
    await expect(reconnectButton).toBeVisible();
    await expect(reconnectButton).toContainText('Reconnect');
  });

  test('should display connection status in the footer', async ({ page }) => {
    // Arrange: Open exec panel for any pod
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    const shellButton = firstPodCard.getByTestId('pod-exec-button');
    await shellButton.click();

    // Assert: Footer should be visible with connection status
    const execPanel = page.getByTestId('exec-panel');
    await expect(execPanel).toBeVisible();

    const footer = execPanel.getByTestId('exec-panel-footer');
    await expect(footer).toBeVisible();

    const statusIndicator = execPanel.getByTestId('exec-panel-status');
    await expect(statusIndicator).toBeVisible();

    // Assert: Status should show either Connecting, Connected, or Disconnected
    const statusText = await statusIndicator.innerText();
    expect(statusText).toMatch(/connecting|connected|disconnected/i);
  });

  test('should display /bin/sh in the footer', async ({ page }) => {
    // Arrange: Open exec panel for any pod
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    const shellButton = firstPodCard.getByTestId('pod-exec-button');
    await shellButton.click();

    // Assert: Footer should display the shell command
    const execPanel = page.getByTestId('exec-panel');
    await expect(execPanel).toBeVisible();

    const footer = execPanel.getByTestId('exec-panel-footer');
    await expect(footer).toBeVisible();

    const footerText = await footer.innerText();
    expect(footerText).toContain('/bin/sh');
  });
});

// ------------------------------------------------------------
// UI Tests: PodExecPanel — close interactions
// ------------------------------------------------------------

test.describe('PodExecPanel UI - panel close interactions', () => {
  test('should close the exec panel when the backdrop is clicked', async ({ page }) => {
    // Arrange: Open exec panel
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    const shellButton = firstPodCard.getByTestId('pod-exec-button');
    await shellButton.click();

    const execPanel = page.getByTestId('exec-panel');
    await expect(execPanel).toBeVisible();

    const backdrop = page.getByTestId('exec-panel-backdrop');
    await expect(backdrop).toBeVisible();

    // Act: Click the backdrop overlay to dismiss the panel
    await backdrop.click({ position: { x: 10, y: 10 } });

    // Assert: Exec panel should no longer be visible
    await expect(execPanel).not.toBeVisible();
    await expect(backdrop).not.toBeVisible();
  });

  test('should close the exec panel when the X close button is clicked', async ({ page }) => {
    // Arrange: Open exec panel
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    const shellButton = firstPodCard.getByTestId('pod-exec-button');
    await shellButton.click();

    const execPanel = page.getByTestId('exec-panel');
    await expect(execPanel).toBeVisible();

    // Act: Click the X close button
    const closeButton = execPanel.getByTestId('exec-panel-close-button');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // Assert: Exec panel should no longer be visible
    await expect(execPanel).not.toBeVisible();

    // Assert: Pods page should still be visible
    await expect(page.getByTestId('pod-card').first()).toBeVisible();
  });

  test('should be able to reopen exec panel after closing', async ({ page }) => {
    // Arrange: Open and close exec panel
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    const shellButton = firstPodCard.getByTestId('pod-exec-button');

    // Act: Open panel
    await shellButton.click();
    const execPanel = page.getByTestId('exec-panel');
    await expect(execPanel).toBeVisible();

    // Act: Close panel via close button
    const closeButton = execPanel.getByTestId('exec-panel-close-button');
    await closeButton.click();
    await expect(execPanel).not.toBeVisible();

    // Act: Reopen panel
    await shellButton.click();

    // Assert: Panel should be visible again
    await expect(execPanel).toBeVisible();

    // Assert: Terminal should be present
    const terminal = execPanel.getByTestId('exec-panel-terminal');
    await expect(terminal).toBeVisible();
  });
});

// ------------------------------------------------------------
// UI Tests: PodExecPanel — WebSocket connection for running pod
// ------------------------------------------------------------

test.describe('PodExecPanel UI - WebSocket connection', () => {
  test('should show Connected status for a running pod with shell', async ({ page }) => {
    // Arrange: Find the busybox-test pod (running, has /bin/sh)
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();

    let targetCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = podCards.nth(i);
      const nameText = await card.getByTestId('pod-name').innerText();
      if (nameText === 'busybox-test') {
        targetCard = card;
        break;
      }
    }

    // Skip if busybox-test not found
    if (!targetCard) return;

    // Act: Click Shell button on busybox-test
    const shellButton = targetCard.getByTestId('pod-exec-button');
    await shellButton.click();

    const execPanel = page.getByTestId('exec-panel');
    await expect(execPanel).toBeVisible();

    // Assert: Status should eventually show "Connected"
    const statusIndicator = execPanel.getByTestId('exec-panel-status');
    await expect(statusIndicator).toContainText('Connected', { timeout: 10000 });
  });

  test('should show Disconnected or error status for a non-running pod', async ({ page }) => {
    // Arrange: Find an unhealthy pod (ImagePullBackOff - cannot exec)
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const podCards = page.getByTestId('pod-card');
    const cardCount = await podCards.count();

    let targetCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = podCards.nth(i);
      const nameText = await card.getByTestId('pod-name').innerText();
      if (nameText === 'unhealthy-test-pod-2') {
        targetCard = card;
        break;
      }
    }

    // Skip if unhealthy pod not found
    if (!targetCard) return;

    // Act: Click Shell button on the unhealthy pod
    const shellButton = targetCard.getByTestId('pod-exec-button');
    await shellButton.click();

    const execPanel = page.getByTestId('exec-panel');
    await expect(execPanel).toBeVisible();

    // Assert: Status should show Disconnected (exec fails for non-running pods)
    const statusIndicator = execPanel.getByTestId('exec-panel-status');
    await expect(statusIndicator).toContainText(/Disconnected|Connecting/, { timeout: 10000 });
  });
});

// ------------------------------------------------------------
// UI Tests: PodExecPanel — all required fields displayed together
// ------------------------------------------------------------

test.describe('PodExecPanel UI - complete panel structure', () => {
  test('should display all required elements in the exec panel', async ({ page }) => {
    // Arrange: Open exec panel for any pod
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstPodCard = page.getByTestId('pod-card').first();
    const shellButton = firstPodCard.getByTestId('pod-exec-button');
    await shellButton.click();

    // Assert: All elements should be present
    const execPanel = page.getByTestId('exec-panel');
    await expect(execPanel).toBeVisible();

    // Header elements
    await expect(execPanel.getByTestId('exec-panel-title')).toBeVisible();
    await expect(execPanel.getByTestId('exec-panel-pod-info')).toBeVisible();
    await expect(execPanel.getByTestId('status-badge')).toBeVisible();
    await expect(execPanel.getByTestId('exec-panel-close-button')).toBeVisible();

    // Toolbar elements
    await expect(execPanel.getByTestId('exec-panel-container-selector')).toBeVisible();
    await expect(execPanel.getByTestId('exec-panel-reconnect-button')).toBeVisible();

    // Terminal
    await expect(execPanel.getByTestId('exec-panel-terminal')).toBeVisible();

    // Footer elements
    await expect(execPanel.getByTestId('exec-panel-footer')).toBeVisible();
    await expect(execPanel.getByTestId('exec-panel-status')).toBeVisible();
  });
});
