import { test, expect } from '@playwright/test';

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
 * Both fixtures are in the dashboard-test namespace.
 *
 * Related Issue: DLD-440 - 작업 3-1: WorkflowTemplate Submit — e2e 테스트 작성 (skipped)
 * Parent Issue:  DLD-435 - Argo WorkflowTemplate Submit 기능 추가
 */

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------

const WORKFLOW_TEMPLATES_FIXTURE = [
  {
    name: 'data-processing-with-params',
    namespace: 'dashboard-test',
    parameters: [
      { name: 'input-path', value: '/data/input', description: 'Input data path' },
      { name: 'output-path', value: '/data/output', description: 'Output data path' },
      { name: 'batch-size', value: '100', description: 'Batch size' },
      { name: 'env', enum: ['dev', 'staging', 'prod'] },
    ],
  },
  {
    name: 'simple-template',
    namespace: 'dashboard-test',
    parameters: [],
  },
];

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

test.describe('Argo Tab - WorkflowTemplate Submit - Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the workflow templates list API so tests are not reliant on cluster state
    await page.route('**/api/argo/workflow-templates**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(WORKFLOW_TEMPLATES_FIXTURE),
      });
    });
  });

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

    // Arrange: Mock the submit API to return a successful workflow reference
    await page.route('**/api/argo/workflow-templates/data-processing-with-params/submit', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ name: 'data-processing-with-params-abc12', namespace: 'dashboard-test' }),
      });
    });

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

    // Arrange: Mock the submit API for simple-template
    await page.route('**/api/argo/workflow-templates/simple-template/submit', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ name: 'simple-template-xyz99', namespace: 'dashboard-test' }),
      });
    });

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

    // Arrange: Mock submit API to return a created workflow
    await page.route('**/api/argo/workflow-templates/simple-template/submit', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ name: 'simple-template-xyz99', namespace: 'dashboard-test' }),
      });
    });

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

    // Assert: The page has transitioned to the Workflows section
    // (the modal closes and the workflows list is visible)
    await expect(submitDialog).not.toBeVisible();
    const workflowsSection = page.getByTestId('workflow-runs-page');
    await expect(workflowsSection).toBeVisible();
  });
});

// ---------------------------------------------------------------------------

test.describe('Argo Tab - WorkflowTemplate Submit - Error & Loading States', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the workflow templates list API
    await page.route('**/api/argo/workflow-templates**', async route => {
      // Only intercept GET list requests, not submit POSTs
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(WORKFLOW_TEMPLATES_FIXTURE),
        });
      } else {
        await route.continue();
      }
    });
  });

  test('should display error view and allow retry when the submit API returns an error', async ({ page }) => {
    // Tests that a failed submit shows an error view inside the modal,
    // and the Retry button re-triggers the API call (which succeeds on retry)

    // Arrange: First call fails, second call succeeds
    let submitCallCount = 0;
    await page.route('**/api/argo/workflow-templates/simple-template/submit', async route => {
      submitCallCount += 1;
      if (submitCallCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ name: 'simple-template-xyz99', namespace: 'dashboard-test' }),
        });
      }
    });

    await gotoArgo(page);

    const card = await findCardByName(page, 'simple-template');
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

    // Act: Click retry — second call will succeed
    await retryButton.click();

    // Assert: Success view replaces the error view
    const successView = submitDialog.getByTestId('submit-success-view');
    await expect(successView).toBeVisible();
    await expect(errorView).not.toBeVisible();
  });

  test('should disable the confirm button and show a loading spinner while submitting', async ({ page }) => {
    // Tests that during the in-flight POST request the confirm button is disabled
    // and a loading spinner is visible, preventing duplicate submissions

    // Arrange: Mock submit API with a deliberate delay to observe in-flight state
    await page.route('**/api/argo/workflow-templates/simple-template/submit', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ name: 'simple-template-xyz99', namespace: 'dashboard-test' }),
      });
    });

    await gotoArgo(page);

    const card = await findCardByName(page, 'simple-template');
    expect(card).toBeTruthy();
    if (!card) return;

    await card.getByTestId('submit-button').click();

    const submitDialog = page.getByTestId('submit-workflow-dialog');
    await expect(submitDialog).toBeVisible();

    // Act: Click the confirm button to start the submit
    const confirmButton = submitDialog.getByTestId('confirm-button');
    await confirmButton.click();

    // Assert: Confirm button is disabled while the request is in-flight
    await expect(confirmButton).toBeDisabled();

    // Assert: Loading spinner is visible
    const spinner = submitDialog.getByTestId('submit-spinner');
    await expect(spinner).toBeVisible();
  });
});

// ---------------------------------------------------------------------------

test.describe('Argo Tab - WorkflowTemplate Submit - Modal Dismissal', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the workflow templates list API
    await page.route('**/api/argo/workflow-templates**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(WORKFLOW_TEMPLATES_FIXTURE),
        });
      } else {
        await route.continue();
      }
    });
  });

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
