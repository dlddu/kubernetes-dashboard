// Verifies: OV6 (docs/product/prd-overview.md) — sole dedicated e2e spec for this AC.
import { test, expect, type Page, type Request } from '@playwright/test';

/**
 * E2E Tests for Overview namespace scope (OV6: 네임스페이스 스코프 반영).
 *
 * OverviewTab re-fetches whenever the selected namespace changes
 * (`useEffect(loadDashboard, [namespace])`), and `fetchOverview(namespace)`
 * builds `GET /api/overview?ns=<namespace>` (api/overview.ts -> buildURL). The
 * backend scopes the unhealthy-pod aggregation by that `ns` query param
 * (handlers/overview.go `r.URL.Query().Get("ns")`).
 *
 * This spec asserts the scope contract directly against the real kind cluster —
 * no route mocking. Switching the global namespace selector must issue a fresh
 * `/api/overview?ns=<selected>` request and the overview must re-render for that
 * scope. Fixtures provide two namespaces: `dashboard-test` (populated) and
 * `dashboard-empty` (empty), so switching between them exercises re-scoping.
 *
 * Distinct from sibling overview specs (summary-cards OV1, auto-polling OV4,
 * manual-refresh OV5) and from namespace-filter.spec.ts (CM5 — the selector
 * widget itself). This spec is the dedicated owner of OV6: the overview
 * re-querying scoped by the chosen namespace.
 */

/** True when the request is an overview fetch carrying ns=<namespace>. */
function isScopedOverviewRequest(request: Request, namespace: string): boolean {
  const url = new URL(request.url());
  return (
    request.method() === 'GET' &&
    url.pathname.endsWith('/api/overview') &&
    url.searchParams.get('ns') === namespace
  );
}

/** Select a namespace from the global TopBar selector. */
async function selectNamespace(page: Page, label: RegExp) {
  const selector = page.getByRole('combobox', { name: /namespace/i });
  await selector.click();
  await page.getByRole('option', { name: label }).click();
}

test.describe('Overview Tab - Namespace Scope (OV6)', () => {
  test('re-queries the overview scoped to the chosen namespace', async ({ page }) => {
    // Arrange: land on the overview and wait for the initial (unscoped) load.
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('overview-tab')).toBeVisible();

    // Act + Assert: selecting a specific namespace issues GET /api/overview?ns=<ns>.
    const scopedRequest = page.waitForRequest((req) =>
      isScopedOverviewRequest(req, 'dashboard-test'),
    );
    await selectNamespace(page, /^dashboard-test$/i);
    await scopedRequest;

    // Assert: the overview re-renders for that scope without falling into an error state.
    await expect(page.getByTestId('summary-cards-container')).toBeVisible();
    await expect(page.getByTestId('summary-cards-error')).toHaveCount(0);
  });

  test('issues a distinct scoped request each time the namespace changes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('overview-tab')).toBeVisible();

    // First scope: dashboard-test.
    const firstScoped = page.waitForRequest((req) =>
      isScopedOverviewRequest(req, 'dashboard-test'),
    );
    await selectNamespace(page, /^dashboard-test$/i);
    await firstScoped;
    await expect(page.getByTestId('summary-cards-container')).toBeVisible();

    // Changing to a second scope (the empty namespace) re-queries scoped to it —
    // proving the overview follows the selector rather than caching a single scope.
    const secondScoped = page.waitForRequest((req) =>
      isScopedOverviewRequest(req, 'dashboard-empty'),
    );
    await selectNamespace(page, /^dashboard-empty$/i);
    await secondScoped;

    // Assert: still a healthy render for the empty scope (empty, not errored).
    await expect(page.getByTestId('overview-tab')).toBeVisible();
    await expect(page.getByTestId('summary-cards-container')).toBeVisible();
    await expect(page.getByTestId('summary-cards-error')).toHaveCount(0);
  });
});
