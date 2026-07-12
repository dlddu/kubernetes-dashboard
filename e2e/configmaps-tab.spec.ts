// Verifies: CF1 (docs/product/prd-configmaps.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

/**
 * E2E Tests for ConfigMaps Tab
 *
 * These tests verify the behavior of the ConfigMaps tab page,
 * which displays config maps as expandable accordions with their
 * key/value data shown inline (read-only, no masking).
 *
 * Test Fixtures (dashboard-test namespace):
 * - test-config: keys: app.properties, nginx.conf
 * - app-settings: keys: feature.flags, log.level
 *
 * Implemented Components:
 * - ConfigMapsTab
 * - ConfigMapAccordion
 * - ConfigMapKeyValue
 */

test.describe('ConfigMaps Tab - Basic Rendering', () => {
  test('should display configmaps as accordions in the ConfigMaps tab', async ({ page }) => {
    // Arrange: Navigate to the ConfigMaps tab
    await page.goto('/configmaps');
    await page.waitForLoadState('networkidle');

    // Assert: ConfigMaps tab page should be visible
    const configMapsTab = page.getByTestId('configmaps-tab');
    await expect(configMapsTab).toBeVisible();

    // Assert: Should display configmap accordions
    const configMapAccordions = page.locator('[data-testid^="configmap-accordion-"]');
    const accordionCount = await configMapAccordions.count();
    expect(accordionCount).toBeGreaterThanOrEqual(2); // test-config and app-settings

    // Assert: test-config accordion should be present
    const testConfigAccordion = page.getByTestId('configmap-accordion-test-config');
    await expect(testConfigAccordion).toBeVisible();

    // Assert: app-settings accordion should be present
    const appSettingsAccordion = page.getByTestId('configmap-accordion-app-settings');
    await expect(appSettingsAccordion).toBeVisible();
  });
});

test.describe('ConfigMaps Tab - Namespace Filtering', () => {
  test('should display configmaps from dashboard-test namespace', async ({ page }) => {
    // Arrange: Navigate to ConfigMaps tab
    await page.goto('/configmaps');
    await page.waitForLoadState('networkidle');

    // Assert: Should display configmaps from dashboard-test namespace
    const testConfigAccordion = page.getByTestId('configmap-accordion-test-config');
    await expect(testConfigAccordion).toBeVisible();

    const appSettingsAccordion = page.getByTestId('configmap-accordion-app-settings');
    await expect(appSettingsAccordion).toBeVisible();

    // Assert: Each accordion should show namespace information
    const testConfigNamespace = testConfigAccordion.getByTestId('configmap-namespace');
    await expect(testConfigNamespace).toHaveText('dashboard-test');

    const appSettingsNamespace = appSettingsAccordion.getByTestId('configmap-namespace');
    await expect(appSettingsNamespace).toHaveText('dashboard-test');
  });
});
