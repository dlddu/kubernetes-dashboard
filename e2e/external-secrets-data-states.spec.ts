// Verifies: ES4 (docs/product/prd-external-secrets.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Group 4: UI — Empty / Error / Loading states
// ---------------------------------------------------------------------------
test.describe('External Secrets Tab - Empty, Error & Loading States', () => {
  test('should display EmptyState when the selected namespace has no ExternalSecrets', async ({ page }) => {
    await page.goto('/external-secrets');
    await page.waitForLoadState('networkidle');

    // Switch to dashboard-empty (no ExternalSecret resources)
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const emptyNamespaceOption = page.getByRole('option', { name: /^dashboard-empty$/i })
      .or(page.getByTestId('namespace-option-dashboard-empty'));
    await emptyNamespaceOption.click();
    await page.waitForLoadState('networkidle');

    const emptyState = page.getByTestId('no-external-secrets-message')
      .or(page.getByTestId('empty-state').first());
    await expect(emptyState).toBeVisible();

    expect(await page.getByTestId('external-secret-card').count()).toBe(0);
  });

  test('should display ErrorRetry component with retry button when the API returns an error', async ({ page }) => {
    let shouldFail = true;
    // mock-exception: ERR — ExternalSecret 목록 조회를 첫 호출만 500으로 실패시켜 ErrorRetry·재시도를 검증(플래그 기반, 재시도는 continue로 실 backend). 실클러스터가 요청 시점에 실패하도록 만들 수 없음.
    await page.route('**/api/external-secrets**', async route => {
      if (shouldFail) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/external-secrets');
    await page.waitForLoadState('networkidle');

    const errorRetry = page.getByTestId('external-secrets-error')
      .or(page.getByTestId('error-retry'));
    await expect(errorRetry).toBeVisible();

    const retryButton = errorRetry.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    expect(await page.getByTestId('external-secret-card').count()).toBe(0);

    // Allow next call to succeed and retry
    shouldFail = false;
    await retryButton.click();
    await page.waitForLoadState('networkidle');

    await expect(errorRetry).not.toBeVisible();
  });

  test('should display LoadingSkeleton with aria-busy="true" while ExternalSecrets are being fetched', async ({ page }) => {
    // mock-exception: LAT — ExternalSecret 목록 로딩 스켈레톤(aria-busy) 관측을 위해 응답 지연 주입(본문은 미검증). 실 응답은 즉시 완료돼 관측 불가.
    await page.route('**/api/external-secrets**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/external-secrets');

    const loadingSkeleton = page.getByTestId('external-secrets-loading')
      .or(page.getByTestId('loading-skeleton').first());
    await expect(loadingSkeleton).toBeVisible();
    await expect(loadingSkeleton).toHaveAttribute('aria-busy', 'true');
  });
});
