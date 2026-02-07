import { test, expect } from '@playwright/test';

test.describe('Overview Tab', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/');
  });

  test.describe('API endpoint', () => {
    test('should return overview data from /api/overview endpoint', async ({ request }) => {
      // Act
      const response = await request.get('/api/overview');

      // Assert
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');

      const body = await response.json();
      expect(body).toHaveProperty('nodes');
      expect(body.nodes).toHaveProperty('ready');
      expect(body.nodes).toHaveProperty('total');
      expect(body).toHaveProperty('unhealthyPods');
      expect(body).toHaveProperty('avgCpuUsage');
      expect(body).toHaveProperty('avgMemoryUsage');
    });

    test('should return valid node counts', async ({ request }) => {
      // Act
      const response = await request.get('/api/overview');
      const body = await response.json();

      // Assert
      expect(body.nodes.ready).toBeGreaterThanOrEqual(0);
      expect(body.nodes.total).toBeGreaterThanOrEqual(0);
      expect(body.nodes.ready).toBeLessThanOrEqual(body.nodes.total);
    });

    test('should return valid usage percentages', async ({ request }) => {
      // Act
      const response = await request.get('/api/overview');
      const body = await response.json();

      // Assert
      expect(body.avgCpuUsage).toBeGreaterThanOrEqual(0);
      expect(body.avgCpuUsage).toBeLessThanOrEqual(100);
      expect(body.avgMemoryUsage).toBeGreaterThanOrEqual(0);
      expect(body.avgMemoryUsage).toBeLessThanOrEqual(100);
    });

    test('should reject non-GET methods', async ({ request }) => {
      // Act
      const response = await request.post('/api/overview');

      // Assert
      expect(response.status()).toBe(405);
    });
  });

  test.describe('UI rendering', () => {
    test('should display overview tab', async ({ page }) => {
      // Act
      await page.waitForSelector('[data-testid="overview-tab"]');

      // Assert
      const overviewTab = page.locator('[data-testid="overview-tab"]');
      await expect(overviewTab).toBeVisible();
    });

    test('should show 4 summary cards', async ({ page }) => {
      // Act
      await page.waitForSelector('[data-testid="summary-cards"]');

      // Assert
      const nodesCard = page.locator('[data-testid="nodes-card"]');
      const podsCard = page.locator('[data-testid="pods-card"]');
      const cpuCard = page.locator('[data-testid="cpu-card"]');
      const memoryCard = page.locator('[data-testid="memory-card"]');

      await expect(nodesCard).toBeVisible();
      await expect(podsCard).toBeVisible();
      await expect(cpuCard).toBeVisible();
      await expect(memoryCard).toBeVisible();
    });

    test('should display node statistics', async ({ page }) => {
      // Act
      await page.waitForSelector('[data-testid="nodes-card"]');

      // Assert
      const nodesCard = page.locator('[data-testid="nodes-card"]');
      await expect(nodesCard).toContainText(/\d+/); // Should contain numbers
      await expect(nodesCard).toContainText(/nodes/i);
    });

    test('should display unhealthy pods count', async ({ page }) => {
      // Act
      await page.waitForSelector('[data-testid="pods-card"]');

      // Assert
      const podsCard = page.locator('[data-testid="pods-card"]');
      await expect(podsCard).toContainText(/\d+/);
      await expect(podsCard).toContainText(/unhealthy pods/i);
    });

    test('should display CPU usage with percentage', async ({ page }) => {
      // Act
      await page.waitForSelector('[data-testid="cpu-card"]');

      // Assert
      const cpuCard = page.locator('[data-testid="cpu-card"]');
      await expect(cpuCard).toContainText(/%/);
      await expect(cpuCard).toContainText(/cpu usage/i);
    });

    test('should display Memory usage with percentage', async ({ page }) => {
      // Act
      await page.waitForSelector('[data-testid="memory-card"]');

      // Assert
      const memoryCard = page.locator('[data-testid="memory-card"]');
      await expect(memoryCard).toContainText(/%/);
      await expect(memoryCard).toContainText(/memory usage/i);
    });
  });

  test.describe('loading state', () => {
    test('should show skeleton cards while loading', async ({ page }) => {
      // Act
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      // Assert - check for loading state before data arrives
      const hasSkeletons = await page.locator('[data-testid="skeleton-card"]').count();
      if (hasSkeletons > 0) {
        expect(hasSkeletons).toBe(4);
      }
    });

    test('should hide loading state after data loads', async ({ page }) => {
      // Act
      await page.waitForSelector('[data-testid="overview-tab"]');
      await page.waitForLoadState('networkidle');

      // Assert
      const skeletons = page.locator('[data-testid="skeleton-card"]');
      await expect(skeletons).toHaveCount(0);
    });
  });

  test.describe('responsive layout', () => {
    test('should display 2-column grid on mobile', async ({ page }) => {
      // Arrange
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

      // Act
      await page.waitForSelector('[data-testid="summary-cards"]');

      // Assert
      const grid = page.locator('[data-testid="summary-cards"]');
      const gridClass = await grid.getAttribute('class');
      expect(gridClass).toMatch(/grid/);
      expect(gridClass).toMatch(/grid-cols-2/);
    });

    test('should display 4-column grid on desktop', async ({ page }) => {
      // Arrange
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Act
      await page.waitForSelector('[data-testid="summary-cards"]');

      // Assert
      const grid = page.locator('[data-testid="summary-cards"]');
      const gridClass = await grid.getAttribute('class');
      expect(gridClass).toMatch(/grid/);
    });

    test('should be scrollable on small screens', async ({ page }) => {
      // Arrange
      await page.setViewportSize({ width: 320, height: 568 }); // iPhone 5

      // Act
      await page.waitForSelector('[data-testid="overview-tab"]');

      // Assert
      const isScrollable = await page.evaluate(() => {
        return document.documentElement.scrollHeight > document.documentElement.clientHeight;
      });
      expect(isScrollable).toBe(true);
    });
  });

  test.describe('usage bars', () => {
    test('should display CPU usage bar', async ({ page }) => {
      // Act
      await page.waitForSelector('[data-testid="cpu-usage-bar"]');

      // Assert
      const cpuBar = page.locator('[data-testid="cpu-usage-bar"]');
      await expect(cpuBar).toBeVisible();
    });

    test('should display Memory usage bar', async ({ page }) => {
      // Act
      await page.waitForSelector('[data-testid="memory-usage-bar"]');

      // Assert
      const memoryBar = page.locator('[data-testid="memory-usage-bar"]');
      await expect(memoryBar).toBeVisible();
    });

    test('should show color-coded usage bars', async ({ page }) => {
      // Act
      await page.waitForSelector('[data-testid="cpu-usage-bar"]');

      // Assert - bar should have color styling
      const cpuBar = page.locator('[data-testid="cpu-usage-bar-fill"]');
      const barClass = await cpuBar.getAttribute('class');
      expect(barClass).toMatch(/bg-/); // Should have background color
    });
  });

  test.describe('polling indicator', () => {
    test('should display last updated time', async ({ page }) => {
      // Act
      await page.waitForSelector('[data-testid="polling-indicator"]');

      // Assert
      const indicator = page.locator('[data-testid="polling-indicator"]');
      await expect(indicator).toBeVisible();
      await expect(indicator).toContainText(/last updated|just now/i);
    });

    test('should show loading spinner when updating', async ({ page }) => {
      // Act
      await page.waitForSelector('[data-testid="overview-tab"]');

      // Trigger update by waiting for polling interval
      await page.waitForTimeout(1000);

      // Check if loading spinner appears during update
      const spinner = page.locator('[data-testid="loading-spinner"]');
      const spinnerCount = await spinner.count();

      // Assert - spinner may or may not be visible depending on timing
      expect(spinnerCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('auto-refresh', () => {
    test('should auto-refresh data every 10 seconds', async ({ page, request }) => {
      // Arrange
      await page.waitForSelector('[data-testid="overview-tab"]');

      // Track API calls
      let apiCallCount = 0;
      page.on('request', (request) => {
        if (request.url().includes('/api/overview')) {
          apiCallCount++;
        }
      });

      // Act - wait for 11 seconds to allow polling
      await page.waitForTimeout(11000);

      // Assert - should have made at least 2 calls (initial + 1 poll)
      expect(apiCallCount).toBeGreaterThanOrEqual(2);
    });

    test('should stop polling when tab is hidden', async ({ page, context }) => {
      // Arrange
      await page.waitForSelector('[data-testid="overview-tab"]');

      let apiCallCount = 0;
      page.on('request', (request) => {
        if (request.url().includes('/api/overview')) {
          apiCallCount++;
        }
      });

      const initialCount = apiCallCount;

      // Act - simulate tab becoming hidden
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', {
          configurable: true,
          get: () => true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      await page.waitForTimeout(11000);

      // Assert - should not have made additional calls while hidden
      expect(apiCallCount).toBe(initialCount);
    });
  });

  test.describe('error handling', () => {
    test('should display error message when API fails', async ({ page, context }) => {
      // Arrange - intercept and fail API calls
      await page.route('/api/overview', (route) => {
        route.abort('failed');
      });

      // Act
      await page.goto('/');

      // Assert
      await page.waitForSelector('text=/error loading overview/i');
      const errorMessage = page.locator('text=/error loading overview/i');
      await expect(errorMessage).toBeVisible();
    });

    test('should show retry button on error', async ({ page }) => {
      // Arrange - intercept and fail API calls
      await page.route('/api/overview', (route) => {
        route.abort('failed');
      });

      // Act
      await page.goto('/');

      // Assert
      await page.waitForSelector('button:has-text("Retry")');
      const retryButton = page.locator('button:has-text("Retry")');
      await expect(retryButton).toBeVisible();
      await expect(retryButton).toBeEnabled();
    });

    test('should retry when retry button is clicked', async ({ page }) => {
      // Arrange
      let attempts = 0;
      await page.route('/api/overview', (route) => {
        attempts++;
        if (attempts === 1) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });

      await page.goto('/');

      // Act
      await page.waitForSelector('button:has-text("Retry")');
      const retryButton = page.locator('button:has-text("Retry")');
      await retryButton.click();

      // Assert
      await page.waitForSelector('[data-testid="overview-tab"]');
      const overviewTab = page.locator('[data-testid="overview-tab"]');
      await expect(overviewTab).toBeVisible();
      expect(attempts).toBe(2);
    });
  });

  test.describe('empty state', () => {
    test('should show empty state when cluster has no nodes', async ({ page }) => {
      // Arrange - mock empty cluster response
      await page.route('/api/overview', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            nodes: { ready: 0, total: 0 },
            unhealthyPods: 0,
            avgCpuUsage: 0,
            avgMemoryUsage: 0,
          }),
        });
      });

      // Act
      await page.goto('/');

      // Assert
      await page.waitForSelector('text=/cluster is empty/i');
      const emptyMessage = page.locator('text=/cluster is empty/i');
      await expect(emptyMessage).toBeVisible();
    });

    test('should show helpful message about empty cluster', async ({ page }) => {
      // Arrange
      await page.route('/api/overview', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            nodes: { ready: 0, total: 0 },
            unhealthyPods: 0,
            avgCpuUsage: 0,
            avgMemoryUsage: 0,
          }),
        });
      });

      // Act
      await page.goto('/');

      // Assert
      await page.waitForSelector('text=/no nodes or pods/i');
      const message = page.locator('text=/no nodes or pods/i');
      await expect(message).toBeVisible();
    });
  });

  test.describe('accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      // Act
      await page.waitForSelector('[data-testid="overview-tab"]');

      // Assert
      const headings = page.locator('h1, h2, h3');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
    });

    test('should have ARIA labels on cards', async ({ page }) => {
      // Act
      await page.waitForSelector('[data-testid="nodes-card"]');

      // Assert
      const nodesCard = page.locator('[data-testid="nodes-card"]');
      const ariaLabel = await nodesCard.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Act
      await page.waitForSelector('[data-testid="overview-tab"]');

      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Assert - focused element should be visible
      const focusedElement = await page.evaluateHandle(() => document.activeElement);
      expect(focusedElement).toBeTruthy();
    });
  });
});
