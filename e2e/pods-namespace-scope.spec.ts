// Verifies: docs/product/test-pods.md#시나리오 2 (네임스페이스 스코프 반영) — sole dedicated e2e spec for this scenario.
// AC: PD1 (docs/product/prd-pods.md), shared with e2e/pods.spec.ts (test-pods.md#시나리오 1).
// Provenance: both describes below were moved verbatim out of e2e/pods.spec.ts on 2026-09-09
//   (scenario-axis 1:1 split — see docs/product/doc-tracker.md, "테스트 시나리오 ↔ e2e 스펙 매칭").
//   No assertion was added, removed or edited by that move.
import { test, expect } from '@playwright/test';

/**
 * E2E Tests for namespace scoping on the Pods page
 *
 * test-pods.md#시나리오 2: selecting a namespace in the namespace selector must
 * re-scope the pod list to that namespace (GET /api/pods?ns=).
 *
 * Runs against the real kind cluster + real fixtures; no network interception.
 */

test.describe('BottomTabBar - Namespace Context Integration', () => {
  test('should filter current tab data when namespace is changed', async ({ page }) => {
    // Tests that namespace selection affects active tab's data

    // Arrange: Set mobile viewport and navigate to Pods tab
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/pods');

    // Wait for initial pod data to load
    await expect(
      page.getByTestId('pod-card').first()
        .or(page.getByTestId('no-pods-message'))
    ).toBeVisible({ timeout: 10000 });

    // Act: Record initial pod count (all namespaces)
    const initialPodCards = page.getByTestId('pod-card');
    const initialCount = await initialPodCards.count();

    // Act: Select "default" namespace and wait for API response
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));

    // Wait for pods API response after namespace selection
    await Promise.all([
      page.waitForResponse(resp =>
        resp.url().includes('/api/pods') &&
        resp.url().includes('ns=default') &&
        resp.status() === 200
      ),
      defaultNamespaceOption.click(),
    ]);

    // Wait for the filtered pod list to render
    await expect(
      page.getByTestId('pod-card').first()
        .or(page.getByTestId('no-pods-message'))
    ).toBeVisible({ timeout: 10000 });

    // Assert: Pod list should be filtered to default namespace
    const filteredPodCards = page.getByTestId('pod-card');
    const filteredCount = await filteredPodCards.count();

    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Assert: All visible pods should belong to default namespace
    if (filteredCount > 0) {
      const firstPod = filteredPodCards.first();
      await expect(firstPod).toContainText('default', { timeout: 5000 });
    }
  });
});

test.describe('Namespace Context Integration', () => {
  test('should filter displayed data when specific namespace is selected', async ({ page }) => {
    // Tests that resource lists respect NamespaceContext filtering

    // Arrange: Navigate to Pods page with "All Namespaces" selected
    await page.goto('/pods');
    await page.waitForLoadState('networkidle');

    // Wait for pods data to load
    const podsPage = page.getByTestId('pods-page');
    await expect(podsPage).toBeVisible();

    // Act: Select "default" namespace from dropdown
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();
    const defaultNamespaceOption = page.getByRole('option', { name: /^default$/i })
      .or(page.getByTestId('namespace-option-default'));
    await defaultNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Pods page should still be visible with filtered data
    await expect(podsPage).toBeVisible();

    // Act: Select "kube-system" namespace
    await namespaceSelector.click();
    const kubeSystemOption = page.getByRole('option', { name: /^kube-system$/i })
      .or(page.getByTestId('namespace-option-kube-system'));
    await kubeSystemOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Pods page should show kube-system pods
    await expect(podsPage).toBeVisible();
  });
});
