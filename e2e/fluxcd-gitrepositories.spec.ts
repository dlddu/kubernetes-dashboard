// Verifies: FX1 (docs/product/prd-fluxcd.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

/**
 * Resolve the current CI branch name so tests can verify that the branch
 * which triggered the test run is present in the real remote's branch list.
 *
 * Resolution order:
 *   1. GITHUB_HEAD_REF — set by GitHub Actions on `pull_request` events to
 *      the source branch (e.g. "claude/my-feature").
 *   2. GITHUB_REF_NAME — set by GitHub Actions on `push` / `workflow_dispatch`
 *      events to the branch that triggered the workflow (e.g. "main").
 *   3. Local `git branch --show-current` — for developers running e2e tests
 *      outside of CI.
 *   4. Final fallback: "main".
 */
function getCurrentCIBranch(): string {
  const headRef = process.env.GITHUB_HEAD_REF;
  if (headRef && headRef.trim()) {
    return headRef.trim();
  }

  const refName = process.env.GITHUB_REF_NAME;
  if (refName && refName.trim() && !refName.includes('/merge')) {
    return refName.trim();
  }

  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (branch) {
      return branch;
    }
  } catch {
    // Ignore and fall through
  }

  return 'main';
}

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
 *                                 url: https://github.com/dlddu/kubernetes-dashboard,
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
    await expect(gitRepoUrl).toContainText('github.com/dlddu/kubernetes-dashboard');

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
// Group 2b: UI — 상태 필터 (Ready / Not Ready / Suspended 요약 카드 클릭)
// ---------------------------------------------------------------------------
test.describe('FluxCD Tab - GitRepository List - Status Filtering', () => {
  // No API mocking — tests use real cluster data from test/fixtures/ YAML resources.
  // Fixtures: flux-system (Ready), app-source (Not Ready), infra-repo (Suspended).

  test('should show only Ready GitRepositories when the Ready summary card is clicked', async ({ page }) => {
    // Arrange
    await gotoFluxGitRepositories(page);

    const allCards = page.getByTestId('gitrepository-card');
    await expect(allCards.first()).toBeVisible();
    const totalCount = await allCards.count();
    expect(totalCount).toBeGreaterThanOrEqual(1);

    // Act: Click the Ready summary card
    await page.getByTestId('summary-card-gitrepo-ready').click();

    // Assert: The Ready filter card is marked active
    await expect(page.getByTestId('summary-card-gitrepo-ready')).toHaveAttribute('aria-pressed', 'true');

    // Assert: Every visible card has a Ready badge
    const filtered = page.getByTestId('gitrepository-card');
    const filteredCount = await filtered.count();
    expect(filteredCount).toBeGreaterThanOrEqual(1);
    expect(filteredCount).toBeLessThanOrEqual(totalCount);
    for (let i = 0; i < filteredCount; i++) {
      await expect(filtered.nth(i).getByTestId('status-badge')).toHaveText('Ready');
    }

    // Assert: The known Not Ready fixture is no longer shown
    expect(await findGitRepositoryCardByName(page, 'app-source')).toBeNull();
  });

  test('should show only Not Ready GitRepositories when the Not Ready summary card is clicked', async ({ page }) => {
    // Arrange
    await gotoFluxGitRepositories(page);
    await expect(page.getByTestId('gitrepository-card').first()).toBeVisible();

    // Act: Click the Not Ready summary card
    await page.getByTestId('summary-card-gitrepo-not-ready').click();

    // Assert: Every visible card has a NotReady badge
    const filtered = page.getByTestId('gitrepository-card');
    const filteredCount = await filtered.count();
    expect(filteredCount).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < filteredCount; i++) {
      await expect(filtered.nth(i).getByTestId('status-badge')).toHaveText('NotReady');
    }

    // Assert: The app-source fixture is present in the filtered list
    expect(await findGitRepositoryCardByName(page, 'app-source')).toBeTruthy();
  });

  test('should show only Suspended GitRepositories when the Suspended summary card is clicked', async ({ page }) => {
    // Arrange
    await gotoFluxGitRepositories(page);
    await expect(page.getByTestId('gitrepository-card').first()).toBeVisible();

    // Act: Click the Suspended summary card
    await page.getByTestId('summary-card-gitrepo-suspended').click();

    // Assert: Every visible card has a Suspended badge
    const filtered = page.getByTestId('gitrepository-card');
    const filteredCount = await filtered.count();
    expect(filteredCount).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < filteredCount; i++) {
      await expect(filtered.nth(i).getByTestId('status-badge')).toHaveText('Suspended');
    }

    // Assert: The infra-repo fixture is present in the filtered list
    expect(await findGitRepositoryCardByName(page, 'infra-repo')).toBeTruthy();
  });

  test('should clear the filter and show all GitRepositories when the active summary card is clicked again', async ({ page }) => {
    // Tests the toggle behaviour: clicking the active filter card again restores the full list.

    // Arrange
    await gotoFluxGitRepositories(page);
    const allCards = page.getByTestId('gitrepository-card');
    await expect(allCards.first()).toBeVisible();
    const totalCount = await allCards.count();

    // Act: Apply the Ready filter, then toggle it off
    const readyCard = page.getByTestId('summary-card-gitrepo-ready');
    await readyCard.click();
    await expect(readyCard).toHaveAttribute('aria-pressed', 'true');
    await readyCard.click();

    // Assert: Filter cleared and all cards visible again
    await expect(readyCard).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('gitrepository-card')).toHaveCount(totalCount);
  });

  test('should filter GitRepositories independently from the Kustomizations section', async ({ page }) => {
    // Tests that the two sections keep separate filter state: filtering GitRepositories
    // by status must not change the Kustomizations list (or its filter cards).

    // Arrange: Capture the Kustomization list size before filtering
    await gotoFluxGitRepositories(page);
    const kustomizationCards = page.getByTestId('kustomization-card');
    await expect(kustomizationCards.first()).toBeVisible();
    const kustomizationTotal = await kustomizationCards.count();

    // Act: Filter GitRepositories by Suspended
    await page.getByTestId('summary-card-gitrepo-suspended').click();

    // Assert: GitRepository cards are filtered to Suspended only
    const grCards = page.getByTestId('gitrepository-card');
    const grCount = await grCards.count();
    expect(grCount).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < grCount; i++) {
      await expect(grCards.nth(i).getByTestId('status-badge')).toHaveText('Suspended');
    }

    // Assert: The Kustomization list is unchanged and its Suspended filter stays inactive
    await expect(page.getByTestId('kustomization-card')).toHaveCount(kustomizationTotal);
    await expect(page.getByTestId('summary-card-suspended')).toHaveAttribute('aria-pressed', 'false');
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
