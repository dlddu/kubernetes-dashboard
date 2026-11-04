import { test, expect } from '@playwright/test';

test.describe('BottomTabBar - Overview Tab Badge', () => {
  function captureOverviewResponse(page: import('@playwright/test').Page) {
    return page.waitForResponse(
      resp => resp.url().includes('/api/overview') && resp.status() === 200
    ).then(async (resp) => {
      const body = await resp.json();
      return body.unhealthyPods as number;
    });
  }

  test('should show badge only when API reports unhealthy pods, never show stray "0"', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const overviewPromise = captureOverviewResponse(page);
    await page.goto('/');
    const unhealthyPods = await overviewPromise;
    await page.waitForLoadState('networkidle');

    const overviewTab = page.getByTestId('tab-overview');
    const overviewBadge = overviewTab.getByTestId('overview-badge');

    if (unhealthyPods > 0) {
      await expect(overviewBadge).toBeVisible();
      await expect(overviewBadge).toHaveText(String(unhealthyPods));
    } else {
      await expect(overviewBadge).toHaveCount(0);
    }

    // Regression guard: "0" must never appear as visible text in the tab
    // This catches the exact bug where {unhealthyPodCount} rendered "0"
    // as a bare text node outside the conditional badge span
    const tabText = await overviewTab.innerText();
    expect(tabText).not.toMatch(/\b0\b/);
  });

  test('should show badge count matching API response after re-navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const initialPromise = captureOverviewResponse(page);
    await page.goto('/');
    const initialCount = await initialPromise;
    await page.waitForLoadState('networkidle');

    await page.getByTestId('tab-nodes').click();
    await page.waitForLoadState('networkidle');

    const refreshPromise = captureOverviewResponse(page);
    await page.getByTestId('tab-overview').click();
    const refreshedCount = await refreshPromise;
    await page.waitForLoadState('networkidle');

    const overviewTab = page.getByTestId('tab-overview');
    const overviewBadge = overviewTab.getByTestId('overview-badge');

    if (refreshedCount > 0) {
      await expect(overviewBadge).toBeVisible();
      await expect(overviewBadge).toHaveText(String(refreshedCount));
    } else {
      await expect(overviewBadge).toHaveCount(0);
    }

    const tabText = await overviewTab.innerText();
    expect(tabText).not.toMatch(/\b0\b/);
  });

  test('should display correct badge count for selected namespace', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const allNsPromise = captureOverviewResponse(page);
    await page.goto('/');
    const allNsCount = await allNsPromise;
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));

    const filteredPromise = captureOverviewResponse(page);
    await defaultNamespaceOption.click();
    const filteredCount = await filteredPromise;

    const overviewTab = page.getByTestId('tab-overview');
    const overviewBadge = overviewTab.getByTestId('overview-badge');

    expect(filteredCount).toBeLessThanOrEqual(allNsCount);

    if (filteredCount > 0) {
      await expect(overviewBadge).toBeVisible();
      await expect(overviewBadge).toHaveText(String(filteredCount));
    } else {
      await expect(overviewBadge).toHaveCount(0);
    }

    const tabText = await overviewTab.innerText();
    expect(tabText).not.toMatch(/\b0\b/);
  });

  test('should have badge count consistent with pods page data', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const overviewPromise = captureOverviewResponse(page);
    await page.goto('/');
    const unhealthyPods = await overviewPromise;
    await page.waitForLoadState('networkidle');

    await page.getByTestId('tab-pods').click();
    await expect(
      page.getByTestId('pod-card').first()
        .or(page.getByTestId('no-pods-message'))
    ).toBeVisible({ timeout: 10000 });

    const totalPodCount = await page.getByTestId('pod-card').count();

    expect(totalPodCount).toBeGreaterThanOrEqual(unhealthyPods);
  });
});

test.describe('BottomTabBar - Namespace Context Integration', () => {
  test('should update Overview badge when namespace filter changes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const allNsPromise = page.waitForResponse(
      resp => resp.url().includes('/api/overview') && resp.status() === 200
    ).then(async (resp) => (await resp.json()).unhealthyPods as number);

    await page.goto('/');
    const allNamespacesCount = await allNsPromise;
    await page.waitForLoadState('networkidle');

    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));

    const filteredPromise = page.waitForResponse(
      resp => resp.url().includes('/api/overview') && resp.status() === 200
    ).then(async (resp) => (await resp.json()).unhealthyPods as number);

    await defaultNamespaceOption.click();
    const filteredCount = await filteredPromise;

    expect(filteredCount).toBeLessThanOrEqual(allNamespacesCount);

    const overviewTab = page.getByTestId('tab-overview');
    const overviewBadge = overviewTab.getByTestId('overview-badge');

    if (filteredCount > 0) {
      await expect(overviewBadge).toBeVisible();
      await expect(overviewBadge).toHaveText(String(filteredCount));
    } else {
      await expect(overviewBadge).toHaveCount(0);
    }

    const tabText = await overviewTab.innerText();
    expect(tabText).not.toMatch(/\b0\b/);
  });
});
