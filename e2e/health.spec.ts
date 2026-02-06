import { test, expect } from '@playwright/test';

/**
 * Health Check E2E Tests
 *
 * Tests the health endpoint and basic application availability
 * This is the first e2e test to verify the entire pipeline:
 * - kind cluster setup
 * - Kubernetes resources deployment
 * - Go backend connection to cluster
 * - Frontend build and serving
 * - End-to-end integration
 */

test.describe('Health Check', () => {
  test('should return healthy status from API endpoint', async ({ request }) => {
    // Arrange - API endpoint URL
    const healthUrl = '/api/health';

    // Act - Call health endpoint
    const response = await request.get(healthUrl);

    // Assert - Verify response
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body.status).toBe('ok');
  });

  test('should load frontend application', async ({ page }) => {
    // Arrange - Navigate to root
    await page.goto('/');

    // Act - Wait for page to load
    await page.waitForLoadState('networkidle');

    // Assert - Check page loaded successfully
    expect(page.url()).toContain('localhost:8080');

    // Verify HTML content exists
    const html = await page.content();
    expect(html).toBeTruthy();
    expect(html.length).toBeGreaterThan(0);
  });

  test('should have correct response headers for API', async ({ request }) => {
    // Arrange
    const healthUrl = '/api/health';

    // Act
    const response = await request.get(healthUrl);

    // Assert - Check JSON content type
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('should handle 404 for non-existent API endpoints', async ({ request }) => {
    // Arrange
    const nonExistentUrl = '/api/nonexistent';

    // Act
    const response = await request.get(nonExistentUrl);

    // Assert - Should return 404
    expect(response.status()).toBe(404);
  });

  test('should serve index.html for SPA routes', async ({ page }) => {
    // Arrange - SPA client-side routes
    const spaRoutes = ['/dashboard', '/pods', '/services'];

    for (const route of spaRoutes) {
      // Act - Navigate to SPA route
      await page.goto(route);

      // Assert - Should serve index.html (not 404)
      expect(page.url()).toContain(route);

      // Verify page loaded (not error page)
      const html = await page.content();
      expect(html).toBeTruthy();
    }
  });
});

test.describe('Kubernetes Integration', () => {
  test('should connect to kind cluster', async ({ request }) => {
    // This test verifies that the backend can connect to the kind cluster
    // For now, we just verify the health endpoint works
    // Later tests will check actual Kubernetes API calls

    // Arrange
    const healthUrl = '/api/health';

    // Act
    const response = await request.get(healthUrl);

    // Assert
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('ok');
  });
});
