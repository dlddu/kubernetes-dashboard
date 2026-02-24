import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Argo Workflow Detail View
 *
 * TDD Red Phase: Tests written — WorkflowDetail component not yet implemented.
 * These tests define the expected behavior of the Workflow detail screen,
 * which is displayed when a user clicks a WorkflowCard in the Workflows list.
 * The detail screen shows the workflow header (name, phase badge, start/end times),
 * a collapsible Parameters section, and a Steps timeline where each step shows
 * its name, phase badge, time, optional step message, and an Inputs/Outputs toggle
 * (only for steps that have inputs or outputs). The Inputs panel is purple and the
 * Outputs panel is green. A "Back to Workflows" button returns the user to the list.
 * Loading and error states are also tested.
 *
 * Test Fixtures (test/fixtures/):
 * - GET /api/argo/workflows returns workflows from cluster
 * - GET /api/argo/workflows/:name  returns single workflow detail with IO
 *   - data-processing-running  (namespace: dashboard-test, phase: Running)
 *     - step-one   Succeeded — has inputs (input-path=/data/input) and outputs (result=done)
 *     - step-two   Running   — has inputs only (input-path=/data/output), no outputs
 *     - step-three Pending   — no inputs, no outputs
 *   - data-processing-failed (namespace: dashboard-test, phase: Failed)
 *     - step-one Succeeded — has inputs + outputs
 *     - step-two Failed    — has inputs, no outputs; message: 'Health check failed...'
 *     - step-three Omitted — no inputs, no outputs
 *
 * WorkflowDetail is rendered when a WorkflowCard is clicked.
 * Expected navigation model: clicking a WorkflowCard inside workflow-runs-page
 * transitions to data-testid="workflow-detail-page" (same-page view swap, no URL change).
 * "Back to Workflows" returns to data-testid="workflow-runs-page".
 *
 * Related Issue: DLD-445 - 작업 5-1: Workflow 상세 (step IO) — e2e 테스트 작성 (skipped)
 * Parent Issue:  DLD-435 - Argo WorkflowTemplate Submit 기능 추가
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type PageParam = Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] : never;

/**
 * Navigate to /argo, switch to the Workflows section, and wait for cards to appear.
 *
 * DLD-531: The standalone 'workflows-tab' button has been removed.
 * To navigate to the runs view, click the first template card instead.
 */
async function gotoArgoWorkflows(page: PageParam) {
  await page.goto('/argo');
  await page.waitForLoadState('networkidle');
  // Click the first workflow template card to navigate to its runs view
  const templateCards = page.getByTestId('workflow-template-card');
  await expect(templateCards.first()).toBeVisible();
  await templateCards.first().click();
  await page.waitForLoadState('networkidle');
}

/**
 * Find a workflow-run-card by workflow name.
 * Returns the card locator or null if not found.
 */
