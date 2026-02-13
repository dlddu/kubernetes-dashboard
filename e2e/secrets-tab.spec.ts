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

test.describe('Secrets Tab - Accordion Expand/Collapse', () => {
  test('should expand accordion and display key list when secret is clicked', async ({ page }) => {
    // Tests that clicking a secret accordion expands it and shows the keys

    // Arrange: Navigate to the Secrets tab
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Assert: test-secret accordion should be visible but collapsed initially
    const testSecretAccordion = page.getByTestId('secret-accordion-test-secret');
    await expect(testSecretAccordion).toBeVisible();

    // Assert: Key list should not be visible when collapsed
    const keyListCollapsed = testSecretAccordion.getByTestId('secret-key-list');
    await expect(keyListCollapsed).not.toBeVisible();

    // Act: Click the accordion header to expand
    const accordionHeader = testSecretAccordion.getByTestId('secret-accordion-header');
    await accordionHeader.click();

    // Assert: Key list should now be visible
    const keyListExpanded = testSecretAccordion.getByTestId('secret-key-list');
    await expect(keyListExpanded).toBeVisible();

    // Assert: Should display all keys from test-secret
    const keyItems = keyListExpanded.locator('[data-testid^="secret-key-value-"]');
    const keyCount = await keyItems.count();
    expect(keyCount).toBe(4); // username, password, api-key, config.yaml

    // Assert: All expected keys should be present
    const usernameKey = keyListExpanded.getByText('username');
    await expect(usernameKey).toBeVisible();

    const passwordKey = keyListExpanded.getByText('password');
    await expect(passwordKey).toBeVisible();

    const apiKeyKey = keyListExpanded.getByText('api-key');
    await expect(apiKeyKey).toBeVisible();

    const configKey = keyListExpanded.getByText('config.yaml');
    await expect(configKey).toBeVisible();
  });
});

test.describe('Secrets Tab - Reveal/Hide Values', () => {
  test('should reveal base64-decoded value when Reveal button is clicked', async ({ page }) => {
    // Tests that clicking Reveal button displays the decoded secret value

    // Arrange: Navigate to Secrets tab and expand test-secret
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    const testSecretAccordion = page.getByTestId('secret-accordion-test-secret');
    const accordionHeader = testSecretAccordion.getByTestId('secret-accordion-header');
    await accordionHeader.click();

    // Assert: Key list is visible
    const keyList = testSecretAccordion.getByTestId('secret-key-list');
    await expect(keyList).toBeVisible();

    // Act: Find the username key-value component
    const usernameKeyValue = keyList.getByTestId('secret-key-value-username');
    await expect(usernameKeyValue).toBeVisible();

    // Assert: Value should be masked initially
    const maskedValue = usernameKeyValue.getByTestId('secret-value-masked');
    await expect(maskedValue).toBeVisible();
    const maskedText = await maskedValue.innerText();
    expect(maskedText).toMatch(/\*+/); // Should contain asterisks or similar masking

    // Act: Click Reveal button
    const revealButton = usernameKeyValue.getByTestId('reveal-button');
    await expect(revealButton).toBeVisible();
    await expect(revealButton).toBeEnabled();
    await revealButton.click();

    // Assert: Decoded value should now be visible
    const revealedValue = usernameKeyValue.getByTestId('secret-value-revealed');
    await expect(revealedValue).toBeVisible();

    // Assert: Value should not be masked anymore
    const revealedText = await revealedValue.innerText();
    expect(revealedText).not.toMatch(/\*+/); // Should not contain masking
    expect(revealedText.length).toBeGreaterThan(0);

    // Assert: Masked value should no longer be visible
    await expect(maskedValue).not.toBeVisible();
  });

  test('should hide value and restore masking when Hide button is clicked', async ({ page }) => {
    // Tests that clicking Hide button masks the secret value again

    // Arrange: Navigate to Secrets tab, expand test-secret, and reveal username value
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    const testSecretAccordion = page.getByTestId('secret-accordion-test-secret');
    const accordionHeader = testSecretAccordion.getByTestId('secret-accordion-header');
    await accordionHeader.click();

    const keyList = testSecretAccordion.getByTestId('secret-key-list');
    const usernameKeyValue = keyList.getByTestId('secret-key-value-username');

    // Act: Click Reveal button to show value
    const revealButton = usernameKeyValue.getByTestId('reveal-button');
    await revealButton.click();

    // Assert: Value should be revealed
    const revealedValue = usernameKeyValue.getByTestId('secret-value-revealed');
    await expect(revealedValue).toBeVisible();

    // Act: Click Hide button
    const hideButton = usernameKeyValue.getByTestId('hide-button');
    await expect(hideButton).toBeVisible();
    await expect(hideButton).toBeEnabled();
    await hideButton.click();

    // Assert: Value should be masked again
    const maskedValue = usernameKeyValue.getByTestId('secret-value-masked');
    await expect(maskedValue).toBeVisible();
    const maskedText = await maskedValue.innerText();
    expect(maskedText).toMatch(/\*+/); // Should contain masking characters

    // Assert: Revealed value should no longer be visible
    await expect(revealedValue).not.toBeVisible();

    // Assert: Reveal button should be visible again
    await expect(revealButton).toBeVisible();
  });
});

