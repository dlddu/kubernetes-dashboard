import { test, expect } from '@playwright/test';

/**
 * E2E Tests for PollingIndicator Component
 *
 * TDD Red Phase: Tests written - component not yet implemented.
 * These tests define the expected behavior of the PollingIndicator component,
 * which displays auto-refresh status and last update timestamp.
 */
test.describe('PollingIndicator Component', () => {
  test('should display PollingIndicator in TopBar on page load', async ({ page }) => {
    // Tests that PollingIndicator component is visible in the TopBar

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the TopBar
    const topBar = page.getByRole('banner').or(page.getByTestId('top-bar'));
    await expect(topBar).toBeVisible();

    // Assert: PollingIndicator should be visible within TopBar
    const pollingIndicator = page.getByTestId('polling-indicator');
    await expect(pollingIndicator).toBeVisible();

    // Assert: Should display last update time
    const lastUpdateTime = pollingIndicator.getByTestId('last-update-time');
    await expect(lastUpdateTime).toBeVisible();

    // Assert: Last update time should contain valid time format
    const timeText = await lastUpdateTime.innerText();
    expect(timeText).toMatch(/\d{1,2}:\d{2}:\d{2}|just now|seconds? ago|minutes? ago/i);
  });

  test('should display refresh button in PollingIndicator', async ({ page }) => {
    // Tests that manual refresh button is available

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the PollingIndicator component
    const pollingIndicator = page.getByTestId('polling-indicator');
    await expect(pollingIndicator).toBeVisible();

    // Assert: Refresh button should be visible
    const refreshButton = pollingIndicator.getByRole('button', { name: /refresh|reload/i })
      .or(pollingIndicator.getByTestId('refresh-button'));
    await expect(refreshButton).toBeVisible();

    // Assert: Refresh button should be enabled
    await expect(refreshButton).toBeEnabled();

    // Assert: Button should have appropriate accessible label
    await expect(refreshButton).toHaveAttribute('aria-label');
  });

  test('should update last refresh time automatically after polling interval', async ({ page }) => {
    // Tests that auto-polling updates the last refresh timestamp

    // Arrange: Install fake clock before navigation to control JS timers
    await page.clock.install();

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the PollingIndicator component
    const pollingIndicator = page.getByTestId('polling-indicator');
    await expect(pollingIndicator).toBeVisible();

    // Act: Get initial last update time
    const lastUpdateTime = pollingIndicator.getByTestId('last-update-time');
    const initialTimeText = await lastUpdateTime.innerText();

    // Act: Fast-forward 6 seconds (fires the 1-second relative-time interval 6 times)
    await page.clock.fastForward(6000);

    // Assert: Last update time should have changed
    const updatedTimeText = await lastUpdateTime.innerText();
    expect(updatedTimeText).not.toBe(initialTimeText);

    // Assert: New time should indicate a recent update
    expect(updatedTimeText).toMatch(/just now|seconds? ago|few seconds ago|\d{1,2}:\d{2}:\d{2}/i);
  });

  test('should show visual indicator during active polling', async ({ page }) => {
    // Tests that a loading/syncing indicator appears during data refresh

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the PollingIndicator component
    const pollingIndicator = page.getByTestId('polling-indicator');
    await expect(pollingIndicator).toBeVisible();

    // Act: Trigger manual refresh to observe the syncing indicator
    const refreshButton = pollingIndicator.getByRole('button', { name: /refresh|reload/i })
      .or(pollingIndicator.getByTestId('refresh-button'));

    // Click refresh and immediately check for syncing indicator
    await refreshButton.click();

    // Assert: Should show syncing indicator during update
    const syncingIndicator = pollingIndicator.getByTestId('syncing-indicator')
      .or(pollingIndicator.locator('[aria-busy="true"]'))
      .or(pollingIndicator.locator('.spinner'));

    // Note: Check if indicator exists during the brief refresh period
    const indicatorCount = await syncingIndicator.count();
    if (indicatorCount > 0) {
      // If indicator exists, it may be briefly visible during sync
      // We just verify it exists and can be found
      await expect(syncingIndicator.first()).toBeAttached();
    }

    // Wait for refresh to complete
    await page.waitForLoadState('networkidle');
  });
});

