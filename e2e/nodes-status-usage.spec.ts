// Verifies: ND2 (docs/product/prd-nodes.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

test.describe('Nodes Tab - NodeCard Components', () => {
  test('should display StatusBadge with node status in each NodeCard', async ({ page }) => {
    // Tests that each NodeCard shows the node's status using StatusBadge component

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get all node cards
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Check first node card for status badge
    const firstNodeCard = nodeCards.first();
    const statusBadge = firstNodeCard.getByTestId('status-badge');
    await expect(statusBadge).toBeVisible();

    // Assert: Status should be Ready, NotReady, or Ready,SchedulingDisabled
    const statusText = await statusBadge.innerText();
    expect(statusText).toMatch(/^(Ready|NotReady|Ready,SchedulingDisabled)$/i);
  });

  test('should display CPU usage bar in each NodeCard', async ({ page }) => {
    // Tests that each NodeCard displays CPU usage with UsageBar component

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get the first node card
    const firstNodeCard = page.getByTestId('node-card').first();
    await expect(firstNodeCard).toBeVisible();

    // Assert: CPU usage container should be visible
    const cpuUsageContainer = firstNodeCard.getByTestId('node-cpu-usage');
    await expect(cpuUsageContainer).toBeVisible();

    // Assert: CPU usage label should be present
    const cpuLabel = cpuUsageContainer.getByText(/cpu/i);
    await expect(cpuLabel).toBeVisible();

    // Assert: CPU usage bar should have progressbar role
    const cpuProgressBar = firstNodeCard.getByRole('progressbar').first();
    await expect(cpuProgressBar).toBeVisible();
  });

  test('should display Memory usage bar in each NodeCard', async ({ page }) => {
    // Tests that each NodeCard displays Memory usage with UsageBar component

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get the first node card
    const firstNodeCard = page.getByTestId('node-card').first();
    await expect(firstNodeCard).toBeVisible();

    // Assert: Memory usage container should be visible
    const memoryUsageContainer = firstNodeCard.getByTestId('node-memory-usage');
    await expect(memoryUsageContainer).toBeVisible();

    // Assert: Memory usage label should be present
    const memoryLabel = memoryUsageContainer.getByText(/memory/i);
    await expect(memoryLabel).toBeVisible();

    // Assert: Memory usage bar should have progressbar role
    const memoryProgressBar = firstNodeCard.getByRole('progressbar').nth(1);
    await expect(memoryProgressBar).toBeVisible();
  });

  test('should display pod count in each NodeCard', async ({ page }) => {
    // Tests that each NodeCard shows the number of pods running on the node

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get the first node card
    const firstNodeCard = page.getByTestId('node-card').first();
    await expect(firstNodeCard).toBeVisible();

    // Assert: Pod count should be visible
    const podCount = firstNodeCard.getByTestId('node-pod-count');
    await expect(podCount).toBeVisible();

    // Assert: Pod count should contain a number
    const podCountText = await podCount.innerText();
    expect(podCountText).toMatch(/\d+/); // Contains at least one digit
    expect(podCountText.toLowerCase()).toMatch(/pod/i); // Contains "pod" text
  });
});

