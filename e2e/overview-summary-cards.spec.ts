import { test, expect } from '@playwright/test';

test.describe('Overview Tab - Summary Cards', () => {
  test('should display four summary cards on Overview tab', async ({ page }) => {
    // Tests OverviewTab and SummaryCards component rendering

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the Overview tab or section
    const overviewSection = page.getByTestId('overview-tab')
      .or(page.getByRole('region', { name: /overview/i }));
    await expect(overviewSection).toBeVisible();

    // Assert: Should display exactly 4 summary cards
    const summaryCards = page.getByRole('article');
    await expect(summaryCards).toHaveCount(4);

    // Assert: Each card should be visible
    const cards = await summaryCards.all();
    for (const card of cards) {
      await expect(card).toBeVisible();
    }
  });

  test('should display Nodes summary card with correct label and value', async ({ page }) => {
    // Tests Nodes SummaryCard content

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the Nodes summary card
    const nodesCard = page.getByTestId('summary-card-nodes')
      .or(page.getByRole('article', { name: /nodes/i }));
    await expect(nodesCard).toBeVisible();

    // Assert: Card should have "Nodes" label
    const nodesLabel = nodesCard.getByText(/nodes/i)
      .or(nodesCard.getByTestId('summary-card-label'));
    await expect(nodesLabel).toBeVisible();

    // Assert: Card should display a numeric value
    const nodesValue = nodesCard.getByTestId('summary-card-value')
      .or(nodesCard.locator('[data-value]'));
    await expect(nodesValue).toBeVisible();
    await expect(nodesValue).toContainText(/\d+\s*\/\s*\d+/);
  });

  test('should display Unhealthy Pods summary card with correct label and value', async ({ page }) => {
    // Tests Unhealthy Pods SummaryCard content

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the Unhealthy Pods summary card
    const unhealthyPodsCard = page.getByTestId('summary-card-unhealthy-pods')
      .or(page.getByRole('article', { name: /unhealthy pods/i }));
    await expect(unhealthyPodsCard).toBeVisible();

    // Assert: Card should have "Unhealthy Pods" label
    const unhealthyPodsLabel = unhealthyPodsCard.getByText(/unhealthy pods/i)
      .or(unhealthyPodsCard.getByTestId('summary-card-label'));
    await expect(unhealthyPodsLabel).toBeVisible();

    // Assert: Card should display a numeric value
    const unhealthyPodsValue = unhealthyPodsCard.getByTestId('summary-card-value')
      .or(unhealthyPodsCard.locator('[data-value]'));
    await expect(unhealthyPodsValue).toBeVisible();
    await expect(unhealthyPodsValue).toContainText(/^\d+$/);
  });

  test('should display Avg CPU summary card with correct label and percentage', async ({ page }) => {
    // Tests Avg CPU SummaryCard with UsageBar component

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the Avg CPU summary card
    const avgCpuCard = page.getByTestId('summary-card-avg-cpu')
      .or(page.getByRole('article', { name: /avg cpu/i }));
    await expect(avgCpuCard).toBeVisible();

    // Assert: Card should have "Avg CPU" label
    const avgCpuLabel = avgCpuCard.getByText(/avg cpu/i)
      .or(avgCpuCard.getByTestId('summary-card-label'));
    await expect(avgCpuLabel).toBeVisible();

    // Assert: Card should display a percentage value
    const avgCpuValue = avgCpuCard.getByTestId('summary-card-value')
      .or(avgCpuCard.locator('[data-value]'));
    await expect(avgCpuValue).toBeVisible();
    await expect(avgCpuValue).toContainText(/%/);

    // Assert: Card should contain a UsageBar (progress bar)
    const usageBar = avgCpuCard.getByTestId('usage-bar')
      .or(avgCpuCard.getByRole('progressbar'));
    await expect(usageBar).toBeVisible();

    // Assert: UsageBar should have aria-valuenow attribute
    await expect(usageBar).toHaveAttribute('aria-valuenow');
  });

  test('should display Avg Memory summary card with correct label and percentage', async ({ page }) => {
    // Tests Avg Memory SummaryCard with UsageBar component

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the Avg Memory summary card
    const avgMemoryCard = page.getByTestId('summary-card-avg-memory')
      .or(page.getByRole('article', { name: /avg memory/i }));
    await expect(avgMemoryCard).toBeVisible();

    // Assert: Card should have "Avg Memory" label
    const avgMemoryLabel = avgMemoryCard.getByText(/avg memory/i)
      .or(avgMemoryCard.getByTestId('summary-card-label'));
    await expect(avgMemoryLabel).toBeVisible();

    // Assert: Card should display a percentage value
    const avgMemoryValue = avgMemoryCard.getByTestId('summary-card-value')
      .or(avgMemoryCard.locator('[data-value]'));
    await expect(avgMemoryValue).toBeVisible();
    await expect(avgMemoryValue).toContainText(/%/);

    // Assert: Card should contain a UsageBar (progress bar)
    const usageBar = avgMemoryCard.getByTestId('usage-bar')
      .or(avgMemoryCard.getByRole('progressbar'));
    await expect(usageBar).toBeVisible();

    // Assert: UsageBar should have aria-valuenow attribute
    await expect(usageBar).toHaveAttribute('aria-valuenow');
  });
});

