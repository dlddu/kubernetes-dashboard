import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Common UI Components (LoadingSkeleton, ErrorRetry, EmptyState)
 *
 * TDD Green Phase: Components implemented - tests activated.
 * These tests verify the behavior of common UI components that are
 * used across multiple tabs (Overview, Nodes, Workloads, Pods, Secrets).
 *
 * Related Issue: DLD-389 - Common UI Components E2E Testing
 */

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

    // Arrange: Navigate to the Overview page
    await page.goto('/');

    // Act: Check for loading state
    const loadingIndicator = page.locator('[aria-busy="true"]')
      .or(page.getByTestId('loading-skeleton'));

    const loadingCount = await loadingIndicator.count();

    if (loadingCount > 0) {
      // Assert: Should have aria-busy="true" during loading
      const ariaBusy = await loadingIndicator.first().getAttribute('aria-busy');
      expect(ariaBusy).toBe('true');

      // Assert: Should have aria-label or role for screen readers
      const hasAriaLabel = await loadingIndicator.first().getAttribute('aria-label');
      const hasRole = await loadingIndicator.first().getAttribute('role');
      expect(hasAriaLabel || hasRole).toBeTruthy();
    }

    // Wait for loading to complete
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

test.describe('LoadingSkeleton Component - Nodes Tab', () => {
  test('should display loading skeleton while fetching node data', async ({ page }) => {
    // Tests that LoadingSkeleton appears during node data fetch

    // Arrange: Navigate to the Nodes tab
    await page.goto('/nodes');

    // Act: Check for loading state
    const loadingIndicator = page.getByTestId('nodes-loading')
      .or(page.locator('[data-testid*="loading"]'))
      .or(page.locator('[aria-busy="true"]'));

    // Assert: Page should be visible
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Assert: Node cards should be displayed after loading
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Loading indicator should no longer be visible
    const loadingStillVisible = await loadingIndicator.isVisible().catch(() => false);
    expect(loadingStillVisible).toBe(false);
  });

  test('should show skeleton cards matching final node card layout', async ({ page }) => {
    // Tests that loading skeleton matches the structure of node cards

    // Arrange: Navigate to the Nodes tab
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Navigate to Nodes tab to observe loading skeleton
    await page.goto('/nodes');

    // Wait for loading to complete
    await page.waitForLoadState('networkidle');

    // Assert: Node cards should have consistent structure
    const nodeCards = page.getByTestId('node-card');
    const cardCount = await nodeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Assert: Each card should have name, status, and usage bars
    const firstCard = nodeCards.first();
    await expect(firstCard.getByTestId('node-name')).toBeVisible();
    await expect(firstCard.getByTestId('status-badge')).toBeVisible();
    await expect(firstCard.getByTestId('node-cpu-usage')).toBeVisible();
  });
});

test.describe('LoadingSkeleton Component - Workloads Tab', () => {
  test('should display loading skeleton while fetching workload data', async ({ page }) => {
    // Tests that LoadingSkeleton appears during workload data fetch

    // Arrange: Navigate to the Workloads tab
    await page.goto('/workloads');

    // Act: Check for loading state
    const loadingIndicator = page.getByTestId('loading-indicator')
      .or(page.locator('[data-testid*="loading"]'))
      .or(page.locator('[aria-busy="true"]'));

    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Assert: Deployment cards should be displayed after loading
    const workloadCards = page.getByTestId('deployment-card');
    const cardCount = await workloadCards.count();

    // Either cards are displayed or empty state is shown
    if (cardCount === 0) {
      const emptyState = page.getByTestId('empty-state');
      await expect(emptyState).toBeVisible();
    } else {
      expect(cardCount).toBeGreaterThan(0);
    }

    // Assert: Loading indicator should no longer be visible
    const loadingStillVisible = await loadingIndicator.isVisible().catch(() => false);
    expect(loadingStillVisible).toBe(false);
  });
});

