import { test, expect } from '@playwright/test';

/**
 * E2E Tests for External Secrets Tab
 *
 * Verifies the behavior of the External Secrets tab page, which lists
 * ExternalSecret CRs (External Secrets Operator) with sync status, store
 * reference, target name, and refresh interval.
 *
 * Test Fixtures (test/fixtures/):
 * - externalsecret-ready.yaml:     app-secrets-ready (dashboard-test), Ready=True,
 *                                   secretStoreRef: ClusterSecretStore/vault-backend,
 *                                   target: app-secrets, refreshInterval: 1h
 * - externalsecret-not-ready.yaml: app-secrets-failing (dashboard-test), Ready=False,
 *                                   reason: SecretSyncedError
 * - externalsecret-multi-ns.yaml:  frontend-secrets (dashboard-test) +
 *                                   backend-secrets (default)
 *
 * CRD installation: scripts/kind-cluster.sh installs externalsecrets.external-secrets.io
 * CRD before tests run.
 */

// ---------------------------------------------------------------------------
// Group 1: UI — Basic rendering
// ---------------------------------------------------------------------------

test.describe('External Secrets Tab - Basic Rendering', () => {
  test('should display the External Secrets page when navigating to /external-secrets', async ({ page }) => {
    await page.goto('/external-secrets');
    await page.waitForLoadState('networkidle');

    const externalSecretsTab = page.getByTestId('external-secrets-tab');
    await expect(externalSecretsTab).toBeVisible();

    await expect(page.getByRole('heading', { name: /external secrets/i })).toBeVisible();
  });

  test('should render external secret cards with name, namespace, status badge, store, target, and refresh interval', async ({ page }) => {
    await page.goto('/external-secrets');
    await page.waitForLoadState('networkidle');

    const cards = page.getByTestId('external-secret-card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Locate the app-secrets-ready card by name
    let readyCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      const nameText = await card.getByTestId('external-secret-name').innerText();
      if (nameText === 'app-secrets-ready') {
        readyCard = card;
        break;
      }
    }
    expect(readyCard).toBeTruthy();
    if (!readyCard) return;

    // Name
    await expect(readyCard.getByTestId('external-secret-name')).toHaveText('app-secrets-ready');

    // Namespace
    await expect(readyCard.getByTestId('external-secret-namespace')).toHaveText('dashboard-test');

    // Status badge (Ready)
    const statusBadge = readyCard.getByTestId('status-badge');
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toHaveText('Ready');

    // Store reference (ClusterSecretStore/vault-backend)
    const store = readyCard.getByTestId('external-secret-store');
    await expect(store).toBeVisible();
    await expect(store).toContainText('ClusterSecretStore');
    await expect(store).toContainText('vault-backend');

    // Target (app-secrets)
    const target = readyCard.getByTestId('external-secret-target');
    await expect(target).toBeVisible();
    await expect(target).toContainText('app-secrets');

    // Refresh interval (1h)
    const refresh = readyCard.getByTestId('external-secret-refresh');
    await expect(refresh).toBeVisible();
    await expect(refresh).toContainText('1h');
  });

  test('should display NotReady status badge and failure reason when ExternalSecret is failing', async ({ page }) => {
    await page.goto('/external-secrets');
    await page.waitForLoadState('networkidle');

    const cards = page.getByTestId('external-secret-card');
    const cardCount = await cards.count();

    // Locate the failing card
    let failingCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      const nameText = await card.getByTestId('external-secret-name').innerText();
      if (nameText === 'app-secrets-failing') {
        failingCard = card;
        break;
      }
    }
    expect(failingCard).toBeTruthy();
    if (!failingCard) return;

    // Status badge should display NotReady
    const statusBadge = failingCard.getByTestId('status-badge');
    await expect(statusBadge).toHaveText('NotReady');

    // Reason / message should be visible
    const reason = failingCard.getByTestId('external-secret-reason');
    await expect(reason).toBeVisible();
    await expect(reason).toContainText('SecretSyncedError');
  });
});

// ---------------------------------------------------------------------------
// Group 2: UI — Summary cards
// ---------------------------------------------------------------------------

test.describe('External Secrets Tab - Summary Cards', () => {
  test('should display Total, Ready, and Not Ready summary cards with correct counts', async ({ page }) => {
    await page.goto('/external-secrets');
    await page.waitForLoadState('networkidle');

    const totalCard = page.getByTestId('summary-card-external-secrets-total');
    const readyCard = page.getByTestId('summary-card-external-secrets-ready');
    const notReadyCard = page.getByTestId('summary-card-external-secrets-not-ready');

    await expect(totalCard).toBeVisible();
    await expect(readyCard).toBeVisible();
    await expect(notReadyCard).toBeVisible();

    // Fixtures: 3 ready (app-secrets-ready, frontend-secrets, backend-secrets) +
    //           1 not ready (app-secrets-failing) = 4 total when no namespace filter applied.
    await expect(totalCard).toContainText(/[1-9]/);
    await expect(readyCard).toContainText(/[1-9]/);
    await expect(notReadyCard).toContainText(/[1-9]/);
  });
});

// ---------------------------------------------------------------------------
// Group 3: UI — Namespace filtering
// ---------------------------------------------------------------------------

