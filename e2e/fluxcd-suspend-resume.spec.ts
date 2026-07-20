// Verifies: FX4 (docs/product/prd-fluxcd.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

// ===========================================================================
// Kustomization Suspend / Resume — E2E 테스트
// ===========================================================================

// ---------------------------------------------------------------------------
// Group 17: UI — Suspend / Resume 토글 버튼 및 상태 전환
// ---------------------------------------------------------------------------
test.describe('FluxCD Tab - Kustomization Detail - Suspend/Resume Button', () => {
  test('should display "Suspend" button on the detail page for an unsuspended Kustomization', async ({ page }) => {
    // Tests that the Suspend button is rendered and enabled on a non-suspended
    // Kustomization's detail page, with label "Suspend".
    // Fixture: kust-mut-suspend (namespace: dashboard-test, suspend=false)

    // Arrange: Navigate directly to the detail page
    await page.goto('/fluxcd/kustomization/dashboard-test/kust-mut-suspend');
    await page.waitForLoadState('networkidle');

    // Assert: Detail page container is visible
    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: Suspend toggle button is visible, enabled, and labeled "Suspend"
    const suspendButton = detailPage.getByTestId('suspend-toggle-button');
    await expect(suspendButton).toBeVisible();
    await expect(suspendButton).toBeEnabled();
    await expect(suspendButton).toHaveText(/^Suspend$/);
  });

  test('should display "Resume" button on the detail page for a suspended Kustomization', async ({ page }) => {
    // Tests that the toggle button's label flips to "Resume" on a suspended
    // Kustomization's detail page.
    // Fixture: kust-mut-resume (namespace: dashboard-test, suspend=true)

    // Arrange: Navigate directly to the detail page
    await page.goto('/fluxcd/kustomization/dashboard-test/kust-mut-resume');
    await page.waitForLoadState('networkidle');

    // Assert: Detail page container is visible
    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: Toggle button is visible, enabled, and labeled "Resume"
    const suspendButton = detailPage.getByTestId('suspend-toggle-button');
    await expect(suspendButton).toBeVisible();
    await expect(suspendButton).toBeEnabled();
    await expect(suspendButton).toHaveText(/^Resume$/);
  });

  test('should transition to "Suspending..." loading state and disable button after clicking Suspend', async ({ page, request }) => {
    // Tests that clicking the Suspend button disables the button and changes
    // the label to "Suspending..." while the API request is in-flight.
    // Fixture: kust-mut-suspend (namespace: dashboard-test)
    //
    // No 200 mocking: the request is forwarded to the real backend through
    // page.route() with an added delay so the intermediate loading state is
    // observable. Cleanup resumes the fixture after the test.

    try {
      // Arrange: Delay the suspend request (but forward to the real backend)
      await page.route('**/api/fluxcd/kustomizations/dashboard-test/kust-mut-suspend/suspend', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.continue();
      });

      // Arrange: Navigate directly to the detail page
      await page.goto('/fluxcd/kustomization/dashboard-test/kust-mut-suspend');
      await page.waitForLoadState('networkidle');

      const detailPage = page.getByTestId('kustomization-detail-page');
      await expect(detailPage).toBeVisible();

      // Act: Click the Suspend button
      const suspendButton = detailPage.getByTestId('suspend-toggle-button');
      await expect(suspendButton).toBeEnabled();
      await suspendButton.click();

      // Assert: Button is disabled while request is in-flight
      await expect(suspendButton).toBeDisabled();

      // Assert: Button text changes to "Suspending..."
      await expect(suspendButton).toContainText(/suspending/i);
    } finally {
      // Cleanup: Resume the Kustomization so the fixture state is restored
      await request.post('/api/fluxcd/kustomizations/dashboard-test/kust-mut-suspend/resume');
    }
  });

  test('should transition to "Resuming..." loading state and disable button after clicking Resume', async ({ page, request }) => {
    // Tests that clicking the Resume button disables the button and changes
    // the label to "Resuming..." while the API request is in-flight.
    // Fixture: kust-mut-resume (namespace: dashboard-test)
    //
    // No 200 mocking: the request is forwarded to the real backend through
    // page.route() with an added delay. Cleanup re-suspends afterward.

    try {
      // Arrange: Delay the resume request (but forward to the real backend)
      await page.route('**/api/fluxcd/kustomizations/dashboard-test/kust-mut-resume/resume', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.continue();
      });

      // Arrange: Navigate directly to the detail page
      await page.goto('/fluxcd/kustomization/dashboard-test/kust-mut-resume');
      await page.waitForLoadState('networkidle');

      const detailPage = page.getByTestId('kustomization-detail-page');
      await expect(detailPage).toBeVisible();

      // Act: Click the Resume button
      const suspendButton = detailPage.getByTestId('suspend-toggle-button');
      await expect(suspendButton).toBeEnabled();
      await suspendButton.click();

      // Assert: Button is disabled while request is in-flight
      await expect(suspendButton).toBeDisabled();

      // Assert: Button text changes to "Resuming..."
      await expect(suspendButton).toContainText(/resuming/i);
    } finally {
      // Cleanup: Re-suspend the Kustomization so the fixture state is restored
      await request.post('/api/fluxcd/kustomizations/dashboard-test/kust-mut-resume/suspend');
    }
  });

  test('should restore button to enabled state and refresh detail data after a successful Suspend', async ({ page, request }) => {
    // Tests that after a successful suspend API response:
    //   - the button returns to enabled state
    //   - the detail data is re-fetched (detail API called again)
    // Fixture: kust-mut-suspend (namespace: dashboard-test)
    //
    // No 200 mocking: the suspend call hits the real backend. The detail
    // route is only a pass-through counter, not a mock. Cleanup resumes
    // the fixture after the test.

    try {
      // Arrange: Track how many times the detail API is called to verify re-fetch
      let detailFetchCount = 0;
      await page.route('**/api/fluxcd/kustomizations/dashboard-test/kust-mut-suspend', async route => {
        detailFetchCount += 1;
        await route.continue();
      });

      // Arrange: Navigate directly to the detail page
      await page.goto('/fluxcd/kustomization/dashboard-test/kust-mut-suspend');
      await page.waitForLoadState('networkidle');

      // Assert: Detail page is rendered (initial fetch counted)
      const detailPage = page.getByTestId('kustomization-detail-page');
      await expect(detailPage).toBeVisible();
      const fetchCountBeforeSuspend = detailFetchCount;

      // Act: Click the Suspend button (real backend handles it)
      const suspendButton = detailPage.getByTestId('suspend-toggle-button');
      await suspendButton.click();

      // Assert: Wait for the button to return to its enabled state
      await expect(suspendButton).toBeEnabled({ timeout: 10000 });

      // Assert: Detail data was re-fetched after successful suspend
      expect(detailFetchCount).toBeGreaterThan(fetchCountBeforeSuspend);
    } finally {
      // Cleanup: Resume the Kustomization so the fixture state is restored
      await request.post('/api/fluxcd/kustomizations/dashboard-test/kust-mut-suspend/resume');
    }
  });

  test('should display an error message when the Suspend API returns an error', async ({ page }) => {
    // Tests that when the suspend API returns a 500 error, an error alert is shown
    // and the button returns to its enabled state.
    // Fixture: kust-mut-suspend (namespace: dashboard-test)

    // Arrange: Suspend API responds with 500
    await page.route('**/api/fluxcd/kustomizations/dashboard-test/kust-mut-suspend/suspend', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to suspend kustomization' }),
      });
    });

    // Arrange: Navigate directly to the detail page
    await page.goto('/fluxcd/kustomization/dashboard-test/kust-mut-suspend');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    // Act: Click the Suspend button
    const suspendButton = detailPage.getByTestId('suspend-toggle-button');
    await suspendButton.click();

    // Assert: Error alert is visible
    const suspendError = detailPage.getByTestId('suspend-error');
    await expect(suspendError).toBeVisible();

    // Assert: Error element has role="alert" for accessibility
    await expect(suspendError).toHaveAttribute('role', 'alert');

    // Assert: Error body contains the server's error message
    await expect(suspendError).toContainText(/suspend/i);

    // Assert: Button returns to enabled state after failure
    await expect(suspendButton).toBeEnabled({ timeout: 10000 });
  });

  test('should display an error message when the Resume API returns an error', async ({ page }) => {
    // Tests that when the resume API returns a 500 error, an error alert is shown
    // and the button returns to its enabled state.
    // Fixture: kust-mut-resume (namespace: dashboard-test)

    // Arrange: Resume API responds with 500
    await page.route('**/api/fluxcd/kustomizations/dashboard-test/kust-mut-resume/resume', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to resume kustomization' }),
      });
    });

    // Arrange: Navigate directly to the detail page
    await page.goto('/fluxcd/kustomization/dashboard-test/kust-mut-resume');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('kustomization-detail-page');
    await expect(detailPage).toBeVisible();

    // Act: Click the Resume button
    const suspendButton = detailPage.getByTestId('suspend-toggle-button');
    await suspendButton.click();

    // Assert: Error alert is visible with role="alert"
    const suspendError = detailPage.getByTestId('suspend-error');
    await expect(suspendError).toBeVisible();
    await expect(suspendError).toHaveAttribute('role', 'alert');
    await expect(suspendError).toContainText(/resume/i);

    // Assert: Button returns to enabled state after failure
    await expect(suspendButton).toBeEnabled({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Group 18: 백엔드 API — POST /api/fluxcd/kustomizations/{namespace}/{name}/suspend
//                        POST /api/fluxcd/kustomizations/{namespace}/{name}/resume
// ---------------------------------------------------------------------------
test.describe('FluxCD API - POST /api/fluxcd/kustomizations/{namespace}/{name}/suspend|resume', () => {
  test('should suspend and then resume an existing Kustomization, restoring its original state', async ({ request }) => {
    // Tests the full suspend → resume cycle against the real backend.
    // Fixture: kust-mut-suspend (fluxcd-mut-fixtures.yaml, namespace: dashboard-test, starts unsuspended)
    // Cleanup: explicitly resumes at the end so the fixture state is restored for subsequent tests.

    try {
      // Act: Suspend the Kustomization
      const suspendResponse = await request.post(
        '/api/fluxcd/kustomizations/dashboard-test/kust-mut-suspend/suspend'
      );

      // Assert: Suspend response is successful
      expect(suspendResponse.ok()).toBeTruthy();
      expect(suspendResponse.status()).toBe(200);
      expect(suspendResponse.headers()['content-type']).toContain('application/json');

      const suspendBody = await suspendResponse.json();
      expect(suspendBody).toHaveProperty('message');
      expect(suspendBody.message).toBe('Suspended');

      // Assert: GET detail confirms spec.suspend was flipped to true
      const detailAfterSuspend = await request.get(
        '/api/fluxcd/kustomizations/dashboard-test/kust-mut-suspend'
      );
      expect(detailAfterSuspend.ok()).toBeTruthy();
      const detailBodyAfterSuspend = await detailAfterSuspend.json();
      expect(detailBodyAfterSuspend).toHaveProperty('suspended', true);
    } finally {
      // Cleanup: Always resume so the fixture returns to its original state
      const resumeResponse = await request.post(
        '/api/fluxcd/kustomizations/dashboard-test/kust-mut-suspend/resume'
      );

      // Assert: Resume response is successful
      expect(resumeResponse.ok()).toBeTruthy();
      expect(resumeResponse.status()).toBe(200);

      const resumeBody = await resumeResponse.json();
      expect(resumeBody).toHaveProperty('message');
      expect(resumeBody.message).toBe('Resumed');

      // Assert: GET detail confirms spec.suspend was flipped back to false
      const detailAfterResume = await request.get(
        '/api/fluxcd/kustomizations/dashboard-test/kust-mut-suspend'
      );
      expect(detailAfterResume.ok()).toBeTruthy();
      const detailBodyAfterResume = await detailAfterResume.json();
      expect(detailBodyAfterResume).toHaveProperty('suspended', false);
    }
  });

  test('should resume and then re-suspend an already-suspended Kustomization, restoring its original state', async ({ request }) => {
    // Tests the resume → suspend cycle against the real backend.
    // Fixture: kust-mut-resume (fluxcd-mut-fixtures.yaml, namespace: dashboard-test, starts suspended)
    // Cleanup: explicitly re-suspends at the end to restore the fixture state.

    try {
      // Act: Resume the Kustomization
      const resumeResponse = await request.post(
        '/api/fluxcd/kustomizations/dashboard-test/kust-mut-resume/resume'
      );

      // Assert: Resume response is successful
      expect(resumeResponse.ok()).toBeTruthy();
      expect(resumeResponse.status()).toBe(200);
      expect(resumeResponse.headers()['content-type']).toContain('application/json');

      const resumeBody = await resumeResponse.json();
      expect(resumeBody).toHaveProperty('message');
      expect(resumeBody.message).toBe('Resumed');

      // Assert: GET detail confirms spec.suspend was flipped to false
      const detailAfterResume = await request.get(
        '/api/fluxcd/kustomizations/dashboard-test/kust-mut-resume'
      );
      expect(detailAfterResume.ok()).toBeTruthy();
      const detailBodyAfterResume = await detailAfterResume.json();
      expect(detailBodyAfterResume).toHaveProperty('suspended', false);
    } finally {
      // Cleanup: Always re-suspend so the fixture returns to its original state
      const suspendResponse = await request.post(
        '/api/fluxcd/kustomizations/dashboard-test/kust-mut-resume/suspend'
      );

      // Assert: Suspend response is successful
      expect(suspendResponse.ok()).toBeTruthy();
      expect(suspendResponse.status()).toBe(200);

      const suspendBody = await suspendResponse.json();
      expect(suspendBody).toHaveProperty('message');
      expect(suspendBody.message).toBe('Suspended');

      // Assert: GET detail confirms spec.suspend was flipped back to true
      const detailAfterSuspend = await request.get(
        '/api/fluxcd/kustomizations/dashboard-test/kust-mut-resume'
      );
      expect(detailAfterSuspend.ok()).toBeTruthy();
      const detailBodyAfterSuspend = await detailAfterSuspend.json();
      expect(detailBodyAfterSuspend).toHaveProperty('suspended', true);
    }
  });

  test('should return 404 when POST /suspend targets a non-existent Kustomization', async ({ request }) => {
    // Tests that POST /api/fluxcd/kustomizations/{namespace}/{name}/suspend returns 404
    // when no Kustomization resource matches the given namespace and name.

    // Act: Call the suspend API with a non-existent resource
    const response = await request.post(
      '/api/fluxcd/kustomizations/dashboard-test/non-existent-resource/suspend'
    );

    // Assert: Response is 404 Not Found
    expect(response.status()).toBe(404);

    // Assert: Response Content-Type is application/json
    expect(response.headers()['content-type']).toContain('application/json');

    // Assert: Response body contains an error message
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('should return 404 when POST /resume targets a non-existent Kustomization', async ({ request }) => {
    // Tests that POST /api/fluxcd/kustomizations/{namespace}/{name}/resume returns 404
    // when no Kustomization resource matches the given namespace and name.

    // Act: Call the resume API with a non-existent resource
    const response = await request.post(
      '/api/fluxcd/kustomizations/dashboard-test/non-existent-resource/resume'
    );

    // Assert: Response is 404 Not Found
    expect(response.status()).toBe(404);

    // Assert: Response Content-Type is application/json
    expect(response.headers()['content-type']).toContain('application/json');

    // Assert: Response body contains an error message
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('should return 405 when /suspend is called with GET instead of POST', async ({ request }) => {
    // Tests that the suspend endpoint only accepts POST, returning 405 for GET.

    // Act: Call the suspend endpoint with GET
    const response = await request.get(
      '/api/fluxcd/kustomizations/dashboard-test/kust-mut-suspend/suspend'
    );

    // Assert: Response is 405 Method Not Allowed
    expect(response.status()).toBe(405);
  });

  test('should return 405 when /resume is called with GET instead of POST', async ({ request }) => {
    // Tests that the resume endpoint only accepts POST, returning 405 for GET.

    // Act: Call the resume endpoint with GET
    const response = await request.get(
      '/api/fluxcd/kustomizations/dashboard-test/kust-mut-resume/resume'
    );

    // Assert: Response is 405 Method Not Allowed
    expect(response.status()).toBe(405);
  });
});