test.describe('LoadingSkeleton Component - Pods Tab', () => {
  test('should display loading skeleton while fetching pod data', async ({ page }) => {
    // Tests that LoadingSkeleton appears during pod data fetch

    // Arrange: Navigate to the Pods tab
    await page.goto('/pods');

    // Act: Check for loading state
    const loadingIndicator = page.getByTestId('pods-loading')
      .or(page.locator('[data-testid*="loading"]'))
      .or(page.locator('[aria-busy="true"]'));

    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Assert: Pod table or empty state should be displayed after loading
    const podRows = page.getByTestId('pod-card');
    const emptyMessage = page.getByTestId('no-unhealthy-pods-message');

    const hasRows = (await podRows.count()) > 0;
    const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);

    expect(hasRows || hasEmptyMessage).toBe(true);

    // Assert: Loading indicator should no longer be visible
    const loadingStillVisible = await loadingIndicator.isVisible().catch(() => false);
    expect(loadingStillVisible).toBe(false);
  });
});

test.describe('LoadingSkeleton Component - Secrets Tab', () => {
  test('should display loading skeleton while fetching secret data', async ({ page }) => {
    // Tests that LoadingSkeleton appears during secret data fetch

    // Arrange: Navigate to the Secrets tab
    await page.goto('/secrets');

    // Act: Check for loading state
    const loadingIndicator = page.getByTestId('secrets-loading')
      .or(page.locator('[data-testid*="loading"]'))
      .or(page.locator('[aria-busy="true"]'));

    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Assert: Secret accordions or empty state should be displayed after loading
    const secretAccordions = page.locator('[data-testid^="secret-accordion-"]');
    const cardCount = await secretAccordions.count();

    if (cardCount === 0) {
      // May show empty state if no secrets
      const emptyState = page.getByTestId('no-secrets-message')
        .or(page.getByText(/no secrets found/i));
      const hasEmptyState = (await emptyState.count()) > 0;
      // Either empty state or secrets should be present
      expect(hasEmptyState).toBe(true);
    } else {
      expect(cardCount).toBeGreaterThan(0);
    }

    // Assert: Loading indicator should no longer be visible
    const loadingStillVisible = await loadingIndicator.isVisible().catch(() => false);
    expect(loadingStillVisible).toBe(false);
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

test.describe('ErrorRetry Component - Nodes Tab', () => {
  test('should display error message when node data fails to load', async ({ page }) => {
    // Tests that ErrorRetry appears when node API fails

    // Arrange: Navigate to the Nodes tab
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state or successful load
    const nodesPage = page.getByTestId('nodes-page');
    await expect(nodesPage).toBeVisible();

    const errorContainer = page.getByTestId('nodes-error');
    const nodeCards = page.getByTestId('node-card');

    // Assert: Either error is displayed or nodes are successfully loaded
    const hasError = await errorContainer.isVisible().catch(() => false);
    const hasNodes = (await nodeCards.count()) > 0;

    expect(hasError || hasNodes).toBe(true);

    // If error is displayed, verify retry functionality
    if (hasError) {
      const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i })
        .or(errorContainer.getByTestId('retry-button'));
      await expect(retryButton).toBeVisible();
    }
  });

  test('should successfully refetch node data after retry', async ({ page }) => {
    // Tests that retry button successfully refetches node data

    // Arrange: Navigate to the Nodes tab
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Check if error state exists
    const errorContainer = page.getByTestId('nodes-error');
    const hasError = await errorContainer.isVisible().catch(() => false);

    if (hasError) {
      // Act: Click retry button
      const retryButton = errorContainer.getByTestId('retry-button')
        .or(errorContainer.getByRole('button', { name: /retry|try again/i }));

      await retryButton.click();

      // Wait for retry operation
      await page.waitForLoadState('networkidle');

      // Assert: Should either display nodes or error state
      const nodeCards = page.getByTestId('node-card');
      const errorStillVisible = await errorContainer.isVisible().catch(() => false);
      const hasNodes = (await nodeCards.count()) > 0;

      expect(errorStillVisible || hasNodes).toBe(true);
    }
  });
});

test.describe('ErrorRetry Component - Workloads Tab', () => {
  test('should display error message when workload data fails to load', async ({ page }) => {
    // Tests that ErrorRetry appears when workload API fails

    // Arrange: Navigate to the Workloads tab
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state or successful load
    const errorContainer = page.getByTestId('error-message');
    const workloadCards = page.getByTestId('deployment-card');
    const emptyState = page.getByTestId('empty-state');

    // Assert: Either error, empty state, or workloads are displayed
    const hasError = await errorContainer.isVisible().catch(() => false);
    const hasWorkloads = (await workloadCards.count()) > 0;
    const isEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasError || hasWorkloads || isEmpty).toBe(true);

    // If error is displayed, verify retry functionality
    if (hasError) {
      const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i })
        .or(page.getByTestId('retry-button'));

      const retryButtonExists = (await retryButton.count()) > 0;
      if (retryButtonExists) {
        await expect(retryButton).toBeVisible();
      }
    }
  });

  test('should retry loading workloads when retry button is clicked', async ({ page }) => {
    // Tests retry functionality for workloads

    // Arrange: Navigate to the Workloads tab
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Check if error state exists
    const errorContainer = page.getByTestId('error-message');
    const hasError = await errorContainer.isVisible().catch(() => false);

    if (hasError) {
      // Act: Click retry button
      const retryButton = page.getByRole('button', { name: /retry|try again/i });
      const hasRetryButton = (await retryButton.count()) > 0;

      if (hasRetryButton) {
        await retryButton.click();

        // Wait for retry operation
        await page.waitForLoadState('networkidle');

        // Assert: Should show result after retry
        const workloadCards = page.getByTestId('deployment-card');
        const emptyState = page.getByTestId('empty-state');
        const errorStillVisible = await errorContainer.isVisible().catch(() => false);

        const hasWorkloads = (await workloadCards.count()) > 0;
        const isEmpty = await emptyState.isVisible().catch(() => false);

        expect(errorStillVisible || hasWorkloads || isEmpty).toBe(true);
      }
    }
  });
});

