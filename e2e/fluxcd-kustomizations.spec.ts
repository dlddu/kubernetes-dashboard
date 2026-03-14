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
 * - Card click → detail page navigation (URL: /fluxcd/{namespace}/{name})
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

    // Act: Record total card count before filtering
    const allKustomizationCards = page.getByTestId('kustomization-card');
    const totalCount = await allKustomizationCards.count();
    expect(totalCount).toBeGreaterThanOrEqual(1);

    // Act: Apply namespace filter via the namespace selector in the TopBar
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const dashboardTestOption = page.getByRole('option', { name: /^dashboard-test$/i })
      .or(page.getByTestId('namespace-option-dashboard-test'));
    await dashboardTestOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Only dashboard-test namespace Kustomizations are shown
    const filteredCards = page.getByTestId('kustomization-card');
    const filteredCount = await filteredCards.count();
    expect(filteredCount).toBeLessThanOrEqual(totalCount);
    expect(filteredCount).toBeGreaterThanOrEqual(1);

    // Assert: All visible cards belong to dashboard-test namespace
    for (let i = 0; i < filteredCount; i++) {
      const card = filteredCards.nth(i);
      const namespaceElement = card.getByTestId('kustomization-namespace');
      const namespaceText = await namespaceElement.innerText();
      expect(namespaceText).toBe('dashboard-test');
    }
  });
});

// ---------------------------------------------------------------------------
// Group 4: UI — EmptyState / ErrorRetry / LoadingSkeleton (테스트 5, 6, 7)
// TODO: Activate when DLD-744 is implemented.
// ---------------------------------------------------------------------------