test.describe('Nodes Tab - CPU/Memory UsageBar Accessibility', () => {
  test('should have proper accessibility attributes for CPU usage bar', async ({ page }) => {
    // Tests ARIA attributes for CPU usage progressbar

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get the first node card
    const firstNodeCard = page.getByTestId('node-card').first();
    await expect(firstNodeCard).toBeVisible();

    // Act: Get CPU usage progressbar
    const cpuProgressBar = firstNodeCard.getByRole('progressbar').first();
    await expect(cpuProgressBar).toBeVisible();

    // Assert: Should have required ARIA attributes
    await expect(cpuProgressBar).toHaveAttribute('aria-valuenow');
    await expect(cpuProgressBar).toHaveAttribute('aria-valuemin', '0');
    await expect(cpuProgressBar).toHaveAttribute('aria-valuemax', '100');

    // Assert: aria-valuenow should be a valid percentage (0-100)
    const ariaValueNow = await cpuProgressBar.getAttribute('aria-valuenow');
    const cpuPercentage = parseFloat(ariaValueNow!);
    expect(cpuPercentage).toBeGreaterThan(0);
    expect(cpuPercentage).toBeLessThanOrEqual(100);
  });

  test('should have proper accessibility attributes for Memory usage bar', async ({ page }) => {
    // Tests ARIA attributes for Memory usage progressbar

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get the first node card
    const firstNodeCard = page.getByTestId('node-card').first();
    await expect(firstNodeCard).toBeVisible();

    // Act: Get Memory usage progressbar (second progressbar in the card)
    const memoryProgressBar = firstNodeCard.getByRole('progressbar').nth(1);
    await expect(memoryProgressBar).toBeVisible();

    // Assert: Should have required ARIA attributes
    await expect(memoryProgressBar).toHaveAttribute('aria-valuenow');
    await expect(memoryProgressBar).toHaveAttribute('aria-valuemin', '0');
    await expect(memoryProgressBar).toHaveAttribute('aria-valuemax', '100');

    // Assert: aria-valuenow should be a valid percentage (0-100)
    const ariaValueNow = await memoryProgressBar.getAttribute('aria-valuenow');
    const memoryPercentage = parseFloat(ariaValueNow!);
    expect(memoryPercentage).toBeGreaterThan(0);
    expect(memoryPercentage).toBeLessThanOrEqual(100);
  });

  test('should have aria-label for CPU usage bar describing the metric', async ({ page }) => {
    // Tests that CPU usage bar has descriptive aria-label

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get the first node card and CPU progressbar
    const firstNodeCard = page.getByTestId('node-card').first();
    const cpuProgressBar = firstNodeCard.getByRole('progressbar').first();

    // Assert: Should have aria-label or aria-labelledby
    const hasAriaLabel = await cpuProgressBar.getAttribute('aria-label');
    const hasAriaLabelledby = await cpuProgressBar.getAttribute('aria-labelledby');
    expect(hasAriaLabel || hasAriaLabelledby).toBeTruthy();

    // Assert: Label should contain "CPU" reference
    if (hasAriaLabel) {
      expect(hasAriaLabel.toLowerCase()).toContain('cpu');
    }
  });
});

test.describe('Nodes Tab - Ready Node Status', () => {
  test('should display Ready status badge with success variant for healthy nodes', async ({ page }) => {
    // Tests that Ready nodes show success-style status badge

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get all node cards
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Act: Find a Ready node (either Ready or Ready,SchedulingDisabled)
    let foundReadyNode = false;
    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const statusBadge = nodeCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      // Assert: If node is Ready, verify status badge styling
      if (statusText === 'Ready') {
        foundReadyNode = true;

        // Assert: Status badge should have success/green styling
        const badgeClasses = await statusBadge.getAttribute('class');
        expect(badgeClasses).toMatch(/success|green|ready/i);

        // Assert: CPU and Memory usage bars should be visible for Ready nodes
        const cpuUsage = nodeCard.getByTestId('node-cpu-usage');
        const memoryUsage = nodeCard.getByTestId('node-memory-usage');
        await expect(cpuUsage).toBeVisible();
        await expect(memoryUsage).toBeVisible();

        break;
      } else if (statusText === 'Ready,SchedulingDisabled') {
        foundReadyNode = true;

        // Assert: Status badge should have warning/yellow styling
        const badgeClasses = await statusBadge.getAttribute('class');
        expect(badgeClasses).toMatch(/warning|yellow/i);

        // Assert: CPU and Memory usage bars should still be visible
        const cpuUsage = nodeCard.getByTestId('node-cpu-usage');
        const memoryUsage = nodeCard.getByTestId('node-memory-usage');
        await expect(cpuUsage).toBeVisible();
        await expect(memoryUsage).toBeVisible();

        // Assert: Scheduling disabled warning should be visible
        const schedulingWarning = nodeCard.getByTestId('node-scheduling-disabled-warning');
        await expect(schedulingWarning).toBeVisible();

        break;
      }
    }

    // Assert: At least one Ready or SchedulingDisabled node should exist
    expect(foundReadyNode).toBe(true);
  });

  test('should render usage bars correctly for Ready nodes', async ({ page }) => {
    // Tests that Ready nodes display functional CPU/Memory usage bars

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get all node cards and find a Ready node
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    let readyNodeCard = null;

    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const statusBadge = nodeCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      if (statusText === 'Ready' || statusText === 'Ready,SchedulingDisabled') {
        readyNodeCard = nodeCard;
        break;
      }
    }

    // Assert: Found a Ready or SchedulingDisabled node
    expect(readyNodeCard).toBeTruthy();
    if (!readyNodeCard) return;

    // Assert: CPU progressbar should render with valid width
    const cpuProgressBar = readyNodeCard.getByRole('progressbar').first();
    await expect(cpuProgressBar).toBeVisible();
    const cpuWidth = await cpuProgressBar.evaluate(el => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.width);
    });
    expect(cpuWidth).toBeGreaterThan(0);

    // Assert: Memory progressbar should render with valid width
    const memoryProgressBar = readyNodeCard.getByRole('progressbar').nth(1);
    await expect(memoryProgressBar).toBeVisible();
    const memoryWidth = await memoryProgressBar.evaluate(el => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.width);
    });
    expect(memoryWidth).toBeGreaterThan(0);
  });

  test('should display pod count for Ready nodes', async ({ page }) => {
    // Tests that Ready nodes show accurate pod count

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Find a Ready node
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    let readyNodeCard = null;

    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const statusBadge = nodeCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      if (statusText === 'Ready' || statusText === 'Ready,SchedulingDisabled') {
        readyNodeCard = nodeCard;
        break;
      }
    }

    // Assert: Found a Ready or SchedulingDisabled node
    expect(readyNodeCard).toBeTruthy();
    if (!readyNodeCard) return;

    // Assert: Pod count should be visible and contain valid number
    const podCount = readyNodeCard.getByTestId('node-pod-count');
    await expect(podCount).toBeVisible();

    const podCountText = await podCount.innerText();
    const podNumber = parseInt(podCountText.match(/\d+/)?.[0] || '0');
    expect(podNumber).toBeGreaterThanOrEqual(0); // Can be 0 or more
  });
});

