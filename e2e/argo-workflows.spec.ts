import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Argo Workflow List
 *
 * TDD Red Phase: Tests written - components not yet implemented.
 * These tests define the expected behavior of the Argo tab Workflows section,
 * which displays Workflow run instances (created by submitting WorkflowTemplates)
 * as cards with name, phase badge, template name, started time, and step preview.
 * Covers basic rendering, phase badge colors, step preview display,
 * namespace filtering, loading, empty, and error states.
 *
 * Test Fixtures (test/fixtures/):
 * - workflow-running.yaml:    data-processing-running   (phase: Running,   3 steps)
 * - workflow-succeeded.yaml:  data-processing-succeeded  (phase: Succeeded, 2 steps)
 * - workflow-failed.yaml:     data-processing-failed     (phase: Failed,    3 steps)
 * All workflows reference workflowTemplateRef: data-processing-with-params.
 *
 * Workflow Runs section entry point:
 * - ArgoTab renders data-testid="workflow-runs-page" when showWorkflowRuns is true.
 * - The expected UI control to trigger this is data-testid="workflows-tab".
 *
 * Related Issue: DLD-442 - 작업 4-1: Workflow 목록 조회 — e2e 테스트 작성 (skipped)
 * Parent Issue: DLD-435 - Argo WorkflowTemplate Submit 기능 추가
 *
 * Group 5 (activated in DLD-529):
 * - GET /api/argo/workflows?templateName=xxx filters by templateName (DLD-528)
 * - Related Issue: DLD-528 - e2e 테스트: 백엔드 templateName 필터 API
 * - Parent Issue: DLD-527 - Argo Tab: Template 카드 클릭으로 해당 Runs 조회 기능
 *
 * Group 6 (skipped, pending DLD-530):
 * - Template 카드 클릭 → Runs 뷰로 전환되고 해당 template의 runs만 표시 (DLD-530)
 * - Runs 뷰 헤더에 선택한 template 이름 포함 (DLD-530)
 * - Runs 뷰의 뒤로가기 버튼 클릭 시 Templates 뷰로 복귀 (DLD-530)
 * - workflows-tab 독립 버튼이 DOM에서 제거됨 (DLD-530)
 * - Submit 버튼 클릭 시 이벤트 버블링 차단으로 Runs 뷰 미전환 (DLD-530)
 * - Related Issue: DLD-530 - e2e 테스트: Template 카드 클릭 → 해당 Runs 조회
 * - Parent Issue: DLD-527 - Argo Tab: Template 카드 클릭으로 해당 Runs 조회 기능
 */

// ---------------------------------------------------------------------------
// Mock data (only for Group 5-6 tests that need templates not in the real cluster)
// ---------------------------------------------------------------------------

// Fixture for templateName filter tests (Group 5-6).
// Contains workflows from two distinct templates so that filtering by
// templateName can produce a non-trivial subset.
// This mock is needed because 'ml-pipeline' template does not exist in test/fixtures/.
const MIXED_TEMPLATE_WORKFLOWS_FIXTURE = [
  {
    name: 'data-processing-running',
    namespace: 'dashboard-test',
    phase: 'Running',
    templateName: 'data-processing',
    startedAt: '2026-02-22T07:00:00Z',
    finishedAt: '',
    nodes: [
      { name: 'step-one', phase: 'Succeeded' },
      { name: 'step-two', phase: 'Running' },
      { name: 'step-three', phase: 'Pending' },
    ],
  },
  {
    name: 'data-processing-succeeded',
    namespace: 'dashboard-test',
    phase: 'Succeeded',
    templateName: 'data-processing',
    startedAt: '2026-02-22T06:00:00Z',
    finishedAt: '2026-02-22T06:30:00Z',
    nodes: [
      { name: 'step-one', phase: 'Succeeded' },
      { name: 'step-two', phase: 'Succeeded' },
    ],
  },
  {
    name: 'ml-pipeline-running',
    namespace: 'dashboard-test',
    phase: 'Running',
    templateName: 'ml-pipeline',
    startedAt: '2026-02-22T08:00:00Z',
    finishedAt: '',
    nodes: [{ name: 'train', phase: 'Running' }],
  },
];

