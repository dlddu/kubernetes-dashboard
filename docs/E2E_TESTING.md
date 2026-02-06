# E2E Testing Guide

This document describes the end-to-end testing setup for the Kubernetes Dashboard project.

## Overview

The E2E test infrastructure consists of:
- **Playwright** for browser automation and API testing
- **kind (Kubernetes in Docker)** for local Kubernetes cluster
- **Test fixtures** for Kubernetes resources (namespaces, deployments, pods, secrets)
- **GitHub Actions workflow** for automated CI testing

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      E2E Test Flow                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Setup kind cluster                                      │
│     └─> test/kind-setup.sh setup                           │
│                                                             │
│  2. Apply test fixtures                                     │
│     └─> test/fixtures/*.yaml                               │
│                                                             │
│  3. Build frontend                                          │
│     └─> cd frontend && npm run build                       │
│                                                             │
│  4. Build backend                                           │
│     └─> go build -o kubernetes-dashboard .                 │
│                                                             │
│  5. Start backend server                                    │
│     └─> ./kubernetes-dashboard (port 8080)                 │
│                                                             │
│  6. Run Playwright tests                                    │
│     └─> npm run test:e2e                                   │
│                                                             │
│  7. Teardown cluster                                        │
│     └─> test/kind-setup.sh teardown                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

Install required tools:

```bash
# kind
brew install kind  # macOS
# or
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind && sudo mv ./kind /usr/local/bin/kind

# kubectl
brew install kubectl  # macOS
# or
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl && sudo mv kubectl /usr/local/bin/

# Node.js 20+
node --version  # should be v20.x.x or higher

# Go 1.21+
go version  # should be go1.21.x or higher

# Docker (required for kind)
docker --version
```

### Running E2E Tests Locally

#### Option 1: Full Automated Cycle

```bash
make test-e2e-full
```

This will:
1. Install Playwright dependencies
2. Create kind cluster
3. Apply test fixtures
4. Build frontend and backend
5. Run E2E tests
6. Teardown cluster

#### Option 2: Manual Step-by-Step

```bash
# 1. Setup dependencies
make setup-e2e

# 2. Create kind cluster
make e2e-setup

# 3. Build project
make build

# 4. Start backend (in separate terminal)
./kubernetes-dashboard

# 5. Run E2E tests (in another terminal)
npm run test:e2e

# 6. Cleanup
make e2e-teardown
```

## Makefile Targets

| Target | Description |
|--------|-------------|
| `make setup-e2e` | Install all e2e dependencies (Playwright, Go modules) |
| `make e2e-setup` | Create kind cluster and apply test fixtures |
| `make e2e-teardown` | Delete kind cluster |
| `make e2e-validate` | Validate e2e test environment setup |
| `make e2e-install-playwright` | Install Playwright and browsers |
| `make test-e2e` | Run e2e tests (requires cluster to be running) |
| `make test-e2e-full` | Full cycle: setup → test → teardown |

## Test Structure

### Test Files

```
e2e/
├── health.spec.ts           # Health check and basic integration tests
└── README.md                # E2E testing documentation

test/
├── kind-setup.sh            # kind cluster management script
├── e2e_helper.go            # Go test helper functions
├── e2e_test.sh              # E2E validation script
└── fixtures/                # Kubernetes test resources
    ├── namespace.yaml       # Test namespaces
    ├── deployment.yaml      # Test deployments
    ├── pod.yaml             # Test pods
    └── secret.yaml          # Test secrets
```

### Test Fixtures

The test fixtures create a realistic Kubernetes environment:

- **Namespaces**: `test-namespace`, `test-namespace-2`
- **Deployments**: nginx and busybox deployments
- **Pods**: Standalone and multi-container pods
- **Secrets**: Opaque and TLS secrets

## GitHub Actions Workflow

The E2E tests run automatically on:
- Push to `main` branch
- Pull requests to `main`

Workflow: `.github/workflows/e2e.yaml`

### Workflow Steps

1. Setup Go 1.21
2. Setup Node.js 20
3. Install kind and kubectl
4. Create kind cluster
5. Apply test fixtures
6. Build frontend and backend
7. Start backend server
8. Install Playwright
9. Run E2E tests
10. Upload test reports (on failure)
11. Cleanup cluster

### Artifacts

On test failure, the following artifacts are uploaded:
- `playwright-report/` - HTML test report
- `test-results/` - Screenshots and videos

## Writing E2E Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page, request }) => {
    // Arrange
    const url = '/some-page';

    // Act
    await page.goto(url);

    // Assert
    expect(page.url()).toContain('expected');
  });
});
```

### API Testing

```typescript
test('API endpoint test', async ({ request }) => {
  const response = await request.get('/api/endpoint');

  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toHaveProperty('field');
});
```

### UI Testing

```typescript
test('UI interaction test', async ({ page }) => {
  await page.goto('/');
  await page.click('button#action');
  await expect(page.locator('.result')).toBeVisible();
});
```

## Troubleshooting

### kind cluster won't start

```bash
# Check Docker is running
docker ps

# Delete and recreate cluster
make e2e-teardown
make e2e-setup
```

### Backend can't connect to cluster

```bash
# Verify KUBECONFIG
echo $KUBECONFIG

# Test kubectl connection
kubectl cluster-info

# Set correct kubeconfig
export KUBECONFIG=$(kind get kubeconfig --name k8s-dashboard-e2e)
```

### Playwright tests timeout

```bash
# Verify backend is running
curl http://localhost:8080/api/health

# Check frontend build
ls -la frontend/dist/

# Increase timeout in playwright.config.ts if needed
```

### Tests fail on CI but pass locally

Common causes:
- Different Node.js or Go versions
- Race conditions (use retry logic in CI)
- Resources not ready (increase wait times)

Solutions:
- Check GitHub Actions logs
- Review uploaded artifacts (screenshots, videos)
- Ensure tests are not order-dependent

## Configuration

### Playwright Configuration

File: `playwright.config.ts`

Key settings:
- `timeout`: 30 seconds per test
- `retries`: 2 on CI, 0 locally
- `workers`: 1 on CI (sequential), parallel locally
- `baseURL`: `http://localhost:8080`

### kind Cluster Configuration

The cluster is configured with:
- 1 control-plane node
- Port mapping: 30000 (for future NodePort services)
- Cluster name: `k8s-dashboard-e2e`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KIND_CLUSTER_NAME` | kind cluster name | `k8s-dashboard-e2e` |
| `KUBECONFIG` | Kubeconfig file path | `~/.kube/config` |
| `BASE_URL` | Backend base URL | `http://localhost:8080` |
| `SERVER_PORT` | Backend server port | `8080` |
| `CI` | CI environment flag | (auto-detected) |

## Best Practices

1. **Keep tests independent**: Each test should be able to run in isolation
2. **Use test fixtures**: Leverage Kubernetes fixtures for consistent state
3. **Clean up resources**: Ensure cluster is torn down after tests
4. **Handle timing**: Use proper waits instead of fixed sleeps
5. **Descriptive names**: Use clear test and describe names
6. **AAA pattern**: Follow Arrange-Act-Assert in all tests
7. **Retry on CI**: Configure retries for flaky network operations
8. **Capture failures**: Screenshots and videos help debug CI failures

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [kind Documentation](https://kind.sigs.k8s.io/)
- [Kubernetes Testing Guide](https://kubernetes.io/docs/tasks/tools/)
- [E2E Test README](../e2e/README.md)
