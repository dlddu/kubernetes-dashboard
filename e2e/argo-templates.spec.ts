import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Argo WorkflowTemplate List
 *
 * TDD Red Phase: Tests written - components not yet implemented.
 * These tests define the expected behavior of the Argo tab Templates section,
 * which displays WorkflowTemplate resources as cards with name, namespace,
 * and parameter tags. Covers happy path, namespace filtering, loading,
 * empty, and error states.
 *
 * Test Fixtures (test/fixtures/):
 * - workflow-template-with-params.yaml: data-processing-with-params (4 params)
 * - workflow-template-no-params.yaml: simple-template (no params)
 * Both fixtures are in the dashboard-test namespace.
 *
 * Related Issue: DLD-438 - 작업 2-1: WorkflowTemplate 목록 조회 — e2e 테스트 작성 (skipped)
 * Parent Issue: DLD-435 - Argo WorkflowTemplate Submit 기능 추가
 */

// TODO: Activate when DLD-438 is implemented
test.describe.skip('Argo Tab - WorkflowTemplate List', () => {
  test('should display Templates section by default when navigating to Argo tab', async ({ page }) => {
    // Tests that the Argo tab renders with the Templates section visible by default

    // Arrange: Navigate to the Argo tab
    await page.goto('/argo');
    await page.waitForLoadState('networkidle');

    // Assert: Argo page container should be visible
    const argoPage = page.getByTestId('argo-page');
    await expect(argoPage).toBeVisible();

    // Assert: Templates section should be visible by default (not hidden behind another sub-tab)
    const templatesSection = page.getByTestId('workflow-templates-page');
    await expect(templatesSection).toBeVisible();
  });

  test('should render WorkflowTemplate cards with name, namespace, and parameter tags', async ({ page }) => {
    // Tests that fixture WorkflowTemplates are rendered as cards with all required fields

    // Arrange: Navigate to the Argo tab
    await page.goto('/argo');
    await page.waitForLoadState('networkidle');

    // Assert: workflow-template-card elements should be present
    const templateCards = page.getByTestId('workflow-template-card');
    const cardCount = await templateCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

    // Act: Find the data-processing-with-params card
    let dataProcessingCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = templateCards.nth(i);
      const nameElement = card.getByTestId('workflow-template-name');
      const nameText = await nameElement.innerText();
      if (nameText === 'data-processing-with-params') {
        dataProcessingCard = card;
        break;
      }
    }

    // Assert: data-processing-with-params card exists
    expect(dataProcessingCard).toBeTruthy();
    if (!dataProcessingCard) return;

    // Assert: Card displays the template name
    const templateName = dataProcessingCard.getByTestId('workflow-template-name');
    await expect(templateName).toBeVisible();
    expect(await templateName.innerText()).toBe('data-processing-with-params');

    // Assert: Card displays the namespace
    const templateNamespace = dataProcessingCard.getByTestId('workflow-template-namespace');
    await expect(templateNamespace).toBeVisible();
    expect(await templateNamespace.innerText()).toBe('dashboard-test');

    // Assert: Card displays 4 parameter tags (input-path, output-path, batch-size, env)
    const paramTags = dataProcessingCard.getByTestId('workflow-template-params');
    await expect(paramTags).toBeVisible();
    const paramTagItems = dataProcessingCard.getByTestId('workflow-template-param-tag');
    expect(await paramTagItems.count()).toBe(4);

    // Act: Also verify the simple-template card
    let simpleTemplateCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = templateCards.nth(i);
      const nameElement = card.getByTestId('workflow-template-name');
      const nameText = await nameElement.innerText();
      if (nameText === 'simple-template') {
        simpleTemplateCard = card;
        break;
      }
    }

    // Assert: simple-template card exists with correct namespace
    expect(simpleTemplateCard).toBeTruthy();
    if (!simpleTemplateCard) return;

    const simpleTemplateName = simpleTemplateCard.getByTestId('workflow-template-name');
    await expect(simpleTemplateName).toBeVisible();
    expect(await simpleTemplateName.innerText()).toBe('simple-template');

    const simpleTemplateNamespace = simpleTemplateCard.getByTestId('workflow-template-namespace');
    await expect(simpleTemplateNamespace).toBeVisible();
    expect(await simpleTemplateNamespace.innerText()).toBe('dashboard-test');
  });

  test('should display "No parameters" text for templates with no parameters', async ({ page }) => {
    // Tests that simple-template (no params) shows the "No parameters" fallback text

    // Arrange: Navigate to the Argo tab
    await page.goto('/argo');
    await page.waitForLoadState('networkidle');

    // Act: Find the simple-template card
    const templateCards = page.getByTestId('workflow-template-card');
    const cardCount = await templateCards.count();
    let simpleTemplateCard = null;

    for (let i = 0; i < cardCount; i++) {
      const card = templateCards.nth(i);
      const nameElement = card.getByTestId('workflow-template-name');
      const nameText = await nameElement.innerText();
      if (nameText === 'simple-template') {
        simpleTemplateCard = card;
        break;
      }
    }

    // Assert: simple-template card is found
    expect(simpleTemplateCard).toBeTruthy();
    if (!simpleTemplateCard) return;

    // Assert: "No parameters" text is shown instead of parameter tags
    const noParamsText = simpleTemplateCard.getByText('No parameters');
    await expect(noParamsText).toBeVisible();
  });

  test('should display only templates for the selected namespace when namespace filter is applied', async ({ page }) => {
    // Tests that namespace filtering shows only templates matching the selected namespace

    // Arrange: Navigate to the Argo tab (all namespaces visible by default)
    await page.goto('/argo');
    await page.waitForLoadState('networkidle');

    // Act: Record total template count before filtering
    const allTemplateCards = page.getByTestId('workflow-template-card');
    const totalCount = await allTemplateCards.count();
    expect(totalCount).toBeGreaterThanOrEqual(1);

    // Act: Apply namespace filter via the namespace selector in the TopBar
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const dashboardTestOption = page.getByRole('option', { name: /^dashboard-test$/i })
      .or(page.getByTestId('namespace-option-dashboard-test'));
    await dashboardTestOption.click();
    await page.waitForLoadState('networkidle');

    // Assert: Only dashboard-test namespace templates are shown
    const filteredTemplateCards = page.getByTestId('workflow-template-card');
    const filteredCount = await filteredTemplateCards.count();
    expect(filteredCount).toBeLessThanOrEqual(totalCount);
    expect(filteredCount).toBeGreaterThanOrEqual(1);

    // Assert: All visible cards belong to dashboard-test namespace
    for (let i = 0; i < filteredCount; i++) {
      const card = filteredTemplateCards.nth(i);
      const namespaceElement = card.getByTestId('workflow-template-namespace');
      const namespaceText = await namespaceElement.innerText();
      expect(namespaceText).toBe('dashboard-test');
    }
  });

  test('should display LoadingSkeleton while workflow templates are being fetched', async ({ page }) => {
    // Tests that LoadingSkeleton is shown during the API request

    // Arrange: Intercept the workflow templates API and delay the response
    await page.route('**/api/argo/workflow-templates**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Act: Navigate to the Argo tab
    await page.goto('/argo');

    // Assert: LoadingSkeleton should be visible before the response arrives
    const loadingSkeleton = page.getByTestId('loading-skeleton');
    await expect(loadingSkeleton).toBeVisible();

    // Assert: LoadingSkeleton has aria-busy="true"
    await expect(loadingSkeleton).toHaveAttribute('aria-busy', 'true');
  });

  test('should display EmptyState with "No workflow templates found" when no templates exist', async ({ page }) => {
    // Tests that EmptyState is rendered with the correct message when the API returns an empty list

    // Arrange: Mock the workflow templates API to return an empty array
    await page.route('**/api/argo/workflow-templates**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Act: Navigate to the Argo tab
    await page.goto('/argo');
    await page.waitForLoadState('networkidle');

    // Assert: EmptyState component is visible
    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();

    // Assert: EmptyState displays the correct message
    await expect(emptyState).toContainText('No workflow templates found');

    // Assert: No template cards are shown
    const templateCards = page.getByTestId('workflow-template-card');
    expect(await templateCards.count()).toBe(0);
  });

  test('should display ErrorRetry component when the workflow templates API returns an error', async ({ page }) => {
    // Tests that ErrorRetry is rendered and the retry button is functional on API failure

    // Arrange: Mock the workflow templates API to return a 500 error
    await page.route('**/api/argo/workflow-templates**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    // Act: Navigate to the Argo tab
    await page.goto('/argo');
    await page.waitForLoadState('networkidle');

    // Assert: ErrorRetry component is visible
    const errorRetry = page.getByTestId('error-retry');
    await expect(errorRetry).toBeVisible();

    // Assert: ErrorRetry has role="alert" for accessibility
    await expect(errorRetry).toHaveAttribute('role', 'alert');

    // Assert: Retry button is present and enabled
    const retryButton = errorRetry.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    // Assert: No template cards are shown during error state
    const templateCards = page.getByTestId('workflow-template-card');
    expect(await templateCards.count()).toBe(0);
  });
});
