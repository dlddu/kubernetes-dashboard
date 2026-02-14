import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test('should return healthy status from API endpoint', async ({ request }) => {
    // Act: Call the health endpoint
    const response = await request.get('/api/health');

    // Assert: Response should be successful
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Assert: Response should have correct content type
    expect(response.headers()['content-type']).toContain('application/json');

    // Assert: Response body should match expected structure
    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('message', 'Backend is healthy');
  });

  test('should serve the frontend application', async ({ page }) => {
    // Act: Navigate to the home page
    await page.goto('/');

    // Assert: Page should load successfully
    expect(new URL(page.url()).pathname).toBe('/');

    // Assert: Page should have a title
    await expect(page).toHaveTitle(/Kubernetes Dashboard/i);
  });

  test('should handle 404 for non-existent routes', async ({ request }) => {
    // Act: Request a non-existent route
    const response = await request.get('/non-existent-route');

    // Assert: Should return 404 or redirect to index.html (SPA routing)
    // For SPA, it might return 200 and serve index.html
    expect([200, 404]).toContain(response.status());
  });

  test('should reject non-GET requests to health endpoint', async ({ request }) => {
    // Act: Try POST to health endpoint
    const response = await request.post('/api/health');

    // Assert: Should return 405 Method Not Allowed
    expect(response.status()).toBe(405);
  });

  test('should have correct CORS headers', async ({ request }) => {
    // Act: Make a request to the API
    const response = await request.get('/api/health');

    // Assert: Response should be successful
    expect(response.ok()).toBeTruthy();

    // Note: Add CORS header checks if/when CORS is configured
    // const headers = response.headers();
    // expect(headers['access-control-allow-origin']).toBeDefined();
  });
});

test.describe('Kubernetes Integration', () => {
  test.skip('should connect to Kubernetes cluster', async ({ request }) => {
    // This test will be implemented after Kubernetes endpoints are added
    // Currently skipped as the feature is not yet implemented

    // Act: Call the Kubernetes API endpoint
    const response = await request.get('/api/k8s/namespaces');

    // Assert: Should return namespaces
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('items');
    expect(Array.isArray(body.items)).toBeTruthy();
  });

  test.skip('should list pods in default namespace', async ({ request }) => {
    // This test will be implemented after pod listing endpoint is added
    // Currently skipped as the feature is not yet implemented

    // Act: Call the pods endpoint
    const response = await request.get('/api/k8s/namespaces/default/pods');

    // Assert: Should return pods
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('items');
    expect(Array.isArray(body.items)).toBeTruthy();
  });
});