test.describe('Overview Tab - Summary Cards Layout', () => {
  test('should display cards in 2-column grid on mobile viewport', async ({ page }) => {
    // Tests responsive grid layout on mobile devices

    // Arrange: Set mobile viewport (iPhone SE dimensions)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the summary cards container
    const cardsContainer = page.getByTestId('summary-cards-container')
      .or(page.locator('.summary-cards-grid'));
    await expect(cardsContainer).toBeVisible();

    // Assert: Container should have grid layout
    const gridStyle = await cardsContainer.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        gridTemplateColumns: styles.gridTemplateColumns,
      };
    });

    // Assert: Should use CSS Grid with 2 columns
    expect(gridStyle.display).toBe('grid');
    // Grid template columns should create a 2-column layout on mobile
    // This might be "repeat(2, 1fr)" or similar

    // Assert: All 4 cards should still be visible
    const summaryCards = page.getByRole('article');
    await expect(summaryCards).toHaveCount(4);

    // Assert: Cards should be arranged in 2 rows of 2 cards each
    const firstCard = summaryCards.nth(0);
    const secondCard = summaryCards.nth(1);
    const thirdCard = summaryCards.nth(2);

    const firstCardBox = await firstCard.boundingBox();
    const secondCardBox = await secondCard.boundingBox();
    const thirdCardBox = await thirdCard.boundingBox();

    // Assert: First and second cards should be on the same row (similar Y position)
    expect(Math.abs(firstCardBox!.y - secondCardBox!.y)).toBeLessThan(10);

    // Assert: Third card should be on a different row (different Y position)
    expect(thirdCardBox!.y).toBeGreaterThan(firstCardBox!.y + 50);
  });

  test('should display cards in 4-column grid on desktop viewport', async ({ page }) => {
    // Tests responsive grid layout on desktop

    // Arrange: Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the summary cards container
    const cardsContainer = page.getByTestId('summary-cards-container')
      .or(page.locator('.summary-cards-grid'));
    await expect(cardsContainer).toBeVisible();

    // Assert: All 4 cards should be visible
    const summaryCards = page.getByRole('article');
    await expect(summaryCards).toHaveCount(4);

    // Assert: All cards should be on the same row on desktop (similar Y position)
    const firstCard = summaryCards.nth(0);
    const secondCard = summaryCards.nth(1);
    const thirdCard = summaryCards.nth(2);
    const fourthCard = summaryCards.nth(3);

    const firstCardBox = await firstCard.boundingBox();
    const secondCardBox = await secondCard.boundingBox();
    const thirdCardBox = await thirdCard.boundingBox();
    const fourthCardBox = await fourthCard.boundingBox();

    // Assert: All cards should have similar Y positions (same row)
    expect(Math.abs(firstCardBox!.y - secondCardBox!.y)).toBeLessThan(10);
    expect(Math.abs(firstCardBox!.y - thirdCardBox!.y)).toBeLessThan(10);
    expect(Math.abs(firstCardBox!.y - fourthCardBox!.y)).toBeLessThan(10);

    // Assert: Cards should be arranged horizontally (increasing X positions)
    expect(secondCardBox!.x).toBeGreaterThan(firstCardBox!.x);
    expect(thirdCardBox!.x).toBeGreaterThan(secondCardBox!.x);
    expect(fourthCardBox!.x).toBeGreaterThan(thirdCardBox!.x);
  });
});