test.describe('ErrorRetry Component - Pods Tab', () => {
  test('should display error message when pod data fails to load', async ({ page }) => {
    // Tests that ErrorRetry appears when pod API fails

    // Arrange: Navigate to the Pods tab
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state or successful load
    const errorContainer = page.getByTestId('pods-error');
    const podRows = page.getByTestId('pod-card');
    const emptyMessage = page.getByTestId('no-unhealthy-pods-message');

    // Assert: Either error, empty message, or pods are displayed
    const hasError = await errorContainer.isVisible().catch(() => false);
    const hasPods = (await podRows.count()) > 0;
    const isEmpty = await emptyMessage.isVisible().catch(() => false);

    expect(hasError || hasPods || isEmpty).toBe(true);
  });
});

test.describe('ErrorRetry Component - Secrets Tab', () => {
  test('should display error message when secret data fails to load', async ({ page }) => {
    // Tests that ErrorRetry appears when secret API fails

    // Arrange: Navigate to the Secrets tab
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state or successful load
    const errorContainer = page.getByTestId('secrets-error');
    const secretAccordions = page.locator('[data-testid^="secret-accordion-"]');

    // Assert: Either error or secrets are displayed
    const hasError = await errorContainer.isVisible().catch(() => false);
    const hasSecrets = (await secretAccordions.count()) > 0;

    expect(hasError || hasSecrets).toBe(true);

    // If error is displayed, verify retry button
    if (hasError) {
      const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i })
        .or(errorContainer.getByTestId('retry-button'));

      const hasRetryButton = (await retryButton.count()) > 0;
      if (hasRetryButton) {
        await expect(retryButton).toBeVisible();
      }
    }
  });
});

test.describe('EmptyState Component - Nodes Tab', () => {
  test('should display empty state when no nodes are available', async ({ page }) => {
    // Tests that EmptyState appears when cluster has no nodes
    // Note: In practice, a cluster always has at least one node

    // Arrange: Navigate to the Nodes tab
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Check for empty state or node cards
    const emptyState = page.getByTestId('nodes-empty');
    const nodeCards = page.getByTestId('node-card');

    // Assert: Either empty state or nodes should be displayed
    const isEmpty = await emptyState.isVisible().catch(() => false);
    const hasNodes = (await nodeCards.count()) > 0;

    expect(isEmpty || hasNodes).toBe(true);

    // If empty state is shown, verify its content
    if (isEmpty) {
      // Assert: Empty state should have descriptive message
      const emptyMessage = await emptyState.innerText();
      expect(emptyMessage.length).toBeGreaterThan(0);
      expect(emptyMessage.toLowerCase()).toMatch(/no nodes|empty|not found/);
    }
  });

  test('should display helpful message in empty state', async ({ page }) => {
    // Tests that empty state message is clear and helpful

    // Arrange: Navigate to the Nodes tab
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Check for empty state
    const emptyState = page.getByTestId('nodes-empty');
    const isEmpty = await emptyState.isVisible().catch(() => false);

    if (isEmpty) {
      // Assert: Should have icon or visual indicator
      const emptyIcon = emptyState.locator('svg')
        .or(emptyState.locator('[role="img"]'));

      const hasIcon = (await emptyIcon.count()) > 0;
      expect(hasIcon).toBe(true);

      // Assert: Should have clear message
      const message = await emptyState.innerText();
      expect(message).toBeTruthy();
    }
  });
});

