// Verifies: SC1 (docs/product/prd-secrets.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Secrets Tab
 *
 * TDD Green Phase: Tests activated after implementation.
 * These tests verify the behavior of the Secrets tab page,
 * which displays secrets as expandable accordions with reveal/hide functionality
 * for base64-decoded values.
 *
 * Test Fixtures:
 * - dashboard-test namespace
 * - test-secret (Opaque type): keys: username, password, api-key, config.yaml
 * - tls-secret (kubernetes.io/tls type): keys: tls.crt, tls.key
 *
 * Implemented Components:
 * - SecretsTab
 * - SecretAccordion
 * - SecretKeyValue
 */

test.describe('Secrets Tab - Basic Rendering', () => {
  test('should display secrets as accordions in the Secrets tab', async ({ page }) => {
    // Tests that secrets created by fixtures are displayed as accordion components

    // Arrange: Navigate to the Secrets tab
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Assert: Secrets tab page should be visible
    const secretsTab = page.getByTestId('secrets-tab');
    await expect(secretsTab).toBeVisible();

    // Assert: Should display secret accordions
    const secretAccordions = page.locator('[data-testid^="secret-accordion-"]');
    const accordionCount = await secretAccordions.count();
    expect(accordionCount).toBeGreaterThanOrEqual(2); // test-secret and tls-secret

    // Assert: test-secret accordion should be present
    const testSecretAccordion = page.getByTestId('secret-accordion-test-secret');
    await expect(testSecretAccordion).toBeVisible();

    // Assert: tls-secret accordion should be present
    const tlsSecretAccordion = page.getByTestId('secret-accordion-tls-secret');
    await expect(tlsSecretAccordion).toBeVisible();
  });
});

test.describe('Secrets Tab - Namespace Filtering', () => {
  test('should display only secrets from dashboard-test namespace', async ({ page }) => {
    // Tests that secrets are properly filtered by namespace

    // Arrange: Navigate to Secrets tab
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Assert: Should display secrets from dashboard-test namespace
    const testSecretAccordion = page.getByTestId('secret-accordion-test-secret');
    await expect(testSecretAccordion).toBeVisible();

    const tlsSecretAccordion = page.getByTestId('secret-accordion-tls-secret');
    await expect(tlsSecretAccordion).toBeVisible();

    // Assert: Each accordion should show namespace information
    const testSecretNamespace = testSecretAccordion.getByTestId('secret-namespace');
    await expect(testSecretNamespace).toHaveText('dashboard-test');

    const tlsSecretNamespace = tlsSecretAccordion.getByTestId('secret-namespace');
    await expect(tlsSecretNamespace).toHaveText('dashboard-test');
  });
});

test.describe('Secrets Tab - Secret Type Display', () => {
  test('should display secret type (Opaque, kubernetes.io/tls)', async ({ page }) => {
    // Tests that secret type is visible in accordion

    // Arrange: Navigate to Secrets tab
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Assert: test-secret should show Opaque type
    const testSecretAccordion = page.getByTestId('secret-accordion-test-secret');
    const testSecretType = testSecretAccordion.getByTestId('secret-type');
    await expect(testSecretType).toBeVisible();
    await expect(testSecretType).toHaveText('Opaque');

    // Assert: tls-secret should show kubernetes.io/tls type
    const tlsSecretAccordion = page.getByTestId('secret-accordion-tls-secret');
    const tlsSecretType = tlsSecretAccordion.getByTestId('secret-type');
    await expect(tlsSecretType).toBeVisible();
    await expect(tlsSecretType).toHaveText('kubernetes.io/tls');
  });
});
