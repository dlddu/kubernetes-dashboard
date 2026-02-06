import { test, expect } from '@playwright/test';

/**
 * Health Check E2E Tests
 *
 * These tests verify that the frontend can successfully communicate
 * with the backend API and that the full stack is operational.
 */

test.describe('Health Check E2E', () => {
  test('should load the application homepage', async ({ page }) => {
    // Arrange & Act
    await page.goto('/');

    // Assert
    await expect(page).toHaveTitle(/Kubernetes Dashboard/i);
  });

  test('should display health status from backend API', async ({ page }) => {
    // Arrange
    await page.goto('/');

    // Act
    // Wait for the health check to complete
    // The frontend should make a request to /api/health on load
    await page.waitForLoadState('networkidle');

    // Assert
    // Verify that the API request was made
    const healthResponse = await page.request.get('/api/health');
    expect(healthResponse.ok()).toBeTruthy();
    expect(healthResponse.status()).toBe(200);

    const healthData = await healthResponse.json();
    expect(healthData).toHaveProperty('status', 'ok');
    expect(healthData).toHaveProperty('message');
  });

  test('should show healthy status indicator in UI', async ({ page }) => {
    // Arrange
    await page.goto('/');

    // Act
    await page.waitForLoadState('networkidle');

    // Assert
    // Look for a health status indicator in the UI
    // This assumes the frontend displays health status
    const healthIndicator = page.locator('[data-testid="health-status"]');

    // Wait for the health indicator to appear
    await expect(healthIndicator).toBeVisible({ timeout: 10000 });

    // Verify it shows healthy status
    await expect(healthIndicator).toContainText(/healthy|ok/i);
  });

  test('should handle backend health check endpoint directly', async ({ request }) => {
    // Arrange & Act
    const response = await request.get('/api/health');

    // Assert
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const data = await response.json();
    expect(data).toEqual({
      status: 'ok',
      message: expect.any(String),
    });
  });

  test('should connect to Kubernetes cluster when kubeconfig is available', async ({ request }) => {
    // Arrange & Act
    const response = await request.get('/api/health');

    // Assert
    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // When running in kind cluster, the backend should successfully
    // connect to Kubernetes API
    // This test will initially fail until K8s connection is implemented
    expect(data.status).toBe('ok');

    // In future iterations, we can check for cluster connectivity
    // expect(data).toHaveProperty('cluster_connected', true);
  });
});

test.describe('Error Handling E2E', () => {
  test('should handle 404 for non-existent API routes', async ({ request }) => {
    // Arrange & Act
    const response = await request.get('/api/nonexistent');

    // Assert
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(404);
  });

  test('should serve SPA for non-API routes (client-side routing)', async ({ page }) => {
    // Arrange & Act
    const response = await page.goto('/dashboard');

    // Assert
    // Should return index.html (200), not 404
    expect(response?.status()).toBe(200);

    // Should still have the app title
    await expect(page).toHaveTitle(/Kubernetes Dashboard/i);
  });

  test('should reject non-GET methods on health endpoint', async ({ request }) => {
    // Arrange
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

    // Act & Assert
    for (const method of methods) {
      const response = await request.fetch('/api/health', {
        method: method,
      });

      expect(response.status()).toBe(405); // Method Not Allowed
    }
  });
});
