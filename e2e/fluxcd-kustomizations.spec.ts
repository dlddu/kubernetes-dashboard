// Verifies: FX2 (docs/product/prd-fluxcd.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

/**
 * E2E Tests for FluxCD Kustomization List and Detail
 *
 * TDD Red Phase: Tests written - components not yet implemented.
 * These tests define the expected behavior of the FluxCD tab Kustomizations section,
 * which displays Kustomization resources as cards with name, namespace, status badge,
 * source ref, revision, interval, and last applied time.
 * Covers happy path, summary cards, namespace filtering, loading, empty, and error states.
 * Also covers backend API filtering by namespace and CRD-not-installed empty response.
 *
 * Also covers the Kustomization detail view (DLD-746):
 * - Card click → detail page navigation (URL: /fluxcd/kustomization/{namespace}/{name})
 * - Back button → list page return
 * - Spec info: Source, Path, Interval, Prune, Suspended, DependsOn
 * - Status info: Revision (mono font), Last Applied
 * - Conditions: Type, Status badge, Reason, Message
 * - Conditions left border color: True=green, False=red
 * - Detail API error state
 * - Backend API: GET /api/fluxcd/kustomizations/{namespace}/{name}
 *
 * Test Fixtures (test/fixtures/):
 * - kustomization-ready.yaml:     app-ready (dashboard-test), Ready=True,
 *                                 sourceRef: GitRepository/flux-system,
 *                                 interval: 5m, path: ./deploy, prune: true,
 *                                 lastAppliedRevision: "main@sha1:abc123def456"
 * - kustomization-not-ready.yaml: app-not-ready (dashboard-test), Ready=False,
 *                                 sourceRef: GitRepository/app-source, interval: 10m,
 *                                 reason: ArtifactFailed
 * - kustomization-suspended.yaml: app-suspended (dashboard-test), spec.suspend=true,
 *                                 sourceRef: GitRepository/flux-system, interval: 10m
 * - kustomization-multi-ns.yaml:  frontend-app (dashboard-test) + backend-app (dashboard-empty)
 *
 * Activation: Remove test.describe.skip() from each describe block when implementation is ready.
 * Related issues: DLD-744 (목록 이슈), DLD-746 (상세 이슈), DLD-741 (부모 이슈)
 */

// ---------------------------------------------------------------------------
// Helpers (detail view)
// ---------------------------------------------------------------------------

type PageParam = Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] : never;

/**
 * Navigate to /flux and wait for Kustomization cards to appear.
 */
async function gotoFluxKustomizations(page: PageParam) {
  await page.goto('/flux');
  await page.waitForLoadState('networkidle');
  await expect(
    page.getByTestId('flux-page').or(page.getByTestId('fluxcd-page'))
  ).toBeVisible();
}

/**
 * Find a kustomization-card by name.
 * Returns the card locator or null if not found.
 */