test.describe('Nodes Tab - NotReady Node Handling', () => {
  test('should display NotReady status badge with error variant for unhealthy nodes', async ({ page }) => {
    // Tests that NotReady nodes show error-style status badge

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get all node cards
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();

    // Act: Look for NotReady nodes
    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const statusBadge = nodeCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      // Assert: If node is NotReady, verify error styling
      if (statusText.toLowerCase().includes('notready')) {
        // Assert: Status badge should have error/red styling
        const badgeClasses = await statusBadge.getAttribute('class');
        expect(badgeClasses).toMatch(/error|red|danger|notready/i);

        // Note: NotReady nodes may still show usage bars or show disabled state
        // This depends on implementation requirements
        break;
      }
    }

    // Note: This test doesn't fail if all nodes are Ready
    // In a healthy cluster, all nodes should be Ready
  });
});

test.describe('Nodes Tab - Role Display', () => {
  test('should display node role when available', async ({ page }) => {
    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Assert: Node cards should be visible
    const firstNodeCard = page.getByTestId('node-card').first();
    await expect(firstNodeCard).toBeVisible();

    // Role badge may or may not be present depending on node labels
    const roleBadge = firstNodeCard.getByTestId('node-role');
    const roleCount = await roleBadge.count();
    if (roleCount > 0) {
      await expect(roleBadge).toBeVisible();
      const roleText = await roleBadge.innerText();
      expect(roleText.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Nodes Tab - SchedulingDisabled (Cordoned/Drained) Node Handling', () => {
  test('should display yellow status badge for SchedulingDisabled nodes', async ({ page }) => {
    // Tests that cordoned/drained nodes show warning-style status badge

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Get all node cards
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();

    // Act: Look for SchedulingDisabled nodes
    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const statusBadge = nodeCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      // Assert: If node is SchedulingDisabled, verify yellow/warning styling
      if (statusText === 'Ready,SchedulingDisabled') {
        const badgeClasses = await statusBadge.getAttribute('class');
        expect(badgeClasses).toMatch(/warning|yellow/i);

        // Assert: Should still show usage bars (node is healthy)
        const cpuUsage = nodeCard.getByTestId('node-cpu-usage');
        const memoryUsage = nodeCard.getByTestId('node-memory-usage');
        await expect(cpuUsage).toBeVisible();
        await expect(memoryUsage).toBeVisible();

        // Assert: Should show scheduling disabled warning message
        const schedulingWarning = nodeCard.getByTestId('node-scheduling-disabled-warning');
        await expect(schedulingWarning).toBeVisible();

        // Assert: Should NOT show NotReady warning
        const notReadyWarning = nodeCard.getByTestId('node-not-ready-warning');
        const notReadyCount = await notReadyWarning.count();
        if (notReadyCount > 0) {
          await expect(notReadyWarning).not.toBeVisible();
        }

        break;
      }
    }

    // Note: This test won't fail if no SchedulingDisabled nodes exist in the cluster
  });

  test('should display pod count for SchedulingDisabled nodes', async ({ page }) => {
    // Tests that cordoned/drained nodes still show pod count

    // Arrange: Navigate to the Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Look for SchedulingDisabled nodes
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();

    for (let i = 0; i < cardCount; i++) {
      const nodeCard = nodeCards.nth(i);
      const statusBadge = nodeCard.getByTestId('status-badge');
      const statusText = await statusBadge.innerText();

      if (statusText === 'Ready,SchedulingDisabled') {
        // Assert: Pod count should still be visible
        const podCount = nodeCard.getByTestId('node-pod-count');
        await expect(podCount).toBeVisible();
        const podCountText = await podCount.innerText();
        expect(podCountText).toMatch(/\d+/);
        break;
      }
    }
  });
});
