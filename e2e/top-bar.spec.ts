// Verifies: CM3 (docs/product/prd-common.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

/**
 * E2E Tests for TopBar Component (CM3: 상단 바 + 반응형 셸)
 *
 * Verifies the global app-shell top bar: app title, cluster connection
 * indicator, and the responsive layout that switches from a stacked
 * (mobile) to a horizontal (desktop, sm+) arrangement.
 *
 * Distinct from sibling shell specs on the same page: bottom-tab-bar.spec.ts
 * (CM1, bottom navigation) and polling-indicator.spec.ts (CM4, the last-update
 * indicator inside the top bar). This spec owns the title + ClusterStatus +
 * responsive container assertions that CM3 declares.
 *
 * The top bar renders on every route (App.tsx mounts <TopBar /> above <main>),
 * and its title / ClusterStatus markup is static, so these assertions do not
 * depend on any cluster fixture data.
 */

test.describe('TopBar - Structure & Cluster Connection', () => {
  test('should display the top bar with the app title on page load', async ({ page }) => {
    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the TopBar (banner landmark / testid)
    const topBar = page.getByTestId('top-bar').or(page.getByRole('banner'));
    await expect(topBar).toBeVisible();

    // Assert: App title should be visible within the top bar
    const title = topBar.getByRole('heading', { name: 'Kubernetes Dashboard' });
    await expect(title).toBeVisible();
  });

  test('should display the cluster connection indicator', async ({ page }) => {
    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the cluster status indicator within the top bar
    const topBar = page.getByTestId('top-bar').or(page.getByRole('banner'));
    await expect(topBar).toBeVisible();

    const clusterStatus = page.getByTestId('cluster-status');
    await expect(clusterStatus).toBeVisible();

    // Assert: It should surface the cluster connection state
    await expect(clusterStatus).toContainText(/Cluster Connected/i);
  });
});

test.describe('TopBar - Responsive Shell Layout', () => {
  test('should carry the responsive layout classes (flex-col on mobile, sm:flex-row on desktop)', async ({ page }) => {
    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the top bar's responsive container. Both the outer wrapper
    // and the inner controls group carry `flex-col sm:flex-row`; `.first()`
    // selects the outer wrapper (title block ↔ controls block) in DOM order.
    const layoutContainer = page.getByTestId('top-bar').locator('div.flex-col').first();
    await expect(layoutContainer).toBeVisible();

    // Assert: Responsive breakpoint classes are present (CM3 verification method:
    // `flex-col sm:flex-row`).
    await expect(layoutContainer).toHaveClass(/flex-col/);
    await expect(layoutContainer).toHaveClass(/sm:flex-row/);
  });

  test('should stack the title above the cluster status on a mobile viewport', async ({ page }) => {
    // Arrange: Set mobile viewport (iPhone SE dimensions, below the sm breakpoint)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Measure the title and cluster status positions
    const title = page.getByTestId('top-bar').getByRole('heading', { name: 'Kubernetes Dashboard' });
    const clusterStatus = page.getByTestId('cluster-status');
    await expect(title).toBeVisible();
    await expect(clusterStatus).toBeVisible();

    const titleBox = await title.boundingBox();
    const clusterBox = await clusterStatus.boundingBox();

    // Assert: Vertical stacking — the cluster status sits below the title block
    expect(clusterBox!.y).toBeGreaterThanOrEqual(titleBox!.y + titleBox!.height);
  });

  test('should lay out the title and cluster status side by side on a desktop viewport', async ({ page }) => {
    // Arrange: Set desktop viewport (>= sm breakpoint)
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Measure the title and cluster status positions
    const title = page.getByTestId('top-bar').getByRole('heading', { name: 'Kubernetes Dashboard' });
    const clusterStatus = page.getByTestId('cluster-status');
    await expect(title).toBeVisible();
    await expect(clusterStatus).toBeVisible();

    const titleBox = await title.boundingBox();
    const clusterBox = await clusterStatus.boundingBox();

    // Assert: Horizontal layout — cluster status is to the right of the title
    // (justify-between places the controls on the opposite edge)...
    expect(clusterBox!.x).toBeGreaterThan(titleBox!.x);

    // ...and both sit on the same row (their vertical centers roughly align).
    const titleCenterY = titleBox!.y + titleBox!.height / 2;
    const clusterCenterY = clusterBox!.y + clusterBox!.height / 2;
    expect(Math.abs(clusterCenterY - titleCenterY)).toBeLessThan(60);
  });
});