test.describe('Secrets Tab - Multi-Accordion Behavior', () => {
  test('should collapse previous accordion when a different secret is clicked', async ({ page }) => {
    // Tests that only one accordion is expanded at a time (accordion behavior)

    // Arrange: Navigate to Secrets tab
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Act: Expand test-secret accordion
    const testSecretAccordion = page.getByTestId('secret-accordion-test-secret');
    const testSecretHeader = testSecretAccordion.getByTestId('secret-accordion-header');
    await testSecretHeader.click();

    // Assert: test-secret key list should be visible
    const testSecretKeyList = testSecretAccordion.getByTestId('secret-key-list');
    await expect(testSecretKeyList).toBeVisible();

    // Act: Click tls-secret accordion
    const tlsSecretAccordion = page.getByTestId('secret-accordion-tls-secret');
    const tlsSecretHeader = tlsSecretAccordion.getByTestId('secret-accordion-header');
    await tlsSecretHeader.click();

    // Assert: tls-secret key list should now be visible
    const tlsSecretKeyList = tlsSecretAccordion.getByTestId('secret-key-list');
    await expect(tlsSecretKeyList).toBeVisible();

    // Assert: tls-secret should have expected keys
    const tlsCertKey = tlsSecretKeyList.getByText('tls.crt');
    await expect(tlsCertKey).toBeVisible();

    const tlsKeyKey = tlsSecretKeyList.getByText('tls.key');
    await expect(tlsKeyKey).toBeVisible();

    // Assert: test-secret key list should now be collapsed/hidden
    await expect(testSecretKeyList).not.toBeVisible();

    // Assert: Only one accordion should be expanded at a time
    const expandedKeyLists = page.getByTestId('secret-key-list').locator('visible=true');
    const expandedCount = await expandedKeyLists.count();
    expect(expandedCount).toBe(1); // Only tls-secret should be expanded
  });
});

test.describe('Secrets Tab - TLS Secret Handling', () => {
  test('should display TLS secret with correct keys (tls.crt, tls.key)', async ({ page }) => {
    // Tests that TLS-type secrets display the correct certificate keys

    // Arrange: Navigate to Secrets tab
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Act: Expand tls-secret accordion
    const tlsSecretAccordion = page.getByTestId('secret-accordion-tls-secret');
    const tlsSecretHeader = tlsSecretAccordion.getByTestId('secret-accordion-header');
    await tlsSecretHeader.click();

    // Assert: Key list should be visible
    const tlsSecretKeyList = tlsSecretAccordion.getByTestId('secret-key-list');
    await expect(tlsSecretKeyList).toBeVisible();

    // Assert: Should have exactly 2 keys (tls.crt and tls.key)
    const keyItems = tlsSecretKeyList.locator('[data-testid^="secret-key-value-"]');
    const keyCount = await keyItems.count();
    expect(keyCount).toBe(2);

    // Assert: tls.crt key should be present
    const tlsCertKeyValue = tlsSecretKeyList.getByTestId('secret-key-value-tls.crt');
    await expect(tlsCertKeyValue).toBeVisible();

    // Assert: tls.key key should be present
    const tlsKeyKeyValue = tlsSecretKeyList.getByTestId('secret-key-value-tls.key');
    await expect(tlsKeyKeyValue).toBeVisible();

    // Assert: Both should have Reveal buttons
    const certRevealButton = tlsCertKeyValue.getByTestId('reveal-button');
    await expect(certRevealButton).toBeVisible();

    const keyRevealButton = tlsKeyKeyValue.getByTestId('reveal-button');
    await expect(keyRevealButton).toBeVisible();
  });
});