async function findWorkflowCardByName(page: PageParam, workflowName: string) {
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

/**
 * Find a workflow-detail-step by step name within the detail page.
 * Returns the step locator or null if not found.
 */
async function findDetailStepByName(page: PageParam, stepName: string) {
  const steps = page.getByTestId('workflow-detail-step');
  const count = await steps.count();

  for (let i = 0; i < count; i++) {
    const step = steps.nth(i);
    const nameText = await step.getByTestId('workflow-detail-step-name').innerText();
    if (nameText === stepName) {
      return step;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Group 1: Navigation — WorkflowCard click → WorkflowDetail (테스트 1)
// ---------------------------------------------------------------------------

test.describe('Argo Tab - Workflow Detail - Navigation', () => {
  // TODO: Activate when DLD-445 is implemented
  test('should navigate to WorkflowDetail when a WorkflowCard is clicked', async ({ page }) => {
    // Tests that clicking a WorkflowCard in the Workflow list transitions to the detail view.

    // Arrange: Navigate to the Workflows section
    await gotoArgoWorkflows(page);

    // Assert: Workflow list is visible
    const workflowRunsPage = page.getByTestId('workflow-runs-page');
    await expect(workflowRunsPage).toBeVisible();

    // Act: Click the data-processing-running card
    const card = await findWorkflowCardByName(page, 'data-processing-running');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    // Assert: WorkflowDetail page is now visible
    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: Workflow list is no longer visible (view swap)
    await expect(workflowRunsPage).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 2: Header content — name, phase badge, start/end times (테스트 2)
// ---------------------------------------------------------------------------

test.describe('Argo Tab - Workflow Detail - Header', () => {
  // TODO: Activate when DLD-445 is implemented
  test('should display workflow name, phase badge, and start/end times in the header', async ({ page }) => {
    // Tests that the WorkflowDetail header shows the workflow name, phase badge,
    // started time, and finished time (or dash when not finished).

    // Arrange: Navigate to the Workflows section and open detail
    await gotoArgoWorkflows(page);

    const card = await findWorkflowCardByName(page, 'data-processing-running');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: Workflow name is displayed in the header
    const headerName = detailPage.getByTestId('workflow-detail-name');
    await expect(headerName).toBeVisible();
    await expect(headerName).toContainText('data-processing-running');

    // Assert: Phase badge is displayed with the correct phase text
    const phaseBadge = detailPage.getByTestId('workflow-detail-phase');
    await expect(phaseBadge).toBeVisible();
    await expect(phaseBadge).toContainText('Running');

    // Assert: Phase badge has blue color class (Running = blue)
    await expect(phaseBadge).toHaveClass(/blue/);

    // Assert: Started time is displayed
    const startedTime = detailPage.getByTestId('workflow-detail-started-at');
    await expect(startedTime).toBeVisible();

    // Assert: Finished time area is displayed (shows '-' for running workflow)
    const finishedTime = detailPage.getByTestId('workflow-detail-finished-at');
    await expect(finishedTime).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 3: Parameters section — toggle expand/collapse (테스트 3)
// ---------------------------------------------------------------------------

test.describe('Argo Tab - Workflow Detail - Parameters Toggle', () => {
  // TODO: Activate when DLD-445 is implemented
  test('should expand and collapse the Parameters section when the toggle is clicked', async ({ page }) => {
    // Tests that the Parameters toggle button shows/hides the parameter list.
    // The initial state is collapsed; clicking once expands it; clicking again collapses it.

    // Arrange: Open the workflow detail
    await gotoArgoWorkflows(page);

    const card = await findWorkflowCardByName(page, 'data-processing-running');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: Parameters toggle button is present
    const paramsToggle = detailPage.getByTestId('workflow-detail-params-toggle');
    await expect(paramsToggle).toBeVisible();

    // Assert: Parameter list is initially not visible (collapsed)
    const paramsList = detailPage.getByTestId('workflow-detail-params-list');
    await expect(paramsList).not.toBeVisible();

    // Act: Click the toggle to expand
    await paramsToggle.click();

    // Assert: Parameter list is now visible (expanded)
    await expect(paramsList).toBeVisible();

    // Assert: Parameter items are rendered (input-path=/data/input from fixture)
    const paramItems = paramsList.getByTestId('workflow-detail-param-item');
    await expect(paramItems.first()).toBeVisible();
    await expect(paramItems.first()).toContainText('input-path');
    await expect(paramItems.first()).toContainText('/data/input');

    // Act: Click the toggle again to collapse
    await paramsToggle.click();

    // Assert: Parameter list is hidden again
    await expect(paramsList).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 4: Steps timeline — step name, phase badge, time (테스트 4)
// ---------------------------------------------------------------------------

test.describe('Argo Tab - Workflow Detail - Steps Timeline', () => {
  // TODO: Activate when DLD-445 is implemented
  test('should display each step with name, phase badge, and time in the Steps timeline', async ({ page }) => {
    // Tests that the Steps timeline renders each step entry with:
    // - step name (data-testid="workflow-detail-step-name")
    // - phase badge (data-testid="workflow-detail-step-phase")
    // - started/finished time (data-testid="workflow-detail-step-time")

    // Arrange: Open the workflow detail for data-processing-running (3 steps)
    await gotoArgoWorkflows(page);

    const card = await findWorkflowCardByName(page, 'data-processing-running');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: Steps timeline section is visible
    const stepsTimeline = detailPage.getByTestId('workflow-detail-steps-timeline');
    await expect(stepsTimeline).toBeVisible();

    // Assert: Three step entries are rendered
    const stepEntries = stepsTimeline.getByTestId('workflow-detail-step');
    expect(await stepEntries.count()).toBe(3);

    // Assert: step-one (Succeeded) has correct name, phase badge, and time
    const stepOne = await findDetailStepByName(page, 'step-one');
    expect(stepOne).toBeTruthy();
    if (!stepOne) return;

    const stepOneName = stepOne.getByTestId('workflow-detail-step-name');
    await expect(stepOneName).toBeVisible();
    await expect(stepOneName).toContainText('step-one');

    const stepOnePhaseBadge = stepOne.getByTestId('workflow-detail-step-phase');
    await expect(stepOnePhaseBadge).toBeVisible();
    await expect(stepOnePhaseBadge).toContainText('Succeeded');
    await expect(stepOnePhaseBadge).toHaveClass(/green/);

    const stepOneTime = stepOne.getByTestId('workflow-detail-step-time');
    await expect(stepOneTime).toBeVisible();

    // Assert: step-two (Running) has blue phase badge
    const stepTwo = await findDetailStepByName(page, 'step-two');
    expect(stepTwo).toBeTruthy();
    if (!stepTwo) return;

    const stepTwoPhaseBadge = stepTwo.getByTestId('workflow-detail-step-phase');
    await expect(stepTwoPhaseBadge).toContainText('Running');
    await expect(stepTwoPhaseBadge).toHaveClass(/blue/);

    // Assert: step-three (Pending) is visible
    const stepThree = await findDetailStepByName(page, 'step-three');
    expect(stepThree).toBeTruthy();
    if (!stepThree) return;

    const stepThreePhaseBadge = stepThree.getByTestId('workflow-detail-step-phase');
    await expect(stepThreePhaseBadge).toContainText('Pending');
  });
});

// ---------------------------------------------------------------------------
// Group 5: IO toggle visibility — only steps with IO show the toggle (테스트 5, 8)
// ---------------------------------------------------------------------------

test.describe('Argo Tab - Workflow Detail - IO Toggle Visibility', () => {
  // TODO: Activate when DLD-445 is implemented
  test("should display 'Inputs / Outputs' toggle button for steps that have inputs or outputs", async ({ page }) => {
    // Tests that the IO toggle button (data-testid="workflow-detail-step-io-toggle")
    // is rendered only for steps that have at least one input or output parameter/artifact.
    // - step-one: has inputs + outputs → toggle visible
    // - step-two: has inputs only    → toggle visible
    // - step-three: no inputs, no outputs → toggle NOT visible

    // Arrange: Open the workflow detail
    await gotoArgoWorkflows(page);

    const card = await findWorkflowCardByName(page, 'data-processing-running');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: step-one has the IO toggle button
    const stepOne = await findDetailStepByName(page, 'step-one');
    expect(stepOne).toBeTruthy();
    if (!stepOne) return;
    const stepOneIoToggle = stepOne.getByTestId('workflow-detail-step-io-toggle');
    await expect(stepOneIoToggle).toBeVisible();
    await expect(stepOneIoToggle).toContainText('Inputs / Outputs');

    // Assert: step-two has the IO toggle button (inputs only is still enough)
    const stepTwo = await findDetailStepByName(page, 'step-two');
    expect(stepTwo).toBeTruthy();
    if (!stepTwo) return;
    const stepTwoIoToggle = stepTwo.getByTestId('workflow-detail-step-io-toggle');
    await expect(stepTwoIoToggle).toBeVisible();
  });

  test('should NOT display IO toggle button for steps that have no inputs and no outputs', async ({ page }) => {
    // Tests that step-three (Pending, no inputs, no outputs) does not render
    // the IO toggle button at all.

    // Arrange: Open the workflow detail
    await gotoArgoWorkflows(page);

    const card = await findWorkflowCardByName(page, 'data-processing-running');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: step-three does NOT have the IO toggle button
    const stepThree = await findDetailStepByName(page, 'step-three');
    expect(stepThree).toBeTruthy();
    if (!stepThree) return;
    const stepThreeIoToggle = stepThree.getByTestId('workflow-detail-step-io-toggle');
    await expect(stepThreeIoToggle).not.toBeAttached();
  });
});

// ---------------------------------------------------------------------------
// Group 6 & 7: IO panel content — Inputs (purple) and Outputs (green) (테스트 6, 7)
// ---------------------------------------------------------------------------

test.describe('Argo Tab - Workflow Detail - IO Panel Content', () => {
  // TODO: Activate when DLD-445 is implemented
  test('should display purple Inputs panel with parameters (key=value) and artifacts (name, path, from)', async ({ page }) => {
    // Tests that clicking the IO toggle on step-one of data-processing-failed reveals
    // the Inputs panel with:
    //   - purple color class (data-testid="workflow-detail-step-inputs-panel")
    //   - input parameter: input-path = /data/input
    //   - input artifact:  raw-data, path=/data/raw, from=s3://bucket/raw

    // Arrange: Open the workflow detail for data-processing-failed
    await gotoArgoWorkflows(page);

    const card = await findWorkflowCardByName(page, 'data-processing-failed');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    // Act: Click the IO toggle on step-one to expand the IO panel
    const stepOne = await findDetailStepByName(page, 'step-one');
    expect(stepOne).toBeTruthy();
    if (!stepOne) return;

    const ioToggle = stepOne.getByTestId('workflow-detail-step-io-toggle');
    await expect(ioToggle).toBeVisible();
    await ioToggle.click();

    // Assert: Inputs panel is visible and has purple color class
    const inputsPanel = stepOne.getByTestId('workflow-detail-step-inputs-panel');
    await expect(inputsPanel).toBeVisible();
    await expect(inputsPanel).toHaveClass(/purple/);

    // Assert: Input parameter row shows key=value format
    const inputParams = inputsPanel.getByTestId('workflow-detail-io-param');
    await expect(inputParams.first()).toBeVisible();
    await expect(inputParams.first()).toContainText('input-path');
    await expect(inputParams.first()).toContainText('/data/input');

    // Assert: Input artifact row shows name, path, and from
    const inputArtifacts = inputsPanel.getByTestId('workflow-detail-io-artifact');
    await expect(inputArtifacts.first()).toBeVisible();
    await expect(inputArtifacts.first()).toContainText('raw-data');
    await expect(inputArtifacts.first()).toContainText('/data/raw');
    await expect(inputArtifacts.first()).toContainText('s3://bucket/raw');
  });

  test('should display green Outputs panel with parameters (key=value) and artifacts (name, path, size)', async ({ page }) => {
    // Tests that the Outputs panel shows:
    //   - green color class (data-testid="workflow-detail-step-outputs-panel")
    //   - output parameter: result = done
    //   - output artifact:  processed-data, path=/data/processed, size=1.2MB

    // Arrange: Open the workflow detail for data-processing-failed
    await gotoArgoWorkflows(page);

    const card = await findWorkflowCardByName(page, 'data-processing-failed');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    // Act: Expand IO panel on step-one
    const stepOne = await findDetailStepByName(page, 'step-one');
    expect(stepOne).toBeTruthy();
    if (!stepOne) return;

    const ioToggle = stepOne.getByTestId('workflow-detail-step-io-toggle');
    await ioToggle.click();

    // Assert: Outputs panel is visible and has green color class
    const outputsPanel = stepOne.getByTestId('workflow-detail-step-outputs-panel');
    await expect(outputsPanel).toBeVisible();
    await expect(outputsPanel).toHaveClass(/green/);

    // Assert: Output parameter row shows key=value format
    const outputParams = outputsPanel.getByTestId('workflow-detail-io-param');
    await expect(outputParams.first()).toBeVisible();
    await expect(outputParams.first()).toContainText('result');
    await expect(outputParams.first()).toContainText('done');

    // Assert: Output artifact row shows name, path, and size
    const outputArtifacts = outputsPanel.getByTestId('workflow-detail-io-artifact');
    await expect(outputArtifacts.first()).toBeVisible();
    await expect(outputArtifacts.first()).toContainText('processed-data');
    await expect(outputArtifacts.first()).toContainText('/data/processed');
    await expect(outputArtifacts.first()).toContainText('1.2MB');
  });
});

// ---------------------------------------------------------------------------
// Group 8 (reuses Group 5 — IO toggle visibility for no-IO steps)
// Already covered in Group 5, test 8. No duplicate test needed.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Group 9: Step message display (테스트 9)
// ---------------------------------------------------------------------------

test.describe('Argo Tab - Workflow Detail - Step Message', () => {
  // TODO: Activate when DLD-445 is implemented
  test('should display step message when the step has a non-empty message', async ({ page }) => {
    // Tests that a step with a non-empty message field renders the message text
    // below the step header. Two fixtures are verified:
    // - step-two of data-processing-running: 'Processing batch 42/100'
    // - step-two of data-processing-failed:  'Health check failed...'
    // Steps without a message should not render the message element.

    // --- Scenario A: Running workflow step with progress message ---
    await gotoArgoWorkflows(page);

    const runningCard = await findWorkflowCardByName(page, 'data-processing-running');
    expect(runningCard).toBeTruthy();
    if (!runningCard) return;
    await runningCard.click();
    await page.waitForLoadState('networkidle');

    let detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: step-two shows 'Processing batch 42/100'
    const stepTwoRunning = await findDetailStepByName(page, 'step-two');
    expect(stepTwoRunning).toBeTruthy();
    if (!stepTwoRunning) return;

    const stepTwoMessage = stepTwoRunning.getByTestId('workflow-detail-step-message');
    await expect(stepTwoMessage).toBeVisible();
    await expect(stepTwoMessage).toContainText('Processing batch 42/100');

    // Assert: step-one (no message) does NOT render the message element
    const stepOneRunning = await findDetailStepByName(page, 'step-one');
    expect(stepOneRunning).toBeTruthy();
    if (!stepOneRunning) return;
    const stepOneMessage = stepOneRunning.getByTestId('workflow-detail-step-message');
    await expect(stepOneMessage).not.toBeAttached();

    // --- Scenario B: Failed workflow step with error message ---
    // Navigate back to the list
    const backButton = detailPage.getByTestId('workflow-detail-back-button');
    await backButton.click();
    await page.waitForLoadState('networkidle');

    const workflowRunsPage = page.getByTestId('workflow-runs-page');
    await expect(workflowRunsPage).toBeVisible();

    const failedCard = await findWorkflowCardByName(page, 'data-processing-failed');
    expect(failedCard).toBeTruthy();
    if (!failedCard) return;
    await failedCard.click();
    await page.waitForLoadState('networkidle');

    detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: step-two of failed workflow shows 'Health check failed...'
    const stepTwoFailed = await findDetailStepByName(page, 'step-two');
    expect(stepTwoFailed).toBeTruthy();
    if (!stepTwoFailed) return;

    const failedStepMessage = stepTwoFailed.getByTestId('workflow-detail-step-message');
    await expect(failedStepMessage).toBeVisible();
    await expect(failedStepMessage).toContainText('Health check failed...');
  });
});

// ---------------------------------------------------------------------------
// Group 10: Back navigation — "Back to Workflows" → list view (테스트 10)
// ---------------------------------------------------------------------------

test.describe('Argo Tab - Workflow Detail - Back Navigation', () => {
  // TODO: Activate when DLD-445 is implemented
  test("should return to the Workflow list when 'Back to Workflows' is clicked", async ({ page }) => {
    // Tests that clicking the "Back to Workflows" button in the detail view
    // dismisses the detail and re-renders the workflow-runs-page list.

    // Arrange: Navigate to the workflow detail
    await gotoArgoWorkflows(page);

    const card = await findWorkflowCardByName(page, 'data-processing-running');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: "Back to Workflows" button is visible
    const backButton = detailPage.getByTestId('workflow-detail-back-button');
    await expect(backButton).toBeVisible();
    await expect(backButton).toContainText('Back to Workflows');

    // Act: Click "Back to Workflows"
    await backButton.click();
    await page.waitForLoadState('networkidle');

    // Assert: Workflow list is visible again
    const workflowRunsPage = page.getByTestId('workflow-runs-page');
    await expect(workflowRunsPage).toBeVisible();

    // Assert: Detail page is no longer visible
    await expect(detailPage).not.toBeVisible();

    // Assert: Workflow cards are still displayed (list is intact)
    const workflowCards = page.getByTestId('workflow-run-card');
    expect(await workflowCards.count()).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Group 11: Loading and error states for WorkflowDetail (테스트 11)
// ---------------------------------------------------------------------------

test.describe('Argo Tab - Workflow Detail - Loading and Error States', () => {
  // TODO: Activate when DLD-445 is implemented
  test('should display LoadingSkeleton while the workflow detail is being fetched', async ({ page }) => {
    // Tests that a LoadingSkeleton with aria-busy="true" is shown while the
    // detail API request is in-flight (simulated with a 3-second delay).

    // Act: Navigate to the list and click the card (do NOT wait for networkidle)
    await gotoArgoWorkflows(page);

    const card = await findWorkflowCardByName(page, 'data-processing-running');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    // Do NOT wait for networkidle — we want to observe the loading state

    // Assert: LoadingSkeleton is visible while the detail is loading
    const loadingSkeleton = page.getByTestId('loading-skeleton');
    await expect(loadingSkeleton).toBeVisible();
    await expect(loadingSkeleton).toHaveAttribute('aria-busy', 'true');
  });

  test('should display ErrorRetry with functional retry when the workflow detail API returns an error', async ({ page }) => {
    // Tests that when the detail API returns 500 the ErrorRetry component is shown,
    // and clicking Retry re-fetches and shows the detail on success.

    // Act: Navigate to the list and open the detail
    await gotoArgoWorkflows(page);

    const card = await findWorkflowCardByName(page, 'data-processing-running');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    // Assert: ErrorRetry is displayed inside the detail page area
    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    const errorRetry = detailPage.getByTestId('error-retry');
    await expect(errorRetry).toBeVisible();
    await expect(errorRetry).toHaveAttribute('role', 'alert');

    // Assert: Retry button is present
    const retryButton = errorRetry.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    // Assert: Workflow detail content is not rendered during error
    const headerName = detailPage.getByTestId('workflow-detail-name');
    await expect(headerName).not.toBeVisible();

    // Act: Click retry — second call succeeds
    await retryButton.click();
    await page.waitForLoadState('networkidle');

    // Assert: Workflow detail content is now rendered
    await expect(headerName).toBeVisible();
    await expect(headerName).toContainText('data-processing-running');

    // Assert: ErrorRetry is no longer visible
    await expect(errorRetry).not.toBeVisible();
  });
});