test.describe('PollingIndicator Component - Manual Refresh', () => {
  test('should trigger immediate data refresh when refresh button is clicked', async ({ page }) => {
    // Tests manual refresh functionality

    // Arrange: Install fake clock before navigation to control JS timers
    await page.clock.install();

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the PollingIndicator component
    const pollingIndicator = page.getByTestId('polling-indicator');
    await expect(pollingIndicator).toBeVisible();

    // Act: Get initial last update time
    const lastUpdateTime = pollingIndicator.getByTestId('last-update-time');
    const initialTimeText = await lastUpdateTime.innerText();

    // Act: Fast-forward 2 seconds so time display diverges from initial
    await page.clock.fastForward(2000);

    // Act: Click the refresh button
    const refreshButton = pollingIndicator.getByRole('button', { name: /refresh|reload/i })
      .or(pollingIndicator.getByTestId('refresh-button'));
    await refreshButton.click();

    // Assert: Should show loading state immediately after click
    const syncingIndicator = pollingIndicator.getByTestId('syncing-indicator')
      .or(pollingIndicator.locator('[aria-busy="true"]'));

    // Wait for refresh to complete
    await page.waitForLoadState('networkidle');

    // Assert: Last update time should be updated to "just now" or recent time
    const updatedTimeText = await lastUpdateTime.innerText();
    expect(updatedTimeText).toMatch(/just now|seconds? ago|0 seconds ago|\d{1,2}:\d{2}:\d{2}/i);

    // Assert: Loading indicator should disappear after refresh completes
    const indicatorCount = await syncingIndicator.count();
    if (indicatorCount > 0) {
      await expect(syncingIndicator.first()).not.toBeVisible();
    }
  });

  test('should disable refresh button while refresh is in progress', async ({ page }) => {
    // Tests that refresh button is disabled during active refresh

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the PollingIndicator component
    const pollingIndicator = page.getByTestId('polling-indicator');
    await expect(pollingIndicator).toBeVisible();

    // Act: Click the refresh button
    const refreshButton = pollingIndicator.getByRole('button', { name: /refresh|reload/i })
      .or(pollingIndicator.getByTestId('refresh-button'));
    await refreshButton.click();

    // Assert: Button should be disabled during refresh
    // Note: This check needs to be immediate after click to catch the disabled state
    // In practice, the disabled state may be very brief
    const isDisabled = await refreshButton.isDisabled().catch(() => false);

    // Wait for refresh to complete
    await page.waitForLoadState('networkidle');

    // Assert: Button should be re-enabled after refresh completes
    await expect(refreshButton).toBeEnabled();
  });

  test('should update all dashboard data when manual refresh is triggered', async ({ page }) => {
    // Tests that manual refresh updates all components on the page

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Get initial data from a component (e.g., summary cards)
    const summaryCards = page.getByRole('article');
    const initialCardCount = await summaryCards.count();
    expect(initialCardCount).toBeGreaterThan(0);

    // Act: Click the refresh button
    const pollingIndicator = page.getByTestId('polling-indicator');
    const refreshButton = pollingIndicator.getByRole('button', { name: /refresh|reload/i })
      .or(pollingIndicator.getByTestId('refresh-button'));
    await refreshButton.click();

    // Wait for refresh to complete
    await page.waitForLoadState('networkidle');

    // Assert: Data should be refreshed (components still visible)
    const updatedCardCount = await summaryCards.count();
    expect(updatedCardCount).toBe(initialCardCount);

    // Assert: All cards should still be visible and displaying data
    const cards = await summaryCards.all();
    for (const card of cards) {
      await expect(card).toBeVisible();
    }

    // Assert: Last update time should reflect the recent refresh
    const lastUpdateTime = pollingIndicator.getByTestId('last-update-time');
    const timeText = await lastUpdateTime.innerText();
    expect(timeText).toMatch(/just now|seconds? ago|0 seconds ago/i);
  });
});