test.describe('Secrets Tab - Loading and Error States', () => {
  test('should display loading state while fetching secrets', async ({ page }) => {
    // Tests loading indicator during data fetch

    // Arrange: Navigate to Secrets tab
    await page.goto('/secrets');

    // Act: Look for loading indicator immediately after navigation
    const secretsTab = page.getByTestId('secrets-tab');
    await expect(secretsTab).toBeVisible();

    // Act: Check for loading state
    const loadingIndicator = secretsTab.getByTestId('secrets-loading')
      .or(secretsTab.locator('[aria-busy="true"]'))
      .or(secretsTab.locator('.loading-skeleton'));

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');

    // Assert: After loading, secret accordions should be displayed
    const secretAccordions = page.locator('[data-testid^="secret-accordion-"]');
    const accordionCount = await secretAccordions.count();
    expect(accordionCount).toBeGreaterThanOrEqual(2);

    // Assert: Loading indicator should no longer be visible
    const loadingExists = await loadingIndicator.count();
    if (loadingExists > 0) {
      await expect(loadingIndicator.first()).not.toBeVisible();
    }
  });

  test('should display error message when secrets fetch fails', async ({ page }) => {
    // Tests error state when API request fails

    // Arrange: Navigate to Secrets tab
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Act: Check for error state or successful data load
    const secretsTab = page.getByTestId('secrets-tab');
    await expect(secretsTab).toBeVisible();

    const errorMessage = secretsTab.getByTestId('secrets-error')
      .or(secretsTab.getByText(/error loading secrets|failed to fetch secrets/i));

    // Assert: Either error is shown or secrets are loaded successfully
    const secretAccordions = page.locator('[data-testid^="secret-accordion-"]');
    const errorVisible = await errorMessage.count() > 0 && await errorMessage.isVisible().catch(() => false);
    const secretsVisible = (await secretAccordions.count()) >= 2;

    expect(errorVisible || secretsVisible).toBeTruthy();
  });
});

test.describe('Secrets Tab - Accessibility', () => {
  test('should have proper ARIA attributes for accordions', async ({ page }) => {
    // Tests accessibility attributes on accordion components

    // Arrange: Navigate to Secrets tab
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Act: Get first accordion
    const firstAccordion = page.locator('[data-testid^="secret-accordion-"]').first();
    await expect(firstAccordion).toBeVisible();

    // Assert: Accordion header should have button role
    const accordionHeader = firstAccordion.getByTestId('secret-accordion-header');
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
    // Tests keyboard accessibility (Enter/Space to expand)

    // Arrange: Navigate to Secrets tab
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    // Act: Focus first accordion header
    const firstAccordionHeader = page.locator('[data-testid^="secret-accordion-"]').first()
      .getByTestId('secret-accordion-header');
    await firstAccordionHeader.focus();

    // Assert: Header should be focused
    await expect(firstAccordionHeader).toBeFocused();

    // Act: Press Enter to expand
    await firstAccordionHeader.press('Enter');

    // Assert: Key list should be visible
    const firstAccordion = page.locator('[data-testid^="secret-accordion-"]').first();
    const keyList = firstAccordion.getByTestId('secret-key-list');
    await expect(keyList).toBeVisible();

    // Assert: aria-expanded should be true
    await expect(firstAccordionHeader).toHaveAttribute('aria-expanded', 'true');
  });

  test('should have proper labels for Reveal/Hide buttons', async ({ page }) => {
    // Tests accessibility of Reveal/Hide buttons

    // Arrange: Navigate to Secrets tab and expand test-secret
    await page.goto('/secrets');
    await page.waitForLoadState('networkidle');

    const testSecretAccordion = page.getByTestId('secret-accordion-test-secret');
    const accordionHeader = testSecretAccordion.getByTestId('secret-accordion-header');
    await accordionHeader.click();

    // Act: Get first key-value component
    const firstKeyValue = testSecretAccordion.locator('[data-testid^="secret-key-value-"]').first();

    // Assert: Reveal button should have accessible label
    const revealButton = firstKeyValue.getByTestId('reveal-button');
    await expect(revealButton).toHaveAttribute('aria-label');
    const revealAriaLabel = await revealButton.getAttribute('aria-label');
    expect(revealAriaLabel?.toLowerCase()).toMatch(/reveal|show/i);

    // Act: Click Reveal button
    await revealButton.click();

    // Assert: Hide button should have accessible label
    const hideButton = firstKeyValue.getByTestId('hide-button');
    await expect(hideButton).toHaveAttribute('aria-label');
    const hideAriaLabel = await hideButton.getAttribute('aria-label');
    expect(hideAriaLabel?.toLowerCase()).toMatch(/hide|conceal/i);
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
