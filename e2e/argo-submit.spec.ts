// Verifies: AR2 (docs/product/prd-argo.md) — sole dedicated e2e spec for this AC.
import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests for Argo WorkflowTemplate Submit
 *
 * TDD Red Phase: Tests written - components not yet implemented.
 * These tests define the expected behavior of the WorkflowTemplate Submit feature,
 * which allows users to trigger a Workflow from a WorkflowTemplate card via a Submit
 * modal. The modal pre-fills parameter defaults, supports enum dropdowns, shows
 * a success view with a "View Workflow" link, handles API errors with a retry flow,
 * and disables the submit button while the request is in-flight.
 *
 * Test Fixtures (test/fixtures/):
 * - workflow-template-with-params.yaml: data-processing-with-params (4 params)
 *   - input-path  (default: /data/input)
 *   - output-path (default: /data/output)
 *   - batch-size  (default: 100)
 *   - env         (enum: [dev, staging, prod])
 * - workflow-template-no-params.yaml: simple-template (no params)
 * - workflow-template-empty-runs.yaml: empty-runs-template (no params, no workflow runs)
 * All fixtures are in the dashboard-test namespace.
 * Error/loading mutations use mock-policy-mutation-fixtures.yaml instead:
 * submit-policy-template in dashboard-mock-policy, with per-response cleanup.
 *
 * Related Issue: DLD-440 - 작업 3-1: WorkflowTemplate Submit — e2e 테스트 작성 (skipped)
 * Parent Issue:  DLD-435 - Argo WorkflowTemplate Submit 기능 추가
 */

// ---------------------------------------------------------------------------
// Helper: navigate to /argo and wait for the templates list to settle
// ---------------------------------------------------------------------------

async function gotoArgo(page: Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] : never) {
  await page.goto('/argo');
  await page.waitForLoadState('networkidle');
}

// ---------------------------------------------------------------------------
// Helper: find a workflow-template-card by template name
// ---------------------------------------------------------------------------

