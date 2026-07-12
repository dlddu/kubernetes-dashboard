// Verifies: FX5 (docs/product/prd-fluxcd.md) — sole dedicated e2e spec for this AC.
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

function getCurrentCIBranch(): string {
  const headRef = process.env.GITHUB_HEAD_REF;
  if (headRef && headRef.trim()) {
    return headRef.trim();
  }

  const refName = process.env.GITHUB_REF_NAME;
  if (refName && refName.trim() && !refName.includes('/merge')) {
    return refName.trim();
  }

  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (branch) {
      return branch;
    }
  } catch {
    // Ignore and fall through
  }

  return 'main';
}

// ---------------------------------------------------------------------------
// Group 16: UI — Edit Branch 버튼 표시
// ---------------------------------------------------------------------------
test.describe('FluxCD Tab - GitRepository Detail - Edit Branch Button', () => {
  test('should display "Edit" button next to the branch ref on a branch-based GitRepository', async ({ page }) => {
    await page.goto('/fluxcd/gitrepository/dashboard-test/flux-system');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: Ref displays the current branch
    const specRef = detailPage.getByTestId('gitrepository-detail-spec-ref');
    await expect(specRef).toBeVisible();
    await expect(specRef).toContainText('main');

    // Assert: Edit button is visible next to the branch
    const editButton = detailPage.getByTestId('edit-branch-button');
    await expect(editButton).toBeVisible();
    await expect(editButton).toContainText(/edit/i);
  });

  test('should also display "Edit" button for a tag-based GitRepository (no branch set)', async ({ page }) => {
    await page.goto('/fluxcd/gitrepository/dashboard-test/infra-repo');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    // Assert: Ref displays the tag
    const specRef = detailPage.getByTestId('gitrepository-detail-spec-ref');
    await expect(specRef).toBeVisible();
    await expect(specRef).toContainText('v1.0.0');

    // Assert: Edit button is visible even when ref has no branch
    // (allows switching from tag to branch)
    const editButton = detailPage.getByTestId('edit-branch-button');
    await expect(editButton).toBeVisible();
    await expect(editButton).toContainText(/edit/i);
  });

  test('should allow setting a branch on a tag-based GitRepository through the Edit flow', async ({ page }) => {
    await page.goto('/fluxcd/gitrepository/dashboard-test/infra-repo');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    // Act: Click Edit on the tag-based repository
    const editButton = detailPage.getByTestId('edit-branch-button');
    await editButton.click();

    // Assert: Dropdown appears with placeholder since no branch is currently set
    const branchSelect = detailPage.getByTestId('branch-select');
    await expect(branchSelect).toBeVisible({ timeout: 15000 });

    // Assert: Save button is initially disabled (no branch selected)
    const saveButton = detailPage.getByTestId('save-branch-button');
    await expect(saveButton).toBeDisabled();

    // Cancel out so we don't mutate the fixture for other tests
    const cancelButton = detailPage.getByTestId('cancel-branch-button');
    await cancelButton.click();
    await expect(editButton).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 17: UI — Edit 클릭 시 편집 모드 진입 및 Cancel 동작
// ---------------------------------------------------------------------------
test.describe('FluxCD Tab - GitRepository Detail - Branch Edit Mode', () => {
  test('should enter edit mode with Save and Cancel buttons when Edit is clicked', async ({ page }) => {
    await page.goto('/fluxcd/gitrepository/dashboard-test/flux-system');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    // Act: Click the Edit button
    const editButton = detailPage.getByTestId('edit-branch-button');
    await editButton.click();

    // Assert: Save and Cancel buttons appear
    const saveButton = detailPage.getByTestId('save-branch-button');
    await expect(saveButton).toBeVisible();

    const cancelButton = detailPage.getByTestId('cancel-branch-button');
    await expect(cancelButton).toBeVisible();

    // Assert: Edit button is no longer visible (replaced by edit controls)
    await expect(editButton).not.toBeVisible();
  });

  test('should show dropdown with remote branches including "main" and the CI branch', async ({ page }) => {
    await page.goto('/fluxcd/gitrepository/dashboard-test/flux-system');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    const editButton = detailPage.getByTestId('edit-branch-button');
    await editButton.click();

    // Assert: Dropdown appears with branches fetched from the real repository
    const branchSelect = detailPage.getByTestId('branch-select');
    await expect(branchSelect).toBeVisible({ timeout: 15000 });
    await expect(branchSelect).toHaveValue('main');

    // Assert: Dropdown contains "main" and the current CI branch from the real remote
    const options = branchSelect.locator('option');
    const optionTexts = await options.allTextContents();
    expect(optionTexts).toContain('main');
    expect(optionTexts).toContain(getCurrentCIBranch());
  });

  test('should exit edit mode and restore original display when Cancel is clicked', async ({ page }) => {
    await page.goto('/fluxcd/gitrepository/dashboard-test/flux-system');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    // Act: Enter edit mode
    const editButton = detailPage.getByTestId('edit-branch-button');
    await editButton.click();

    // Wait for edit controls to appear
    const cancelButton = detailPage.getByTestId('cancel-branch-button');
    await expect(cancelButton).toBeVisible();

    // Act: Click Cancel
    await cancelButton.click();

    // Assert: Edit mode exited — Edit button is visible again
    await expect(editButton).toBeVisible();

    // Assert: Save/Cancel buttons are gone
    await expect(cancelButton).not.toBeVisible();
    const saveButton = detailPage.getByTestId('save-branch-button');
    await expect(saveButton).not.toBeVisible();

    // Assert: Branch error message is cleared
    const branchError = detailPage.getByTestId('branch-error');
    await expect(branchError).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Group 18: UI — 브랜치 저장 (Save)
// ---------------------------------------------------------------------------
test.describe('FluxCD Tab - GitRepository Detail - Save Branch', () => {
  test('should save current branch and exit edit mode when Save is clicked', async ({ page }) => {
    await page.goto('/fluxcd/gitrepository/dashboard-test/flux-system');
    await page.waitForLoadState('networkidle');

    const detailPage = page.getByTestId('gitrepository-detail-page');
    await expect(detailPage).toBeVisible();

    // Act: Enter edit mode
    const editButton = detailPage.getByTestId('edit-branch-button');
    await editButton.click();

    // Wait for dropdown to appear
    const branchSelect = detailPage.getByTestId('branch-select');
    await expect(branchSelect).toBeVisible({ timeout: 15000 });

    // Act: Keep the current branch selected ("main") and click Save
    const saveButton = detailPage.getByTestId('save-branch-button');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Assert: Edit mode exited — Edit button is visible again
    await expect(editButton).toBeVisible({ timeout: 10000 });

    // Assert: Dropdown is no longer visible
    await expect(branchSelect).not.toBeVisible();

    // Assert: Ref still shows "main"
    const specRef = detailPage.getByTestId('gitrepository-detail-spec-ref');
    await expect(specRef).toContainText('main');
  });
});

// ---------------------------------------------------------------------------
// Group 19: 백엔드 API — POST /api/fluxcd/gitrepositories/{namespace}/{name}/update-branch
// ---------------------------------------------------------------------------
test.describe('FluxCD API - POST /api/fluxcd/gitrepositories/{namespace}/{name}/update-branch', () => {
  test('should return 200 and update branch when the GitRepository exists', async ({ request }) => {
    const response = await request.post(
      '/api/fluxcd/gitrepositories/dashboard-test/flux-system/update-branch',
      {
        data: { branch: 'main' },
      }
    );

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body.message).toMatch(/branch updated/i);
  });

  test('should return 404 when the GitRepository does not exist', async ({ request }) => {
    const response = await request.post(
      '/api/fluxcd/gitrepositories/dashboard-test/non-existent-resource/update-branch',
      {
        data: { branch: 'main' },
      }
    );

    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('should return 400 when branch name is empty', async ({ request }) => {
    const response = await request.post(
      '/api/fluxcd/gitrepositories/dashboard-test/flux-system/update-branch',
      {
        data: { branch: '' },
      }
    );

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('should return 400 when request body is invalid JSON', async ({ request }) => {
    const response = await request.post(
      '/api/fluxcd/gitrepositories/dashboard-test/flux-system/update-branch',
      {
        headers: { 'Content-Type': 'application/json' },
        data: 'not json',
      }
    );

    expect(response.status()).toBe(400);
  });

  test('should verify the branch is actually updated on the resource after a successful update', async ({ request }) => {
    // Act: Update branch to "develop"
    const updateResponse = await request.post(
      '/api/fluxcd/gitrepositories/dashboard-test/flux-system/update-branch',
      {
        data: { branch: 'develop' },
      }
    );
    expect(updateResponse.ok()).toBeTruthy();

    // Assert: Fetch the detail and confirm the branch has changed
    const detailResponse = await request.get(
      '/api/fluxcd/gitrepositories/dashboard-test/flux-system'
    );
    expect(detailResponse.ok()).toBeTruthy();
    const detail = await detailResponse.json();
    expect(detail.spec.ref.branch).toBe('develop');

    // Cleanup: Restore the original branch
    const restoreResponse = await request.post(
      '/api/fluxcd/gitrepositories/dashboard-test/flux-system/update-branch',
      {
        data: { branch: 'main' },
      }
    );
    expect(restoreResponse.ok()).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Group 20: 백엔드 API — GET /api/fluxcd/gitrepositories/{namespace}/{name}/branches
// ---------------------------------------------------------------------------
test.describe('FluxCD API - GET /api/fluxcd/gitrepositories/{namespace}/{name}/branches', () => {
  test('should return 404 when the GitRepository does not exist', async ({ request }) => {
    const response = await request.get(
      '/api/fluxcd/gitrepositories/dashboard-test/non-existent-resource/branches'
    );

    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('should return branches array including "main" for the dlddu/kubernetes-dashboard repository', async ({ request }) => {
    const response = await request.get(
      '/api/fluxcd/gitrepositories/dashboard-test/flux-system/branches'
    );

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body).toHaveProperty('branches');
    expect(Array.isArray(body.branches)).toBeTruthy();

    // Assert: "main" branch exists in the real repository
    expect(body.branches).toContain('main');
  });

  test('should return branches array including the current CI branch', async ({ request }) => {
    const response = await request.get(
      '/api/fluxcd/gitrepositories/dashboard-test/flux-system/branches'
    );

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body.branches)).toBeTruthy();

    // Assert: The CI branch that triggered this test run should exist
    expect(body.branches).toContain(getCurrentCIBranch());
  });

  test('should only accept GET method', async ({ request }) => {
    const response = await request.post(
      '/api/fluxcd/gitrepositories/dashboard-test/flux-system/branches'
    );

    expect(response.status()).toBe(405);
  });
});
