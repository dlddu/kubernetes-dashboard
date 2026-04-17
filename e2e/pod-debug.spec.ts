import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * E2E Tests for Pod Debug (Ephemeral Container) Feature
 *
 * Exercises the full flow: clicking the Debug button on a pod card opens the
 * DebugPodDialog, submitting it POSTs to /api/pods/debug/{ns}/{name}, which
 * injects an ephemeral container. On success the frontend automatically opens
 * the PodExecPanel targeting the new container.
 *
 * Related features:
 *   - Debug button on UnhealthyPodCard
 *   - DebugPodDialog with image presets and target container selector
 *   - Ephemeral container creation API: POST /api/pods/debug/{namespace}/{name}
 *   - Container selector in PodExecPanel lists ephemeral containers
 */

// ---------------------------------------------------------------
// API: POST /api/pods/debug/{namespace}/{name} — validation
// ---------------------------------------------------------------

test.describe('Pod Debug API - parameter validation', () => {
  test('returns 400 when the body is missing or invalid JSON', async ({ request }) => {
    const response = await request.post('/api/pods/debug/dashboard-test/busybox-test', {
      data: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(400);
  });

  test('returns 400 when image field is empty', async ({ request }) => {
    const response = await request.post('/api/pods/debug/dashboard-test/busybox-test', {
      data: { image: '' },
    });
    expect(response.status()).toBe(400);
  });

  test('returns 404 when pod does not exist', async ({ request }) => {
    const response = await request.post(
      '/api/pods/debug/dashboard-test/nonexistent-pod-xyz',
      { data: { image: 'busybox:1.36' } },
    );
    expect(response.status()).toBe(404);
  });

  test('returns 400 when the URL path is malformed', async ({ request }) => {
    const response = await request.post('/api/pods/debug/dashboard-test', {
      data: { image: 'busybox:1.36' },
    });
    expect(response.status()).toBe(400);
  });

  test('returns 409 when the requested name collides with an existing container', async ({
    request,
  }) => {
    // busybox-test already has a container named "busybox"
    const response = await request.post('/api/pods/debug/dashboard-test/busybox-test', {
      data: { image: 'busybox:1.36', name: 'busybox' },
    });
    expect(response.status()).toBe(409);
  });
});

// ---------------------------------------------------------------
// UI: Debug button on PodCard
// ---------------------------------------------------------------

test.describe('PodCard UI - Debug button', () => {
  test('renders a Debug button on every pod card', async ({ page }) => {
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const cards = page.getByTestId('pod-card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < cardCount; i++) {
      const debugButton = cards.nth(i).getByTestId('pod-debug-button');
      await expect(debugButton).toBeVisible();
      await expect(debugButton).toContainText(/debug/i);
    }
  });

  test('opens the DebugPodDialog when the Debug button is clicked', async ({ page }) => {
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstCard = page.getByTestId('pod-card').first();
    await firstCard.getByTestId('pod-debug-button').click();

    await expect(page.getByTestId('debug-pod-dialog')).toBeVisible();
  });

  test('does not open the log panel when the Debug button is clicked', async ({
    page,
  }) => {
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    const firstCard = page.getByTestId('pod-card').first();
    await firstCard.getByTestId('pod-debug-button').click();

    await expect(page.getByTestId('debug-pod-dialog')).toBeVisible();
    await expect(page.locator('[data-testid="log-panel"]')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------
// UI: DebugPodDialog fields
// ---------------------------------------------------------------

async function openDebugDialogForBusybox(page: Page): Promise<Locator> {
  await page.goto('/pods');
  await page.waitForLoadState('networkidle');

  const cards = page.getByTestId('pod-card');
  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const name = await card.getByTestId('pod-name').innerText();
    if (name === 'busybox-test') {
      await card.getByTestId('pod-debug-button').click();
      return page.getByTestId('debug-pod-dialog');
    }
  }
  throw new Error('busybox-test fixture pod not found');
}

test.describe('DebugPodDialog UI - fields', () => {
  test('shows the preset image dropdown with netshoot selected by default', async ({
    page,
  }) => {
    const dialog = await openDebugDialogForBusybox(page);
    const select = dialog.getByTestId('debug-image-select');
    await expect(select).toBeVisible();
    await expect(select).toHaveValue('nicolaka/netshoot:latest');

    const options = select.locator('option');
    expect(await options.count()).toBeGreaterThanOrEqual(3);
    // "Custom..." option is present.
    await expect(select.locator('option[value="__custom__"]')).toHaveCount(1);
  });

  test('reveals the custom image input when "Custom..." is selected', async ({
    page,
  }) => {
    const dialog = await openDebugDialogForBusybox(page);

    await expect(
      dialog.locator('[data-testid="debug-image-custom-input"]'),
    ).toHaveCount(0);

    await dialog
      .getByTestId('debug-image-select')
      .selectOption({ value: '__custom__' });

    await expect(dialog.getByTestId('debug-image-custom-input')).toBeVisible();
  });

  test('lists the target container options including "None"', async ({ page }) => {
    const dialog = await openDebugDialogForBusybox(page);
    const target = dialog.getByTestId('debug-target-select');
    await expect(target).toBeVisible();
    // "None" is the empty-value option.
    await expect(target.locator('option[value=""]')).toHaveCount(1);
    // The existing container from the fixture is listed.
    await expect(target.locator('option[value="busybox"]')).toHaveCount(1);
  });

  test('can be cancelled with the Cancel button', async ({ page }) => {
    const dialog = await openDebugDialogForBusybox(page);
    await dialog.getByTestId('debug-pod-cancel').click();
    await expect(dialog).not.toBeVisible();
  });
});

// ---------------------------------------------------------------
// UI: Success flow — ephemeral container created and shell opens
// ---------------------------------------------------------------

test.describe('DebugPodDialog UI - success flow', () => {
  test('creates an ephemeral container and opens the exec panel', async ({
    page,
  }) => {
    const dialog = await openDebugDialogForBusybox(page);

    // Use busybox for the ephemeral image since it is already pulled by the fixture
    // and should start quickly inside the kind cluster without external network.
    await dialog
      .getByTestId('debug-image-select')
      .selectOption({ value: 'busybox:1.36' });
    await dialog
      .getByTestId('debug-target-select')
      .selectOption({ value: 'busybox' });

    await dialog.getByTestId('debug-pod-submit').click();

    // Dialog closes; exec panel opens once the ephemeral container is ready.
    await expect(page.getByTestId('exec-panel')).toBeVisible({ timeout: 30_000 });

    // The container selector must include an "Ephemeral Containers" optgroup.
    const selector = page.getByTestId('exec-panel-container-selector');
    await expect(selector).toBeVisible();
    await expect(selector.locator('optgroup[label="Ephemeral Containers"]')).toHaveCount(
      1,
    );

    // The currently-selected option must be the generated debugger-* container.
    const selected = await selector.inputValue();
    expect(selected).toMatch(/^debugger-\d+$/);
  });
});

// ---------------------------------------------------------------
// UI: Failure flow — image pull failure surfaces in the dialog
// ---------------------------------------------------------------

test.describe('DebugPodDialog UI - failure flow', () => {
  test('shows an inline error when the image fails to pull', async ({ page }) => {
    const dialog = await openDebugDialogForBusybox(page);

    await dialog
      .getByTestId('debug-image-select')
      .selectOption({ value: '__custom__' });
    await dialog
      .getByTestId('debug-image-custom-input')
      .fill('this-image-does-not-exist-1234567:v0');

    await dialog.getByTestId('debug-pod-submit').click();

    // The handler polls for readiness; an ImagePull* status is reported as a 500
    // error which DebugPodDialog surfaces inline without closing.
    await expect(dialog.getByTestId('debug-pod-error')).toBeVisible({
      timeout: 60_000,
    });
    await expect(dialog).toBeVisible();
  });
});