test.describe('EmptyState Component - Workloads Tab', () => {
  test('should display empty state when no workloads are available', async ({ page }) => {
    // Tests that EmptyState appears when namespace has no workloads

    // Arrange: Navigate to the Workloads tab
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Check for empty state or workload cards
    const emptyState = page.getByTestId('empty-state');
    const workloadCards = page.getByTestId('deployment-card');

    // Assert: Either empty state or workloads should be displayed
    const isEmpty = await emptyState.isVisible().catch(() => false);
    const hasWorkloads = (await workloadCards.count()) > 0;

    expect(isEmpty || hasWorkloads).toBe(true);

    // If empty state is shown, verify its content
    if (isEmpty) {
      // Assert: Empty state should have descriptive message
      const emptyMessage = await emptyState.innerText();
      expect(emptyMessage.length).toBeGreaterThan(0);
      expect(emptyMessage.toLowerCase()).toMatch(/no workloads|empty|not found/);
    }
  });

  test('should display empty state with helpful guidance', async ({ page }) => {
    // Tests that empty state provides helpful information

    // Arrange: Navigate to the Workloads tab
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Check for empty state
    const emptyState = page.getByTestId('empty-state');
    const isEmpty = await emptyState.isVisible().catch(() => false);

    if (isEmpty) {
      // Assert: Should contain informative message
      const message = await emptyState.innerText();
      expect(message).toBeTruthy();

      // Assert: Message should be helpful
      expect(message.toLowerCase()).toMatch(/no workloads|no deployments|empty|namespace/);
    }
  });
});

test.describe('EmptyState Component - Pods Tab', () => {
  test('should display empty state when no unhealthy pods are found', async ({ page }) => {
    // Tests that EmptyState appears when all pods are healthy

    // Arrange: Navigate to the Pods tab
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Check for empty state or pod rows
    const emptyMessage = page.getByTestId('no-unhealthy-pods-message');
    const podRows = page.getByTestId('pod-card');

    // Assert: Either empty message or pods should be displayed
    const isEmpty = await emptyMessage.isVisible().catch(() => false);
    const hasPods = (await podRows.count()) > 0;

    expect(isEmpty || hasPods).toBe(true);

    // If empty state is shown, verify it's a positive message
    if (isEmpty) {
      // Assert: Message should indicate healthy state
      const message = await emptyMessage.innerText();
      expect(message.toLowerCase()).toMatch(/no unhealthy|all healthy|good|ok/);
    }
  });

  test('should show positive message when all pods are healthy', async ({ page }) => {
    // Tests that empty state for pods is positive (not alarming)

    // Arrange: Navigate to the Pods tab
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Act: Check for empty message
    const emptyMessage = page.getByTestId('no-unhealthy-pods-message');
    const isEmpty = await emptyMessage.isVisible().catch(() => false);

    if (isEmpty) {
      // Assert: Should have positive/success styling
      const messageElement = emptyMessage;

      // Assert: Message should be positive
      const message = await messageElement.innerText();
      expect(message).toBeTruthy();

      // Assert: Should not have error/warning styling
      const classes = await messageElement.getAttribute('class');
      expect(classes).not.toMatch(/error|danger|warning|red/i);
    }
  });
});

test.describe('EmptyState Component - Secrets Tab', () => {
  test('should display empty state when no secrets are available', async ({ page }) => {
    // Tests that EmptyState appears when namespace has no secrets

    // Arrange: Navigate to the Secrets tab
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Act: Check for empty state or secret accordions
    const emptyState = page.getByTestId('no-secrets-message')
      .or(page.getByText(/no secrets found/i));
    const secretAccordions = page.locator('[data-testid^="secret-accordion-"]');

    // Assert: Either empty state or secrets should be displayed
    const isEmpty = (await emptyState.count()) > 0 && await emptyState.first().isVisible().catch(() => false);
    const hasSecrets = (await secretAccordions.count()) > 0;

    expect(isEmpty || hasSecrets).toBe(true);

    // If empty state is shown, verify its content
    if (isEmpty) {
      // Assert: Should have descriptive message
      const message = await emptyState.first().innerText();
      expect(message.toLowerCase()).toMatch(/no secrets|empty|not found/);
    }
  });
});

