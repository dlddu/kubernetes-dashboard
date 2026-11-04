import { test, expect } from '@playwright/test';

test.describe('Argo Tab - WorkflowTemplate List', () => {
  test('should display Templates section by default when navigating to Argo tab', async ({ page }) => {
    await page.goto('/argo');
    await page.waitForLoadState('networkidle');

    const argoPage = page.getByTestId('argo-page');
    await expect(argoPage).toBeVisible();

    const templatesSection = page.getByTestId('workflow-templates-page');
    await expect(templatesSection).toBeVisible();
  });

  test('should render WorkflowTemplate cards with name, namespace, and parameter tags', async ({ page }) => {
    await page.goto('/argo');
    await page.waitForLoadState('networkidle');

    const templateCards = page.getByTestId('workflow-template-card');
    const cardCount = await templateCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

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

    expect(dataProcessingCard).toBeTruthy();
    if (!dataProcessingCard) return;

    const templateName = dataProcessingCard.getByTestId('workflow-template-name');
    await expect(templateName).toBeVisible();
    expect(await templateName.innerText()).toBe('data-processing-with-params');

    const templateNamespace = dataProcessingCard.getByTestId('workflow-template-namespace');
    await expect(templateNamespace).toBeVisible();
    expect(await templateNamespace.innerText()).toBe('dashboard-test');

    const paramTags = dataProcessingCard.getByTestId('workflow-template-params');
    await expect(paramTags).toBeVisible();
    const paramTagItems = dataProcessingCard.getByTestId('workflow-template-param-tag');
    expect(await paramTagItems.count()).toBe(4);

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
    await page.goto('/argo');
    await page.waitForLoadState('networkidle');

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

    expect(simpleTemplateCard).toBeTruthy();
    if (!simpleTemplateCard) return;

    const noParamsText = simpleTemplateCard.getByText('No parameters');
    await expect(noParamsText).toBeVisible();
  });

  test('should display only templates for the selected namespace when namespace filter is applied', async ({ page }) => {
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
