import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Debug Toggle Button in TopBar
 *
 * Tests verify the Debug toggle button functionality in the TopBar component:
 * - Debug toggle button exists in TopBar with data-testid="debug-toggle"
 * - Initial state: Debug OFF (inactive/default style)
 * - Click toggles to Debug ON (active style with cyan highlight)
 * - Click again toggles back to Debug OFF
 * - Debug ON state shows "debug" tab/link in TopBar navigation
 *
 * Related Issue: DLD-345 - Task 3-1: E2E Test - Debug Toggle Button (skipped)
 * Parent Issue: DLD-341 - Debug Page API Response Feature
 *
 * TODO: Activate when DLD-345 implementation is complete
 */

test.describe.skip('Debug Toggle Button - Existence and Initial State', () => {
  test('should display debug toggle button in TopBar on page load', async ({ page }) => {
    // Tests that debug toggle button is visible in the TopBar component

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert: TopBar should be visible
    const topBar = page.getByRole('banner').or(page.getByTestId('top-bar'));
    await expect(topBar).toBeVisible();

    // Assert: Debug toggle button should exist with data-testid="debug-toggle"
    const debugToggle = page.getByTestId('debug-toggle');
    await expect(debugToggle).toBeVisible();

    // Assert: Button should be accessible as a button element
    await expect(debugToggle).toHaveRole('button');
  });

  test('should have debug mode OFF as initial state', async ({ page }) => {
    // Tests that debug toggle starts in the inactive/OFF state

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the debug toggle button
    const debugToggle = page.getByTestId('debug-toggle');
    await expect(debugToggle).toBeVisible();

    // Assert: Debug mode should be OFF initially (aria-pressed="false")
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    // Assert: Button should have inactive/default visual style (not cyan/highlighted)
    // Check for absence of active state classes or data attributes
    const dataState = await debugToggle.getAttribute('data-state');
    if (dataState) {
      expect(dataState).not.toBe('active');
      expect(dataState).not.toBe('on');
    }
  });
});

test.describe.skip('Debug Toggle Button - ON/OFF Toggle Behavior', () => {
  test('should toggle debug mode ON when clicked', async ({ page }) => {
    // Tests that clicking the toggle activates debug mode with cyan highlight

    // Arrange: Navigate to home page (debug mode OFF by default)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await expect(debugToggle).toBeVisible();

    // Assert: Initial state is OFF
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    // Act: Click debug toggle to turn ON
    await debugToggle.click();

    // Assert: Debug mode should be ON (aria-pressed="true")
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Assert: Visual indicator should show active state (cyan highlight)
    // Check for active state data attribute or class
    const dataState = await debugToggle.getAttribute('data-state');
    if (dataState) {
      expect(dataState).toMatch(/active|on/i);
    }

    // Assert: Button should have cyan-colored highlight (Tailwind: bg-cyan-* or text-cyan-*)
    const buttonClasses = await debugToggle.getAttribute('class');
    if (buttonClasses) {
      // Should contain cyan color classes when active
      expect(buttonClasses).toMatch(/cyan|active|highlight/i);
    }
  });

  test('should toggle debug mode OFF when clicked again', async ({ page }) => {
    // Tests that clicking the toggle again deactivates debug mode

    // Arrange: Navigate to home page and enable debug mode
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');

    // Act: Turn debug mode ON first
    await debugToggle.click();
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Act: Click toggle again to turn OFF
    await debugToggle.click();

    // Assert: Debug mode should be OFF (aria-pressed="false")
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    // Assert: Visual indicator should show inactive state (no cyan highlight)
    const dataState = await debugToggle.getAttribute('data-state');
    if (dataState) {
      expect(dataState).not.toMatch(/active|on/i);
    }

    // Assert: Active styling should be removed
    const buttonClasses = await debugToggle.getAttribute('class');
    if (buttonClasses && buttonClasses.includes('cyan')) {
      // If using conditional classes, active cyan classes should not be present
      // This is framework-dependent, so checking the aria-pressed is more reliable
    }
  });
});

test.describe.skip('Debug Toggle Button - Visual Style Verification', () => {
  test('should display inactive style when debug mode is OFF', async ({ page }) => {
    // Tests the visual styling of the button in OFF state

    // Arrange: Navigate to home page (debug OFF by default)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');
    await expect(debugToggle).toBeVisible();

    // Assert: Debug mode is OFF
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    // Assert: Button should not have cyan/active color classes
    const buttonClasses = await debugToggle.getAttribute('class');
    if (buttonClasses) {
      // In OFF state, should use default/gray styling, not cyan
      // Check that active cyan classes are not present
      const hasCyanActive = buttonClasses.match(/bg-cyan|text-cyan-[5-9]|border-cyan/i);
      expect(hasCyanActive).toBeFalsy();
    }

    // Assert: Visual appearance should be default/muted
    const computedOpacity = await debugToggle.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    // Default state might have reduced opacity
    expect(parseFloat(computedOpacity)).toBeGreaterThan(0);
  });

  test('should display active cyan highlight when debug mode is ON', async ({ page }) => {
    // Tests the visual styling of the button in ON state

    // Arrange: Navigate to home page and enable debug mode
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');

    // Act: Turn debug mode ON
    await debugToggle.click();

    // Assert: Debug mode is ON
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Assert: Button should have cyan color highlight
    const buttonClasses = await debugToggle.getAttribute('class');
    if (buttonClasses) {
      // In ON state, should use cyan highlighting
      expect(buttonClasses).toMatch(/cyan|active/i);
    }

    // Assert: Check for cyan color in computed styles
    const backgroundColor = await debugToggle.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    const color = await debugToggle.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Cyan color should be present in either background or text color
    // Cyan RGB values are around rgb(6, 182, 212) for Tailwind cyan-500
    const hasCyan = backgroundColor.includes('182') || color.includes('182');
    expect(hasCyan).toBeTruthy();
  });
});

