// Verifies: OV7 / AC7 (docs/product/prd-overview.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

/**
 * E2E test for OV7 / AC7: metrics-server absent -> graceful fallback rendering.
 *
 * AC7 (prd-overview.md): even when metrics-server is unavailable, the overview still
 * renders and the usage figures are shown as capacity-allocatable fallback values
 * (it does not collapse into a blank page / error state).
 *
 * Backend path: handlers/overview.go builds OverviewResponse via getMetricsClientSafe();
 * when metrics-server is absent the metrics client / node-metrics list is unavailable, so
 * handlers/node_utils.go fetchNodeMetrics returns nil and calculateResourceUsage falls back
 * to capacity-allocatable. Unit-covered by
 * handlers/overview_test.go::TestCalculateResourceUsageFallback.
 *
 * This spec asserts the same contract against a REAL kind cluster that has NO
 * metrics-server, with no route mocking (0 interceptions). It MUST run in the Playwright
 * 'no-metrics' project, which the CI E2E matrix executes against a cluster created with
 * INSTALL_METRICS_SERVER=false (scripts/kind-cluster.sh). In the default metrics-present
 * profile it is excluded via testIgnore, since OV1 (overview-summary-cards.spec.ts) owns
 * the metrics-present path. Fallback CPU may legitimately read 0% on kind (allocatable
 * equals capacity), so percentages are asserted only to be valid in [0, 100].
 */

test.describe('Overview Tab - Metrics-server Absent Fallback (OV7)', () => {
  test('renders the overview with no error state when metrics-server is absent', async ({ page }) => {
    // Arrange: land on the overview and wait for the initial load.
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: the overview renders (does not collapse to a blank page / error state).
    await expect(page.getByTestId('overview-tab')).toBeVisible();
    await expect(page.getByTestId('summary-cards-container')).toBeVisible();
    await expect(page.getByTestId('summary-cards-error')).toHaveCount(0);

    // Assert: all four summary cards render.
    const summaryCards = page.getByRole('article');
    await expect(summaryCards).toHaveCount(4);
  });

  test('shows fallback CPU and memory usage as valid percentages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Avg CPU and Avg Memory cards still show a valid percentage + usage bar, sourced
    // from the capacity-allocatable fallback because metrics-server is absent.
    for (const testId of ['summary-card-avg-cpu', 'summary-card-avg-memory']) {
      const card = page.getByTestId(testId);
      await expect(card).toBeVisible();

      const value = card.getByTestId('summary-card-value');
      await expect(value).toBeVisible();
      await expect(value).toContainText(/%/);

      const percent = parseFloat((await value.innerText()).replace('%', '').trim());
      expect(Number.isNaN(percent)).toBe(false);
      expect(percent).toBeGreaterThanOrEqual(0);
      expect(percent).toBeLessThanOrEqual(100);

      const usageBar = card.getByTestId('usage-bar');
      await expect(usageBar).toBeVisible();
      const ariaValue = await usageBar.getAttribute('aria-valuenow');
      expect(ariaValue).not.toBeNull();
      const ariaNum = parseFloat(ariaValue!);
      expect(ariaNum).toBeGreaterThanOrEqual(0);
      expect(ariaNum).toBeLessThanOrEqual(100);
    }
  });
});
