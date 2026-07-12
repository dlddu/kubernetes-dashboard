// Verifies: ES3 (docs/product/prd-external-secrets.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

test.describe('External Secrets Tab - Basic Rendering', () => {
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