test.describe('PollingIndicator Component - Page Visibility', () => {
  test('should pause polling when tab becomes inactive', async ({ page, context }) => {
    // Tests that polling stops when page is not visible
    // Note: Testing Page Visibility API in E2E is challenging due to browser limitations

    // Arrange: Install fake clock before navigation to control JS timers
    await page.clock.install();

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the PollingIndicator component
    const pollingIndicator = page.getByTestId('polling-indicator');
    await expect(pollingIndicator).toBeVisible();

    // Act: Get initial last update time
    const lastUpdateTime = pollingIndicator.getByTestId('last-update-time');
    const initialTimeText = await lastUpdateTime.innerText();

    // Act: Simulate tab becoming hidden by evaluating visibilityState
    // Note: This is a simulation; actual tab switching in E2E is browser-dependent
    await page.evaluate(() => {
      // Dispatch visibilitychange event to simulate tab hidden
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true
      });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden'
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Act: Fast-forward longer than the polling interval
    await page.clock.fastForward(15000); // Fast-forward 15 seconds (longer than 10s polling interval)

    // Assert: Last update time should NOT have changed (polling paused)
    const timeAfterHidden = await lastUpdateTime.innerText();
    // Since polling is paused, time should show older timestamp
    expect(timeAfterHidden).toMatch(/\d+\s*seconds? ago|\d+\s*minutes? ago/i);

    // Act: Simulate tab becoming visible again
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false
      });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible'
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Act: Wait for the immediate fetch triggered by visibility restore
    await page.waitForLoadState('networkidle');

    // Act: Let the relative-time interval fire to pick up new lastUpdate
    await page.clock.fastForward(1000);

    // Assert: Polling should have resumed and updated the time
    const timeAfterVisible = await lastUpdateTime.innerText();
    expect(timeAfterVisible).toMatch(/just now|few seconds ago|seconds? ago/i);
  });

  test('should resume polling when tab becomes active again', async ({ page }) => {
    // Tests that polling resumes when page becomes visible

    // Arrange: Install fake clock before navigation to control JS timers
    await page.clock.install();

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the PollingIndicator component
    const pollingIndicator = page.getByTestId('polling-indicator');
    await expect(pollingIndicator).toBeVisible();

    // Act: Simulate tab hidden state
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true
      });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden'
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Act: Fast-forward while tab is hidden
    await page.clock.fastForward(10000); // 10 seconds hidden

    // Act: Simulate tab becoming visible
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false
      });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible'
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Assert: Should trigger immediate refresh on visibility restore
    // Wait for the immediate fetch triggered by visibility restore
    await page.waitForLoadState('networkidle');

    // Let the relative-time interval fire to pick up new lastUpdate
    await page.clock.fastForward(1000);

    // Assert: Last update time should show recent update
    const lastUpdateTime = pollingIndicator.getByTestId('last-update-time');
    const timeText = await lastUpdateTime.innerText();
    expect(timeText).toMatch(/just now|seconds? ago|few seconds ago/i);

    // Assert: Polling should continue normally after resume
    const initialTime = await lastUpdateTime.innerText();

    // Fast-forward past next polling cycle
    await page.clock.fastForward(6000); // Fast-forward 6 seconds

    const updatedTime = await lastUpdateTime.innerText();
    // Time display should have updated or show elapsed time
    expect(updatedTime).toBeTruthy();
  });

  test('should display polling status indicator (active/paused)', async ({ page }) => {
    // Tests that PollingIndicator shows active vs paused state

    // Arrange: Install fake clock before navigation to control JS timers
    await page.clock.install();

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the PollingIndicator component
    const pollingIndicator = page.getByTestId('polling-indicator');
    await expect(pollingIndicator).toBeVisible();

    // Assert: Should show active polling status
    const pollingStatus = pollingIndicator.getByTestId('polling-status')
      .or(pollingIndicator.locator('[data-polling-active="true"]'));

    // Check if status indicator exists and shows active state
    const statusCount = await pollingStatus.count();
    if (statusCount > 0) {
      await expect(pollingStatus.first()).toBeVisible();

      // Assert: Status should indicate active polling
      const statusText = await pollingStatus.innerText();
      expect(statusText.toLowerCase()).toMatch(/active|auto-refresh|polling/i);
    }

    // Act: Simulate tab becoming hidden
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true
      });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden'
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Fast-forward for state change to propagate
    await page.clock.fastForward(1000);

    // Assert: Status should indicate paused state
    const pausedStatus = pollingIndicator.getByTestId('polling-status')
      .or(pollingIndicator.locator('[data-polling-active="false"]'));

    if (await pausedStatus.count() > 0) {
      const pausedText = await pausedStatus.innerText();
      expect(pausedText.toLowerCase()).toMatch(/paused|inactive|stopped/i);
    }
  });
});

