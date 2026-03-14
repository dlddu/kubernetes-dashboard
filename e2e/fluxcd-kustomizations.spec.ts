import { test, expect } from '@playwright/test';

/**
 * E2E Tests for FluxCD Kustomization List
 *
 * TDD Red Phase: Tests written - components not yet implemented.
 * These tests define the expected behavior of the FluxCD tab Kustomizations section,
 * which displays Kustomization resources as cards with name, namespace, status badge,
 * source ref, revision, interval, and last applied time.
 * Covers happy path, summary cards, namespace filtering, loading, empty, and error states.
 * Also covers backend API filtering by namespace and CRD-not-installed empty response.
 *
 * Test Fixtures (test/fixtures/):
 * - kustomization-ready.yaml:     app-ready (dashboard-test), Ready=True,
 *                                 sourceRef: GitRepository/flux-system,
 *                                 interval: 5m, lastAppliedRevision: "main@sha1:abc123def456"
 * - kustomization-not-ready.yaml: app-not-ready (dashboard-test), Ready=False,
 *                                 sourceRef: GitRepository/app-source, interval: 10m
 * - kustomization-suspended.yaml: app-suspended (dashboard-test), spec.suspend=true,
 *                                 sourceRef: GitRepository/flux-system, interval: 10m
 * - kustomization-multi-ns.yaml:  frontend-app (dashboard-test) + backend-app (dashboard-empty)
 *
 * Activation: Remove test.describe.skip() from each describe block when implementation is ready.
 * Related issues: DLD-744 (이 이슈), DLD-741 (부모 이슈)
 */

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