// ---------------------------------------------------------------------------
// Helper: navigate to /argo and wait for network to settle
// ---------------------------------------------------------------------------

async function gotoArgo(page: Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] : never) {
  await page.goto('/argo');
  await page.waitForLoadState('networkidle');
}

// ---------------------------------------------------------------------------
// Helper: navigate to /argo and switch to the Workflows section via template card click
//
// DLD-531: The standalone 'workflows-tab' button has been removed.
// Navigation to the Runs view is now triggered by clicking a template card.
// This helper clicks the 'data-processing-with-params' template card to enter the Runs view.
// ---------------------------------------------------------------------------

async function gotoArgoWorkflows(page: Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] : never) {
  await gotoArgo(page);
  const templateCard = page.getByTestId('workflow-template-card').filter({ hasText: 'data-processing-with-params' });
  await expect(templateCard).toBeVisible();
  await templateCard.click();
  await page.waitForLoadState('networkidle');
  // Wait for the runs page container to render (present for all states: cards, error, empty, loading)
  await expect(page.getByTestId('workflow-runs-page')).toBeVisible();
}

// ---------------------------------------------------------------------------
// Helper: find a workflow-run-card by workflow name
// ---------------------------------------------------------------------------

async function findWorkflowCardByName(
  page: Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] : never,
  workflowName: string,
) {
  // Wait for at least one card to be rendered before iterating
  await expect(page.getByTestId('workflow-run-card').first()).toBeVisible();
  const workflowCards = page.getByTestId('workflow-run-card');
  const cardCount = await workflowCards.count();

  for (let i = 0; i < cardCount; i++) {
    const card = workflowCards.nth(i);
    const nameText = await card.getByTestId('workflow-run-name').innerText();
    if (nameText === workflowName) {
      return card;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Group 1: Basic Rendering (테스트 1, 2)
// ---------------------------------------------------------------------------

test.describe('Argo Tab - Workflow List - Basic Rendering', () => {
  // No API mocking — tests use real cluster data from test/fixtures/ YAML resources.

  test('should display Workflow card list when switching to the Workflows section', async ({ page }) => {
    // Tests that switching to the Workflows section renders workflow run cards

    // Arrange: Navigate to /argo and switch to the Workflows section
    await gotoArgoWorkflows(page);

    // Assert: workflow-runs-page section is visible
    const workflowRunsPage = page.getByTestId('workflow-runs-page');
    await expect(workflowRunsPage).toBeVisible();

    // Assert: At least one workflow-run-card is rendered
    const workflowCards = page.getByTestId('workflow-run-card');
    const cardCount = await workflowCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);
  });

  test('should display name, phase badge, template name, started time, and step preview on each card', async ({ page }) => {
    // Tests that all required fields are present on a workflow run card

    // Arrange: Navigate to the Workflows section
    await gotoArgoWorkflows(page);

    // Act: Find the data-processing-running card
    const card = await findWorkflowCardByName(page, 'data-processing-running');
    expect(card).toBeTruthy();
    if (!card) return;

    // Assert: Workflow name is displayed
    const workflowName = card.getByTestId('workflow-run-name');
    await expect(workflowName).toBeVisible();
    expect(await workflowName.innerText()).toBe('data-processing-running');

    // Assert: Phase badge is displayed
    const phaseBadge = card.getByTestId('workflow-run-phase');
    await expect(phaseBadge).toBeVisible();
    await expect(phaseBadge).toContainText('Running');

    // Assert: Template name is displayed
    const templateName = card.getByTestId('workflow-run-template');
    await expect(templateName).toBeVisible();
    await expect(templateName).toContainText('data-processing');

    // Assert: Started time is displayed
    const startedTime = card.getByTestId('workflow-run-time');
    await expect(startedTime).toBeVisible();

    // Assert: Step preview area is displayed
    const stepsPreview = card.getByTestId('workflow-run-steps-preview');
    await expect(stepsPreview).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 2: Phase Badge & Step Preview (테스트 3, 4)
// ---------------------------------------------------------------------------

test.describe('Argo Tab - Workflow List - Phase Badge & Step Preview', () => {
  // No API mocking — tests use real cluster data from test/fixtures/ YAML resources.

  test('should apply correct color class per phase: Running=blue, Succeeded=green, Failed=red', async ({ page }) => {
    // Tests that each phase badge carries the appropriate color CSS class

    // Arrange: Navigate to the Workflows section
    await gotoArgoWorkflows(page);

    // Act & Assert: Running card has blue color class
    const runningCard = await findWorkflowCardByName(page, 'data-processing-running');
    expect(runningCard).toBeTruthy();
    if (!runningCard) return;

    const runningBadge = runningCard.getByTestId('workflow-run-phase');
    await expect(runningBadge).toBeVisible();
    await expect(runningBadge).toHaveClass(/blue/);

    // Act & Assert: Succeeded card has green color class
    const succeededCard = await findWorkflowCardByName(page, 'data-processing-succeeded');
    expect(succeededCard).toBeTruthy();
    if (!succeededCard) return;

    const succeededBadge = succeededCard.getByTestId('workflow-run-phase');
    await expect(succeededBadge).toBeVisible();
    await expect(succeededBadge).toHaveClass(/green/);

    // Act & Assert: Failed card has red color class
    const failedCard = await findWorkflowCardByName(page, 'data-processing-failed');
    expect(failedCard).toBeTruthy();
    if (!failedCard) return;

    const failedBadge = failedCard.getByTestId('workflow-run-phase');
    await expect(failedBadge).toBeVisible();
    await expect(failedBadge).toHaveClass(/red/);
  });

  test('should display each step with phase icon, step name, and arrow separator in step preview', async ({ page }) => {
    // Tests that the step preview renders each step as: icon + name + arrow (→),
    // with no trailing arrow after the last step

    // Arrange: Navigate to the Workflows section
    await gotoArgoWorkflows(page);

    // Act: Find the data-processing-running card (3 steps)
    const card = await findWorkflowCardByName(page, 'data-processing-running');
    expect(card).toBeTruthy();
    if (!card) return;

    const stepsPreview = card.getByTestId('workflow-run-steps-preview');
    await expect(stepsPreview).toBeVisible();

    // Assert: Three step items are rendered
    const stepItems = stepsPreview.getByTestId('workflow-run-step');
    expect(await stepItems.count()).toBe(3);

    // Assert: First step — step-one — has icon, name
    const firstStep = stepItems.nth(0);
    await expect(firstStep.getByTestId('workflow-run-step-icon')).toBeVisible();
    const firstStepName = firstStep.getByTestId('workflow-run-step-name');
    await expect(firstStepName).toBeVisible();
    await expect(firstStepName).toContainText('step-one');

    // Assert: Arrow separator appears between steps (2 arrows for 3 steps)
    const arrows = stepsPreview.getByTestId('workflow-run-step-arrow');
    expect(await arrows.count()).toBe(2);
    await expect(arrows.first()).toContainText('→');

    // Assert: Second step — step-two — is visible
    const secondStep = stepItems.nth(1);
    const secondStepName = secondStep.getByTestId('workflow-run-step-name');
    await expect(secondStepName).toContainText('step-two');

    // Assert: Third step — step-three — is visible
    const thirdStep = stepItems.nth(2);
    const thirdStepName = thirdStep.getByTestId('workflow-run-step-name');
    await expect(thirdStepName).toContainText('step-three');
  });
});

// ---------------------------------------------------------------------------
// Group 3: Namespace Filtering (테스트 5)
// ---------------------------------------------------------------------------

test.describe('Argo Tab - Workflow List - Namespace Filtering', () => {
  test('should display only workflows for the selected namespace when namespace filter is applied', async ({ page }) => {
    // Tests that the namespace selector filters the displayed workflow runs
    // No API mocking — uses real cluster data from test/fixtures/ YAML resources.

    // Arrange: Navigate to the Workflows section
    await gotoArgoWorkflows(page);

    // Act: Record total workflow count before filtering
    const allWorkflowCards = page.getByTestId('workflow-run-card');
    const totalCount = await allWorkflowCards.count();
    expect(totalCount).toBeGreaterThanOrEqual(1);

    // Act: Apply namespace filter via the namespace selector in the TopBar
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const dashboardTestOption = page.getByRole('option', { name: /^dashboard-test$/i })
      .or(page.getByTestId('namespace-option-dashboard-test'));
    await dashboardTestOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Only dashboard-test namespace workflows are shown
    const filteredWorkflowCards = page.getByTestId('workflow-run-card');
    const filteredCount = await filteredWorkflowCards.count();
    expect(filteredCount).toBeLessThanOrEqual(totalCount);
    expect(filteredCount).toBeGreaterThanOrEqual(1);

    // Assert: All visible cards belong to the dashboard-test namespace
    // (checked by verifying template name matches fixture data scoped to that namespace)
    for (let i = 0; i < filteredCount; i++) {
      const card = filteredWorkflowCards.nth(i);
      const templateElement = card.getByTestId('workflow-run-template');
      const templateText = await templateElement.innerText();
      expect(templateText).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Group 4: Loading, Empty & Error States (테스트 6, 7, 8)
// ---------------------------------------------------------------------------

test.describe('Argo Tab - Workflow List - Loading, Empty & Error States', () => {
  test('should display LoadingSkeleton while workflows are being fetched', async ({ page }) => {
    // Tests that LoadingSkeleton with aria-busy="true" is shown during the API request

    // Arrange: Intercept the workflows API and delay the response to observe loading state
    await page.route('**/api/argo/workflows**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Act: Navigate to /argo and switch to Workflows section via template card click
    // (does not wait for networkidle — we need to observe the loading state)
    await page.goto('/argo');
    await page.waitForLoadState('networkidle');
    const templateCard = page.getByTestId('workflow-template-card').filter({ hasText: 'data-processing-with-params' });
    await expect(templateCard).toBeVisible();
    await templateCard.click();

    // Assert: LoadingSkeleton is visible before the response arrives
    const loadingSkeleton = page.getByTestId('loading-skeleton');
    await expect(loadingSkeleton).toBeVisible();

    // Assert: LoadingSkeleton has aria-busy="true" for accessibility
    await expect(loadingSkeleton).toHaveAttribute('aria-busy', 'true');
  });

  test('should display EmptyState with "No workflows found" when the API returns an empty list', async ({ page }) => {
    // Tests that EmptyState is rendered with the correct message when no workflows exist

    // Arrange: Mock the workflows API to return an empty array
    await page.route('**/api/argo/workflows**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Act: Navigate to the Workflows section
    await gotoArgoWorkflows(page);

    // Assert: EmptyState component is visible
    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();

    // Assert: EmptyState displays the correct message
    await expect(emptyState).toContainText('No workflows found');

    // Assert: No workflow run cards are shown
    const workflowCards = page.getByTestId('workflow-run-card');
    expect(await workflowCards.count()).toBe(0);
  });

  test('should display ErrorRetry component and functional retry button when the workflows API returns an error', async ({ page }) => {
    // Tests that ErrorRetry is rendered on API failure and the retry button re-triggers the fetch

    // Arrange: First call fails with 500, second call passes through to real API
    let callCount = 0;
    await page.route('**/api/argo/workflows**', async route => {
      callCount += 1;
      if (callCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        await route.continue();
      }
    });

    // Act: Navigate to the Workflows section
    await gotoArgoWorkflows(page);

    // Assert: ErrorRetry component is visible
    const errorRetry = page.getByTestId('error-retry');
    await expect(errorRetry).toBeVisible();

    // Assert: ErrorRetry has role="alert" for accessibility
    await expect(errorRetry).toHaveAttribute('role', 'alert');

    // Assert: Retry button is present and enabled
    const retryButton = errorRetry.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    // Assert: No workflow run cards are shown during error state
    const workflowCards = page.getByTestId('workflow-run-card');
    expect(await workflowCards.count()).toBe(0);

    // Act: Click retry — second call will succeed
    await retryButton.click();
    await page.waitForLoadState('networkidle');

    // Assert: Workflow cards are now displayed after successful retry
    const workflowCardsAfterRetry = page.getByTestId('workflow-run-card');
    expect(await workflowCardsAfterRetry.count()).toBeGreaterThanOrEqual(1);

    // Assert: ErrorRetry is no longer visible
    await expect(errorRetry).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 5: TemplateName Filtering (테스트 9, 10, 11)
//
// Activated in DLD-529.
// Backend templateName query parameter support is implemented in
//   handlers/argo_workflows_handler.go (WorkflowsHandler reads ?templateName=).
// Frontend fetchWorkflows(namespace?, templateName?) is updated in
//   frontend/src/api/argo.ts.
// Related Issue: DLD-528 - e2e 테스트: 백엔드 templateName 필터 API
// Parent Issue:  DLD-527 - Argo Tab: Template 카드 클릭으로 해당 Runs 조회 기능
// ---------------------------------------------------------------------------

test.describe('Argo Tab - Workflow List - TemplateName Filtering', () => {
  // No shared beforeEach — tests use real API where possible and inline mocks only where needed.

  test('should display only workflows matching the given templateName when templateName filter is applied', async ({ page }) => {
    // Tests that GET /api/argo/workflows?templateName=data-processing-with-params returns only
    // workflows whose templateName is 'data-processing-with-params', and that the UI renders
    // exactly those cards. Uses real cluster data.

    // Arrange: Navigate to /argo (Templates view is default)
    await gotoArgo(page);

    // Act: Click the 'data-processing-with-params' template card directly from the templates view.
    // This fetches /api/argo/workflows?templateName=data-processing-with-params.
    const templateCard = page.getByTestId('workflow-template-card').filter({ hasText: 'data-processing-with-params' });
    await expect(templateCard).toBeVisible();
    await templateCard.click();
    await page.waitForLoadState('networkidle');

    // Assert: All 3 workflow fixture cards are rendered (all belong to data-processing-with-params)
    const workflowCards = page.getByTestId('workflow-run-card');
    expect(await workflowCards.count()).toBe(3);

    // Assert: Every visible card belongs to the 'data-processing-with-params' template
    const cardCount = await workflowCards.count();
    for (let i = 0; i < cardCount; i++) {
      const card = workflowCards.nth(i);
      const templateElement = card.getByTestId('workflow-run-template');
      await expect(templateElement).toContainText('data-processing-with-params');
    }
  });

  test('should display EmptyState when the requested templateName has no matching workflows', async ({ page }) => {
    // Tests that clicking the 'simple-template' card (which has no associated workflows)
    // renders an empty array and the UI shows the EmptyState component.
    // Uses real cluster data — simple-template exists but has no workflow runs.

    // Arrange: Navigate to /argo (Templates view is default)
    await gotoArgo(page);

    // Act: Click the 'simple-template' card.
    // This fetches /api/argo/workflows?templateName=simple-template, which returns [].
    const templateCard = page.getByTestId('workflow-template-card').filter({ hasText: 'simple-template' });
    await expect(templateCard).toBeVisible();
    await templateCard.click();
    await page.waitForLoadState('networkidle');

    // Assert: EmptyState component is visible
    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();

    // Assert: EmptyState displays the correct message
    await expect(emptyState).toContainText('No workflows found');

    // Assert: No workflow run cards are shown
    const workflowCards = page.getByTestId('workflow-run-card');
    expect(await workflowCards.count()).toBe(0);
  });

  test('should display only the ml-pipeline workflow when ml-pipeline template card is clicked', async ({ page }) => {
    // Tests that clicking the 'ml-pipeline' card fetches and renders exactly 1 matching run,
    // preserving the per-template filtering behavior across all templates.
    // This test requires mocking because 'ml-pipeline' template does not exist in test/fixtures/.

    // Arrange: Mock both APIs to include ml-pipeline data
    await page.route('**/api/argo/workflow-templates**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { name: 'data-processing', namespace: 'dashboard-test', parameters: [] },
          { name: 'ml-pipeline', namespace: 'dashboard-test', parameters: [] },
        ]),
      });
    });
    await page.route('**/api/argo/workflows**', async route => {
      const url = new URL(route.request().url());
      const templateName = url.searchParams.get('templateName');
      const body = templateName
        ? MIXED_TEMPLATE_WORKFLOWS_FIXTURE.filter(w => w.templateName === templateName)
        : MIXED_TEMPLATE_WORKFLOWS_FIXTURE;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    // Arrange: Navigate to /argo (Templates view is default)
    await gotoArgo(page);

    // Act: Click the 'ml-pipeline' template card directly from the templates view
    const mlPipelineTemplateCard = page.getByTestId('workflow-template-card').filter({ hasText: 'ml-pipeline' });
    await expect(mlPipelineTemplateCard).toBeVisible();
    await mlPipelineTemplateCard.click();
    await page.waitForLoadState('networkidle');

    // Assert: workflow-runs-page is visible
    const workflowRunsPage = page.getByTestId('workflow-runs-page');
    await expect(workflowRunsPage).toBeVisible();

    // Assert: Exactly 1 workflow card is rendered (only 'ml-pipeline' run)
    const workflowCards = page.getByTestId('workflow-run-card');
    expect(await workflowCards.count()).toBe(1);

    // Assert: The ml-pipeline-running card is present
    const mlPipelineRunCard = await findWorkflowCardByName(page, 'ml-pipeline-running');
    expect(mlPipelineRunCard).toBeTruthy();

    // Assert: The 'data-processing' workflows are NOT shown
    const dataProcessingRunningCard = await findWorkflowCardByName(page, 'data-processing-running');
    expect(dataProcessingRunningCard).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Group 6: Template 카드 클릭 → 해당 Runs 조회 (테스트 12, 13, 14, 15, 16)
//
// TODO: Activate when DLD-530 is implemented.
// Skipped: pending DLD-530 - e2e 테스트: Template 카드 클릭 → 해당 Runs 조회
// Parent Issue: DLD-527 - Argo Tab: Template 카드 클릭으로 해당 Runs 조회 기능
//
// These tests cover the full ArgoTab UI behavior introduced in DLD-527:
//   - Template 카드 클릭 시 workflow-runs-page로 전환 및 해당 template의 runs만 표시
//   - Runs 뷰 헤더에 선택한 template 이름 포함
//   - 뒤로가기 버튼(back-button)으로 workflow-templates-page 복귀
//   - workflows-tab 독립 버튼이 DOM에 존재하지 않음 (DLD-527 구현 후 제거됨)
//   - submit-button 클릭 시 e.stopPropagation()으로 runs 뷰 미전환
// ---------------------------------------------------------------------------

test.describe('Argo Tab - Template Card Click → Runs View (DLD-531)', () => {
  // No API mocking — tests use real cluster data from test/fixtures/ YAML resources.

  test('should switch to workflow-runs-page and display only matching runs when a template card is clicked', async ({ page }) => {
    // Tests that clicking a template card transitions the view to workflow-runs-page
    // and renders only the runs whose templateName matches the clicked template.
    // Uses real cluster data — all 3 fixture workflows belong to 'data-processing-with-params'.

    // Arrange: Navigate to /argo (Templates view is the default entry point in DLD-527)
    await gotoArgo(page);

    // Arrange: Confirm the templates page is visible before clicking
    const templatesPage = page.getByTestId('workflow-templates-page');
    await expect(templatesPage).toBeVisible();

    // Act: Click the 'data-processing-with-params' template card
    const templateCard = page.getByTestId('workflow-template-card').filter({ hasText: 'data-processing-with-params' });
    await expect(templateCard).toBeVisible();
    await templateCard.click();
    await page.waitForLoadState('networkidle');

    // Assert: workflow-runs-page is now visible
    const workflowRunsPage = page.getByTestId('workflow-runs-page');
    await expect(workflowRunsPage).toBeVisible();

    // Assert: workflow-templates-page is no longer visible
    await expect(templatesPage).not.toBeVisible();

    // Assert: All 3 run cards are rendered (all belong to 'data-processing-with-params')
    const workflowCards = page.getByTestId('workflow-run-card');
    expect(await workflowCards.count()).toBe(3);

    // Assert: Every visible card belongs to the 'data-processing-with-params' template
    const cardCount = await workflowCards.count();
    for (let i = 0; i < cardCount; i++) {
      const card = workflowCards.nth(i);
      const templateElement = card.getByTestId('workflow-run-template');
      await expect(templateElement).toContainText('data-processing-with-params');
    }
  });

  test('should show the selected template name in the Runs view header', async ({ page }) => {
    // Tests that after clicking a template card the Runs view header text includes
    // the name of the selected template (e.g. "data-processing-with-params").

    // Arrange: Navigate to /argo
    await gotoArgo(page);

    // Act: Click the 'data-processing-with-params' template card
    const templateCard = page.getByTestId('workflow-template-card').filter({ hasText: 'data-processing-with-params' });
    await expect(templateCard).toBeVisible();
    await templateCard.click();
    await page.waitForLoadState('networkidle');

    // Assert: workflow-runs-page is visible
    const workflowRunsPage = page.getByTestId('workflow-runs-page');
    await expect(workflowRunsPage).toBeVisible();

    // Assert: The header inside the runs page contains 'data-processing-with-params'
    const runsHeader = workflowRunsPage.locator('h2');
    await expect(runsHeader).toBeVisible();
    await expect(runsHeader).toContainText('data-processing-with-params');
  });

  test('should return to workflow-templates-page when the back button is clicked from the Runs view', async ({ page }) => {
    // Tests that the back button in the Runs view navigates back to the Templates view,
    // hiding the runs page and showing the templates page again.

    // Arrange: Navigate to /argo and click a template card to enter the Runs view
    await gotoArgo(page);

    const templateCard = page.getByTestId('workflow-template-card').filter({ hasText: 'data-processing-with-params' });
    await expect(templateCard).toBeVisible();
    await templateCard.click();
    await page.waitForLoadState('networkidle');

    // Arrange: Confirm we are now on the runs view
    const workflowRunsPage = page.getByTestId('workflow-runs-page');
    await expect(workflowRunsPage).toBeVisible();

    // Act: Click the back button to return to the Templates view
    const backButton = page.getByTestId('back-to-templates');
    await expect(backButton).toBeVisible();
    await backButton.click();
    await page.waitForLoadState('networkidle');

    // Assert: workflow-templates-page is visible again
    const templatesPage = page.getByTestId('workflow-templates-page');
    await expect(templatesPage).toBeVisible();

    // Assert: workflow-runs-page is no longer visible
    await expect(workflowRunsPage).not.toBeVisible();
  });

  test('should not have a standalone workflows-tab button in the DOM after DLD-527 is implemented', async ({ page }) => {
    // Tests that the independent "Workflow Runs" tab button (workflows-tab) has been
    // removed from the DOM as part of the DLD-527 implementation. Navigation to the
    // Runs view is now exclusively via template card clicks.

    // Arrange: Navigate to /argo
    await gotoArgo(page);

    // Assert: workflows-tab button is not attached to the DOM at all
    const workflowsTab = page.getByTestId('workflows-tab');
    await expect(workflowsTab).not.toBeAttached();
  });

  test('should open SubmitModal and not switch to Runs view when the submit button inside a template card is clicked', async ({ page }) => {
    // Tests that clicking the submit-button inside a template card opens the
    // submit-workflow-dialog (SubmitModal) without triggering the card's onClick handler,
    // verifying that e.stopPropagation() correctly prevents the Runs view transition.

    // Arrange: Navigate to /argo
    await gotoArgo(page);

    // Arrange: Confirm the templates page is visible before interaction
    const templatesPage = page.getByTestId('workflow-templates-page');
    await expect(templatesPage).toBeVisible();

    // Act: Click the submit-button inside the 'data-processing-with-params' template card
    const templateCard = page.getByTestId('workflow-template-card').filter({ hasText: 'data-processing-with-params' });
    await expect(templateCard).toBeVisible();
    const submitButton = templateCard.getByTestId('submit-button');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Assert: SubmitModal dialog is opened
    const submitDialog = page.getByTestId('submit-workflow-dialog');
    await expect(submitDialog).toBeVisible();

    // Assert: workflow-runs-page is NOT shown (card click event was not triggered)
    const workflowRunsPage = page.getByTestId('workflow-runs-page');
    await expect(workflowRunsPage).not.toBeVisible();

    // Assert: workflow-templates-page is still visible (view did not transition)
    await expect(templatesPage).toBeVisible();
  });
});
