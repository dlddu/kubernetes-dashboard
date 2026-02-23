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
 * Test Fixtures (API mock, endpoint not yet implemented):
 * - GET /api/argo/workflows returns WORKFLOWS_FIXTURE (3 workflows)
 *   - data-processing-running  (namespace: dashboard-test, phase: Running,   3 steps)
 *   - data-processing-succeeded (namespace: dashboard-test, phase: Succeeded, 2 steps)
 *   - data-processing-failed   (namespace: dashboard-test, phase: Failed,    3 steps)
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
 */

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------

// Fixture for templateName filter tests (Group 5).
// Extends WORKFLOWS_FIXTURE with a workflow from a different template
// so that filtering by templateName can produce a non-trivial subset.
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

const WORKFLOWS_FIXTURE = [
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
    name: 'data-processing-failed',
    namespace: 'dashboard-test',
    phase: 'Failed',
    templateName: 'data-processing',
    startedAt: '2026-02-22T05:00:00Z',
    finishedAt: '2026-02-22T05:45:00Z',
    nodes: [
      { name: 'step-one', phase: 'Succeeded' },
      { name: 'step-two', phase: 'Failed' },
      { name: 'step-three', phase: 'Omitted' },
    ],
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
// Helper: navigate to /argo and switch to the Workflows section via the tab button
// ---------------------------------------------------------------------------

async function gotoArgoWorkflows(page: Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] : never) {
  await gotoArgo(page);
  const workflowsTab = page.getByTestId('workflows-tab');
  await expect(workflowsTab).toBeVisible();
  await workflowsTab.click();
  await page.waitForLoadState('networkidle');
}

// ---------------------------------------------------------------------------
// Helper: find a workflow-run-card by workflow name
// ---------------------------------------------------------------------------

async function findWorkflowCardByName(
  page: Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] : never,
  workflowName: string,
) {
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
  test.beforeEach(async ({ page }) => {
    // Mock the workflows API so tests are not reliant on cluster state
    await page.route('**/api/argo/workflows**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WORKFLOWS_FIXTURE),
      });
    });
  });

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
  test.beforeEach(async ({ page }) => {
    // Mock the workflows API so tests are not reliant on cluster state
    await page.route('**/api/argo/workflows**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WORKFLOWS_FIXTURE),
      });
    });
  });

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

    // Arrange: Mock the workflows API to return all fixture workflows
    await page.route('**/api/argo/workflows**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WORKFLOWS_FIXTURE),
      });
    });

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

    // Act: Navigate to /argo and switch to Workflows section (does not wait for networkidle)
    await page.goto('/argo');
    const workflowsTab = page.getByTestId('workflows-tab');
    await expect(workflowsTab).toBeVisible();
    await workflowsTab.click();

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

    // Arrange: First call fails with 500, second call succeeds with fixture data
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
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(WORKFLOWS_FIXTURE),
        });
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
  test.beforeEach(async ({ page }) => {
    // Mock the workflows API with conditional response based on the templateName query parameter.
    // MIXED_TEMPLATE_WORKFLOWS_FIXTURE contains two distinct templateNames:
    //   - 'data-processing' (2 workflows: data-processing-running, data-processing-succeeded)
    //   - 'ml-pipeline'     (1 workflow:  ml-pipeline-running)
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
  });

  test('should display only workflows matching the given templateName when templateName filter is applied', async ({ page }) => {
    // Tests that GET /api/argo/workflows?templateName=data-processing returns only
    // workflows whose templateName is 'data-processing', and that the UI renders
    // exactly those cards.

    // Arrange: Navigate to the Workflows section
    await gotoArgoWorkflows(page);

    // Act: The UI applies the templateName filter by clicking a template card.
    // Clicking the template card named 'data-processing' should cause the page to
    // fetch /api/argo/workflows?templateName=data-processing.
    const templateCard = page.getByTestId('workflow-template-card').filter({ hasText: 'data-processing' });
    await expect(templateCard).toBeVisible();
    await templateCard.click();
    await page.waitForLoadState('networkidle');

    // Assert: Only 'data-processing' workflow cards are rendered (2 out of 3 in fixture)
    const workflowCards = page.getByTestId('workflow-run-card');
    expect(await workflowCards.count()).toBe(2);

    // Assert: Every visible card belongs to the 'data-processing' template
    const cardCount = await workflowCards.count();
    for (let i = 0; i < cardCount; i++) {
      const card = workflowCards.nth(i);
      const templateElement = card.getByTestId('workflow-run-template');
      await expect(templateElement).toContainText('data-processing');
    }

    // Assert: The 'ml-pipeline' workflow is NOT shown
    const mlPipelineCard = await findWorkflowCardByName(page, 'ml-pipeline-running');
    expect(mlPipelineCard).toBeNull();
  });

  test('should display EmptyState when the requested templateName has no matching workflows', async ({ page }) => {
    // Tests that GET /api/argo/workflows?templateName=nonexistent returns an empty array
    // and that the UI renders the EmptyState component.

    // Arrange: Navigate to the Workflows section
    await gotoArgoWorkflows(page);

    // Act: The UI requests a templateName that does not exist in the backend.
    // Clicking a template card named 'nonexistent-template' should fetch
    // /api/argo/workflows?templateName=nonexistent-template, which returns [].
    const templateCard = page.getByTestId('workflow-template-card').filter({ hasText: 'nonexistent-template' });
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

  test('should display all workflows when no templateName filter is active', async ({ page }) => {
    // Tests that GET /api/argo/workflows (without templateName parameter) returns the full
    // workflow list and the UI renders all cards — preserving the existing behavior.

    // Arrange: Navigate to the Workflows section without selecting any template card
    await gotoArgoWorkflows(page);

    // Assert: All 3 workflows from MIXED_TEMPLATE_WORKFLOWS_FIXTURE are shown
    const workflowCards = page.getByTestId('workflow-run-card');
    expect(await workflowCards.count()).toBe(3);

    // Assert: Both 'data-processing' and 'ml-pipeline' cards are present
    const dataProcessingRunningCard = await findWorkflowCardByName(page, 'data-processing-running');
    expect(dataProcessingRunningCard).toBeTruthy();

    const dataProcessingSucceededCard = await findWorkflowCardByName(page, 'data-processing-succeeded');
    expect(dataProcessingSucceededCard).toBeTruthy();

    const mlPipelineCard = await findWorkflowCardByName(page, 'ml-pipeline-running');
    expect(mlPipelineCard).toBeTruthy();
  });
});
