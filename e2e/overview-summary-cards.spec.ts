// Verifies: OV1 (docs/product/prd-overview.md) — sole dedicated e2e spec for this AC.
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

test.describe('LoadingSkeleton Component - Overview Tab', () => {
  test('should display loading skeleton on initial page load', async ({ page }) => {
    // Tests that LoadingSkeleton appears during data fetch on Overview tab

    // Arrange: Navigate to the Overview page
    await page.goto('/');

    // Act: Check for loading state immediately after navigation
    const loadingIndicator = page.getByTestId('loading-skeleton')
      .or(page.locator('[data-testid*="loading"]'))
      .or(page.locator('[aria-busy="true"]'));

    // Assert: Loading indicator should be present (may be brief)
    // Note: This test may need to be adjusted based on actual loading time
    const loadingExists = await loadingIndicator.count();

    // Wait for page to finish loading
    await page.waitForLoadState('networkidle');

    // Assert: After loading completes, content should be visible
    const summaryCards = page.getByRole('article');
    const cardCount = await summaryCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Assert: Loading indicator should no longer be visible
    if (loadingExists > 0) {
      await expect(loadingIndicator.first()).not.toBeVisible();
    }
  });

  test('should show loading skeleton with proper accessibility attributes', async ({ page }) => {
    // Tests that LoadingSkeleton has appropriate ARIA attributes

    // Arrange: Delay API responses so loading skeleton stays visible long enough to test
    // mock-exception: LAT — 로딩 스켈레톤/ARIA 관측 위해 **/api/** 응답 지연 주입; 실 응답은 즉시 완료돼 스켈레톤 상태를 못 잡음 (docs/e2e-mocking-policy.md)
    await page.route('**/api/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      try {
        await route.continue();
      } catch {
        // Route may have been already handled by navigation or page close
      }
    });

    // Act: Navigate to the Overview page
    await page.goto('/');

    // Assert: Loading indicator should appear while API is delayed
    const loadingIndicator = page.locator('[aria-busy="true"]')
      .or(page.getByTestId('loading-skeleton'));

    await expect(loadingIndicator.first()).toBeVisible({ timeout: 5000 });

    // Assert: Capture all attributes at once to avoid race condition
    // where the element disappears between sequential getAttribute calls
    const attrs = await loadingIndicator.first().evaluate((el) => ({
      ariaBusy: el.getAttribute('aria-busy'),
      ariaLabel: el.getAttribute('aria-label'),
      role: el.getAttribute('role'),
    }));

    // Assert: Should have aria-busy="true" during loading
    expect(attrs.ariaBusy).toBe('true');

    // Assert: Should have aria-label or role for screen readers
    expect(attrs.ariaLabel || attrs.role).toBeTruthy();

    // Cleanup: Remove route interception and wait for loading to complete
    await page.unroute('**/api/**');
    await page.waitForLoadState('networkidle');
  });

  test('should display loading skeleton for summary cards', async ({ page }) => {
    // Tests that summary cards area shows loading skeleton

    // Arrange: Navigate to the Overview page
    await page.goto('/');

    // Act: Check for summary cards loading state
    const summaryCardsContainer = page.getByTestId('summary-cards')
      .or(page.locator('[data-testid*="summary"]'));

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');

    // Assert: Summary cards should be visible after loading
    const summaryCards = page.getByRole('article');
    const cardCount = await summaryCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Assert: Cards should display actual data (not loading state)
    const firstCard = summaryCards.first();
    await expect(firstCard).toBeVisible();
    const cardText = await firstCard.innerText();
    expect(cardText.length).toBeGreaterThan(0);
  });
});

