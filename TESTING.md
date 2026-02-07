# Testing Guide for Kubernetes Dashboard

This document describes the complete testing strategy for the Kubernetes Dashboard project.

## Test Structure

```
kubernetes-dashboard/
├── frontend/                    # Frontend tests
│   └── src/
│       └── **/*.test.ts        # Vitest unit tests
├── e2e/                        # E2E tests
│   ├── health.spec.ts          # Playwright E2E tests
│   └── README.md               # E2E test documentation
├── test/                       # Backend test utilities
│   ├── backend_helper.go       # Backend test helper
│   ├── backend_helper_test.go  # Backend helper tests
│   └── fixtures/               # Kubernetes test fixtures
│       ├── namespace.yaml
│       ├── deployment.yaml
│       ├── pod.yaml
│       ├── secret.yaml
│       └── apply-all.sh
├── scripts/
│   └── kind-cluster.sh         # Kind cluster management
├── *_test.go                   # Go unit tests
└── .github/workflows/
    ├── ci.yaml                 # CI workflow
    └── e2e.yaml                # E2E workflow
```

## Test Types

### 1. Unit Tests

#### Frontend Unit Tests (Vitest)
```bash
# Run frontend tests
cd frontend
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

#### Backend Unit Tests (Go)
```bash
# Run all Go tests
go test -v ./...

# Run with race detection
go test -v -race ./...

# Run with coverage
go test -v -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### 2. Integration Tests

Integration tests verify that the built binary works correctly:

```bash
# Build and run integration test
make test-integration
```

### 3. E2E Tests (Playwright)

End-to-end tests verify the complete application stack with a real Kubernetes cluster.

#### Quick Start

```bash
# Full E2E test cycle (recommended)
make test-e2e

# Or step by step:
make e2e-setup          # Setup environment
make e2e-backend-start  # Start backend
make e2e-test           # Run tests
make e2e-teardown       # Cleanup
```

#### Manual E2E Testing

```bash
# 1. Create kind cluster
./scripts/kind-cluster.sh create
./scripts/kind-cluster.sh export-kubeconfig ./kubeconfig

# 2. Apply test fixtures
export KUBECONFIG=$(pwd)/kubeconfig
./test/fixtures/apply-all.sh

# 3. Build and start backend
make build
export KUBECONFIG=$(pwd)/kubeconfig
./kubernetes-dashboard

# 4. In another terminal, run E2E tests
npm run test:e2e

# 5. Cleanup
./scripts/kind-cluster.sh delete
```

#### E2E Test Development

```bash
# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug
```

## Test Fixtures

Test fixtures are Kubernetes manifests used for E2E testing:

- `namespace.yaml` - Test namespace (dashboard-test)
- `deployment.yaml` - Sample nginx deployment
- `pod.yaml` - Standalone busybox pod
- `secret.yaml` - Sample secrets and configmap

Apply all fixtures:
```bash
./test/fixtures/apply-all.sh
```

## CI/CD

### CI Workflow (`.github/workflows/ci.yaml`)

Runs on every push and PR:
1. Frontend tests (lint, typecheck, unit tests)
2. Go tests (unit tests with race detection)
3. Integration tests
4. Docker build and test
5. Kubernetes manifest validation

### E2E Workflow (`.github/workflows/e2e.yaml`)

Runs on every push, PR, and can be triggered manually:
1. Install kind and kubectl
2. Create kind cluster
3. Apply test fixtures
4. Build backend
5. Start backend server
6. Run Playwright tests
7. Upload test reports
8. Cleanup

## Backend Test Helper

The `test/backend_helper.go` provides utilities for testing the Go backend:

```go
package mytest

import (
    "testing"
    "github.com/dlddu/kubernetes-dashboard/test"
)

func TestMyFeature(t *testing.T) {
    // Create backend server with kubeconfig
    server, err := test.NewBackendServer(t, test.BackendConfig{
        Port: 0, // Random free port
        Kubeconfig: "./kubeconfig",
    })
    if err != nil {
        t.Fatal(err)
    }

    // Start server
    if err := server.Start(); err != nil {
        t.Fatal(err)
    }
    defer server.Stop()

    // Use server.GetBaseURL() for requests
    // ...
}
```

## Kind Cluster Management

The `scripts/kind-cluster.sh` script manages kind clusters:

```bash
# Create cluster
./scripts/kind-cluster.sh create

# Check status
./scripts/kind-cluster.sh status

# Export kubeconfig
./scripts/kind-cluster.sh export-kubeconfig ./kubeconfig

# Load Docker image
./scripts/kind-cluster.sh load-image kubernetes-dashboard:latest

# Delete cluster
./scripts/kind-cluster.sh delete
```

Environment variables:
- `KIND_CLUSTER_NAME` - Cluster name (default: kubernetes-dashboard-e2e)
- `KUBECONFIG` - Kubeconfig path (default: ~/.kube/config)

## Make Targets

### Standard Testing
```bash
make test              # Run all unit tests
make test-go           # Run Go tests only
make test-frontend     # Run frontend tests only
make test-integration  # Run integration tests
make test-docker       # Test Docker build
make test-k8s          # Validate K8s manifests
```

### E2E Testing
```bash
make test-e2e              # Full E2E cycle
make e2e-setup             # Setup E2E environment
make e2e-cluster-create    # Create kind cluster
make e2e-fixtures          # Apply test fixtures
make e2e-backend-build     # Build backend
make e2e-backend-start     # Start backend
make e2e-test              # Run E2E tests
make e2e-backend-stop      # Stop backend
make e2e-teardown          # Cleanup E2E environment
make e2e-status            # Show E2E environment status
```

## Troubleshooting

### E2E Tests Fail

1. Check backend is running:
   ```bash
   curl http://localhost:8080/api/health
   ```

2. Check kind cluster:
   ```bash
   kind get clusters
   kubectl get nodes
   ```

3. Check test resources:
   ```bash
   kubectl get all -n dashboard-test
   ```

4. View backend logs:
   ```bash
   # If running in background
   ps aux | grep kubernetes-dashboard
   ```

### Kind Cluster Issues

1. Delete and recreate:
   ```bash
   ./scripts/kind-cluster.sh delete
   ./scripts/kind-cluster.sh create
   ```

2. Check Docker:
   ```bash
   docker ps
   docker logs kind-control-plane
   ```

### Playwright Issues

1. Reinstall browsers:
   ```bash
   npx playwright install --with-deps
   ```

2. Check browser version:
   ```bash
   npx playwright --version
   ```

3. View test report:
   ```bash
   npx playwright show-report
   ```

## Best Practices

### Writing Tests

1. **Unit Tests** - Fast, isolated, no external dependencies
2. **Integration Tests** - Test component interactions
3. **E2E Tests** - Test complete user workflows

### Test Naming

- Go: `TestFunctionName_Scenario` or `TestFunctionName_Expected_When_Condition`
- TypeScript: `should <expected> when <condition>`

### Test Organization

- Group related tests with `describe` blocks
- Use `beforeEach`/`afterEach` for setup/teardown
- Keep tests independent and deterministic

### CI/CD

- Run unit tests on every commit
- Run E2E tests on PR and before merge
- Upload test reports and coverage

## Coverage Goals

- Backend: >80% line coverage
- Frontend: >80% line coverage
- E2E: Cover critical user paths

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Go Testing](https://golang.org/pkg/testing/)
- [Kind Documentation](https://kind.sigs.k8s.io/)
