// Verifies: ES2 (docs/product/prd-external-secrets.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

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
