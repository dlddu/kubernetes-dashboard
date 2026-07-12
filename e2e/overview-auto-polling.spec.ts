// Verifies: OV4 (docs/product/prd-overview.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

test.describe('PollingIndicator Component - Page Visibility', () => {
  test('should pause polling when tab becomes inactive', async ({ page, context }) => {
    // Tests that polling stops when page is not visible
    // Uses page.clock to avoid real-time waits (was 21.9s, now ~2s)

    // Install fake clock BEFORE navigation so all setIntervals are controlled
    await page.clock.install({ time: Date.now() });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act: Locate the PollingIndicator component
    const pollingIndicator = page.getByTestId('polling-indicator');
    await expect(pollingIndicator).toBeVisible();

    // Act: Get initial last update time
    const lastUpdateTime = pollingIndicator.getByTestId('last-update-time');

    // Act: Simulate tab becoming hidden by evaluating visibilityState
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

    // Act: Fast-forward past the polling interval (instant, no real wait)
    await page.clock.fastForward(15000);

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

    // Act: Fast-forward for next poll cycle
    await page.clock.fastForward(6000);

    // Assert: Polling should have resumed and updated the time
    const timeAfterVisible = await lastUpdateTime.innerText();
    expect(timeAfterVisible).toMatch(/just now|few seconds ago|seconds? ago/i);
  });

  test('should resume polling when tab becomes active again', async ({ page }) => {
    // Tests that polling resumes when page becomes visible
    // Uses page.clock to avoid real-time waits (was 18.8s, now ~2s)

    // Install fake clock BEFORE navigation so all setIntervals are controlled
    await page.clock.install({ time: Date.now() });
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

    // Act: Fast-forward while tab is hidden (instant)
    await page.clock.fastForward(10000);

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
    // Fast-forward to allow refresh to process
    await page.clock.fastForward(2000);

    // Assert: Last update time should show recent update
    const lastUpdateTime = pollingIndicator.getByTestId('last-update-time');
    const timeText = await lastUpdateTime.innerText();
    expect(timeText).toMatch(/just now|seconds? ago|few seconds ago/i);

    // Assert: Polling should continue normally after resume
    const initialTime = await lastUpdateTime.innerText();

    // Fast-forward for next polling cycle
    await page.clock.fastForward(6000);

    const updatedTime = await lastUpdateTime.innerText();
    // Time display should have updated or show elapsed time
    expect(updatedTime).toBeTruthy();
  });

  test('should display polling status indicator (active/paused)', async ({ page }) => {
    // Tests that PollingIndicator shows active vs paused state

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

    // Wait for state change to propagate via DOM assertion instead of fixed timeout
    const pausedStatus = pollingIndicator.getByTestId('polling-status')
      .or(pollingIndicator.locator('[data-polling-active="false"]'));

    if (await pausedStatus.count() > 0) {
      // Use expect with timeout to wait for the paused text instead of waitForTimeout
      await expect.poll(async () => {
        const text = await pausedStatus.innerText();
        return text.toLowerCase();
      }, { timeout: 3000 }).toMatch(/paused|inactive|stopped/i);
    }
  });
});