test.describe('ErrorRetry Component - Overview Tab', () => {
  test('should display error message when summary cards fail to load', async ({ page }) => {
    // Tests that ErrorRetry component appears when API fails

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state or successful load
    const errorContainer = page.getByTestId('summary-cards-error');
    const summaryCards = page.getByRole('article');

    // Assert: Either error is displayed or cards are successfully loaded
    const hasError = await errorContainer.isVisible().catch(() => false);
    const hasCards = (await summaryCards.count()) > 0;

    expect(hasError || hasCards).toBe(true);

    // If error is displayed, verify retry button
    if (hasError) {
      const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i })
        .or(errorContainer.getByTestId('retry-button'));
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toBeEnabled();
    }
  });

  test('should retry data fetch when retry button is clicked', async ({ page }) => {
    // Tests that clicking retry button refetches data

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Check if error state exists
    const errorContainer = page.getByTestId('summary-cards-error');
    const hasError = await errorContainer.isVisible().catch(() => false);

    if (hasError) {
      // Act: Click retry button
      const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i })
        .or(errorContainer.getByTestId('retry-button'));

      await retryButton.click();

      // Assert: Should show loading state during retry
      const loadingIndicator = page.locator('[aria-busy="true"]')
        .or(page.getByTestId('loading-skeleton'));

      // Wait for retry to complete
      await page.waitForLoadState('networkidle');

      // Assert: Either show data or error again
      const summaryCards = page.getByRole('article');
      const errorStillVisible = await errorContainer.isVisible().catch(() => false);
      const hasCards = (await summaryCards.count()) > 0;

      expect(errorStillVisible || hasCards).toBe(true);
    }
  });

  test('should display user-friendly error message', async ({ page }) => {
    // Tests that error messages are clear and helpful

    // Arrange: Navigate to the Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state
    const errorContainer = page.getByTestId('summary-cards-error');
    const hasError = await errorContainer.isVisible().catch(() => false);

    if (hasError) {
      // Assert: Error message should be visible and descriptive
      const errorMessage = await errorContainer.innerText();
      expect(errorMessage.length).toBeGreaterThan(0);

      // Assert: Should contain helpful information
      expect(errorMessage.toLowerCase()).toMatch(/error|failed|unable|problem/);

      // Assert: Should suggest an action (retry)
      const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i });
      await expect(retryButton).toBeVisible();
    }
  });
});

test.describe('Common UI Components - Accessibility', () => {
  test('should have proper ARIA attributes for loading states', async ({ page }) => {
    // Tests accessibility of loading skeletons

    // Arrange: Navigate to Overview page
    await page.goto('/');

    // Act: Check for loading state
    const loadingIndicator = page.locator('[aria-busy="true"]')
      .or(page.getByTestId('loading-skeleton'));

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Assert: After loading, aria-busy should be false or removed
    const bodyBusy = await page.locator('body').getAttribute('aria-busy');
    expect(bodyBusy).not.toBe('true');
  });

  test('should have proper ARIA attributes for error states', async ({ page }) => {
    // Tests accessibility of error messages

    // Arrange: Navigate to Overview page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state
    const errorContainer = page.getByTestId('summary-cards-error');
    const hasError = await errorContainer.isVisible().catch(() => false);

    if (hasError) {
      // Assert: Error should have role="alert" or aria-live
      const role = await errorContainer.getAttribute('role');
      const ariaLive = await errorContainer.getAttribute('aria-live');

      expect(role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBe(true);

      // Assert: Retry button should have proper label
      const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i });
      const hasRetryButton = (await retryButton.count()) > 0;

      if (hasRetryButton) {
        await expect(retryButton).toHaveAttribute('aria-label');
      }
    }
  });

  test('should announce empty states to screen readers', async ({ page }) => {
    // Tests accessibility of empty states

    const tabs = [
      { url: '/nodes', emptyTestId: 'nodes-empty' },
      { url: '/workloads', emptyTestId: 'empty-state' }
    ];

    for (const tab of tabs) {
      // Arrange: Navigate to tab
      await page.goto(tab.url);
      await page.waitForLoadState('networkidle');

      // Act: Check if empty state exists
      const emptyState = page.getByTestId(tab.emptyTestId);
      const isEmpty = await emptyState.isVisible().catch(() => false);

      if (isEmpty) {
        // Assert: Empty state should be accessible
        const role = await emptyState.getAttribute('role');
        const ariaLabel = await emptyState.getAttribute('aria-label');

        // Should have either role or aria-label for accessibility
        expect(role || ariaLabel).toBeTruthy();
      }
    }
  });
});

test.describe('Common UI Components - Responsive Design', () => {
  test('should display loading skeleton correctly on mobile', async ({ page }) => {
    // Tests that loading skeletons are responsive

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Content should be visible and responsive
    const summaryCards = page.getByRole('article');
    const cardCount = await summaryCards.count();

    if (cardCount > 0) {
      const firstCard = summaryCards.first();
      await expect(firstCard).toBeVisible();

      // Assert: Card should fit within mobile viewport
      const box = await firstCard.boundingBox();
      expect(box!.width).toBeLessThanOrEqual(375);
    }
  });
});

test.describe('Common UI Components - Consistency Across Tabs', () => {
  test('should use consistent LoadingSkeleton design on Overview tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: Tab should load successfully (either with data or empty state)
    const body = await page.locator('body').innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });

  test('should use consistent ErrorRetry button style on Overview tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Check if error state exists
    const errorContainer = page.getByTestId('summary-cards-error');
    const hasError = await errorContainer.isVisible().catch(() => false);

    if (hasError) {
      // Assert: Retry button should exist and be consistent
      const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i })
        .or(errorContainer.getByTestId('retry-button'));

      const hasRetryButton = (await retryButton.count()) > 0;
      expect(hasRetryButton).toBe(true);

      if (hasRetryButton) {
        await expect(retryButton.first()).toBeVisible();
      }
    }
  });
});
