// Verifies: AR1 (docs/product/prd-argo.md) — sole dedicated e2e spec for this AC.
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
 * - workflow-template-empty-runs.yaml: empty-runs-template (no params, no workflow runs)
 * - workflow-template-ml-pipeline.yaml: ml-pipeline (no params)
 * All templates are in the dashboard-test namespace.
 * - empty-namespace.yaml: dashboard-empty (empty namespace for empty state testing)
 *
 * Related Issue: DLD-438 - 작업 2-1: WorkflowTemplate 목록 조회 — e2e 테스트 작성 (skipped)
 * Parent Issue: DLD-435 - Argo WorkflowTemplate Submit 기능 추가
 */

// Activated: DLD-439 - WorkflowTemplate 목록 조회 구현 완료

test.describe('Argo Tab - WorkflowTemplate List', () => {
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

    // Both namespaces must be present so an unchanged list cannot pass the filter check.
    const allTemplateCards = page.getByTestId('workflow-template-card');
    await expect(allTemplateCards.getByTestId('workflow-template-namespace').filter({
      hasText: /^dashboard-test$/,
    }).first()).toBeVisible();
    await expect(allTemplateCards.getByTestId('workflow-template-namespace').filter({
      hasText: /^dashboard-mock-policy$/,
    })).toBeVisible();
    const totalCount = await allTemplateCards.count();

    // Act: Apply namespace filter via the namespace selector in the TopBar
    const namespaceSelector = page.getByTestId('namespace-selector').locator('button[role="combobox"]');
    await namespaceSelector.click();

    const dashboardTestOption = page.getByRole('option', { name: /^dashboard-test$/i })
      .or(page.getByTestId('namespace-option-dashboard-test'));
    // networkidle may already be satisfied while the namespace request is still pending.
    const filteredResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return response.request().method() === 'GET'
        && url.pathname === '/api/argo/workflow-templates'
        && url.searchParams.get('ns') === 'dashboard-test';
    });
    await dashboardTestOption.click();
    const filteredResponse = await filteredResponsePromise;
    expect(filteredResponse.ok()).toBeTruthy();
    const filteredTemplates: Array<{ namespace: string }> = await filteredResponse.json();
    expect(filteredTemplates.length).toBeGreaterThan(0);
    expect(filteredTemplates.length).toBeLessThan(totalCount);
    const expectedNamespaces = Array(filteredTemplates.length).fill('dashboard-test');
    expect(filteredTemplates.map((template) => template.namespace)).toEqual(expectedNamespaces);

    await expect(namespaceSelector).toHaveText('dashboard-test');
    await expect(page).toHaveURL(/[?&]namespace=dashboard-test(?:&|$)/);

    // Wait for the complete rendered list, not a snapshot of cards from the previous response.
    const filteredTemplateCards = page.getByTestId('workflow-template-card');
    await expect(filteredTemplateCards).toHaveCount(filteredTemplates.length);
    await expect(filteredTemplateCards.getByTestId('workflow-template-namespace'))
      .toHaveText(expectedNamespaces);
  });

});
