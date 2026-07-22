// Verifies: FX6 (docs/product/prd-fluxcd.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

async function gotoFluxGitRepositories(page: PageParam) {
  await page.goto('/flux');
  await page.waitForLoadState('networkidle');
  await expect(
    page.getByTestId('flux-page').or(page.getByTestId('fluxcd-page'))
  ).toBeVisible();
}

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

async function gotoFluxKustomizations(page: PageParam) {
  await page.goto('/flux');
  await page.waitForLoadState('networkidle');
  await expect(
    page.getByTestId('flux-page').or(page.getByTestId('fluxcd-page'))
  ).toBeVisible();
}

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
    await expect(specUrl).toContainText('github.com/dlddu/kubernetes-dashboard');

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
    expect(body.spec.url).toBe('https://github.com/dlddu/kubernetes-dashboard');
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

// ===========================================================================
// DLD-746: Kustomization 상세 조회 — E2E 테스트 (all skipped)
// ===========================================================================

// ---------------------------------------------------------------------------
// Group 6: UI — 카드 클릭 → 상세 화면 진입 및 URL 확인 (테스트 11)
// TODO: Activate when DLD-746 is implemented.
// Activation: Remove test.describe.skip() when KustomizationDetail component is ready.
// ---------------------------------------------------------------------------
test.describe('FluxCD Tab - Kustomization Detail - Navigation', () => {
  // No API mocking — tests use real cluster data from test/fixtures/ YAML resources.

  test('should navigate to the detail page with correct URL when a Kustomization card is clicked', async ({ page }) => {
    // Tests that clicking a kustomization-card navigates to /fluxcd/kustomization/{namespace}/{name}
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
    expect(page.url()).toContain('/fluxcd/kustomization/dashboard-test/app-ready');

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
test.describe('FluxCD Tab - Kustomization Detail - Back Navigation', () => {
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
    expect(page.url()).not.toContain('/fluxcd/kustomization/dashboard-test/app-ready');

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
test.describe('FluxCD Tab - Kustomization Detail - Spec Information', () => {
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
test.describe('FluxCD Tab - Kustomization Detail - Status Information', () => {
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
test.describe('FluxCD Tab - Kustomization Detail - Conditions', () => {
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
test.describe('FluxCD Tab - Kustomization Detail - Condition Border Colors', () => {
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
test.describe('FluxCD Tab - Kustomization Detail - Error State', () => {
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
    await page.goto('/fluxcd/kustomization/dashboard-test/app-ready');
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
test.describe('FluxCD Tab - Kustomization Detail - Deep Linking', () => {
  // No API mocking — tests use real cluster data from test/fixtures/ YAML resources.

  test('should render kustomization-detail-page when navigating directly to /fluxcd/kustomization/{namespace}/{name}', async ({ page }) => {
    // Tests that navigating directly to the detail URL renders the detail page
    // without requiring the user to first visit the list.
    // Fixture: app-ready (namespace: dashboard-test)

    // Act: Navigate directly to the detail page
    await page.goto('/fluxcd/kustomization/dashboard-test/app-ready');
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
    await page.goto('/fluxcd/kustomization/dashboard-test/app-ready');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    // Act: Click the back button
    const backButton = detailPage.getByTestId('kustomization-detail-back-button');
    await backButton.click();
    await page.waitForLoadState('networkidle');

    // Assert: URL no longer points to the detail route
    expect(page.url()).not.toContain('/fluxcd/kustomization/dashboard-test/app-ready');

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
test.describe('FluxCD API - GET /api/fluxcd/kustomizations/{namespace}/{name}', () => {
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
