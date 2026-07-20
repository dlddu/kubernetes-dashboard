// Verifies: FX3 (docs/product/prd-fluxcd.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

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
      await route.continue();
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
      await route.continue();
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

// ===========================================================================
// DLD-748: Kustomization 수동 Reconcile — E2E 테스트 (all skipped)
// ===========================================================================

// ---------------------------------------------------------------------------
// Group 15: UI — Reconcile 버튼 및 상태 전환 (테스트 21, 22, 23, 24)
// TODO: Activate when DLD-748 is implemented.
// Activation: Remove test.describe.skip() when KustomizationDetail Reconcile feature is ready.
// ---------------------------------------------------------------------------
test.describe('FluxCD Tab - Kustomization Detail - Reconcile Button', () => {
  // No API mocking for button visibility — tests use real cluster data from test/fixtures/ YAML resources.

  test('should display "Reconcile Now" button on the Kustomization detail page', async ({ page }) => {
    // Tests that the Reconcile Now button is rendered and enabled on the detail page.
    // Fixture: app-ready (namespace: dashboard-test)

    // Arrange: Navigate directly to the detail page
    await page.goto('/fluxcd/kustomization/dashboard-test/app-ready');
    await page.waitForLoadState('networkidle');

    // Assert: Detail page container is visible
    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: Reconcile button is visible and enabled
    const reconcileButton = detailPage.getByTestId('reconcile-button');
    await expect(reconcileButton).toBeVisible();
    await expect(reconcileButton).toBeEnabled();

    // Assert: Button text indicates reconcile action
    await expect(reconcileButton).toContainText(/reconcile now/i);
  });

  test('should transition to "Reconciling..." loading state with spinner and disabled button after clicking "Reconcile Now"', async ({ page }) => {
    // Tests that clicking Reconcile Now shows a spinner, disables the button, and
    // changes the button text to "Reconciling..." while the API request is in-flight.
    // Fixture: app-ready (namespace: dashboard-test)

    // Arrange: Intercept the reconcile API to hold the loading state long enough to observe it
    await page.route('**/api/fluxcd/kustomizations/dashboard-test/app-ready/reconcile', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Reconciliation triggered' }),
      });
    });

    // Arrange: Navigate directly to the detail page
    await page.goto('/fluxcd/kustomization/dashboard-test/app-ready');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    // Act: Click the Reconcile Now button
    const reconcileButton = detailPage.getByTestId('reconcile-button');
    await expect(reconcileButton).toBeEnabled();
    await reconcileButton.click();

    // Assert: Button is disabled while request is in-flight
    await expect(reconcileButton).toBeDisabled();

    // Assert: Spinner is visible during loading
    const reconcileSpinner = detailPage.getByTestId('reconcile-spinner');
    await expect(reconcileSpinner).toBeVisible();

    // Assert: Button text changes to "Reconciling..."
    await expect(reconcileButton).toContainText(/reconciling/i);
  });

  test('should restore button to original state and refresh detail data after a successful Reconcile', async ({ page }) => {
    // Tests that after a successful reconcile API response:
    //   - the spinner disappears
    //   - the button returns to enabled "Reconcile Now" state
    //   - the detail data is re-fetched (detail API called again)
    // Fixture: app-ready (namespace: dashboard-test)

    // Arrange: Track how many times the detail API is called to verify re-fetch
    let detailFetchCount = 0;
    await page.route('**/api/fluxcd/kustomizations/dashboard-test/app-ready', async route => {
      detailFetchCount += 1;
      await route.continue();
    });

    // Arrange: Reconcile API responds immediately with 200
    await page.route('**/api/fluxcd/kustomizations/dashboard-test/app-ready/reconcile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Reconciliation triggered' }),
      });
    });

    // Arrange: Navigate directly to the detail page
    await page.goto('/fluxcd/kustomization/dashboard-test/app-ready');
    await page.waitForLoadState('networkidle');

    // Assert: Detail page is rendered (initial fetch counted)
    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();
    const fetchCountBeforeReconcile = detailFetchCount;

    // Act: Click the Reconcile Now button
    const reconcileButton = detailPage.getByTestId('reconcile-button');
    await reconcileButton.click();

    // Assert: Wait for the button to return to its original enabled state
    await expect(reconcileButton).toBeEnabled({ timeout: 10000 });
    await expect(reconcileButton).toContainText(/reconcile now/i);

    // Assert: Spinner is no longer visible
    const reconcileSpinner = detailPage.getByTestId('reconcile-spinner');
    await expect(reconcileSpinner).not.toBeVisible();

    // Assert: Detail data was re-fetched after successful reconcile
    expect(detailFetchCount).toBeGreaterThan(fetchCountBeforeReconcile);
  });

  test('should display an error message when the Reconcile API returns an error', async ({ page }) => {
    // Tests that when the reconcile API returns a 500 error, an error message is shown
    // in the detail page and the button returns to its original enabled state.
    // Fixture: app-ready (namespace: dashboard-test)

    // Arrange: Reconcile API responds with 500
    await page.route('**/api/fluxcd/kustomizations/dashboard-test/app-ready/reconcile', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    // Arrange: Navigate directly to the detail page
    await page.goto('/fluxcd/kustomization/dashboard-test/app-ready');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    // Act: Click the Reconcile Now button
    const reconcileButton = detailPage.getByTestId('reconcile-button');
    await reconcileButton.click();

    // Assert: Error message is visible in the detail page
    const reconcileError = detailPage.getByTestId('reconcile-error');
    await expect(reconcileError).toBeVisible();

    // Assert: Error element has role="alert" for accessibility
    await expect(reconcileError).toHaveAttribute('role', 'alert');

    // Assert: Button returns to enabled "Reconcile Now" state after failure
    await expect(reconcileButton).toBeEnabled({ timeout: 10000 });
    await expect(reconcileButton).toContainText(/reconcile now/i);

    // Assert: Spinner is no longer visible after failure
    const reconcileSpinner = detailPage.getByTestId('reconcile-spinner');
    await expect(reconcileSpinner).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 16: 백엔드 API — POST /api/fluxcd/kustomizations/{namespace}/{name}/reconcile (테스트 25, 26)
// TODO: Activate when DLD-748 is implemented.
// Activation: Remove test.describe.skip() when backend reconcile endpoint is ready.
// ---------------------------------------------------------------------------
test.describe('FluxCD API - POST /api/fluxcd/kustomizations/{namespace}/{name}/reconcile', () => {
  test('should return 200 and add the reconcile annotation when the Kustomization exists', async ({ request }) => {
    // Tests that POST /api/fluxcd/kustomizations/dashboard-test/app-ready/reconcile
    // adds the reconcile.fluxcd.io/requestedAt annotation to the resource and returns 200.
    // Fixture: app-ready (kustomization-ready.yaml, namespace: dashboard-test)

    // Act: Call the reconcile API
    const response = await request.post(
      '/api/fluxcd/kustomizations/dashboard-test/app-ready/reconcile'
    );

    // Assert: Response is successful
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Assert: Response Content-Type is application/json
    expect(response.headers()['content-type']).toContain('application/json');

    // Assert: Response body confirms reconciliation was triggered
    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body.message).toMatch(/reconcil/i);
  });

  test('should return 404 when the Kustomization resource does not exist', async ({ request }) => {
    // Tests that POST /api/fluxcd/kustomizations/{namespace}/{name}/reconcile returns 404
    // when no Kustomization resource matches the given namespace and name.

    // Act: Call the reconcile API with a non-existent resource
    const response = await request.post(
      '/api/fluxcd/kustomizations/dashboard-test/non-existent-resource/reconcile'
    );

    // Assert: Response is 404 Not Found
    expect(response.status()).toBe(404);

    // Assert: Response Content-Type is application/json
    expect(response.headers()['content-type']).toContain('application/json');

    // Assert: Response body contains an error message
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });
});
