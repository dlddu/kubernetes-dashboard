// Verifies: PD6 (docs/product/prd-pods.md) — sole dedicated e2e spec for this AC.
import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests for the "Hide Completed" pod filter (PD6: 완료 파드 숨김 토글).
 *
 * PodsTab renders a "Hide Completed (N)" toggle only when at least one pod is in
 * a completed state (COMPLETED_STATUSES = ['succeeded', 'completed'], matched
 * case-insensitively). Toggling it on filters completed pods out of the list
 * (client-side `filteredPods`); if every pod is completed, an
 * "All pods are completed…" empty state is shown instead.
 *
 * These are pure client-side filter assertions, so the pod list is injected
 * deterministically by mocking `GET /api/pods/all` (fetchAllPods → buildURL
 * '/api/pods/all') with route.fulfill — no cluster fixture dependency, and the
 * mock only intercepts this page's own requests (race-safe under workers:4).
 *
 * Distinct from sibling pods specs: pods.spec.ts (PD1, list rendering),
 * pod-cleanup.spec.ts (PD5, cleanup — its "coexistence" block exercises the
 * toggle only incidentally), pods-data-states.spec.ts (PD7, loading/error/empty).
 * This spec is the dedicated owner of the PD6 hide-completed toggle behaviour.
 */

interface MockPod {
  name: string;
  namespace: string;
  status: string;
  restarts: number;
  node: string;
  age: string;
  containers: string[];
  initContainers: string[];
}

function pod(name: string, status: string): MockPod {
  return {
    name,
    namespace: 'dashboard-test',
    status,
    restarts: 0,
    node: 'kind-control-plane',
    age: '5m',
    containers: ['app'],
    initContainers: [],
  };
}

/** Register the /api/pods/all mock before navigation. */
async function mockPods(page: Page, pods: MockPod[]) {
  await page.route('**/api/pods/all**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pods),
    });
  });
}

test.describe('Pods Tab - Hide Completed Toggle (PD6)', () => {
  test('hides completed pods and keeps running pods when toggled on', async ({ page }) => {
    // Arrange: two Running + two Succeeded (completed) pods.
    await mockPods(page, [
      pod('web-1', 'Running'),
      pod('web-2', 'Running'),
      pod('job-done-1', 'Succeeded'),
      pod('job-done-2', 'Succeeded'),
    ]);

    await page.goto('/pods');
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
    await expect(page.getByTestId('pod-name').filter({ hasText: 'web-1' })).toBeVisible();
    await expect(page.getByTestId('pod-name').filter({ hasText: 'web-2' })).toBeVisible();
    await expect(page.getByTestId('pod-name').filter({ hasText: 'job-done-1' })).toHaveCount(0);
    await expect(page.getByTestId('pod-name').filter({ hasText: 'job-done-2' })).toHaveCount(0);

    // Act: turn the filter back off.
    await toggle.click();

    // Assert: the completed pods reappear.
    await expect(cards).toHaveCount(4);
    await expect(page.getByTestId('pod-name').filter({ hasText: 'job-done-1' })).toBeVisible();
  });

  test('shows the "all completed" empty state when every pod is hidden', async ({ page }) => {
    // Arrange: only completed pods.
    await mockPods(page, [
      pod('job-done-1', 'Succeeded'),
      pod('job-done-2', 'Completed'),
    ]);

    await page.goto('/pods');
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
    // Arrange: only Running pods → completedCount === 0.
    await mockPods(page, [
      pod('web-1', 'Running'),
      pod('web-2', 'Running'),
    ]);

    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: the pods rendered, but the toggle is absent (rendered only when completedCount > 0).
    await expect(page.getByTestId('pod-card')).toHaveCount(2);
    await expect(page.getByTestId('hide-completed-toggle')).toHaveCount(0);
  });
});
