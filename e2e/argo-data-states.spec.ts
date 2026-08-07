// Verifies: AR7 (docs/product/prd-argo.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

async function gotoArgo(page: Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] : never) {
  await page.goto('/argo');
  await page.waitForLoadState('networkidle');
}

async function gotoArgoWorkflows(page: Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] : never) {
  await gotoArgo(page);
  const templateCard = page.getByTestId('workflow-template-card').filter({ hasText: 'data-processing-with-params' });
  await expect(templateCard).toBeVisible();
  await templateCard.click();
  await page.waitForLoadState('networkidle');
  // Wait for the runs page container to render (present for all states: cards, error, empty, loading)
  await expect(page.getByTestId('workflow-runs-page')).toBeVisible();
}

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
// Group 4: Loading, Empty & Error States (테스트 6, 7, 8)
// ---------------------------------------------------------------------------
test.describe('Argo Tab - Workflow List - Loading, Empty & Error States', () => {
  test('should display LoadingSkeleton while workflows are being fetched', async ({ page }) => {
    // Tests that LoadingSkeleton with aria-busy="true" is shown during the API request

    // Arrange: Intercept the workflows API and delay the response to observe loading state
    // mock-exception: LAT — Workflow 목록 로딩 스켈레톤 관측을 위해 응답 지연 주입(본문은 미검증, 스켈레톤 상태만 관측). 실 응답은 즉시 완료돼 관측 불가.
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
    // No API mocking — uses 'empty-runs-template' which has no workflow runs in the cluster.

    // Arrange: Navigate to /argo (Templates view is default)
    await gotoArgo(page);

    // Act: Click the 'empty-runs-template' card (has no workflow runs in the cluster)
    const templateCard = page.getByTestId('workflow-template-card').filter({ hasText: 'empty-runs-template' });
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

  test('should display ErrorRetry component and functional retry button when the workflows API returns an error', async ({ page }) => {
    // Tests that ErrorRetry is rendered on API failure and the retry button re-triggers the fetch

    // Arrange: Block ALL workflow API calls with 500 until we flip the flag.
    // A flag-based approach is used instead of call-counting because the
    // useDataFetch hook may trigger multiple concurrent fetches on mount
    // (one from PollingContext registration, one from its own useEffect),
    // and a counter-based strategy would only fail the first call while the
    // second concurrent call succeeds — causing a race condition.
    let shouldFail = true;
    // mock-exception: ERR — Workflow 목록 조회를 첫 호출만 500으로 실패시켜 ErrorRetry·재시도를 검증(플래그 기반, 재시도는 continue로 실 backend). 실클러스터가 요청 시점에 실패하도록 만들 수 없음.
    await page.route('**/api/argo/workflows**', async route => {
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

    // Act: Allow subsequent calls to succeed, then click retry
    shouldFail = false;
    await retryButton.click();
    await page.waitForLoadState('networkidle');

    // Assert: Workflow cards are now displayed after successful retry
    // Wait for cards to render after retry before counting
    await expect(page.getByTestId('workflow-run-card').first()).toBeVisible();
    const workflowCardsAfterRetry = page.getByTestId('workflow-run-card');
    expect(await workflowCardsAfterRetry.count()).toBeGreaterThanOrEqual(1);

    // Assert: ErrorRetry is no longer visible
    await expect(errorRetry).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 11: Loading and error states for WorkflowDetail (테스트 11)
// ---------------------------------------------------------------------------
test.describe('Argo Tab - Workflow Detail - Loading and Error States', () => {
  // No API mocking — tests use real cluster data from test/fixtures/ YAML resources.
  // Individual tests below mock only the workflow detail endpoint for loading delay / error simulation.

  test('should display LoadingSkeleton while the workflow detail is being fetched', async ({ page }) => {
    // Tests that a LoadingSkeleton with aria-busy="true" is shown while the
    // detail API request is in-flight (simulated with a 3-second delay).

    // Arrange: Intercept the detail API with a deliberate delay, then pass to real API
    // mock-exception: LAT — Workflow 상세 로딩 스켈레톤 관측을 위해 응답 지연 후 continue(실 fixture data-processing-running 통과). 실 응답은 즉시 완료돼 관측 불가.
    await page.route('**/api/argo/workflows/data-processing-running**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.continue();
    });

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

    // Arrange: First call fails with 500, second call passes through to real API
    let detailCallCount = 0;
    // mock-exception: ERR — Workflow 상세 조회 첫 호출을 500으로 실패시켜 ErrorRetry·재시도를 검증(재시도는 continue로 실 fixture 통과). 실클러스터가 요청 시점에 500을 내도록 만들 수 없음.
    await page.route('**/api/argo/workflows/data-processing-running**', async route => {
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

test.describe('Argo Tab - WorkflowTemplate List', () => {
  test('should display LoadingSkeleton while workflow templates are being fetched', async ({ page }) => {
    // Tests that LoadingSkeleton is shown during the API request

    // Arrange: Intercept the workflow templates API and delay the response
    // mock-exception: LAT — WorkflowTemplate 목록 로딩 스켈레톤 관측을 위해 응답 지연 주입(본문은 미검증). 실 응답은 즉시 완료돼 관측 불가.
    await page.route('**/api/argo/workflow-templates**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Act: Navigate to the Argo tab
    await page.goto('/argo');

    // Assert: LoadingSkeleton should be visible before the response arrives
    const loadingSkeleton = page.getByTestId('loading-skeleton');
    await expect(loadingSkeleton).toBeVisible();

    // Assert: LoadingSkeleton has aria-busy="true"
    await expect(loadingSkeleton).toHaveAttribute('aria-busy', 'true');
  });

  test('should display EmptyState with "No workflow templates found" when no templates exist', async ({ page }) => {
    // Tests that EmptyState is rendered with the correct message when no templates exist
    // No API mocking — uses 'dashboard-empty' namespace which has no Argo resources.

    // Arrange: Navigate to the Argo tab
    await page.goto('/argo');
    await page.waitForLoadState('networkidle');

    // Act: Filter to the 'dashboard-empty' namespace (has no Argo WorkflowTemplates)
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const emptyNamespaceOption = page.getByRole('option', { name: /^dashboard-empty$/i })
      .or(page.getByTestId('namespace-option-dashboard-empty'));
    await emptyNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: EmptyState component is visible
    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();

    // Assert: EmptyState displays the correct message
    await expect(emptyState).toContainText('No workflow templates found');

    // Assert: No template cards are shown
    const templateCards = page.getByTestId('workflow-template-card');
    expect(await templateCards.count()).toBe(0);
  });

  test('should display ErrorRetry component when the workflow templates API returns an error', async ({ page }) => {
    // Tests that ErrorRetry is rendered and the retry button is functional on API failure

    // Arrange: Mock the workflow templates API to return a 500 error
    // mock-exception: ERR — WorkflowTemplate 목록 조회 실패(500) 시 ErrorRetry UI 검증. 실클러스터가 요청 시점에 500을 내도록 만들 수 없음.
    await page.route('**/api/argo/workflow-templates**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    // Act: Navigate to the Argo tab
    await page.goto('/argo');
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

    // Assert: No template cards are shown during error state
    const templateCards = page.getByTestId('workflow-template-card');
    expect(await templateCards.count()).toBe(0);
  });
});