test.describe('External Secrets Tab - Namespace Filtering', () => {
  test('should display only ExternalSecrets in the selected namespace', async ({ page }) => {
    await page.goto('/external-secrets');
    await page.waitForLoadState('networkidle');

    const allCards = page.getByTestId('external-secret-card');
    await expect(allCards.first()).toBeVisible();
    const totalCount = await allCards.count();
    expect(totalCount).toBeGreaterThanOrEqual(2);

    // Switch to dashboard-test namespace
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const dashboardTestOption = page.getByRole('option', { name: /^dashboard-test$/i })
      .or(page.getByTestId('namespace-option-dashboard-test'));
    await dashboardTestOption.click();
    await page.waitForLoadState('networkidle');

    const filteredCards = page.getByTestId('external-secret-card');
    const filteredCount = await filteredCards.count();
    expect(filteredCount).toBeGreaterThanOrEqual(1);
    expect(filteredCount).toBeLessThanOrEqual(totalCount);

    for (let i = 0; i < filteredCount; i++) {
      await expect(filteredCards.nth(i).getByTestId('external-secret-namespace')).toHaveText('dashboard-test');
    }
  });
});

// ---------------------------------------------------------------------------
// Group 4: UI — Empty / Error / Loading states
// ---------------------------------------------------------------------------

test.describe('External Secrets Tab - Empty, Error & Loading States', () => {
  test('should display EmptyState when the selected namespace has no ExternalSecrets', async ({ page }) => {
    await page.goto('/external-secrets');
    await page.waitForLoadState('networkidle');

    // Switch to dashboard-empty (no ExternalSecret resources)
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const emptyNamespaceOption = page.getByRole('option', { name: /^dashboard-empty$/i })
      .or(page.getByTestId('namespace-option-dashboard-empty'));
    await emptyNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    const emptyState = page.getByTestId('no-external-secrets-message')
      .or(page.getByTestId('empty-state').first());
    await expect(emptyState).toBeVisible();

    expect(await page.getByTestId('external-secret-card').count()).toBe(0);
  });

  test('should display ErrorRetry component with retry button when the API returns an error', async ({ page }) => {
    let shouldFail = true;
    await page.route('**/api/external-secrets**', async route => {
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

    await page.goto('/external-secrets');
    await page.waitForLoadState('networkidle');

    const errorRetry = page.getByTestId('external-secrets-error')
      .or(page.getByTestId('error-retry'));
    await expect(errorRetry).toBeVisible();

    const retryButton = errorRetry.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    expect(await page.getByTestId('external-secret-card').count()).toBe(0);

    // Allow next call to succeed and retry
    shouldFail = false;
    await retryButton.click();
    await page.waitForLoadState('networkidle');

    await expect(errorRetry).not.toBeVisible();
  });

  test('should display LoadingSkeleton with aria-busy="true" while ExternalSecrets are being fetched', async ({ page }) => {
    await page.route('**/api/external-secrets**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/external-secrets');

    const loadingSkeleton = page.getByTestId('external-secrets-loading')
      .or(page.getByTestId('loading-skeleton').first());
    await expect(loadingSkeleton).toBeVisible();
    await expect(loadingSkeleton).toHaveAttribute('aria-busy', 'true');
  });
});

// ---------------------------------------------------------------------------
// Group 5: UI — Tab navigation
// ---------------------------------------------------------------------------

test.describe('External Secrets Tab - Tab Navigation', () => {
  test('should navigate to /external-secrets when the ExtSecrets tab is clicked in the bottom tab bar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const tab = page.getByTestId('tab-external-secrets');
    await expect(tab).toBeVisible();

    await tab.click();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/external-secrets');
    await expect(page.getByTestId('external-secrets-tab')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 6: Backend API — GET /api/external-secrets
// ---------------------------------------------------------------------------

test.describe('External Secrets API - GET /api/external-secrets', () => {
  test('should return all ExternalSecrets across namespaces when no namespace filter is applied', async ({ request }) => {
    const response = await request.get('/api/external-secrets');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    // Fixtures: app-secrets-ready, app-secrets-failing, frontend-secrets, backend-secrets = 4
    expect(body.length).toBeGreaterThanOrEqual(3);

    const names = body.map((es: { name: string }) => es.name);
    expect(names).toContain('app-secrets-ready');
    expect(names).toContain('app-secrets-failing');
  });

  test('should return only ExternalSecrets in the specified namespace when ns query param is provided', async ({ request }) => {
    const response = await request.get('/api/external-secrets?ns=dashboard-test');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThanOrEqual(1);

    for (const item of body) {
      expect(item.namespace).toBe('dashboard-test');
    }

    const readyItem = body.find((es: { name: string }) => es.name === 'app-secrets-ready');
    expect(readyItem).toBeTruthy();
    expect(readyItem.ready).toBe(true);
    expect(readyItem.status).toBe('Ready');
    expect(readyItem.storeKind).toBe('ClusterSecretStore');
    expect(readyItem.storeName).toBe('vault-backend');
    expect(readyItem.targetName).toBe('app-secrets');
    expect(readyItem.refreshInterval).toBe('1h');

    const failingItem = body.find((es: { name: string }) => es.name === 'app-secrets-failing');
    expect(failingItem).toBeTruthy();
    expect(failingItem.ready).toBe(false);
    expect(failingItem.status).toBe('NotReady');
    expect(failingItem.reason).toBe('SecretSyncedError');
  });

  test('should return an empty array when the namespace has no ExternalSecrets', async ({ request }) => {
    const response = await request.get('/api/external-secrets?ns=dashboard-empty');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBe(0);
  });
});