async function findCardByName(
  page: Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] : never,
  templateName: string,
) {
  const templateCards = page.getByTestId('workflow-template-card');
  const cardCount = await templateCards.count();

  for (let i = 0; i < cardCount; i++) {
    const card = templateCards.nth(i);
    const nameText = await card.getByTestId('workflow-template-name').innerText();
    if (nameText === templateName) {
      return card;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
const mutationTemplate = 'submit-policy-template';
const mutationNamespace = 'dashboard-mock-policy';
const mutationSubmitPath = `/api/argo/workflow-templates/${mutationTemplate}/submit`;

// Wait for the real response even if a loading assertion fails, then clean up only
// the workflow returned by this request. Shared Argo fixtures are never deleted.
async function withSubmittedWorkflow(
  page: Page,
  submit: () => Promise<void>,
  assertSuccess: () => Promise<void>,
) {
  const responsePromise = page.waitForResponse(response =>
    new URL(response.url()).pathname === mutationSubmitPath &&
    response.request().method() === 'POST',
  );
  const [actionResult, responseResult] = await Promise.allSettled([submit(), responsePromise]);
  if (responseResult.status === 'rejected') throw responseResult.reason;
  const response = responseResult.value;
  expect(response.status()).toBe(200);
  const workflow = await response.json();
  expect(workflow.namespace).toBe(mutationNamespace);
  expect(workflow.name).toMatch(/^submit-policy-template-[a-z0-9-]+$/);
  const workflowPath = `/api/argo/workflows/${encodeURIComponent(workflow.name)}`;

  try {
    const persisted = await page.request.get(workflowPath);
    expect(persisted.ok()).toBe(true);
    expect(await persisted.json()).toMatchObject({
      name: workflow.name,
      namespace: mutationNamespace,
      templateName: mutationTemplate,
    });
    if (actionResult.status === 'rejected') throw actionResult.reason;
    await assertSuccess();
  } finally {
    const deleted = await page.request.delete(workflowPath);
    expect(deleted.ok()).toBe(true);
    await expect.poll(async () => (await page.request.get(workflowPath)).status()).toBe(404);
  }
}


test.describe('Argo Tab - WorkflowTemplate Submit - Happy Path', () => {
  test('should open SubmitModal when Submit button is clicked on a template card', async ({ page }) => {
    // Tests that clicking the Submit button on a WorkflowTemplate card opens the Submit modal

    // Arrange: Navigate to the Argo tab
    await gotoArgo(page);

    // Act: Find the data-processing-with-params card and click its Submit button
    const card = await findCardByName(page, 'data-processing-with-params');
    expect(card).toBeTruthy();
    if (!card) return;

    const submitButton = card.getByTestId('submit-button');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Assert: Submit modal is now visible
    const submitDialog = page.getByTestId('submit-workflow-dialog');
    await expect(submitDialog).toBeVisible();
  });

  test('should pre-fill parameter inputs with default values when SubmitModal opens', async ({ page }) => {
    // Tests that each parameter field is initialised with the value defined in the WorkflowTemplate spec

    // Arrange: Navigate to the Argo tab and open the Submit modal
    await gotoArgo(page);

    const card = await findCardByName(page, 'data-processing-with-params');
    expect(card).toBeTruthy();
    if (!card) return;

    await card.getByTestId('submit-button').click();

    const submitDialog = page.getByTestId('submit-workflow-dialog');
    await expect(submitDialog).toBeVisible();

    // Assert: Each text parameter input has the expected default value pre-filled
    const inputPathField = submitDialog.getByTestId('param-input-input-path');
    await expect(inputPathField).toHaveValue('/data/input');

    const outputPathField = submitDialog.getByTestId('param-input-output-path');
    await expect(outputPathField).toHaveValue('/data/output');

    const batchSizeField = submitDialog.getByTestId('param-input-batch-size');
    await expect(batchSizeField).toHaveValue('100');
  });

  test('should render enum parameter as a select dropdown with all enum options', async ({ page }) => {
    // Tests that a parameter with an enum list is rendered as a <select> element
    // containing exactly the enum values defined in the WorkflowTemplate spec

    // Arrange: Navigate to the Argo tab and open the Submit modal
    await gotoArgo(page);

    const card = await findCardByName(page, 'data-processing-with-params');
    expect(card).toBeTruthy();
    if (!card) return;

    await card.getByTestId('submit-button').click();

    const submitDialog = page.getByTestId('submit-workflow-dialog');
    await expect(submitDialog).toBeVisible();

    // Assert: The "env" parameter is rendered as a select element
    const envSelect = submitDialog.getByTestId('param-select-env');
    await expect(envSelect).toBeVisible();

    // Assert: All three enum options are present in the dropdown
    await expect(envSelect.getByRole('option', { name: 'dev' })).toBeAttached();
    await expect(envSelect.getByRole('option', { name: 'staging' })).toBeAttached();
    await expect(envSelect.getByRole('option', { name: 'prod' })).toBeAttached();
  });

  test('should show success view after editing parameters and submitting the form', async ({ page }) => {
    // Tests the full happy-path submit flow: change a parameter value → click confirm → success view appears

    await gotoArgo(page);

    const card = await findCardByName(page, 'data-processing-with-params');
    expect(card).toBeTruthy();
    if (!card) return;

    await card.getByTestId('submit-button').click();

    const submitDialog = page.getByTestId('submit-workflow-dialog');
    await expect(submitDialog).toBeVisible();

    // Act: Change the batch-size parameter value
    const batchSizeField = submitDialog.getByTestId('param-input-batch-size');
    await batchSizeField.fill('200');

    // Act: Click the confirm / submit button inside the modal
    const confirmButton = submitDialog.getByTestId('confirm-button');
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    // Assert: Success view is displayed after the API call resolves
    const successView = submitDialog.getByTestId('submit-success-view');
    await expect(successView).toBeVisible();
  });

  test('should allow submitting a template with no parameters without showing a form', async ({ page }) => {
    // Tests that simple-template (0 parameters) opens a modal with no parameter fields
    // and can be submitted immediately without filling in anything

    await gotoArgo(page);

    const card = await findCardByName(page, 'simple-template');
    expect(card).toBeTruthy();
    if (!card) return;

    await card.getByTestId('submit-button').click();

    const submitDialog = page.getByTestId('submit-workflow-dialog');
    await expect(submitDialog).toBeVisible();

    // Assert: No parameter input fields are present (template has no parameters)
    const anyParamInput = submitDialog.getByTestId(/^param-input-/);
    expect(await anyParamInput.count()).toBe(0);

    const anyParamSelect = submitDialog.getByTestId(/^param-select-/);
    expect(await anyParamSelect.count()).toBe(0);

    // Act: Submit immediately without editing anything
    const confirmButton = submitDialog.getByTestId('confirm-button');
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    // Assert: Success view is shown
    const successView = submitDialog.getByTestId('submit-success-view');
    await expect(successView).toBeVisible();
  });

  test('should navigate to the Workflows section when "View Workflow" link is clicked', async ({ page }) => {
    // Tests that clicking the "View Workflow" link in the success view switches to the Workflows tab/section

    await gotoArgo(page);

    const card = await findCardByName(page, 'simple-template');
    expect(card).toBeTruthy();
    if (!card) return;

    await card.getByTestId('submit-button').click();

    const submitDialog = page.getByTestId('submit-workflow-dialog');
    await expect(submitDialog).toBeVisible();

    await submitDialog.getByTestId('confirm-button').click();

    const successView = submitDialog.getByTestId('submit-success-view');
    await expect(successView).toBeVisible();

    // Act: Click the "View Workflow" link
    const viewWorkflowLink = successView.getByTestId('view-workflow-link');
    await expect(viewWorkflowLink).toBeVisible();
    await viewWorkflowLink.click();

    // Assert: URL changed to the template-specific runs route
    expect(page.url()).toContain('/argo/templates/simple-template');

    // Assert: The page has transitioned to the Workflows section
    // (the modal closes and the workflows list is visible)
    await expect(submitDialog).not.toBeVisible();
    const workflowsSection = page.getByTestId('workflow-runs-page');
    await expect(workflowsSection).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
test.describe('Argo Tab - WorkflowTemplate Submit - Error & Loading States', () => {
  test('should display error view and allow retry when the submit API returns an error', async ({ page }) => {
    // Tests that a failed submit shows an error view inside the modal,
    // and the Retry button re-triggers the API call (which succeeds on retry)

    // Arrange: First call fails, second call succeeds
    let submitCallCount = 0;
    // mock-exception: ERR — 실클러스터가 요청 시점에 500을 내도록 만들 수 없어 첫 실패만 주입. 재시도는 전용 fixture에 실 submit하며 생성된 workflow만 삭제한다.
    await page.route('**/api/argo/workflow-templates/submit-policy-template/submit', async route => {
      submitCallCount += 1;
      if (submitCallCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        await route.continue();
      }
    });

    await gotoArgo(page);

    const card = await findCardByName(page, mutationTemplate);
    expect(card).toBeTruthy();
    if (!card) return;

    await card.getByTestId('submit-button').click();

    const submitDialog = page.getByTestId('submit-workflow-dialog');
    await expect(submitDialog).toBeVisible();

    // Act: Click confirm — first call will fail
    await submitDialog.getByTestId('confirm-button').click();

    // Assert: Error view is displayed
    const errorView = submitDialog.getByTestId('submit-error-view');
    await expect(errorView).toBeVisible();

    // Assert: Retry button is present and enabled
    const retryButton = errorView.getByTestId('retry-button');
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    await withSubmittedWorkflow(page, () => retryButton.click(), async () => {
      const successView = submitDialog.getByTestId('submit-success-view');
      await expect(successView).toBeVisible();
      await expect(errorView).not.toBeVisible();
      expect(submitCallCount).toBe(2);
    });
  });

  test('should disable the confirm button and show a loading spinner while submitting', async ({ page }) => {
    // Tests that during the in-flight POST request the confirm button is disabled
    // and a loading spinner is visible, preventing duplicate submissions

    let releaseSubmit!: () => void;
    const submitGate = new Promise<void>(resolve => { releaseSubmit = resolve; });
    // mock-exception: LAT — 실 응답은 즉시 완료돼 in-flight 상태를 관측할 수 없어 어서션까지 지연. 해제 후 전용 fixture에 실 submit하고 생성된 workflow만 삭제한다.
    await page.route('**/api/argo/workflow-templates/submit-policy-template/submit', async route => {
      await submitGate;
      await route.continue();
    });

    await gotoArgo(page);

    const card = await findCardByName(page, mutationTemplate);
    expect(card).toBeTruthy();
    if (!card) return;

    await card.getByTestId('submit-button').click();

    const submitDialog = page.getByTestId('submit-workflow-dialog');
    await expect(submitDialog).toBeVisible();

    // Act: Click the confirm button to start the submit
    const confirmButton = submitDialog.getByTestId('confirm-button');
    await withSubmittedWorkflow(page, async () => {
      try {
        await confirmButton.click();
        await expect(confirmButton).toBeDisabled();
        await expect(submitDialog.getByTestId('submit-spinner')).toBeVisible();
      } finally {
        releaseSubmit();
      }
    }, async () => {
      await expect(submitDialog.getByTestId('submit-success-view')).toBeVisible();
    });
  });
});

// ---------------------------------------------------------------------------
test.describe('Argo Tab - WorkflowTemplate Submit - Modal Dismissal', () => {
  test('should close the Submit modal when the Cancel button is clicked', async ({ page }) => {
    // Tests that clicking the Cancel button in the Submit modal dismisses it
    // without triggering an API call

    // Arrange: Navigate to the Argo tab and open the modal
    await gotoArgo(page);

    const card = await findCardByName(page, 'data-processing-with-params');
    expect(card).toBeTruthy();
    if (!card) return;

    await card.getByTestId('submit-button').click();

    const submitDialog = page.getByTestId('submit-workflow-dialog');
    await expect(submitDialog).toBeVisible();

    // Act: Click the Cancel button inside the modal
    const cancelButton = submitDialog.getByTestId('cancel-button');
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    // Assert: The modal is no longer visible
    await expect(submitDialog).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------

// Related Issue: DLD-532 (parent: DLD-527) - Submit 성공 후 View Workflow 클릭 시 해당 template의 Runs 뷰 전환 검증
test.describe('Argo Tab - WorkflowTemplate Submit - View Workflow Navigation', () => {
  // No API mocking — all tests use real cluster data from test/fixtures/ and real API calls.

  test('should close SubmitModal when "View Workflow" button is clicked after successful submit', async ({
    page,
  }) => {
    // Tests that the SubmitModal (submit-workflow-dialog) is no longer visible
    // after the user clicks the "View Workflow" button in the success view.

    await gotoArgo(page);

    const card = await findCardByName(page, 'simple-template');
    expect(card).toBeTruthy();
    if (!card) return;

    await card.getByTestId('submit-button').click();

    const submitDialog = page.getByTestId('submit-workflow-dialog');
    await expect(submitDialog).toBeVisible();

    await submitDialog.getByTestId('confirm-button').click();

    const successView = submitDialog.getByTestId('submit-success-view');
    await expect(successView).toBeVisible();

    // Act: Click the "View Workflow" button in the success view
    const viewWorkflowLink = successView.getByTestId('view-workflow-link');
    await expect(viewWorkflowLink).toBeVisible();
    await viewWorkflowLink.click();

    // Assert: The SubmitModal is no longer visible
    await expect(submitDialog).not.toBeVisible();
  });

  test('should show workflow-runs-page after "View Workflow" is clicked', async ({ page }) => {
    // Tests that the workflow-runs-page element becomes visible after the user
    // clicks "View Workflow", confirming the UI has transitioned to the Runs view.

    await gotoArgo(page);

    const card = await findCardByName(page, 'simple-template');
    expect(card).toBeTruthy();
    if (!card) return;

    await card.getByTestId('submit-button').click();

    const submitDialog = page.getByTestId('submit-workflow-dialog');
    await expect(submitDialog).toBeVisible();

    await submitDialog.getByTestId('confirm-button').click();

    const successView = submitDialog.getByTestId('submit-success-view');
    await expect(successView).toBeVisible();

    // Act: Click "View Workflow"
    await successView.getByTestId('view-workflow-link').click();

    // Assert: URL changed to the template-specific runs route
    expect(page.url()).toContain('/argo/templates/simple-template');

    // Assert: The Runs view is now displayed
    const workflowRunsPage = page.getByTestId('workflow-runs-page');
    await expect(workflowRunsPage).toBeVisible();

    // Assert: The templates list is no longer shown (we have switched away from it)
    const workflowTemplatesPage = page.getByTestId('workflow-templates-page');
    await expect(workflowTemplatesPage).not.toBeVisible();
  });

  test('should display the submitted template name in the Runs view header', async ({ page }) => {
    // Tests that the Runs view header shows the name of the template that was submitted,
    // so the user knows which template's runs they are viewing.

    await gotoArgo(page);

    const card = await findCardByName(page, 'simple-template');
    expect(card).toBeTruthy();
    if (!card) return;

    await card.getByTestId('submit-button').click();

    const submitDialog = page.getByTestId('submit-workflow-dialog');
    await expect(submitDialog).toBeVisible();

    await submitDialog.getByTestId('confirm-button').click();

    const successView = submitDialog.getByTestId('submit-success-view');
    await expect(successView).toBeVisible();

    // Act: Click "View Workflow"
    await successView.getByTestId('view-workflow-link').click();

    // Assert: The Runs view header contains the submitted template name
    const workflowRunsPage = page.getByTestId('workflow-runs-page');
    await expect(workflowRunsPage).toBeVisible();
    await expect(workflowRunsPage).toContainText('simple-template');
  });

  test('should show only the submitted template runs and not runs from other templates', async ({ page }) => {
    // Tests that the Runs view is filtered to the submitted template:
    // runs from "simple-template" are visible, while runs from
    // "data-processing-with-params" (loaded via test/fixtures/) are not present.
    // This verifies that the API is called with the correct templateName filter
    // and that the UI does not mix runs from unrelated templates.
    // Uses real API — no mocking.

    await gotoArgo(page);

    const card = await findCardByName(page, 'simple-template');
    expect(card).toBeTruthy();
    if (!card) return;

    await card.getByTestId('submit-button').click();

    const submitDialog = page.getByTestId('submit-workflow-dialog');
    await expect(submitDialog).toBeVisible();

    await submitDialog.getByTestId('confirm-button').click();

    const successView = submitDialog.getByTestId('submit-success-view');
    await expect(successView).toBeVisible();

    // Act: Click "View Workflow"
    await successView.getByTestId('view-workflow-link').click();

    // Assert: The Runs view is visible
    const workflowRunsPage = page.getByTestId('workflow-runs-page');
    await expect(workflowRunsPage).toBeVisible();

    // Assert: The runs page shows simple-template content
    await expect(workflowRunsPage).toContainText('simple-template');

    // Assert: Runs from other templates (loaded via test/fixtures/) are not shown
    await expect(workflowRunsPage).not.toContainText('data-processing-with-params');
  });
});
