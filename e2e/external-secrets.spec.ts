// Verifies: ES1 (docs/product/prd-external-secrets.md) — sole dedicated e2e spec for this AC.
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