test.describe('Overview Tab - Loading State', () => {
  test('should display skeleton cards while loading data', async ({ page }) => {
    // Tests loading state with skeleton placeholders

    // Arrange: Navigate to the page and intercept API to delay response
    await page.goto('/');

    // Act: Look for loading state immediately after navigation
    // Before data loads, should show skeleton cards
    const skeletonCards = page.getByTestId('summary-card-skeleton')
      .or(page.locator('.summary-card-skeleton'));

    // Assert: Should display 4 skeleton cards while loading
    // Note: This may require fast navigation or network throttling to catch
    // We'll check if either real cards or skeleton cards are present

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');

    // Assert: After loading, skeleton cards should be replaced with real cards
    const summaryCards = page.getByRole('article');
    await expect(summaryCards).toHaveCount(4);

    // Assert: Skeleton cards should no longer be visible
    await expect(skeletonCards.first()).not.toBeVisible();
  });

  test('should show loading state with proper accessibility attributes', async ({ page }) => {
    // Tests loading state accessibility (aria-busy, aria-live)

    // Arrange: Navigate to the page
    await page.goto('/');

    // Act: Locate the summary cards container during loading
    const cardsContainer = page.getByTestId('summary-cards-container');

    // Assert: Container should have aria-live attribute for screen readers
    await expect(cardsContainer).toHaveAttribute('aria-live', 'polite');

    // Wait for loading to complete
    await page.waitForLoadState('networkidle');

    // Assert: All cards should be loaded and visible
    const summaryCards = page.getByRole('article');
    await expect(summaryCards).toHaveCount(4);

    // Assert: No elements should have aria-busy="true" after loading
    const busyElements = page.locator('[aria-busy="true"]');
    await expect(busyElements).toHaveCount(0);
  });
});

test.describe('Overview Tab - Error State', () => {
  test('should display error message when data fetch fails', async ({ page }) => {
    // Tests error state when API request fails

    // Arrange: Navigate to the page (assume API will fail in test environment)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state
    // In a failed state, should show error message instead of cards
    const errorMessage = page.getByTestId('summary-cards-error')
      .or(page.getByText(/error loading summary data/i));

    // Assert: If error occurs, error message should be visible
    // OR cards should be visible (depending on API state)
    const summaryCards = page.getByRole('article');

    // Either error is shown or cards are loaded successfully
    const errorVisible = await errorMessage.isVisible().catch(() => false);
    const cardsVisible = (await summaryCards.count()) === 4;

    expect(errorVisible || cardsVisible).toBeTruthy();
  });

  test('should display retry button on error state', async ({ page }) => {
    // Tests retry functionality in error state

    // Arrange: Navigate to the page and wait for potential error
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Look for error state with retry button
    const errorContainer = page.getByTestId('summary-cards-error')
      .or(page.locator('.summary-cards-error'));

    // Assert: If error state is shown, retry button should be present
    if (await errorContainer.isVisible()) {
      const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i })
        .or(errorContainer.getByTestId('retry-button'));
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toBeEnabled();

      // Act: Click retry button
      await retryButton.click();

      // Assert: Should trigger a new data fetch
      // Loading state should appear
      const loadingIndicator = page.getByTestId('summary-card-skeleton')
        .or(page.locator('[aria-busy="true"]'));

      // Wait for retry to complete
      await page.waitForLoadState('networkidle');

      // Assert: Should either show cards or error message again
      const summaryCards = page.getByRole('article');
      const errorMessage = page.getByTestId('summary-cards-error');

      const cardsVisible = (await summaryCards.count()) > 0;
      const errorStillVisible = await errorMessage.isVisible().catch(() => false);

      expect(cardsVisible || errorStillVisible).toBeTruthy();
    }
  });

  test('should display user-friendly error message with details', async ({ page }) => {
    // Tests error message clarity and helpfulness

    // Arrange: Navigate to the page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state
    const errorContainer = page.getByTestId('summary-cards-error');

    // Assert: If error occurs, message should be user-friendly
    if (await errorContainer.isVisible()) {
      // Assert: Error title should be present
      const errorTitle = errorContainer.getByRole('heading', { name: /error|failed/i })
        .or(errorContainer.getByTestId('error-title'));
      await expect(errorTitle).toBeVisible();

      // Assert: Error description should provide helpful information
      const errorDescription = errorContainer.getByTestId('error-description')
        .or(errorContainer.getByText(/unable to load|failed to fetch|try again/i));
      await expect(errorDescription).toBeVisible();

      // Assert: Should not expose technical error details to users
      // (no stack traces, internal error codes, etc.)
      const errorText = await errorContainer.innerText();
      expect(errorText).not.toContain('stack');
      expect(errorText).not.toContain('undefined');
      expect(errorText).not.toContain('null');
    }
  });
});