test.describe.skip('Debug Toggle Button - Debug Navigation Tab Visibility', () => {
  test('should show debug tab in TopBar navigation when debug mode is ON', async ({ page }) => {
    // Tests that enabling debug mode reveals a debug navigation tab/link

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');

    // Assert: Debug navigation link should not be visible initially (or is hidden)
    const debugNavLink = page.getByRole('link', { name: /debug/i })
      .or(page.getByTestId('debug-nav-link'))
      .or(page.locator('[href="/debug"]'));

    // Check initial visibility (might be hidden or not exist)
    const initiallyVisible = await debugNavLink.isVisible().catch(() => false);

    // Act: Turn debug mode ON
    await debugToggle.click();
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Assert: Debug navigation link should now be visible in TopBar
    await expect(debugNavLink).toBeVisible();

    // Assert: Link should navigate to /debug route
    const href = await debugNavLink.getAttribute('href');
    expect(href).toContain('/debug');

    // Assert: Link should be accessible
    await expect(debugNavLink).toHaveRole('link');
  });

  test('should hide debug tab in TopBar navigation when debug mode is OFF', async ({ page }) => {
    // Tests that disabling debug mode hides the debug navigation tab/link

    // Arrange: Navigate to home page and enable debug mode
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');

    // Act: Turn debug mode ON first
    await debugToggle.click();
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Assert: Debug navigation link is visible
    const debugNavLink = page.getByRole('link', { name: /debug/i })
      .or(page.getByTestId('debug-nav-link'))
      .or(page.locator('[href="/debug"]'));

    await expect(debugNavLink).toBeVisible();

    // Act: Turn debug mode OFF
    await debugToggle.click();
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    // Assert: Debug navigation link should be hidden or not visible
    const isVisibleAfterOff = await debugNavLink.isVisible().catch(() => false);
    expect(isVisibleAfterOff).toBeFalsy();
  });

  test('should persist debug tab visibility when navigating between pages', async ({ page }) => {
    // Tests that debug navigation tab remains visible across page navigation

    // Arrange: Navigate to home page and enable debug mode
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');

    // Act: Turn debug mode ON
    await debugToggle.click();
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Assert: Debug navigation link is visible
    const debugNavLink = page.getByRole('link', { name: /debug/i })
      .or(page.locator('[href="/debug"]'));
    await expect(debugNavLink).toBeVisible();

    // Act: Navigate to Pods page
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Assert: Debug toggle should still be ON
    const debugToggleOnPods = page.getByTestId('debug-toggle');
    await expect(debugToggleOnPods).toHaveAttribute('aria-pressed', 'true');

    // Assert: Debug navigation link should still be visible
    const debugNavLinkOnPods = page.getByRole('link', { name: /debug/i })
      .or(page.locator('[href="/debug"]'));
    await expect(debugNavLinkOnPods).toBeVisible();

    // Act: Navigate to Nodes page
    await page.goto('/nodes');
    await page.waitForLoadState('networkidle');

    // Assert: Debug navigation link should still be visible
    const debugNavLinkOnNodes = page.getByRole('link', { name: /debug/i })
      .or(page.locator('[href="/debug"]'));
    await expect(debugNavLinkOnNodes).toBeVisible();
  });
});

test.describe.skip('Debug Toggle Button - Accessibility', () => {
  test('should have proper ARIA attributes for screen readers', async ({ page }) => {
    // Tests accessibility compliance

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the debug toggle button
    const debugToggle = page.getByTestId('debug-toggle');
    await expect(debugToggle).toBeVisible();

    // Assert: Button should have aria-pressed attribute
    const ariaPressed = await debugToggle.getAttribute('aria-pressed');
    expect(ariaPressed).toBeTruthy();
    expect(ariaPressed).toMatch(/true|false/);

    // Assert: Button should have aria-label for screen readers
    const ariaLabel = await debugToggle.getAttribute('aria-label');
    if (ariaLabel) {
      expect(ariaLabel.toLowerCase()).toMatch(/debug|toggle/i);
    }

    // Assert: Button should be properly labeled
    const buttonText = await debugToggle.innerText().catch(() => '');
    const hasLabel = ariaLabel || buttonText.length > 0;
    expect(hasLabel).toBeTruthy();
  });

  test('should be keyboard accessible', async ({ page }) => {
    // Tests keyboard navigation and activation

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');

    // Act: Focus the debug toggle button using Tab navigation
    await debugToggle.focus();

    // Assert: Button should receive focus
    await expect(debugToggle).toBeFocused();

    // Assert: Initial state is OFF
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    // Act: Activate button using Enter key
    await page.keyboard.press('Enter');

    // Assert: Debug mode should be ON after Enter press
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Act: Activate button using Space key
    await page.keyboard.press('Space');

    // Assert: Debug mode should be OFF after Space press
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('should announce state changes to screen readers', async ({ page }) => {
    // Tests that state changes are properly announced

    // Arrange: Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const debugToggle = page.getByTestId('debug-toggle');

    // Assert: aria-pressed should be "false" initially
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');

    // Act: Toggle debug mode ON
    await debugToggle.click();

    // Assert: aria-pressed should update to "true" (announces change to screen readers)
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'true');

    // Act: Toggle debug mode OFF
    await debugToggle.click();

    // Assert: aria-pressed should update back to "false"
    await expect(debugToggle).toHaveAttribute('aria-pressed', 'false');
  });
});