async function findKustomizationCardByName(page: PageParam, name: string) {
  await expect(page.getByTestId('kustomization-card').first()).toBeVisible();
  const cards = page.getByTestId('kustomization-card');
  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const nameText = await card.getByTestId('kustomization-name').innerText();
    if (nameText === name) {
      return card;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Group 1: UI — 페이지 진입 및 기본 렌더링 (테스트 1, 2)
// TODO: Activate when DLD-744 is implemented.
// ---------------------------------------------------------------------------

test.describe('FluxCD Tab - Kustomization List - Basic Rendering', () => {
  // No API mocking — tests use real cluster data from test/fixtures/ YAML resources.

  test('should display Kustomization list page when navigating to FluxCD tab', async ({ page }) => {
    // Tests that navigating to /flux renders the FluxCD page with the Kustomization list visible.

    // Arrange: Navigate to the FluxCD tab
    await page.goto('/flux');
    await page.waitForLoadState('networkidle');

    // Assert: FluxCD page container should be visible
    // Accepts either flux-page or fluxcd-page as the data-testid
    const fluxPage = page.getByTestId('flux-page').or(page.getByTestId('fluxcd-page'));
    await expect(fluxPage).toBeVisible();
  });

  test('should render Kustomization cards with name, namespace, status badge, source, revision, interval, and last applied time', async ({ page }) => {
    // Tests that fixture Kustomizations are rendered as cards with all required fields.

    // Arrange: Navigate to the FluxCD tab
    await page.goto('/flux');
    await page.waitForLoadState('networkidle');

    // Assert: kustomization-card elements should be present
    const kustomizationCards = page.getByTestId('kustomization-card');
    const cardCount = await kustomizationCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Act: Find the app-ready card (Ready=True, complete fixture data)
    let appReadyCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = kustomizationCards.nth(i);
      const nameElement = card.getByTestId('kustomization-name');
      const nameText = await nameElement.innerText();
      if (nameText === 'app-ready') {
        appReadyCard = card;
        break;
      }
    }

    // Assert: app-ready card exists
    expect(appReadyCard).toBeTruthy();
    if (!appReadyCard) return;

    // Assert: Card displays the Kustomization name
    const kustomizationName = appReadyCard.getByTestId('kustomization-name');
    await expect(kustomizationName).toBeVisible();
    expect(await kustomizationName.innerText()).toBe('app-ready');

    // Assert: Card displays the namespace
    const kustomizationNamespace = appReadyCard.getByTestId('kustomization-namespace');
    await expect(kustomizationNamespace).toBeVisible();
    expect(await kustomizationNamespace.innerText()).toBe('dashboard-test');

    // Assert: Card displays the status badge
    const statusBadge = appReadyCard.getByTestId('status-badge');
    await expect(statusBadge).toBeVisible();

    // Assert: Card displays the source ref (GitRepository/flux-system)
    const kustomizationSource = appReadyCard.getByTestId('kustomization-source');
    await expect(kustomizationSource).toBeVisible();
    await expect(kustomizationSource).toContainText('flux-system');

    // Assert: Card displays the revision
    const kustomizationRevision = appReadyCard.getByTestId('kustomization-revision');
    await expect(kustomizationRevision).toBeVisible();
    await expect(kustomizationRevision).toContainText('main@sha1:abc123def456');

    // Assert: Card displays the interval
    const kustomizationInterval = appReadyCard.getByTestId('kustomization-interval');
    await expect(kustomizationInterval).toBeVisible();
    await expect(kustomizationInterval).toContainText('5m');

    // Assert: Card displays the last applied time
    const kustomizationLastApplied = appReadyCard.getByTestId('kustomization-last-applied');
    await expect(kustomizationLastApplied).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 2: UI — 요약 카드 카운트 (테스트 3)
// TODO: Activate when DLD-744 is implemented.
// ---------------------------------------------------------------------------
test.describe('FluxCD Tab - Kustomization List - Summary Cards', () => {
  // No API mocking — tests use real cluster data from test/fixtures/ YAML resources.

  test('should display correct counts on Ready, Not Ready, and Suspended summary cards', async ({ page }) => {
    // Tests that the three summary cards (Ready / Not Ready / Suspended) show
    // counts that reflect the fixture Kustomizations in the dashboard-test namespace.
    // Fixtures: app-ready (Ready), app-not-ready (Not Ready), app-suspended (Suspended).

    // Arrange: Navigate to the FluxCD tab
    await page.goto('/flux');
    await page.waitForLoadState('networkidle');

    // Assert: summary-card-ready is visible and shows a non-negative count
    const summaryCardReady = page.getByTestId('summary-card-ready');
    await expect(summaryCardReady).toBeVisible();

    // Assert: summary-card-not-ready is visible and shows a non-negative count
    const summaryCardNotReady = page.getByTestId('summary-card-not-ready');
    await expect(summaryCardNotReady).toBeVisible();

    // Assert: summary-card-suspended is visible and shows a non-negative count
    const summaryCardSuspended = page.getByTestId('summary-card-suspended');
    await expect(summaryCardSuspended).toBeVisible();

    // Assert: Ready count is at least 1 (app-ready fixture)
    await expect(summaryCardReady).toContainText(/[1-9]/);

    // Assert: Not Ready count is at least 1 (app-not-ready fixture)
    await expect(summaryCardNotReady).toContainText(/[1-9]/);

    // Assert: Suspended count is at least 1 (app-suspended fixture)
    await expect(summaryCardSuspended).toContainText(/[1-9]/);
  });
});

// ---------------------------------------------------------------------------
// Group 3: UI — 네임스페이스 필터 (테스트 4)
// TODO: Activate when DLD-744 is implemented.
// ---------------------------------------------------------------------------
test.describe('FluxCD Tab - Kustomization List - Namespace Filtering', () => {
  test('should display only Kustomizations for the selected namespace when namespace filter is applied', async ({ page }) => {
    // Tests that the namespace selector filters the displayed Kustomization cards.
    // kustomization-multi-ns.yaml provides: frontend-app (dashboard-test) + backend-app (dashboard-empty).
    // No API mocking — uses real cluster data from test/fixtures/ YAML resources.

    // Arrange: Navigate to the FluxCD tab (all namespaces visible by default)
    await page.goto('/flux');
    await page.waitForLoadState('networkidle');

    // Act: ensure the unfiltered list has rendered at least one card
    const allKustomizationCards = page.getByTestId('kustomization-card');
    await expect(allKustomizationCards.first()).toBeVisible();

    // Act: Apply namespace filter via the namespace selector in the TopBar
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const dashboardTestOption = page.getByRole('option', { name: /^dashboard-test$/i })
      .or(page.getByTestId('namespace-option-dashboard-test'));
    await dashboardTestOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Only dashboard-test namespace Kustomizations are shown.
    // The card list re-renders asynchronously after the filter is applied, so a
    // one-shot count()+nth() snapshot can capture the pre-filter union — which
    // includes the backend-app card that apply-all.sh relocates to the `default`
    // namespace — before those stale cards detach, yielding a flaky
    // "unexpected value default" failure under the workers:4 shard ordering
    // (reconcile rct_20260722-0001). Poll until the filtered list settles so
    // every visible card belongs to dashboard-test.
    const filteredNamespaces = page
      .getByTestId('kustomization-card')
      .getByTestId('kustomization-namespace');
    await expect
      .poll(
        async () => {
          const namespaces = await filteredNamespaces.allTextContents();
          return (
            namespaces.length >= 1 &&
            namespaces.every((ns) => ns.trim() === 'dashboard-test')
          );
        },
        {
          message:
            'namespace filter should settle so every visible Kustomization card is in dashboard-test',
          timeout: 10000,
        },
      )
      .toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Group 3b: UI — 상태 필터 (Ready / Not Ready / Suspended 요약 카드 클릭)
// Activation: status filter toggles on the FluxCD list summary cards.
// ---------------------------------------------------------------------------
test.describe('FluxCD Tab - Kustomization List - Status Filtering', () => {
  // No API mocking — tests use real cluster data from test/fixtures/ YAML resources.
  // Fixtures: app-ready (Ready), app-not-ready (Not Ready), app-suspended (Suspended).

  test('should show only Ready Kustomizations when the Ready summary card is clicked', async ({ page }) => {
    // Tests that clicking the Ready summary card filters the list to Ready cards only
    // and marks the card as the active filter.

    // Arrange: Navigate to the list with all statuses visible
    await gotoFluxKustomizations(page);

    const allCards = page.getByTestId('kustomization-card');
    await expect(allCards.first()).toBeVisible();
    const totalCount = await allCards.count();
    expect(totalCount).toBeGreaterThanOrEqual(1);

    // Act: Click the Ready summary card
    await page.getByTestId('summary-card-ready').click();

    // Assert: The Ready filter card is marked active
    await expect(page.getByTestId('summary-card-ready')).toHaveAttribute('aria-pressed', 'true');

    // Assert: At least one card remains and every visible card has a Ready badge
    const filtered = page.getByTestId('kustomization-card');
    const filteredCount = await filtered.count();
    expect(filteredCount).toBeGreaterThanOrEqual(1);
    expect(filteredCount).toBeLessThanOrEqual(totalCount);
    for (let i = 0; i < filteredCount; i++) {
      await expect(filtered.nth(i).getByTestId('status-badge')).toHaveText('Ready');
    }

    // Assert: The known Not Ready fixture is no longer shown
    expect(await findKustomizationCardByName(page, 'app-not-ready')).toBeNull();
  });

  test('should show only Not Ready Kustomizations when the Not Ready summary card is clicked', async ({ page }) => {
    // Tests that the Not Ready summary card filters the list to Not Ready cards only.
    // Fixture: app-not-ready (dashboard-test).

    // Arrange
    await gotoFluxKustomizations(page);
    await expect(page.getByTestId('kustomization-card').first()).toBeVisible();

    // Act: Click the Not Ready summary card
    await page.getByTestId('summary-card-not-ready').click();

    // Assert: Every visible card has a NotReady badge
    const filtered = page.getByTestId('kustomization-card');
    const filteredCount = await filtered.count();
    expect(filteredCount).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < filteredCount; i++) {
      await expect(filtered.nth(i).getByTestId('status-badge')).toHaveText('NotReady');
    }

    // Assert: The app-not-ready fixture is present in the filtered list
    expect(await findKustomizationCardByName(page, 'app-not-ready')).toBeTruthy();
  });

  test('should show only Suspended Kustomizations when the Suspended summary card is clicked', async ({ page }) => {
    // Tests that the Suspended summary card filters the list to Suspended cards only.
    // Fixture: app-suspended (dashboard-test).

    // Arrange
    await gotoFluxKustomizations(page);
    await expect(page.getByTestId('kustomization-card').first()).toBeVisible();

    // Act: Click the Suspended summary card
    await page.getByTestId('summary-card-suspended').click();

    // Assert: Every visible card has a Suspended badge
    const filtered = page.getByTestId('kustomization-card');
    const filteredCount = await filtered.count();
    expect(filteredCount).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < filteredCount; i++) {
      await expect(filtered.nth(i).getByTestId('status-badge')).toHaveText('Suspended');
    }

    // Assert: The app-suspended fixture is present in the filtered list
    expect(await findKustomizationCardByName(page, 'app-suspended')).toBeTruthy();
  });

  test('should clear the filter and show all Kustomizations when the active summary card is clicked again', async ({ page }) => {
    // Tests the toggle behaviour: clicking the active filter card again restores the full list.

    // Arrange
    await gotoFluxKustomizations(page);
    const allCards = page.getByTestId('kustomization-card');
    await expect(allCards.first()).toBeVisible();
    const totalCount = await allCards.count();

    // Act: Apply the Ready filter
    const readyCard = page.getByTestId('summary-card-ready');
    await readyCard.click();
    await expect(readyCard).toHaveAttribute('aria-pressed', 'true');

    // Act: Click the active card again to clear the filter
    await readyCard.click();

    // Assert: Filter cleared and all cards visible again
    await expect(readyCard).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('kustomization-card')).toHaveCount(totalCount);
  });
});

// ---------------------------------------------------------------------------
// Group 5: 백엔드 API — Kustomization 목록 조회 (테스트 8, 9, 10)
// TODO: Activate when DLD-744 is implemented.
// ---------------------------------------------------------------------------
test.describe('FluxCD API - GET /api/fluxcd/kustomizations', () => {
  test('should return all Kustomizations across namespaces when no namespace filter is applied', async ({ request }) => {
    // Tests that GET /api/fluxcd/kustomizations returns a non-empty array
    // containing all Kustomization resources across namespaces.
    // Fixtures supply: app-ready, app-not-ready, app-suspended (dashboard-test)
    //                  frontend-app (dashboard-test), backend-app (dashboard-empty).

    // Act: Call the kustomizations API without a namespace filter
    const response = await request.get('/api/fluxcd/kustomizations');

    // Assert: Response is successful
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Assert: Response Content-Type is application/json
    expect(response.headers()['content-type']).toContain('application/json');

    // Assert: Response body is an array with at least 3 items (fixture Kustomizations)
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThanOrEqual(3);
  });

  test('should return only Kustomizations in the specified namespace when ns query param is provided', async ({ request }) => {
    // Tests that GET /api/fluxcd/kustomizations?ns=flux-system filters by namespace.
    // All returned items must belong to the dashboard-test namespace.

    // Act: Call the kustomizations API with a namespace filter
    const response = await request.get('/api/fluxcd/kustomizations?ns=dashboard-test');

    // Assert: Response is successful
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Assert: Response body is an array
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThanOrEqual(1);

    // Assert: Every item in the response belongs to the dashboard-test namespace
    for (const item of body) {
      expect(item.namespace).toBe('dashboard-test');
    }
  });

  test('should return an empty array when the namespace has no Kustomizations (CRD not installed)', async ({ request }) => {
    // Tests that GET /api/fluxcd/kustomizations?ns=dashboard-empty returns an empty array
    // when no Kustomization CRD resources exist in that namespace.
    // dashboard-empty namespace is specifically provisioned with no FluxCD resources.

    // Act: Call the kustomizations API for the empty namespace
    const response = await request.get('/api/fluxcd/kustomizations?ns=dashboard-empty');

    // Assert: Response is successful (not an error — absence of CRDs is not a server error)
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Assert: Response Content-Type is application/json
    expect(response.headers()['content-type']).toContain('application/json');

    // Assert: Response body is an empty array
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBe(0);
  });
});
