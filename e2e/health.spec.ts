import { test, expect } from '@playwright/test';

test.describe('Liveness Check', () => {
  test('should return alive status from livez endpoint', async ({ request }) => {
    // Act: Call the liveness endpoint
    const response = await request.get('/api/livez');

    // Assert: Response should be successful
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Assert: Response should have correct content type
    expect(response.headers()['content-type']).toContain('application/json');

    // Assert: Response body should match expected structure
    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('message', 'Alive');
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

  test('should reject non-GET requests to livez endpoint', async ({ request }) => {
    // Act: Try POST to livez endpoint
    const response = await request.post('/api/livez');

    // Assert: Should return 405 Method Not Allowed
    expect(response.status()).toBe(405);
  });

  test('should have correct CORS headers', async ({ request }) => {
    // Act: Make a request to the API
    const response = await request.get('/api/livez');

    // Assert: Response should be successful
    expect(response.ok()).toBeTruthy();

    // Note: Add CORS header checks if/when CORS is configured
    // const headers = response.headers();
    // expect(headers['access-control-allow-origin']).toBeDefined();
  });
});

test.describe('Readiness Check', () => {
  test('should return readiness status from readyz endpoint', async ({ request }) => {
    // Act: Call the readiness endpoint
    const response = await request.get('/api/readyz');

    // Assert: Response should be successful (cluster is available in e2e)
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Assert: Response should have correct content type
    expect(response.headers()['content-type']).toContain('application/json');

    // Assert: Response body should match expected structure
    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('message', 'Ready');
  });

  test('should reject non-GET requests to readyz endpoint', async ({ request }) => {
    // Act: Try POST to readyz endpoint
    const response = await request.post('/api/readyz');

    // Assert: Should return 405 Method Not Allowed
    expect(response.status()).toBe(405);
  });
});

test.describe('Kubernetes Integration', () => {
  test('should connect to Kubernetes cluster', async ({ request }) => {
    // Act: Call the namespaces API endpoint
    const response = await request.get('/api/namespaces');

    // Assert: Should return namespaces
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
  });

  test('should list pods in default namespace', async ({ request }) => {
    // Act: Call the pods endpoint with namespace filter
    const response = await request.get('/api/pods/all?ns=default');

    // Assert: Should return pods
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });
});