test.describe('FluxCD Tab - Kustomization List - Loading, Empty & Error States', () => {
  test('should display EmptyState when CRD is not installed (dashboard-empty namespace)', async ({ page }) => {
    // Tests that EmptyState is rendered when the selected namespace has no Kustomizations.
    // Uses 'dashboard-empty' namespace which has no FluxCD CRD resources installed.
    // No API mocking — relies on the real cluster returning an empty list for that namespace.

    // Arrange: Navigate to the FluxCD tab
    await page.goto('/flux');
    await page.waitForLoadState('networkidle');

    // Act: Filter to the 'dashboard-empty' namespace (no Kustomizations)
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const emptyNamespaceOption = page.getByRole('option', { name: /^dashboard-empty$/i })
      .or(page.getByTestId('namespace-option-dashboard-empty'));
    await emptyNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: EmptyState component is visible
    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();

    // Assert: No Kustomization cards are shown
    const kustomizationCards = page.getByTestId('kustomization-card');
    expect(await kustomizationCards.count()).toBe(0);
  });

  test('should display ErrorRetry component with retry button when the Kustomizations API returns an error', async ({ page }) => {
    // Tests that ErrorRetry is rendered on API failure and the retry button re-triggers the fetch.

    // Arrange: Block ALL kustomizations API calls with 500 until the flag is flipped.
    // Flag-based approach avoids race conditions when multiple concurrent fetches occur on mount.
    let shouldFail = true;
    await page.route('**/api/fluxcd/kustomizations**', async route => {
      if (shouldFail) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        await route.continue();
      }
    });

    // Act: Navigate to the FluxCD tab
    await page.goto('/flux');
    await page.waitForLoadState('networkidle');

    // Assert: ErrorRetry component is visible
    const errorRetry = page.getByTestId('error-retry');
    await expect(errorRetry).toBeVisible();

    // Assert: ErrorRetry has role="alert" for accessibility
    await expect(errorRetry).toHaveAttribute('role', 'alert');

    // Assert: Retry button is present and enabled
    const retryButton = errorRetry.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    // Assert: No Kustomization cards are shown during error state
    const kustomizationCards = page.getByTestId('kustomization-card');
    expect(await kustomizationCards.count()).toBe(0);

    // Act: Allow subsequent calls to succeed, then click retry
    shouldFail = false;
    await retryButton.click();
    await page.waitForLoadState('networkidle');

    // Assert: ErrorRetry is no longer visible after successful retry
    await expect(errorRetry).not.toBeVisible();
  });

  test('should display LoadingSkeleton with aria-busy="true" while Kustomizations are being fetched', async ({ page }) => {
    // Tests that LoadingSkeleton is shown during the API request.

    // Arrange: Intercept the kustomizations API and delay the response to observe loading state
    await page.route('**/api/fluxcd/kustomizations**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Act: Navigate to the FluxCD tab (do not wait for networkidle — need to observe loading state)
    await page.goto('/flux');

    // Assert: LoadingSkeleton is visible before the response arrives
    const loadingSkeleton = page.getByTestId('loading-skeleton');
    await expect(loadingSkeleton).toBeVisible();

    // Assert: LoadingSkeleton has aria-busy="true" for accessibility
    await expect(loadingSkeleton).toHaveAttribute('aria-busy', 'true');
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

// ===========================================================================
// DLD-746: Kustomization 상세 조회 — E2E 테스트 (all skipped)
// ===========================================================================

// ---------------------------------------------------------------------------
// Group 6: UI — 카드 클릭 → 상세 화면 진입 및 URL 확인 (테스트 11)
// TODO: Activate when DLD-746 is implemented.
// Activation: Remove test.describe.skip() when KustomizationDetail component is ready.
// ---------------------------------------------------------------------------

test.describe.skip('FluxCD Tab - Kustomization Detail - Navigation', () => {
  // No API mocking — tests use real cluster data from test/fixtures/ YAML resources.

  test('should navigate to the detail page with correct URL when a Kustomization card is clicked', async ({ page }) => {
    // Tests that clicking a kustomization-card navigates to /fluxcd/{namespace}/{name}
    // and renders the detail page container.
    // Fixture: app-ready (namespace: dashboard-test)

    // Arrange: Navigate to the FluxCD list
    await gotoFluxKustomizations(page);

    // Act: Click the app-ready card
    const card = await findKustomizationCardByName(page, 'app-ready');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    // Assert: URL navigated to the detail route
    expect(page.url()).toContain('/fluxcd/dashboard-test/app-ready');

    // Assert: Detail page container is visible
    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: List page is no longer visible (view swap)
    const listPage = page.getByTestId('flux-page').or(page.getByTestId('fluxcd-page'));
    await expect(listPage).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 7: UI — 뒤로가기 → 목록 화면 복귀 (테스트 12)
// TODO: Activate when DLD-746 is implemented.
// Activation: Remove test.describe.skip() when KustomizationDetail back navigation is ready.
// ---------------------------------------------------------------------------

test.describe.skip('FluxCD Tab - Kustomization Detail - Back Navigation', () => {
  // No API mocking — tests use real cluster data from test/fixtures/ YAML resources.

  test('should return to the Kustomization list when the back button is clicked', async ({ page }) => {
    // Tests that clicking the back button in the detail view returns to the list.
    // Fixture: app-ready (namespace: dashboard-test)

    // Arrange: Navigate to the detail page
    await gotoFluxKustomizations(page);

    const card = await findKustomizationCardByName(page, 'app-ready');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: Back button is present
    const backButton = detailPage.getByTestId('kustomization-detail-back-button');
    await expect(backButton).toBeVisible();

    // Act: Click the back button
    await backButton.click();
    await page.waitForLoadState('networkidle');

    // Assert: URL returned to the list route
    expect(page.url()).not.toContain('/fluxcd/dashboard-test/app-ready');

    // Assert: List page is visible again
    const listPage = page.getByTestId('flux-page').or(page.getByTestId('fluxcd-page'));
    await expect(listPage).toBeVisible();

    // Assert: Detail page is no longer visible
    await expect(detailPage).not.toBeVisible();

    // Assert: Kustomization cards are still displayed (list is intact)
    await expect(page.getByTestId('kustomization-card').first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 8: UI — Spec 정보 표시 (테스트 13)
// TODO: Activate when DLD-746 is implemented.
// Activation: Remove test.describe.skip() when KustomizationDetail Spec section is ready.
// ---------------------------------------------------------------------------

test.describe.skip('FluxCD Tab - Kustomization Detail - Spec Information', () => {
  // No API mocking — tests use real cluster data from test/fixtures/ YAML resources.

  test('should display Spec fields: Source, Path, Interval, Prune, Suspended, and DependsOn', async ({ page }) => {
    // Tests that the detail page renders all Spec fields for app-ready.
    // Fixture values (kustomization-ready.yaml):
    //   sourceRef: GitRepository/flux-system (namespace: flux-system)
    //   path: ./deploy
    //   interval: 5m
    //   prune: true
    //   suspend: (not set — false by default)
    //   dependsOn: (not set)

    // Arrange: Navigate to app-ready detail
    await gotoFluxKustomizations(page);

    const card = await findKustomizationCardByName(page, 'app-ready');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: Source ref is displayed (GitRepository/flux-system)
    const specSource = detailPage.getByTestId('kustomization-detail-spec-source');
    await expect(specSource).toBeVisible();
    await expect(specSource).toContainText('flux-system');

    // Assert: Path is displayed (./deploy)
    const specPath = detailPage.getByTestId('kustomization-detail-spec-path');
    await expect(specPath).toBeVisible();
    await expect(specPath).toContainText('./deploy');

    // Assert: Interval is displayed (5m)
    const specInterval = detailPage.getByTestId('kustomization-detail-spec-interval');
    await expect(specInterval).toBeVisible();
    await expect(specInterval).toContainText('5m');

    // Assert: Prune is displayed (true)
    const specPrune = detailPage.getByTestId('kustomization-detail-spec-prune');
    await expect(specPrune).toBeVisible();
    await expect(specPrune).toContainText('true');

    // Assert: Suspended field is displayed (false for app-ready)
    const specSuspended = detailPage.getByTestId('kustomization-detail-spec-suspended');
    await expect(specSuspended).toBeVisible();
    await expect(specSuspended).toContainText('false');

    // Assert: DependsOn section is present (may show empty or '-' when not set)
    const specDependsOn = detailPage.getByTestId('kustomization-detail-spec-depends-on');
    await expect(specDependsOn).toBeVisible();
  });

  test('should display Suspended=true in Spec for a suspended Kustomization', async ({ page }) => {
    // Tests that spec.suspend=true is correctly shown in the detail page.
    // Fixture: app-suspended (kustomization-suspended.yaml), spec.suspend=true

    // Arrange: Navigate to app-suspended detail
    await gotoFluxKustomizations(page);

    const card = await findKustomizationCardByName(page, 'app-suspended');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: Suspended field is displayed as true
    const specSuspended = detailPage.getByTestId('kustomization-detail-spec-suspended');
    await expect(specSuspended).toBeVisible();
    await expect(specSuspended).toContainText('true');
  });
});

// ---------------------------------------------------------------------------
// Group 9: UI — Status 정보 표시 (Revision, Last Applied) (테스트 14)
// TODO: Activate when DLD-746 is implemented.
// Activation: Remove test.describe.skip() when KustomizationDetail Status section is ready.
// ---------------------------------------------------------------------------

test.describe.skip('FluxCD Tab - Kustomization Detail - Status Information', () => {
  // No API mocking — tests use real cluster data from test/fixtures/ YAML resources.

  test('should display Revision in monospace font and Last Applied time in the Status section', async ({ page }) => {
    // Tests that the Status section renders:
    //   - lastAppliedRevision: "main@sha1:abc123def456" in monospace font
    //   - last applied time (lastTransitionTime from Ready condition)
    // Fixture: app-ready (kustomization-ready.yaml)

    // Arrange: Navigate to app-ready detail
    await gotoFluxKustomizations(page);

    const card = await findKustomizationCardByName(page, 'app-ready');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: Revision is displayed with the correct value
    const statusRevision = detailPage.getByTestId('kustomization-detail-status-revision');
    await expect(statusRevision).toBeVisible();
    await expect(statusRevision).toContainText('main@sha1:abc123def456');

    // Assert: Revision element uses monospace font (font-mono class)
    await expect(statusRevision).toHaveClass(/mono/);

    // Assert: Last Applied time is displayed
    const statusLastApplied = detailPage.getByTestId('kustomization-detail-status-last-applied');
    await expect(statusLastApplied).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 10: UI — Conditions 표시 (Type, Status badge, Reason, Message) (테스트 15)
// TODO: Activate when DLD-746 is implemented.
// Activation: Remove test.describe.skip() when KustomizationDetail Conditions section is ready.
// ---------------------------------------------------------------------------

test.describe.skip('FluxCD Tab - Kustomization Detail - Conditions', () => {
  // No API mocking — tests use real cluster data from test/fixtures/ YAML resources.

  test('should display each Condition with Type, Status badge, Reason, and Message', async ({ page }) => {
    // Tests that the Conditions section renders all condition fields for app-ready.
    // Fixture condition (kustomization-ready.yaml):
    //   type: Ready, status: True, reason: ReconciliationSucceeded,
    //   message: "Applied revision: main@sha1:abc123def456"

    // Arrange: Navigate to app-ready detail
    await gotoFluxKustomizations(page);

    const card = await findKustomizationCardByName(page, 'app-ready');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: Conditions section is visible
    const conditionsSection = detailPage.getByTestId('kustomization-detail-conditions');
    await expect(conditionsSection).toBeVisible();

    // Assert: At least one condition row is rendered
    await expect(conditionsSection.getByTestId('kustomization-detail-condition').first()).toBeVisible();
    const conditions = conditionsSection.getByTestId('kustomization-detail-condition');
    expect(await conditions.count()).toBeGreaterThanOrEqual(1);

    // Assert: The Ready condition row shows correct fields
    const readyCondition = conditions.first();

    const conditionType = readyCondition.getByTestId('kustomization-detail-condition-type');
    await expect(conditionType).toBeVisible();
    await expect(conditionType).toContainText('Ready');

    const conditionStatusBadge = readyCondition.getByTestId('kustomization-detail-condition-status');
    await expect(conditionStatusBadge).toBeVisible();
    await expect(conditionStatusBadge).toContainText('True');

    const conditionReason = readyCondition.getByTestId('kustomization-detail-condition-reason');
    await expect(conditionReason).toBeVisible();
    await expect(conditionReason).toContainText('ReconciliationSucceeded');

    const conditionMessage = readyCondition.getByTestId('kustomization-detail-condition-message');
    await expect(conditionMessage).toBeVisible();
    await expect(conditionMessage).toContainText('Applied revision: main@sha1:abc123def456');
  });

  test('should display Ready=False condition fields for a not-ready Kustomization', async ({ page }) => {
    // Tests that a False condition row shows the correct reason and message.
    // Fixture condition (kustomization-not-ready.yaml):
    //   type: Ready, status: False, reason: ArtifactFailed,
    //   message: "Source artifact not found: GitRepository/flux-system/app-source"

    // Arrange: Navigate to app-not-ready detail
    await gotoFluxKustomizations(page);

    const card = await findKustomizationCardByName(page, 'app-not-ready');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    const conditionsSection = detailPage.getByTestId('kustomization-detail-conditions');
    await expect(conditionsSection).toBeVisible();

    const readyCondition = conditionsSection.getByTestId('kustomization-detail-condition').first();

    const conditionStatusBadge = readyCondition.getByTestId('kustomization-detail-condition-status');
    await expect(conditionStatusBadge).toContainText('False');

    const conditionReason = readyCondition.getByTestId('kustomization-detail-condition-reason');
    await expect(conditionReason).toContainText('ArtifactFailed');

    const conditionMessage = readyCondition.getByTestId('kustomization-detail-condition-message');
    await expect(conditionMessage).toContainText('Source artifact not found');
  });
});

// ---------------------------------------------------------------------------
// Group 11: UI — Conditions 좌측 보더 색상 (True=green, False=red) (테스트 16)
// TODO: Activate when DLD-746 is implemented.
// Activation: Remove test.describe.skip() when KustomizationDetail condition border colors are ready.
// ---------------------------------------------------------------------------

test.describe.skip('FluxCD Tab - Kustomization Detail - Condition Border Colors', () => {
  // No API mocking — tests use real cluster data from test/fixtures/ YAML resources.

  test('should apply green left border to conditions with Status=True', async ({ page }) => {
    // Tests that a Ready=True condition row has a green left border class.
    // Fixture: app-ready (kustomization-ready.yaml), condition status: "True"

    // Arrange: Navigate to app-ready detail
    await gotoFluxKustomizations(page);

    const card = await findKustomizationCardByName(page, 'app-ready');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    const conditionsSection = detailPage.getByTestId('kustomization-detail-conditions');
    const readyCondition = conditionsSection.getByTestId('kustomization-detail-condition').first();

    // Assert: True condition has green left border indicator
    await expect(readyCondition).toHaveClass(/green/);
  });

  test('should apply red left border to conditions with Status=False', async ({ page }) => {
    // Tests that a Ready=False condition row has a red left border class.
    // Fixture: app-not-ready (kustomization-not-ready.yaml), condition status: "False"

    // Arrange: Navigate to app-not-ready detail
    await gotoFluxKustomizations(page);

    const card = await findKustomizationCardByName(page, 'app-not-ready');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    const conditionsSection = detailPage.getByTestId('kustomization-detail-conditions');
    const notReadyCondition = conditionsSection.getByTestId('kustomization-detail-condition').first();

    // Assert: False condition has red left border indicator
    await expect(notReadyCondition).toHaveClass(/red/);
  });
});

// ---------------------------------------------------------------------------
// Group 12: UI — 상세 API 에러 시 에러 표시 (테스트 17)
// TODO: Activate when DLD-746 is implemented.
// Activation: Remove test.describe.skip() when KustomizationDetail error handling is ready.
// ---------------------------------------------------------------------------

test.describe.skip('FluxCD Tab - Kustomization Detail - Error State', () => {
  test('should display ErrorRetry with retry button when the Kustomization detail API returns an error', async ({ page }) => {
    // Tests that when the detail API returns 500, ErrorRetry is shown inside the detail page,
    // and clicking Retry re-fetches and renders the detail on success.
    // Fixture: app-ready (dashboard-test)

    // Arrange: First call fails with 500, subsequent calls pass through to real API
    let detailCallCount = 0;
    await page.route('**/api/fluxcd/kustomizations/dashboard-test/app-ready**', async route => {
      detailCallCount += 1;
      if (detailCallCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        await route.continue();
      }
    });

    // Act: Navigate directly to the detail page
    await page.goto('/fluxcd/dashboard-test/app-ready');
    await page.waitForLoadState('networkidle');

    // Assert: Detail page container is rendered
    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: ErrorRetry component is shown inside the detail page
    const errorRetry = detailPage.getByTestId('error-retry');
    await expect(errorRetry).toBeVisible();
    await expect(errorRetry).toHaveAttribute('role', 'alert');

    // Assert: Retry button is present and enabled
    const retryButton = errorRetry.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    // Assert: Detail content is not rendered during error
    const statusRevision = detailPage.getByTestId('kustomization-detail-status-revision');
    await expect(statusRevision).not.toBeVisible();

    // Act: Click retry — second call succeeds
    await retryButton.click();
    await page.waitForLoadState('networkidle');

    // Assert: Detail content is now visible
    await expect(statusRevision).toBeVisible();

    // Assert: ErrorRetry is no longer visible
    await expect(errorRetry).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 13: UI — Deep Linking (직접 URL 진입) (테스트 18)
// TODO: Activate when DLD-746 is implemented.
// Activation: Remove test.describe.skip() when KustomizationDetail deep link routing is ready.
// ---------------------------------------------------------------------------

test.describe.skip('FluxCD Tab - Kustomization Detail - Deep Linking', () => {
  // No API mocking — tests use real cluster data from test/fixtures/ YAML resources.

  test('should render kustomization-detail-page when navigating directly to /fluxcd/{namespace}/{name}', async ({ page }) => {
    // Tests that navigating directly to the detail URL renders the detail page
    // without requiring the user to first visit the list.
    // Fixture: app-ready (namespace: dashboard-test)

    // Act: Navigate directly to the detail page
    await page.goto('/fluxcd/dashboard-test/app-ready');
    await page.waitForLoadState('networkidle');

    // Assert: Detail page is visible
    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: Revision is shown (confirms detail data loaded)
    const statusRevision = detailPage.getByTestId('kustomization-detail-status-revision');
    await expect(statusRevision).toBeVisible();
    await expect(statusRevision).toContainText('main@sha1:abc123def456');
  });

  test('should navigate back to the list when back button is clicked from a deep-linked detail page', async ({ page }) => {
    // Tests that the back button works correctly even when entering via direct URL.

    // Arrange: Navigate directly to the detail page
    await page.goto('/fluxcd/dashboard-test/app-ready');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    // Act: Click the back button
    const backButton = detailPage.getByTestId('kustomization-detail-back-button');
    await backButton.click();
    await page.waitForLoadState('networkidle');

    // Assert: URL no longer points to the detail route
    expect(page.url()).not.toContain('/fluxcd/dashboard-test/app-ready');

    // Assert: List page is visible
    const listPage = page.getByTestId('flux-page').or(page.getByTestId('fluxcd-page'));
    await expect(listPage).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 14: 백엔드 API — GET /api/fluxcd/kustomizations/{namespace}/{name} (테스트 19, 20)
// TODO: Activate when DLD-746 is implemented.
// Activation: Remove test.describe.skip() when backend detail endpoint is ready.
// ---------------------------------------------------------------------------

test.describe.skip('FluxCD API - GET /api/fluxcd/kustomizations/{namespace}/{name}', () => {
  test('should return 200 with full Kustomization detail for an existing resource', async ({ request }) => {
    // Tests that GET /api/fluxcd/kustomizations/dashboard-test/app-ready
    // returns the complete detail object with spec and status fields.
    // Fixture: app-ready (kustomization-ready.yaml)

    // Act: Call the detail API
    const response = await request.get('/api/fluxcd/kustomizations/dashboard-test/app-ready');

    // Assert: Response is successful
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Assert: Response Content-Type is application/json
    expect(response.headers()['content-type']).toContain('application/json');

    // Assert: Response body contains expected fields
    const body = await response.json();
    expect(body.name).toBe('app-ready');
    expect(body.namespace).toBe('dashboard-test');

    // Assert: Spec fields are present
    expect(body.spec).toBeDefined();
    expect(body.spec.interval).toBe('5m');
    expect(body.spec.path).toBe('./deploy');
    expect(body.spec.prune).toBe(true);
    expect(body.spec.sourceRef).toBeDefined();
    expect(body.spec.sourceRef.name).toBe('flux-system');

    // Assert: Status fields are present
    expect(body.status).toBeDefined();
    expect(body.status.lastAppliedRevision).toBe('main@sha1:abc123def456');

    // Assert: Conditions array is present and has at least one entry
    expect(Array.isArray(body.status.conditions)).toBeTruthy();
    expect(body.status.conditions.length).toBeGreaterThanOrEqual(1);

    const readyCondition = body.status.conditions.find(
      (c: { type: string }) => c.type === 'Ready'
    );
    expect(readyCondition).toBeDefined();
    expect(readyCondition.status).toBe('True');
    expect(readyCondition.reason).toBe('ReconciliationSucceeded');
  });

  test('should return 404 when the requested Kustomization does not exist', async ({ request }) => {
    // Tests that GET /api/fluxcd/kustomizations/{namespace}/{name} returns 404
    // when no Kustomization resource matches the given namespace and name.

    // Act: Call the detail API with a non-existent resource
    const response = await request.get('/api/fluxcd/kustomizations/dashboard-test/non-existent-resource');

    // Assert: Response is 404 Not Found
    expect(response.status()).toBe(404);

    // Assert: Response Content-Type is application/json
    expect(response.headers()['content-type']).toContain('application/json');

    // Assert: Response body contains an error message
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });
});
