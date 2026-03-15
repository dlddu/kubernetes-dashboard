import { test, expect } from '@playwright/test';

/**
 * E2E Tests for FluxCD GitRepository List and Detail
 *
 * These tests define the expected behavior of the FluxCD tab GitRepositories section,
 * which displays GitRepository resources as cards with name, namespace, status badge,
 * URL, branch/tag, revision, and interval.
 * Covers happy path, summary cards, namespace filtering, loading, empty, and error states.
 *
 * Also covers the GitRepository detail view:
 * - Card click → detail page navigation (URL: /fluxcd/gitrepository/{namespace}/{name})
 * - Back button → list page return
 * - Spec info: URL, Ref (branch/tag), Interval, Suspended, SecretRef
 * - Status info: Revision (mono font), Last Update
 * - Conditions: Type, Status badge, Reason, Message
 * - Conditions left border color: True=green, False=red
 * - Detail API error state
 * - Backend API: GET /api/fluxcd/gitrepositories/{namespace}/{name}
 *
 * Also covers the GitRepository Reconcile feature:
 * - Reconcile Now button on the detail page
 * - Loading state (Reconciling...) with spinner and disabled button
 * - Successful reconcile → button restored, detail data re-fetched
 * - Failed reconcile → error message with role="alert"
 * - Backend API: POST /api/fluxcd/gitrepositories/{namespace}/{name}/reconcile
 *
 * Test Fixtures (test/fixtures/):
 * - gitrepository-ready.yaml:     flux-system (dashboard-test), Ready=True,
 *                                 url: https://github.com/example/flux-system,
 *                                 branch: main, interval: 1m,
 *                                 artifact.revision: "main@sha1:abc123def456"
 * - gitrepository-not-ready.yaml: app-source (dashboard-test), Ready=False,
 *                                 url: https://github.com/example/app-source,
 *                                 branch: develop, reason: GitOperationFailed
 * - gitrepository-suspended.yaml: infra-repo (dashboard-test), spec.suspend=true,
 *                                 url: https://github.com/example/infra-repo,
 *                                 tag: v1.0.0, interval: 10m
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type PageParam = Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] : never;

/**
 * Navigate to /flux and wait for GitRepository cards to appear.
 */
async function gotoFluxGitRepositories(page: PageParam) {
  await page.goto('/flux');
  await page.waitForLoadState('networkidle');
  await expect(
    page.getByTestId('flux-page').or(page.getByTestId('fluxcd-page'))
  ).toBeVisible();
}

/**
 * Find a gitrepository-card by name.
 * Returns the card locator or null if not found.
 */
