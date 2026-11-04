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
  await expect(page.getByTestId('workflow-runs-page')).toBeVisible();
}

async function findWorkflowCardByName(
  page: Parameters<typeof test>[1] extends (...args: infer A) => unknown ? A[0] : never,
  workflowName: string,
) {
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

test.describe('Argo Tab - Workflow List - Loading, Empty & Error States', () => {
  test('should display LoadingSkeleton while workflows are being fetched', async ({ page }) => {
    // mock-exception: LAT — Workflow 목록 로딩 스켈레톤 관측을 위해 응답 지연 주입(본문은 미검증, 스켈레톤 상태만 관측). 실 응답은 즉시 완료돼 관측 불가.
    await page.route('**/api/argo/workflows**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/argo');
    await page.waitForLoadState('networkidle');
    const templateCard = page.getByTestId('workflow-template-card').filter({ hasText: 'data-processing-with-params' });
    await expect(templateCard).toBeVisible();
    // Do not wait for networkidle after the click — the loading state must still be observable.
    await templateCard.click();

    const loadingSkeleton = page.getByTestId('loading-skeleton');
    await expect(loadingSkeleton).toBeVisible();

    await expect(loadingSkeleton).toHaveAttribute('aria-busy', 'true');
  });

  test('should display EmptyState with "No workflows found" when the API returns an empty list', async ({ page }) => {
    // No API mocking — uses 'empty-runs-template' which has no workflow runs in the cluster.

    await gotoArgo(page);

    const templateCard = page.getByTestId('workflow-template-card').filter({ hasText: 'empty-runs-template' });
    await expect(templateCard).toBeVisible();
    await templateCard.click();
    await page.waitForLoadState('networkidle');

    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();

    await expect(emptyState).toContainText('No workflows found');

    const workflowCards = page.getByTestId('workflow-run-card');
    expect(await workflowCards.count()).toBe(0);
  });

  test('should display ErrorRetry component and functional retry button when the workflows API returns an error', async ({ page }) => {
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

    await gotoArgoWorkflows(page);

    const errorRetry = page.getByTestId('error-retry');
    await expect(errorRetry).toBeVisible();

    await expect(errorRetry).toHaveAttribute('role', 'alert');

    const retryButton = errorRetry.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    const workflowCards = page.getByTestId('workflow-run-card');
    expect(await workflowCards.count()).toBe(0);

    shouldFail = false;
    await retryButton.click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('workflow-run-card').first()).toBeVisible();
    const workflowCardsAfterRetry = page.getByTestId('workflow-run-card');
    expect(await workflowCardsAfterRetry.count()).toBeGreaterThanOrEqual(1);

    await expect(errorRetry).not.toBeVisible();
  });
});

test.describe('Argo Tab - Workflow Detail - Loading and Error States', () => {
  test('should display LoadingSkeleton while the workflow detail is being fetched', async ({ page }) => {
    // mock-exception: LAT — Workflow 상세 로딩 스켈레톤 관측을 위해 응답 지연 후 continue(실 fixture data-processing-running 통과). 실 응답은 즉시 완료돼 관측 불가.
    await page.route('**/api/argo/workflows/data-processing-running**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.continue();
    });

    await gotoArgoWorkflows(page);

    const card = await findWorkflowCardByName(page, 'data-processing-running');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    // Do NOT wait for networkidle — we want to observe the loading state

    const loadingSkeleton = page.getByTestId('loading-skeleton');
    await expect(loadingSkeleton).toBeVisible();
    await expect(loadingSkeleton).toHaveAttribute('aria-busy', 'true');
  });

  test('should display ErrorRetry with functional retry when the workflow detail API returns an error', async ({ page }) => {
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

    await gotoArgoWorkflows(page);

    const card = await findWorkflowCardByName(page, 'data-processing-running');
    expect(card).toBeTruthy();
    if (!card) return;
    await card.click();
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('workflow-detail-page');
    await expect(detailPage).toBeVisible();

    const errorRetry = detailPage.getByTestId('error-retry');
    await expect(errorRetry).toBeVisible();
    await expect(errorRetry).toHaveAttribute('role', 'alert');

    const retryButton = errorRetry.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    const headerName = detailPage.getByTestId('workflow-detail-name');
    await expect(headerName).not.toBeVisible();

    await retryButton.click();
    await page.waitForLoadState('networkidle');

    await expect(headerName).toBeVisible();
    await expect(headerName).toContainText('data-processing-running');

    await expect(errorRetry).not.toBeVisible();
  });
});

test.describe('Argo Tab - WorkflowTemplate List', () => {
  test('should display LoadingSkeleton while workflow templates are being fetched', async ({ page }) => {
    // mock-exception: LAT — WorkflowTemplate 목록 로딩 스켈레톤 관측을 위해 응답 지연 주입(본문은 미검증). 실 응답은 즉시 완료돼 관측 불가.
    await page.route('**/api/argo/workflow-templates**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/argo');

    const loadingSkeleton = page.getByTestId('loading-skeleton');
    await expect(loadingSkeleton).toBeVisible();

    await expect(loadingSkeleton).toHaveAttribute('aria-busy', 'true');
  });

  test('should display EmptyState with "No workflow templates found" when no templates exist', async ({ page }) => {
    await page.goto('/argo');
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const emptyNamespaceOption = page.getByRole('option', { name: /^dashboard-empty$/i })
      .or(page.getByTestId('namespace-option-dashboard-empty'));
    await emptyNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();

    await expect(emptyState).toContainText('No workflow templates found');

    const templateCards = page.getByTestId('workflow-template-card');
    expect(await templateCards.count()).toBe(0);
  });

  test('should display ErrorRetry component when the workflow templates API returns an error', async ({ page }) => {
    // mock-exception: ERR — WorkflowTemplate 목록 조회 실패(500) 시 ErrorRetry UI 검증. 실클러스터가 요청 시점에 500을 내도록 만들 수 없음.
    await page.route('**/api/argo/workflow-templates**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/argo');
    await page.waitForLoadState('networkidle');

    const errorRetry = page.getByTestId('error-retry');
    await expect(errorRetry).toBeVisible();

    await expect(errorRetry).toHaveAttribute('role', 'alert');

    const retryButton = errorRetry.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    const templateCards = page.getByTestId('workflow-template-card');
    expect(await templateCards.count()).toBe(0);
  });
});