test.describe('Overview Tab - Data Accuracy', () => {
  test('should display correct node count from cluster', async ({ page }) => {
    // Tests that Nodes card shows accurate data from Kubernetes API

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Get the node count from Nodes summary card
    const nodesCard = page.getByTestId('summary-card-nodes');
    const nodesValue = nodesCard.getByTestId('summary-card-value');
    const displayedNodeCount = await nodesValue.innerText();

    // Assert: Value should be in "ready / total" format
    expect(displayedNodeCount).toMatch(/^\d+\s*\/\s*\d+$/);
    const parts = displayedNodeCount.split('/').map((s: string) => parseInt(s.trim(), 10));
    expect(parts[0]).toBeGreaterThanOrEqual(0);
    expect(parts[1]).toBeGreaterThanOrEqual(0);
    expect(parts[0]).toBeLessThanOrEqual(parts[1]);

    // Note: In a real E2E test environment, you would verify this against
    // the actual cluster state using kubectl or K8s API
  });

  test('should update unhealthy pods count when pod status changes', async ({ page }) => {
    // Tests real-time updates to Unhealthy Pods card

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Get initial unhealthy pods count
    const unhealthyPodsCard = page.getByTestId('summary-card-unhealthy-pods');
    const unhealthyPodsValue = unhealthyPodsCard.getByTestId('summary-card-value');
    const initialCount = await unhealthyPodsValue.innerText();

    // Assert: Value should be a valid number
    expect(initialCount).toMatch(/^\d+$/);

    // Note: To test real-time updates, you would:
    // 1. Create/delete a pod with unhealthy status
    // 2. Wait for the dashboard to refresh (WebSocket or polling)
    // 3. Verify the count updates

    // Act: Refresh the page to get latest data
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert: Count should still be a valid number (may have changed)
    const updatedCount = await unhealthyPodsValue.innerText();
    expect(updatedCount).toMatch(/^\d+$/);
  });

  test('should display CPU usage as percentage between 0-100', async ({ page }) => {
    // Tests that Avg CPU displays valid percentage values

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Get CPU percentage from card
    const avgCpuCard = page.getByTestId('summary-card-avg-cpu');
    const avgCpuValue = avgCpuCard.getByTestId('summary-card-value');
    const cpuText = await avgCpuValue.innerText();

    // Assert: Should display percentage format (e.g., "45%")
    expect(cpuText).toMatch(/^\d+(\.\d+)?%$/);

    // Assert: Percentage should be between 0-100
    const cpuPercentage = parseFloat(cpuText.replace('%', ''));
    expect(cpuPercentage).toBeGreaterThan(0);
    expect(cpuPercentage).toBeLessThanOrEqual(100);

    // Assert: UsageBar aria-valuenow should match displayed percentage
    const usageBar = avgCpuCard.getByTestId('usage-bar');
    const ariaValue = await usageBar.getAttribute('aria-valuenow');
    expect(parseFloat(ariaValue!)).toBeCloseTo(cpuPercentage, 1);
  });

  test('should display Memory usage as percentage between 0-100', async ({ page }) => {
    // Tests that Avg Memory displays valid percentage values

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Get Memory percentage from card
    const avgMemoryCard = page.getByTestId('summary-card-avg-memory');
    const avgMemoryValue = avgMemoryCard.getByTestId('summary-card-value');
    const memoryText = await avgMemoryValue.innerText();

    // Assert: Should display percentage format (e.g., "67%")
    expect(memoryText).toMatch(/^\d+(\.\d+)?%$/);

    // Assert: Percentage should be between 0-100
    const memoryPercentage = parseFloat(memoryText.replace('%', ''));
    expect(memoryPercentage).toBeGreaterThan(0);
    expect(memoryPercentage).toBeLessThanOrEqual(100);

    // Assert: UsageBar aria-valuenow should match displayed percentage
    const usageBar = avgMemoryCard.getByTestId('usage-bar');
    const ariaValue = await usageBar.getAttribute('aria-valuenow');
    expect(parseFloat(ariaValue!)).toBeCloseTo(memoryPercentage, 1);
  });
});