async function findGitRepositoryCardByName(page: PageParam, name: string) {
  await expect(page.getByTestId('gitrepository-card').first()).toBeVisible();
  const cards = page.getByTestId('gitrepository-card');
  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const nameText = await card.getByTestId('gitrepository-name').innerText();
    if (nameText === name) {
      return card;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Group 1: UI — 페이지 진입 및 기본 렌더링
// ---------------------------------------------------------------------------

test.describe('FluxCD Tab - GitRepository List - Basic Rendering', () => {
  test('should display GitRepository list when navigating to FluxCD tab', async ({ page }) => {
    await page.goto('/flux');
    await page.waitForLoadState('networkidle');

    const fluxPage = page.getByTestId('flux-page').or(page.getByTestId('fluxcd-page'));
    await expect(fluxPage).toBeVisible();
  });

  test('should render GitRepository cards with name, namespace, status badge, URL, ref, revision, and interval', async ({ page }) => {
    await page.goto('/flux');
    await page.waitForLoadState('networkidle');

    const gitRepoCards = page.getByTestId('gitrepository-card');
    const cardCount = await gitRepoCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Find the flux-system card (Ready=True, complete fixture data)
    let fluxSystemCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = gitRepoCards.nth(i);
      const nameElement = card.getByTestId('gitrepository-name');
      const nameText = await nameElement.innerText();
      if (nameText === 'flux-system') {
        fluxSystemCard = card;
        break;
      }
    }

    expect(fluxSystemCard).toBeTruthy();
    if (!fluxSystemCard) return;

    // Assert: Card displays the GitRepository name
    const gitRepoName = fluxSystemCard.getByTestId('gitrepository-name');
    await expect(gitRepoName).toBeVisible();
    expect(await gitRepoName.innerText()).toBe('flux-system');

    // Assert: Card displays the namespace
    const gitRepoNamespace = fluxSystemCard.getByTestId('gitrepository-namespace');
    await expect(gitRepoNamespace).toBeVisible();
    expect(await gitRepoNamespace.innerText()).toBe('dashboard-test');

    // Assert: Card displays the status badge
    const statusBadge = fluxSystemCard.getByTestId('status-badge');
    await expect(statusBadge).toBeVisible();

    // Assert: Card displays the URL
    const gitRepoUrl = fluxSystemCard.getByTestId('gitrepository-url');
    await expect(gitRepoUrl).toBeVisible();
    await expect(gitRepoUrl).toContainText('github.com/example/flux-system');

    // Assert: Card displays the ref (branch)
    const gitRepoRef = fluxSystemCard.getByTestId('gitrepository-ref');
    await expect(gitRepoRef).toBeVisible();
    await expect(gitRepoRef).toContainText('main');

    // Assert: Card displays the revision
    const gitRepoRevision = fluxSystemCard.getByTestId('gitrepository-revision');
    await expect(gitRepoRevision).toBeVisible();
    await expect(gitRepoRevision).toContainText('main@sha1:abc123def456');

    // Assert: Card displays the interval
    const gitRepoInterval = fluxSystemCard.getByTestId('gitrepository-interval');
    await expect(gitRepoInterval).toBeVisible();
    await expect(gitRepoInterval).toContainText('1m');
  });
});

// ---------------------------------------------------------------------------
// Group 2: UI — 요약 카드 카운트
// ---------------------------------------------------------------------------

test.describe('FluxCD Tab - GitRepository List - Summary Cards', () => {
  test('should display correct counts on Ready, Not Ready, and Suspended summary cards', async ({ page }) => {
    await page.goto('/flux');
    await page.waitForLoadState('networkidle');

    // Assert: GitRepository summary cards are visible
    const summaryCardReady = page.getByTestId('summary-card-gitrepo-ready');
    await expect(summaryCardReady).toBeVisible();

    const summaryCardNotReady = page.getByTestId('summary-card-gitrepo-not-ready');
    await expect(summaryCardNotReady).toBeVisible();

    const summaryCardSuspended = page.getByTestId('summary-card-gitrepo-suspended');
    await expect(summaryCardSuspended).toBeVisible();

    // Assert: Ready count is at least 1 (flux-system fixture)
    await expect(summaryCardReady).toContainText(/[1-9]/);

    // Assert: Not Ready count is at least 1 (app-source fixture)
    await expect(summaryCardNotReady).toContainText(/[1-9]/);

    // Assert: Suspended count is at least 1 (infra-repo fixture)
    await expect(summaryCardSuspended).toContainText(/[1-9]/);
  });
});

// ---------------------------------------------------------------------------
// Group 3: UI — Loading, Empty & Error States
// ---------------------------------------------------------------------------

test.describe('FluxCD Tab - GitRepository List - Loading, Empty & Error States', () => {
  test('should display ErrorRetry component with retry button when the GitRepositories API returns an error', async ({ page }) => {
    // Arrange: Block ALL gitrepositories API calls with 500 until the flag is flipped.
    let shouldFail = true;
    await page.route('**/api/fluxcd/gitrepositories**', async route => {
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

    await page.goto('/flux');
    await page.waitForLoadState('networkidle');

    // Assert: ErrorRetry component is visible
    const errorRetry = page.getByTestId('error-retry');
    await expect(errorRetry).toBeVisible();
    await expect(errorRetry).toHaveAttribute('role', 'alert');

    // Assert: Retry button is present and enabled
    const retryButton = errorRetry.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    // Assert: No GitRepository cards are shown during error state
    const gitRepoCards = page.getByTestId('gitrepository-card');
    expect(await gitRepoCards.count()).toBe(0);

    // Act: Allow subsequent calls to succeed, then click retry
    shouldFail = false;
    await retryButton.click();
    await page.waitForLoadState('networkidle');

    // Assert: ErrorRetry is no longer visible after successful retry
    await expect(errorRetry).not.toBeVisible();
  });

  test('should display LoadingSkeleton with aria-busy="true" while GitRepositories are being fetched', async ({ page }) => {
    // Arrange: Intercept the gitrepositories API and delay the response
    await page.route('**/api/fluxcd/gitrepositories**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/flux');

    // Assert: LoadingSkeleton is visible before the response arrives
    const loadingSkeleton = page.getByTestId('loading-skeleton');
    await expect(loadingSkeleton.first()).toBeVisible();
    await expect(loadingSkeleton.first()).toHaveAttribute('aria-busy', 'true');
  });
});

// ---------------------------------------------------------------------------
// Group 4: 백엔드 API — GitRepository 목록 조회
// ---------------------------------------------------------------------------

test.describe('FluxCD API - GET /api/fluxcd/gitrepositories', () => {
  test('should return all GitRepositories across namespaces when no namespace filter is applied', async ({ request }) => {
    const response = await request.get('/api/fluxcd/gitrepositories');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThanOrEqual(3);
  });

  test('should return only GitRepositories in the specified namespace when ns query param is provided', async ({ request }) => {
    const response = await request.get('/api/fluxcd/gitrepositories?ns=dashboard-test');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThanOrEqual(1);

    for (const item of body) {
      expect(item.namespace).toBe('dashboard-test');
    }
  });

  test('should return an empty array when the namespace has no GitRepositories', async ({ request }) => {
    const response = await request.get('/api/fluxcd/gitrepositories?ns=dashboard-empty');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Group 5: UI — 카드 클릭 → 상세 화면 진입 및 URL 확인
// ---------------------------------------------------------------------------

test.describe('FluxCD Tab - GitRepository Detail - Navigation', () => {
  test('should navigate to the detail page with correct URL when a GitRepository card is clicked', async ({ page }) => {
    await gotoFluxGitRepositories(page);

    const card = await findGitRepositoryCardByName(page, 'flux-system');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    // Assert: URL navigated to the detail route
    expect(page.url()).toContain('/fluxcd/gitrepository/dashboard-test/flux-system');

    // Assert: Detail page container is visible
    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: List page is no longer visible
    const listPage = page.getByTestId('flux-page').or(page.getByTestId('fluxcd-page'));
    await expect(listPage).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 6: UI — 뒤로가기 → 목록 화면 복귀
// ---------------------------------------------------------------------------

test.describe('FluxCD Tab - GitRepository Detail - Back Navigation', () => {
  test('should return to the GitRepository list when the back button is clicked', async ({ page }) => {
    await gotoFluxGitRepositories(page);

    const card = await findGitRepositoryCardByName(page, 'flux-system');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: Back button is present
    const backButton = detailPage.getByTestId('gitrepository-detail-back-button');
    await expect(backButton).toBeVisible();

    // Act: Click the back button
    await backButton.click();
    await page.waitForLoadState('networkidle');

    // Assert: URL returned to the list route
    expect(page.url()).not.toContain('/fluxcd/gitrepository/dashboard-test/flux-system');

    // Assert: List page is visible again
    const listPage = page.getByTestId('flux-page').or(page.getByTestId('fluxcd-page'));
    await expect(listPage).toBeVisible();

    // Assert: Detail page is no longer visible
    await expect(detailPage).not.toBeVisible();

    // Assert: GitRepository cards are still displayed
    await expect(page.getByTestId('gitrepository-card').first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 7: UI — Spec 정보 표시
// ---------------------------------------------------------------------------

test.describe('FluxCD Tab - GitRepository Detail - Spec Information', () => {
  test('should display Spec fields: URL, Ref, Interval, and Suspended', async ({ page }) => {
    await gotoFluxGitRepositories(page);

    const card = await findGitRepositoryCardByName(page, 'flux-system');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: URL is displayed
    const specUrl = detailPage.getByTestId('gitrepository-detail-spec-url');
    await expect(specUrl).toBeVisible();
    await expect(specUrl).toContainText('github.com/example/flux-system');

    // Assert: Ref is displayed (branch: main)
    const specRef = detailPage.getByTestId('gitrepository-detail-spec-ref');
    await expect(specRef).toBeVisible();
    await expect(specRef).toContainText('main');

    // Assert: Interval is displayed (1m)
    const specInterval = detailPage.getByTestId('gitrepository-detail-spec-interval');
    await expect(specInterval).toBeVisible();
    await expect(specInterval).toContainText('1m');

    // Assert: Suspended field is displayed (false for flux-system)
    const specSuspended = detailPage.getByTestId('gitrepository-detail-spec-suspended');
    await expect(specSuspended).toBeVisible();
    await expect(specSuspended).toContainText('false');
  });

  test('should display Suspended=true in Spec for a suspended GitRepository', async ({ page }) => {
    await gotoFluxGitRepositories(page);

    const card = await findGitRepositoryCardByName(page, 'infra-repo');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    const specSuspended = detailPage.getByTestId('gitrepository-detail-spec-suspended');
    await expect(specSuspended).toBeVisible();
    await expect(specSuspended).toContainText('true');
  });
});

// ---------------------------------------------------------------------------
// Group 8: UI — Status 정보 표시 (Revision, Last Update)
// ---------------------------------------------------------------------------

test.describe('FluxCD Tab - GitRepository Detail - Status Information', () => {
  test('should display Revision in monospace font and Last Update time in the Status section', async ({ page }) => {
    await gotoFluxGitRepositories(page);

    const card = await findGitRepositoryCardByName(page, 'flux-system');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: Revision is displayed with the correct value
    const statusRevision = detailPage.getByTestId('gitrepository-detail-status-revision');
    await expect(statusRevision).toBeVisible();
    await expect(statusRevision).toContainText('main@sha1:abc123def456');

    // Assert: Revision element uses monospace font (font-mono class)
    await expect(statusRevision).toHaveClass(/mono/);

    // Assert: Last Update time is displayed
    const statusLastUpdate = detailPage.getByTestId('gitrepository-detail-status-last-update');
    await expect(statusLastUpdate).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 9: UI — Conditions 표시 (Type, Status badge, Reason, Message)
// ---------------------------------------------------------------------------

test.describe('FluxCD Tab - GitRepository Detail - Conditions', () => {
  test('should display each Condition with Type, Status badge, Reason, and Message', async ({ page }) => {
    await gotoFluxGitRepositories(page);

    const card = await findGitRepositoryCardByName(page, 'flux-system');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: Conditions section is visible
    const conditionsSection = detailPage.getByTestId('gitrepository-detail-conditions');
    await expect(conditionsSection).toBeVisible();

    // Assert: At least one condition row is rendered
    await expect(conditionsSection.getByTestId('gitrepository-detail-condition').first()).toBeVisible();
    const conditions = conditionsSection.getByTestId('gitrepository-detail-condition');
    expect(await conditions.count()).toBeGreaterThanOrEqual(1);

    // Assert: The Ready condition row shows correct fields
    const readyCondition = conditions.first();

    const conditionType = readyCondition.getByTestId('gitrepository-detail-condition-type');
    await expect(conditionType).toBeVisible();
    await expect(conditionType).toContainText('Ready');

    const conditionStatusBadge = readyCondition.getByTestId('gitrepository-detail-condition-status');
    await expect(conditionStatusBadge).toBeVisible();
    await expect(conditionStatusBadge).toContainText('True');

    const conditionReason = readyCondition.getByTestId('gitrepository-detail-condition-reason');
    await expect(conditionReason).toBeVisible();
    await expect(conditionReason).toContainText('Succeeded');

    const conditionMessage = readyCondition.getByTestId('gitrepository-detail-condition-message');
    await expect(conditionMessage).toBeVisible();
    await expect(conditionMessage).toContainText('stored artifact for revision');
  });

  test('should display Ready=False condition fields for a not-ready GitRepository', async ({ page }) => {
    await gotoFluxGitRepositories(page);

    const card = await findGitRepositoryCardByName(page, 'app-source');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    const conditionsSection = detailPage.getByTestId('gitrepository-detail-conditions');
    await expect(conditionsSection).toBeVisible();

    const readyCondition = conditionsSection.getByTestId('gitrepository-detail-condition').first();

    const conditionStatusBadge = readyCondition.getByTestId('gitrepository-detail-condition-status');
    await expect(conditionStatusBadge).toContainText('False');

    const conditionReason = readyCondition.getByTestId('gitrepository-detail-condition-reason');
    await expect(conditionReason).toContainText('GitOperationFailed');

    const conditionMessage = readyCondition.getByTestId('gitrepository-detail-condition-message');
    await expect(conditionMessage).toContainText('unable to clone');
  });
});

// ---------------------------------------------------------------------------
// Group 10: UI — Conditions 좌측 보더 색상 (True=green, False=red)
// ---------------------------------------------------------------------------

test.describe('FluxCD Tab - GitRepository Detail - Condition Border Colors', () => {
  test('should apply green left border to conditions with Status=True', async ({ page }) => {
    await gotoFluxGitRepositories(page);

    const card = await findGitRepositoryCardByName(page, 'flux-system');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    const conditionsSection = detailPage.getByTestId('gitrepository-detail-conditions');
    const readyCondition = conditionsSection.getByTestId('gitrepository-detail-condition').first();

    await expect(readyCondition).toHaveClass(/green/);
  });

  test('should apply red left border to conditions with Status=False', async ({ page }) => {
    await gotoFluxGitRepositories(page);

    const card = await findGitRepositoryCardByName(page, 'app-source');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    const conditionsSection = detailPage.getByTestId('gitrepository-detail-conditions');
    const notReadyCondition = conditionsSection.getByTestId('gitrepository-detail-condition').first();

    await expect(notReadyCondition).toHaveClass(/red/);
  });
});

// ---------------------------------------------------------------------------
// Group 11: UI — 상세 API 에러 시 에러 표시
// ---------------------------------------------------------------------------

test.describe('FluxCD Tab - GitRepository Detail - Error State', () => {
  test('should display ErrorRetry with retry button when the GitRepository detail API returns an error', async ({ page }) => {
    // Arrange: First call fails with 500, subsequent calls pass through to real API
    let detailCallCount = 0;
    await page.route('**/api/fluxcd/gitrepositories/dashboard-test/flux-system', async route => {
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

    await page.goto('/fluxcd/gitrepository/dashboard-test/flux-system');
    await page.waitForLoadState('networkidle');

    // Assert: Detail page container is rendered
    const detailPage = page.getByTestId('gitrepository-detail-page');
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
    const statusRevision = detailPage.getByTestId('gitrepository-detail-status-revision');
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
// Group 12: UI — Deep Linking (직접 URL 진입)
// ---------------------------------------------------------------------------

test.describe('FluxCD Tab - GitRepository Detail - Deep Linking', () => {
  test('should render gitrepository-detail-page when navigating directly to /fluxcd/gitrepository/{namespace}/{name}', async ({ page }) => {
    await page.goto('/fluxcd/gitrepository/dashboard-test/flux-system');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    const statusRevision = detailPage.getByTestId('gitrepository-detail-status-revision');
    await expect(statusRevision).toBeVisible();
    await expect(statusRevision).toContainText('main@sha1:abc123def456');
  });

  test('should navigate back to the list when back button is clicked from a deep-linked detail page', async ({ page }) => {
    await page.goto('/fluxcd/gitrepository/dashboard-test/flux-system');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    const backButton = detailPage.getByTestId('gitrepository-detail-back-button');
    await backButton.click();
    await page.waitForLoadState('networkidle');

    expect(page.url()).not.toContain('/fluxcd/gitrepository/dashboard-test/flux-system');

    const listPage = page.getByTestId('flux-page').or(page.getByTestId('fluxcd-page'));
    await expect(listPage).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 13: 백엔드 API — GET /api/fluxcd/gitrepositories/{namespace}/{name}
// ---------------------------------------------------------------------------

test.describe('FluxCD API - GET /api/fluxcd/gitrepositories/{namespace}/{name}', () => {
  test('should return 200 with full GitRepository detail for an existing resource', async ({ request }) => {
    const response = await request.get('/api/fluxcd/gitrepositories/dashboard-test/flux-system');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body.name).toBe('flux-system');
    expect(body.namespace).toBe('dashboard-test');

    // Assert: Spec fields are present
    expect(body.spec).toBeDefined();
    expect(body.spec.url).toBe('https://github.com/example/flux-system');
    expect(body.spec.interval).toBe('1m');
    expect(body.spec.ref).toBeDefined();
    expect(body.spec.ref.branch).toBe('main');

    // Assert: Status fields are present
    expect(body.status).toBeDefined();
    expect(body.status.artifact).toBeDefined();
    expect(body.status.artifact.revision).toBe('main@sha1:abc123def456');

    // Assert: Conditions array is present and has at least one entry
    expect(Array.isArray(body.status.conditions)).toBeTruthy();
    expect(body.status.conditions.length).toBeGreaterThanOrEqual(1);

    const readyCondition = body.status.conditions.find(
      (c: { type: string }) => c.type === 'Ready'
    );
    expect(readyCondition).toBeDefined();
    expect(readyCondition.status).toBe('True');
    expect(readyCondition.reason).toBe('Succeeded');
  });

  test('should return 404 when the requested GitRepository does not exist', async ({ request }) => {
    const response = await request.get('/api/fluxcd/gitrepositories/dashboard-test/non-existent-resource');

    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// Group 14: UI — Reconcile 버튼 및 상태 전환
// ---------------------------------------------------------------------------

test.describe('FluxCD Tab - GitRepository Detail - Reconcile Button', () => {
  test('should display "Reconcile Now" button on the GitRepository detail page', async ({ page }) => {
    await page.goto('/fluxcd/gitrepository/dashboard-test/flux-system');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    const reconcileButton = detailPage.getByTestId('reconcile-button');
    await expect(reconcileButton).toBeVisible();
    await expect(reconcileButton).toBeEnabled();
    await expect(reconcileButton).toContainText(/reconcile now/i);
  });

  test('should transition to "Reconciling..." loading state with spinner and disabled button after clicking "Reconcile Now"', async ({ page }) => {
    await page.route('**/api/fluxcd/gitrepositories/dashboard-test/flux-system/reconcile', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Reconciliation triggered' }),
      });
    });

    await page.goto('/fluxcd/gitrepository/dashboard-test/flux-system');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    const reconcileButton = detailPage.getByTestId('reconcile-button');
    await expect(reconcileButton).toBeEnabled();
    await reconcileButton.click();

    await expect(reconcileButton).toBeDisabled();

    const reconcileSpinner = detailPage.getByTestId('reconcile-spinner');
    await expect(reconcileSpinner).toBeVisible();

    await expect(reconcileButton).toContainText(/reconciling/i);
  });

  test('should restore button to original state and refresh detail data after a successful Reconcile', async ({ page }) => {
    let detailFetchCount = 0;
    await page.route('**/api/fluxcd/gitrepositories/dashboard-test/flux-system', async route => {
      detailFetchCount += 1;
      await route.continue();
    });

    await page.route('**/api/fluxcd/gitrepositories/dashboard-test/flux-system/reconcile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Reconciliation triggered' }),
      });
    });

    await page.goto('/fluxcd/gitrepository/dashboard-test/flux-system');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();
    const fetchCountBeforeReconcile = detailFetchCount;

    const reconcileButton = detailPage.getByTestId('reconcile-button');
    await reconcileButton.click();

    await expect(reconcileButton).toBeEnabled({ timeout: 10000 });
    await expect(reconcileButton).toContainText(/reconcile now/i);

    const reconcileSpinner = detailPage.getByTestId('reconcile-spinner');
    await expect(reconcileSpinner).not.toBeVisible();

    expect(detailFetchCount).toBeGreaterThan(fetchCountBeforeReconcile);
  });

  test('should display an error message when the Reconcile API returns an error', async ({ page }) => {
    await page.route('**/api/fluxcd/gitrepositories/dashboard-test/flux-system/reconcile', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/fluxcd/gitrepository/dashboard-test/flux-system');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    const reconcileButton = detailPage.getByTestId('reconcile-button');
    await reconcileButton.click();

    const reconcileError = detailPage.getByTestId('reconcile-error');
    await expect(reconcileError).toBeVisible();
    await expect(reconcileError).toHaveAttribute('role', 'alert');

    await expect(reconcileButton).toBeEnabled({ timeout: 10000 });
    await expect(reconcileButton).toContainText(/reconcile now/i);

    const reconcileSpinner = detailPage.getByTestId('reconcile-spinner');
    await expect(reconcileSpinner).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 15: 백엔드 API — POST /api/fluxcd/gitrepositories/{namespace}/{name}/reconcile
// ---------------------------------------------------------------------------

test.describe('FluxCD API - POST /api/fluxcd/gitrepositories/{namespace}/{name}/reconcile', () => {
  test('should return 200 and add the reconcile annotation when the GitRepository exists', async ({ request }) => {
    const response = await request.post(
      '/api/fluxcd/gitrepositories/dashboard-test/flux-system/reconcile'
    );

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body.message).toMatch(/reconcil/i);
  });

  test('should return 404 when the GitRepository resource does not exist', async ({ request }) => {
    const response = await request.post(
      '/api/fluxcd/gitrepositories/dashboard-test/non-existent-resource/reconcile'
    );

    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });
});