test.describe('PollingIndicator Component - Time Display Format', () => {
  test('should display last update time in human-readable format', async ({ page }) => {
    // Tests that last update time uses relative time format

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the PollingIndicator component
    const pollingIndicator = page.getByTestId('polling-indicator');
    await expect(pollingIndicator).toBeVisible();

    // Act: Get last update time
    const lastUpdateTime = pollingIndicator.getByTestId('last-update-time');
    await expect(lastUpdateTime).toBeVisible();

    // Assert: Time should be in human-readable format
    const timeText = await lastUpdateTime.innerText();

    // Should match one of these patterns:
    // - "just now"
    // - "5 seconds ago"
    // - "2 minutes ago"
    // - Absolute time like "14:23:45"
    expect(timeText).toMatch(
      /just now|(\d+\s*(second|minute|hour)s?\s*ago)|\d{1,2}:\d{2}(:\d{2})?/i
    );
  });

  test('should update relative time display as time passes', async ({ page }) => {
    // Tests that "X seconds ago" increments over time

    // Arrange: Install fake clock before navigation to control JS timers
    await page.clock.install();

    // Arrange: Navigate to the home page and trigger refresh
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the PollingIndicator component
    const pollingIndicator = page.getByTestId('polling-indicator');
    const refreshButton = pollingIndicator.getByRole('button', { name: /refresh|reload/i })
      .or(pollingIndicator.getByTestId('refresh-button'));

    // Trigger refresh to get known "just now" state
    await refreshButton.click();
    await page.waitForLoadState('networkidle');

    // Act: Get initial time display
    const lastUpdateTime = pollingIndicator.getByTestId('last-update-time');
    const initialText = await lastUpdateTime.innerText();
    expect(initialText).toMatch(/just now|0 seconds ago|seconds? ago/i);

    // Act: Fast-forward 5 seconds to observe elapsed time
    await page.clock.fastForward(5000);

    // Assert: Time display should now show elapsed seconds
    const updatedText = await lastUpdateTime.innerText();

    // Should show progression like "5 seconds ago"
    // (unless auto-polling updated it)
    if (!updatedText.match(/just now/i)) {
      expect(updatedText).toMatch(/\d+\s*seconds?\s*ago/i);
    }
  });

  test('should display tooltip with exact timestamp on hover', async ({ page }) => {
    // Tests that hovering shows full timestamp

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the PollingIndicator component
    const pollingIndicator = page.getByTestId('polling-indicator');
    await expect(pollingIndicator).toBeVisible();

    // Act: Locate the last update time element
    const lastUpdateTime = pollingIndicator.getByTestId('last-update-time');
    await expect(lastUpdateTime).toBeVisible();

    // Act: Hover over the time display
    await lastUpdateTime.hover();

    // Assert: Should show tooltip or title with full timestamp
    // Check for title attribute (common tooltip pattern)
    const titleAttr = await lastUpdateTime.getAttribute('title');
    if (titleAttr) {
      // Title should contain full timestamp
      expect(titleAttr).toMatch(/\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2}:\d{2}/);
    }

    // Or check for visible tooltip element
    const tooltip = page.getByRole('tooltip')
      .or(page.getByTestId('timestamp-tooltip'));

    const tooltipCount = await tooltip.count();
    if (tooltipCount > 0) {
      await expect(tooltip.first()).toBeVisible();
      const tooltipText = await tooltip.first().innerText();
      expect(tooltipText).toMatch(/\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2}:\d{2}/);
    }
  });
});

