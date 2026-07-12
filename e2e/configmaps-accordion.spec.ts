// Verifies: CF2 (docs/product/prd-configmaps.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

test.describe('ConfigMaps Tab - Accordion Expand/Collapse', () => {
  test('should expand accordion and display key/value list with inline values', async ({ page }) => {
    // Arrange: Navigate to the ConfigMaps tab
    await page.goto('/configmaps');
    await page.waitForLoadState('networkidle');

    // Assert: test-config accordion should be visible but collapsed initially
    const testConfigAccordion = page.getByTestId('configmap-accordion-test-config');
    await expect(testConfigAccordion).toBeVisible();

    // Assert: Key list should not be visible when collapsed
    const keyListCollapsed = testConfigAccordion.getByTestId('configmap-key-list');
    await expect(keyListCollapsed).not.toBeVisible();

    // Act: Click the accordion header to expand
    const accordionHeader = testConfigAccordion.getByTestId('configmap-accordion-header');
    await accordionHeader.click();

    // Assert: Key list should now be visible
    const keyListExpanded = testConfigAccordion.getByTestId('configmap-key-list');
    await expect(keyListExpanded).toBeVisible();

    // Assert: Should display all keys from test-config
    const keyItems = keyListExpanded.locator('[data-testid^="configmap-key-value-"]');
    const keyCount = await keyItems.count();
    expect(keyCount).toBe(2); // app.properties, nginx.conf

    // Assert: All expected keys should be present
    await expect(keyListExpanded.getByText('app.properties')).toBeVisible();
    await expect(keyListExpanded.getByText('nginx.conf')).toBeVisible();

    // Assert: Values are displayed inline immediately (no reveal needed)
    const appPropertiesKeyValue = keyListExpanded.getByTestId('configmap-key-value-app.properties');
    const valueElement = appPropertiesKeyValue.getByTestId('configmap-value');
    await expect(valueElement).toBeVisible();
    const valueText = await valueElement.innerText();
    expect(valueText).toContain('log.level=debug');

    // Assert: No reveal/hide button exists (configmaps are not sensitive)
    await expect(appPropertiesKeyValue.getByTestId('reveal-button')).toHaveCount(0);

    // Assert: Copy button is available
    await expect(appPropertiesKeyValue.getByTestId('copy-button')).toBeVisible();
  });
});

test.describe('ConfigMaps Tab - Multi-Accordion Behavior', () => {
  test('should collapse previous accordion when a different configmap is clicked', async ({ page }) => {
    // Arrange: Navigate to ConfigMaps tab
    await page.goto('/configmaps');
    await page.waitForLoadState('networkidle');

    // Act: Expand test-config accordion
    const testConfigAccordion = page.getByTestId('configmap-accordion-test-config');
    const testConfigHeader = testConfigAccordion.getByTestId('configmap-accordion-header');
    await testConfigHeader.click();

    // Assert: test-config key list should be visible
    const testConfigKeyList = testConfigAccordion.getByTestId('configmap-key-list');
    await expect(testConfigKeyList).toBeVisible();

    // Act: Click app-settings accordion
    const appSettingsAccordion = page.getByTestId('configmap-accordion-app-settings');
    const appSettingsHeader = appSettingsAccordion.getByTestId('configmap-accordion-header');
    await appSettingsHeader.click();

    // Assert: app-settings key list should now be visible
    const appSettingsKeyList = appSettingsAccordion.getByTestId('configmap-key-list');
    await expect(appSettingsKeyList).toBeVisible();

    // Assert: app-settings should have expected keys
    await expect(appSettingsKeyList.getByText('feature.flags')).toBeVisible();
    await expect(appSettingsKeyList.getByText('log.level')).toBeVisible();

    // Assert: test-config key list should now be collapsed/hidden
    await expect(testConfigKeyList).not.toBeVisible();

    // Assert: Only one accordion should be expanded at a time
    const expandedKeyLists = page.getByTestId('configmap-key-list').locator('visible=true');
    const expandedCount = await expandedKeyLists.count();
    expect(expandedCount).toBe(1); // Only app-settings should be expanded
  });
});

test.describe('ConfigMaps Tab - Accessibility', () => {
  test('should have proper ARIA attributes for accordions', async ({ page }) => {
    // Arrange: Navigate to ConfigMaps tab
    await page.goto('/configmaps');
    await page.waitForLoadState('networkidle');

    // Act: Get first accordion
    const firstAccordion = page.locator('[data-testid^="configmap-accordion-"]').first();
    await expect(firstAccordion).toBeVisible();

    // Assert: Accordion header should have button role
    const accordionHeader = firstAccordion.getByTestId('configmap-accordion-header');
    await expect(accordionHeader).toHaveAttribute('role', 'button');

    // Assert: Should have aria-expanded attribute
    await expect(accordionHeader).toHaveAttribute('aria-expanded');

    // Act: Expand accordion
    await accordionHeader.click();

    // Assert: aria-expanded should be true when expanded
    await expect(accordionHeader).toHaveAttribute('aria-expanded', 'true');

    // Assert: Should have aria-controls pointing to content panel
    await expect(accordionHeader).toHaveAttribute('aria-controls');
  });

  test('should support keyboard navigation for accordions', async ({ page }) => {
    // Arrange: Navigate to ConfigMaps tab
    await page.goto('/configmaps');
    await page.waitForLoadState('networkidle');

    // Act: Focus first accordion header
    const firstAccordionHeader = page.locator('[data-testid^="configmap-accordion-"]').first()
      .getByTestId('configmap-accordion-header');
    await firstAccordionHeader.focus();

    // Assert: Header should be focused
    await expect(firstAccordionHeader).toBeFocused();

    // Act: Press Enter to expand
    await firstAccordionHeader.press('Enter');

    // Assert: Key list should be visible
    const firstAccordion = page.locator('[data-testid^="configmap-accordion-"]').first();
    const keyList = firstAccordion.getByTestId('configmap-key-list');
    await expect(keyList).toBeVisible();

    // Assert: aria-expanded should be true
    await expect(firstAccordionHeader).toHaveAttribute('aria-expanded', 'true');
  });
});
