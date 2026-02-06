# E2E Tests

End-to-end tests for the Kubernetes Dashboard using Playwright.

## Overview

These tests verify the full integration of:
- Frontend (React + Vite)
- Backend (Go + net/http)
- Kubernetes cluster (kind)

## Prerequisites

- Node.js 20+
- Go 1.21+
- Docker (for kind)
- kind CLI
- kubectl

## Running Tests Locally

### 1. Install Dependencies

```bash
# Install Playwright
npm install

# Install Playwright browsers
npx playwright install --with-deps chromium
```

### 2. Set Up Kind Cluster

```bash
# Create kind cluster and apply fixtures
./scripts/kind-setup.sh
```

### 3. Build and Start Backend

```bash
# Build frontend
cd frontend
npm ci
npm run build
cd ..

# Build backend
go build -o kubernetes-dashboard .

# Start backend (with kubeconfig)
export KUBECONFIG=~/.kube/config
./kubernetes-dashboard
```

### 4. Run E2E Tests

In a separate terminal:

```bash
# Run all tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug
```

### 5. Clean Up

```bash
# Stop the backend (Ctrl+C)

# Delete kind cluster
./scripts/kind-teardown.sh
```

## Test Structure

```
test/e2e/
├── README.md              # This file
└── health.spec.ts         # Health check E2E tests
```

## Test Fixtures

Test fixtures are located in `test/fixtures/`:

- `test-namespace.yaml` - Test namespaces
- `test-secret.yaml` - Test secrets
- `test-deployment.yaml` - Test deployments and services
- `test-pod.yaml` - Standalone test pods

These fixtures are automatically applied by `scripts/kind-setup.sh`.

## CI/CD

E2E tests run automatically in GitHub Actions on:
- Push to `main` branch
- Pull requests to `main` branch

See `.github/workflows/e2e.yaml` for the full CI pipeline.

## Test Scenarios

### Health Check Tests (`health.spec.ts`)

- ✓ Application loads successfully
- ✓ Backend API responds to health checks
- ✓ Frontend displays health status
- ✓ Error handling for invalid routes
- ✓ SPA client-side routing works
- ✓ HTTP method validation

## Writing New Tests

Follow the AAA pattern (Arrange, Act, Assert):

```typescript
test('should do something when condition', async ({ page }) => {
  // Arrange
  await page.goto('/');

  // Act
  const result = await page.locator('[data-testid="element"]').textContent();

  // Assert
  expect(result).toBe('expected value');
});
```

### Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Wait for network idle** before assertions
3. **Test user behavior**, not implementation
4. **Keep tests independent** (no shared state)
5. **Use descriptive test names** (should/when format)

## Debugging

### View Test Report

```bash
npm run test:e2e:report
```

### Debug Failed Tests

```bash
# Run specific test file
npx playwright test test/e2e/health.spec.ts

# Run with trace
npx playwright test --trace on

# Show trace viewer
npx playwright show-trace trace.zip
```

### Check Backend Logs

```bash
# If backend is running in background
ps aux | grep kubernetes-dashboard

# Check if backend is responding
curl http://localhost:8080/api/health
```

### Check Kind Cluster

```bash
# Get cluster info
kubectl cluster-info

# List all resources
kubectl get all -A

# Check specific namespace
kubectl get pods -n test-namespace

# View pod logs
kubectl logs -n test-namespace <pod-name>
```

## Troubleshooting

### Backend not starting

```bash
# Check if port 8080 is in use
lsof -i :8080

# Check kubeconfig
echo $KUBECONFIG
kubectl cluster-info
```

### Kind cluster issues

```bash
# Delete and recreate cluster
./scripts/kind-teardown.sh
./scripts/kind-setup.sh

# Check Docker
docker ps
docker logs <kind-container>
```

### Playwright issues

```bash
# Reinstall browsers
npx playwright install --force chromium

# Check Playwright installation
npx playwright --version
```

## Future Tests

Planned test scenarios:

- [ ] List pods from Kubernetes cluster
- [ ] View pod details
- [ ] View pod logs
- [ ] List deployments
- [ ] Scale deployments
- [ ] View secrets (metadata only)
- [ ] Filter and search resources
- [ ] Real-time updates
- [ ] Error handling for cluster connection issues

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [kind Documentation](https://kind.sigs.k8s.io/)
- [Kubernetes Testing Best Practices](https://kubernetes.io/docs/tasks/tools/)