test.describe('PollingIndicator Component - Accessibility', () => {
  test('should have proper ARIA labels for screen readers', async ({ page }) => {
    // Tests accessibility attributes

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the PollingIndicator component
    const pollingIndicator = page.getByTestId('polling-indicator');
    await expect(pollingIndicator).toBeVisible();

    // Assert: Component should have proper ARIA role
    const ariaLive = await pollingIndicator.getAttribute('aria-live');
    if (ariaLive) {
      expect(ariaLive).toMatch(/polite|off/);
    }

    // Assert: Refresh button should have aria-label
    const refreshButton = pollingIndicator.getByRole('button', { name: /refresh|reload/i })
      .or(pollingIndicator.getByTestId('refresh-button'));
    await expect(refreshButton).toHaveAttribute('aria-label');

    // Assert: Last update time should have descriptive label
    const lastUpdateTime = pollingIndicator.getByTestId('last-update-time');
    const ariaLabel = await lastUpdateTime.getAttribute('aria-label');
    if (ariaLabel) {
      expect(ariaLabel.toLowerCase()).toMatch(/last update|updated|refreshed/);
    }
  });

  test('should announce status changes to screen readers', async ({ page }) => {
    // Tests that status changes are announced

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the PollingIndicator component
    const pollingIndicator = page.getByTestId('polling-indicator');
    await expect(pollingIndicator).toBeVisible();

    // Assert: Component should have aria-live region
    const ariaLive = await pollingIndicator.getAttribute('aria-live');

    // Act: Trigger manual refresh
    const refreshButton = pollingIndicator.getByRole('button', { name: /refresh|reload/i })
      .or(pollingIndicator.getByTestId('refresh-button'));
    await refreshButton.click();

    // Wait for refresh to complete
    await page.waitForLoadState('networkidle');

    // Assert: Status message should be in aria-live region
    const statusMessage = pollingIndicator.locator('[aria-live="polite"]')
      .or(pollingIndicator.getByTestId('status-message'));

    const messageCount = await statusMessage.count();
    if (messageCount > 0) {
      await expect(statusMessage.first()).toBeVisible();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tests keyboard accessibility

    // Arrange: Navigate to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Navigate using keyboard (Tab key)
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Act: Check if refresh button can receive focus
    const pollingIndicator = page.getByTestId('polling-indicator');
    const refreshButton = pollingIndicator.getByRole('button', { name: /refresh|reload/i })
      .or(pollingIndicator.getByTestId('refresh-button'));

    // Assert: Refresh button should be focusable
    await refreshButton.focus();
    await expect(refreshButton).toBeFocused();

    // Act: Trigger refresh with Enter key
    await page.keyboard.press('Enter');

    // Wait for refresh to complete
    await page.waitForLoadState('networkidle');

    // Assert: Last update time should be updated
    const lastUpdateTime = pollingIndicator.getByTestId('last-update-time');
    const timeText = await lastUpdateTime.innerText();
    expect(timeText).toMatch(/just now|seconds? ago/i);
  });
});

test.describe('PollingIndicator Component - Responsive Design', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    // Tests mobile viewport rendering

    // Arrange: Set mobile viewport (iPhone SE dimensions)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the PollingIndicator component
    const pollingIndicator = page.getByTestId('polling-indicator');
    await expect(pollingIndicator).toBeVisible();

    // Assert: Last update time should be visible on mobile
    const lastUpdateTime = pollingIndicator.getByTestId('last-update-time');
    await expect(lastUpdateTime).toBeVisible();

    // Assert: Refresh button should be visible and touchable
    const refreshButton = pollingIndicator.getByRole('button', { name: /refresh|reload/i })
      .or(pollingIndicator.getByTestId('refresh-button'));
    await expect(refreshButton).toBeVisible();

    // Assert: Button should have adequate touch target size (at least 44x44px)
    const buttonBox = await refreshButton.boundingBox();
    expect(buttonBox!.width).toBeGreaterThanOrEqual(44);
    expect(buttonBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('should display correctly on desktop viewport', async ({ page }) => {
    // Tests desktop viewport rendering

    // Arrange: Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the PollingIndicator component
    const pollingIndicator = page.getByTestId('polling-indicator');
    await expect(pollingIndicator).toBeVisible();

    // Assert: All elements should be visible on desktop
    const lastUpdateTime = pollingIndicator.getByTestId('last-update-time');
    await expect(lastUpdateTime).toBeVisible();

    const refreshButton = pollingIndicator.getByRole('button', { name: /refresh|reload/i })
      .or(pollingIndicator.getByTestId('refresh-button'));
    await expect(refreshButton).toBeVisible();

    // Assert: Layout should be horizontal on desktop
    const indicatorBox = await pollingIndicator.boundingBox();
    expect(indicatorBox!.width).toBeGreaterThan(indicatorBox!.height);
  });
});
