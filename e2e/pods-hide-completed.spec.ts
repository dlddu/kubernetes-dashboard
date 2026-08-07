// Verifies: PD6 (docs/product/prd-pods.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

/**
 * E2E Tests for the "Hide Completed" pod filter (PD6: 완료 파드 숨김 토글).
 *
 * PodsTab renders a "Hide Completed (N)" toggle only when at least one pod is in
 * a completed state (COMPLETED_STATUSES = ['succeeded', 'completed'], matched
 * case-insensitively). Toggling it on filters completed pods out of the list
 * (client-side `filteredPods`); if every pod is completed, an
 * "All pods are completed…" empty state is shown instead.
 *
 * Test Fixtures (test/fixtures/pd6-hide-completed-fixtures.yaml):
 * - dashboard-pd6-mixed:     2 Running + 2 completed pods
 * - dashboard-pd6-completed: 2 completed pods only
 * - dashboard-pd6-running:   2 Running pods only
 *
 * The three cases need mutually exclusive pod-state combinations, so each gets its own
 * namespace and this spec deep links to it with `/pods?namespace=<ns>` (NamespaceContext
 * treats the URL as the source of truth; fetchAllPods scopes the request server-side via
 * `?ns=`). That keeps the counts below exact without mocking `GET /api/pods/all` — data
 * mocking is disallowed by docs/e2e-mocking-policy.md, which names fixtures and dedicated
 * namespaces as the required alternative.
 *
 * The completed pods run `busybox … echo done` with restartPolicy: Never, so they settle in
 * phase Succeeded with container terminated reason "Completed"; the backend's getPodStatus()
 * reports the container reason, which COMPLETED_STATUSES matches.
 *
 * Distinct from sibling pods specs: pods.spec.ts (PD1, list rendering),
 * pod-cleanup.spec.ts (PD5, cleanup — its "coexistence" block exercises the
 * toggle only incidentally), pods-data-states.spec.ts (PD7, loading/error/empty).
 * This spec is the dedicated owner of the PD6 hide-completed toggle behaviour.
 */

const MIXED_NS = 'dashboard-pd6-mixed';
const ALL_COMPLETED_NS = 'dashboard-pd6-completed';
const NO_COMPLETED_NS = 'dashboard-pd6-running';

test.describe('Pods Tab - Hide Completed Toggle (PD6)', () => {
  test('hides completed pods and keeps running pods when toggled on', async ({ page }) => {
    // Arrange: the mixed fixture namespace holds two Running + two completed pods.
    await page.goto(`/pods?namespace=${MIXED_NS}`);
    await page.waitForLoadState('networkidle');

    // Assert: toggle is present and reports the completed count (2).
    const toggle = page.getByTestId('hide-completed-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText(/Hide Completed \(2\)/);

    // Assert: with the filter off, all four pods are listed.
    const cards = page.getByTestId('pod-card');
    await expect(cards).toHaveCount(4);

    // Act: turn the filter on.
    await toggle.click();

    // Assert: only the two Running pods remain; the completed ones are hidden.
    await expect(cards).toHaveCount(2);
    await expect(page.getByTestId('pod-name').filter({ hasText: 'pd6-mixed-running-1' })).toBeVisible();
    await expect(page.getByTestId('pod-name').filter({ hasText: 'pd6-mixed-running-2' })).toBeVisible();
    await expect(page.getByTestId('pod-name').filter({ hasText: 'pd6-mixed-done-1' })).toHaveCount(0);
    await expect(page.getByTestId('pod-name').filter({ hasText: 'pd6-mixed-done-2' })).toHaveCount(0);

    // Act: turn the filter back off.
    await toggle.click();

    // Assert: the completed pods reappear.
    await expect(cards).toHaveCount(4);
    await expect(page.getByTestId('pod-name').filter({ hasText: 'pd6-mixed-done-1' })).toBeVisible();
  });

  test('shows the "all completed" empty state when every pod is hidden', async ({ page }) => {
    // Arrange: this fixture namespace holds only completed pods.
    await page.goto(`/pods?namespace=${ALL_COMPLETED_NS}`);
    await page.waitForLoadState('networkidle');

    const toggle = page.getByTestId('hide-completed-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText(/Hide Completed \(2\)/);
    await expect(page.getByTestId('pod-card')).toHaveCount(2);

    // Act: hide completed — everything is completed, so nothing remains.
    await toggle.click();

    // Assert: the dedicated "all completed" empty state is shown, no cards.
    const emptyState = page.getByTestId('no-visible-pods-message');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(/All pods are completed/i);
    await expect(page.getByTestId('pod-card')).toHaveCount(0);
  });

  test('does not render the toggle when there are no completed pods', async ({ page }) => {
    // Arrange: this fixture namespace holds only Running pods → completedCount === 0.
    await page.goto(`/pods?namespace=${NO_COMPLETED_NS}`);
    await page.waitForLoadState('networkidle');

    // Assert: the pods rendered, but the toggle is absent (rendered only when completedCount > 0).
    await expect(page.getByTestId('pod-card')).toHaveCount(2);
    await expect(page.getByTestId('hide-completed-toggle')).toHaveCount(0);
  });
});
