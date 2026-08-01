// Verifies: SC3 (docs/product/prd-secrets.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

/**
 * E2E test for the app-owned side of SC3 (External Secret 재동기화 유도 — 대상
 * Secret 삭제): a secret's delete button opens the DeleteConfirmDialog (name +
 * namespace + "This action cannot be undone."), and confirming calls
 * deleteSecret(ns, name), issuing a real DELETE on /api/secrets/:ns/:name
 * (frontend api/secrets.ts, SecretsTab.tsx). On success SecretsTab refetches
 * (handleDeleteSuccess -> refresh), so the removed secret drops out of the list.
 *
 * This spec runs against the real kind cluster with NO network mocking. It owns a
 * dedicated fixture, secret-mut-delete (test/fixtures/secret-mut-fixtures.yaml),
 * that no other spec reads. The confirm test really deletes it; because SC1
 * (secrets-tab), SC2 (secrets-reveal) and SC4 (secrets-data-states) only target
 * test-secret / tls-secret by testid and assert at least two accordions, deleting
 * this third fixture never affects them (mirrors the fluxcd-mut-fixtures.yaml
 * isolation used by the FluxCD mutating specs).
 *
 * Scope note: the kind harness installs the ExternalSecret CRD only, with no ESO
 * controller, so the AC's "ESO re-syncs the secret from the external store"
 * recreation step cannot happen here — that is out of harness scope. This spec
 * verifies the app-owned behaviour end to end: the real delete request fires and
 * the target Secret is actually removed.
 */

const TARGET = { name: 'secret-mut-delete', namespace: 'dashboard-test' };
const TARGET_TESTID = `secret-accordion-${TARGET.name}`;
const DELETE_PATH = `/api/secrets/${TARGET.namespace}/${TARGET.name}`;

test.describe('Secrets Tab - Delete flow against a dedicated fixture (SC3)', () => {
  test('delete button opens a confirm dialog naming the target secret', async ({ page }) => {
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    const accordion = page.getByTestId(TARGET_TESTID);
    await expect(accordion).toBeVisible();

    // Act: click the target secret's delete button.
    await accordion.getByTestId('secret-delete-button').click();

    // Assert: the confirm dialog names the target and warns it is irreversible.
    const dialog = page.getByTestId('delete-confirm-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(TARGET.name);
    await expect(dialog).toContainText(TARGET.namespace);
    await expect(dialog).toContainText(/cannot be undone/i);

    // Assert: both Confirm (Delete) and Cancel controls are present.
    await expect(dialog.getByTestId('confirm-button')).toBeVisible();
    await expect(dialog.getByTestId('cancel-button')).toBeVisible();
  });

  test('cancelling closes the dialog and leaves the secret in place', async ({ page }) => {
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    const accordion = page.getByTestId(TARGET_TESTID);
    await expect(accordion).toBeVisible();

    await accordion.getByTestId('secret-delete-button').click();
    const dialog = page.getByTestId('delete-confirm-dialog');
    await expect(dialog).toBeVisible();

    // Act: cancel — no DELETE should be issued.
    await dialog.getByTestId('cancel-button').click();

    // Assert: the dialog closes and the secret is still listed.
    await expect(dialog).not.toBeVisible();
    await expect(accordion).toBeVisible();
  });

  // Destructive: really deletes the dedicated fixture. Declared last so, under
  // playwright.config fullyParallel:false (in-file sequential execution), the two
  // non-destructive tests above always run first against the intact fixture.
  test('confirming issues a real DELETE and removes the secret from the list', async ({ page }) => {
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    const accordion = page.getByTestId(TARGET_TESTID);
    await expect(accordion).toBeVisible();

    await accordion.getByTestId('secret-delete-button').click();
    const dialog = page.getByTestId('delete-confirm-dialog');
    await expect(dialog).toBeVisible();

    // Act: confirm — this issues a REAL DELETE against the dedicated fixture.
    const deleteResponse = page.waitForResponse(
      (res) => res.request().method() === 'DELETE' && new URL(res.url()).pathname === DELETE_PATH,
    );
    await dialog.getByTestId('confirm-button').click();
    const response = await deleteResponse;

    // Assert: the backend accepted the delete.
    expect(response.ok()).toBeTruthy();

    // Assert: on success the dialog closes and, after the refetch, the really
    // deleted secret is gone from the list.
    await expect(dialog).not.toBeVisible();
    await expect(page.getByTestId(TARGET_TESTID)).toHaveCount(0);

    // Sanity: the shared fixtures the other secrets specs rely on are untouched.
    await expect(page.getByTestId('secret-accordion-test-secret')).toBeVisible();
  });
});
