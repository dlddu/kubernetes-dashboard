# E2E Tests for Kubernetes Dashboard

This directory contains end-to-end tests using Playwright for the Kubernetes Dashboard application.

## Test organization (AC ↔ spec 1:1)

Top-level `e2e/*.spec.ts` files are the **AC-matching surface**: each file verifies
exactly one Acceptance Criterion and declares it in a header comment
(`// Verifies: <AC> (docs/product/prd-*.md)`). The mapping SSOT is the `자동화` field
of `docs/product/test-*.md`; `docs/product/doc-tracker.md` holds the aggregate view.

Two subdirectories are **excluded** from AC↔spec matching:
- `e2e/smoke/` — infra liveness/readiness probes (not a product AC).
- `e2e/eng/` — engineering diagnostic contracts (e.g. the `/debug` page), registered
  in `docs/product/eng-notes.md` (ENG-NNN). Each carries an `// Engineering: ENG-NNN` header.

Shared helpers live in `e2e/helpers/` and are not specs. When adding an e2e test, first
decide which AC it covers and extend that AC's existing spec; only create a new top-level
spec when introducing a new AC.

## Network mocking policy

e2e runs against a **real kind cluster + real fixtures** by default. Network interception
and response mocking (`page.route`, `route.fulfill`/`continue`/`abort`, etc.) are allowed
**only** for cases that cannot be reproduced in the real environment and **only** when the
site is listed in the allowlist. Each allowed interception carries a
`// mock-exception: <CODE> — <reason>` comment immediately before the `page.route(...)`
call, and the same entry must appear in the allowlist. The policy SSOT (allowed categories
`ERR`/`LAT`/`ABS`/`DES` and the allowlist) is `docs/e2e-mocking-policy.md`.

## Prerequisites

- Node.js 20+
- Go 1.21+
- Docker (for kind)
- kind (Kubernetes in Docker)
- kubectl

## Setup

### 1. Install Dependencies

Install Playwright and its dependencies:

```bash
npm install
npx playwright install --with-deps chromium
```

### 2. Create kind Cluster

```bash
./scripts/kind-cluster.sh create
```

### 3. Apply Test Fixtures

```bash
./test/fixtures/apply-all.sh
```

### 4. Build and Start Backend

```bash
# Build frontend
cd frontend
npm ci
npm run build
cd ..

# Build backend
go build -o kubernetes-dashboard .

# Export kubeconfig
./scripts/kind-cluster.sh export-kubeconfig ./kubeconfig
export KUBECONFIG=$(pwd)/kubeconfig

# Start backend
./kubernetes-dashboard
```

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

### Run Tests in UI Mode

```bash
npm run test:e2e:ui
```

### Run Tests in Headed Mode

```bash
npm run test:e2e:headed
```

### Debug Tests

```bash
npm run test:e2e:debug
```

### Run Specific Test

```bash
npx playwright test health.spec.ts
```

## Test Structure

```
e2e/
├── health.spec.ts          # Health check and basic API tests
└── README.md               # This file
```

## Writing Tests

Tests follow the Arrange-Act-Assert (AAA) pattern:

```typescript
test('should do something', async ({ page }) => {
  // Arrange
  await page.goto('/');

  // Act
  const element = await page.locator('selector');

  // Assert
  await expect(element).toBeVisible();
});
```

## Test Categories

### Health Check Tests
- API health endpoint validation
- Frontend serving verification
- Error handling tests

### Kubernetes Integration Tests (TODO)
- Namespace listing
- Pod listing
- Resource details
- CRUD operations

## Troubleshooting

### Server not responding
- Ensure backend is running on port 8080
- Check `KUBECONFIG` environment variable is set
- Verify kind cluster is running: `kind get clusters`

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check network connectivity
- Verify Kubernetes cluster is responsive

### Cluster issues
- Delete and recreate cluster: `./scripts/kind-cluster.sh delete && ./scripts/kind-cluster.sh create`
- Check Docker is running
- Verify kind installation: `kind version`

## Cleanup

### Delete Test Resources
```bash
kubectl delete namespace dashboard-test
```

### Delete kind Cluster
```bash
./scripts/kind-cluster.sh delete
```

## CI/CD Integration

E2E tests run automatically in GitHub Actions on:
- Push to `main` branch
- Pull requests
- Manual workflow dispatch

See `.github/workflows/e2e.yaml` for the complete CI pipeline.

## Environment Variables

- `BASE_URL`: Backend server URL (default: `http://localhost:8080`)
- `KUBECONFIG`: Path to kubeconfig file
- `KIND_CLUSTER_NAME`: Name of kind cluster (default: `kubernetes-dashboard-e2e`)

## Reports

Test reports are generated in:
- `playwright-report/` - HTML report
- `test-results/` - Test artifacts (screenshots, videos, traces)

View HTML report:
```bash
npx playwright show-report
```