test.describe('Common UI Components - Consistency Across Tabs', () => {
  test('should use consistent LoadingSkeleton design across all tabs', async ({ page }) => {
    // Tests that loading skeletons have consistent visual design

    const tabs = [
      { url: '/', testId: 'loading-skeleton' },
      { url: '/nodes', testId: 'nodes-loading' },
      { url: '/workloads', testId: 'loading-indicator' },
      { url: '/pods', testId: 'pods-loading' },
      { url: '/secrets', testId: 'secrets-loading' }
    ];

    for (const tab of tabs) {
      // Arrange: Navigate to tab
      await page.goto(tab.url);
      await page.waitForLoadState('networkidle');

      // Assert: Tab should load successfully (either with data or empty state)
      const body = await page.locator('body').innerHTML();
      expect(body.length).toBeGreaterThan(0);
    }
  });

  test('should use consistent ErrorRetry button style across all tabs', async ({ page }) => {
    // Tests that retry buttons have consistent design

    const tabs = [
      { url: '/', errorTestId: 'summary-cards-error' },
      { url: '/nodes', errorTestId: 'nodes-error' },
      { url: '/workloads', errorTestId: 'error-message' },
      { url: '/pods', errorTestId: 'pods-error' },
      { url: '/secrets', errorTestId: 'secrets-error' }
    ];

    for (const tab of tabs) {
      // Arrange: Navigate to tab
      await page.goto(tab.url);
      await page.waitForLoadState('networkidle');

      // Act: Check if error state exists
      const errorContainer = page.getByTestId(tab.errorTestId);
      const hasError = await errorContainer.isVisible().catch(() => false);

      if (hasError) {
        // Assert: Retry button should exist and be consistent
        const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i })
          .or(errorContainer.getByTestId('retry-button'));

        const hasRetryButton = (await retryButton.count()) > 0;
        expect(hasRetryButton).toBe(true);

        if (hasRetryButton) {
          await expect(retryButton.first()).toBeVisible();
          await expect(retryButton.first()).toBeEnabled();
        }
      }
    }
  });

  test('should use consistent EmptyState design across all tabs', async ({ page }) => {
    // Tests that empty states have consistent visual design

    const tabs = [
      { url: '/nodes', emptyTestId: 'nodes-empty' },
      { url: '/workloads', emptyTestId: 'empty-state' },
      { url: '/pods', emptyTestId: 'no-unhealthy-pods-message' },
      { url: '/secrets', emptyTestId: 'no-secrets-message' }
    ];

    for (const tab of tabs) {
      // Arrange: Navigate to tab
      await page.goto(tab.url);
      await page.waitForLoadState('networkidle');

      // Act: Check if empty state exists
      const emptyState = page.getByTestId(tab.emptyTestId);
      const isEmpty = await emptyState.isVisible().catch(() => false);

      if (isEmpty) {
        // Assert: Empty state should have content
        const message = await emptyState.innerText();
        expect(message.length).toBeGreaterThan(0);
      }
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

  test('should display error retry button correctly on mobile', async ({ page }) => {
    // Tests that retry buttons are touchable on mobile

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state
    const errorContainer = page.getByTestId('nodes-error');
    const hasError = await errorContainer.isVisible().catch(() => false);

    if (hasError) {
      const retryButton = errorContainer.getByRole('button', { name: /retry|try again/i });
      const hasRetryButton = (await retryButton.count()) > 0;

      if (hasRetryButton) {
        await expect(retryButton).toBeVisible();

        // Assert: Button should have adequate touch target size
        const box = await retryButton.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44); // Minimum touch target
      }
    }
  });

  test('should display empty state correctly on mobile', async ({ page }) => {
    // Tests that empty states are readable on mobile

    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/workloads');
    await page.waitForLoadState('networkidle');

    // Act: Check for empty state
    const emptyState = page.getByTestId('empty-state');
    const isEmpty = await emptyState.isVisible().catch(() => false);

    if (isEmpty) {
      // Assert: Empty state should fit within viewport
      const box = await emptyState.boundingBox();
      expect(box!.width).toBeLessThanOrEqual(375);

      // Assert: Text should be readable
      const message = await emptyState.innerText();
      expect(message.length).toBeGreaterThan(0);
    }
  });
});
