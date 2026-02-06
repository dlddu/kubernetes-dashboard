# E2E Test Plan

## Overview

This document outlines the E2E testing strategy for the Kubernetes Dashboard project, following Test-Driven Development (TDD) principles.

## Testing Philosophy

We follow the **Red-Green-Refactor** TDD cycle:

1. **Red**: Write failing tests first
2. **Green**: Implement minimum code to pass tests
3. **Refactor**: Improve code while keeping tests green

## Test Pyramid

```
        /\
       /  \      E2E Tests (Playwright)
      /    \     - Full stack integration
     /------\    - User workflows
    /        \
   /  UNIT    \  Unit Tests (Go, Vitest)
  /____________\ - Individual functions
                 - Component behavior
```

## E2E Test Scope

### What We Test

- **Full Stack Integration**: Frontend + Backend + Kubernetes
- **User Workflows**: Real user interactions
- **API Integration**: Frontend calling backend APIs
- **Kubernetes Connectivity**: Backend communicating with K8s cluster
- **Error Handling**: Graceful degradation

### What We Don't Test

- **Unit Logic**: Use unit tests instead
- **Component Internals**: Use component tests instead
- **Browser Compatibility**: Focus on Chromium (extend later)

## Test Environment

### Local Development

```
┌─────────────┐
│  Developer  │
│   Machine   │
├─────────────┤
│  Frontend   │ ← Vite dev server or built assets
│  (React)    │
├─────────────┤
│  Backend    │ ← Go server with embedded frontend
│  (Go)       │
├─────────────┤
│   kind      │ ← Local Kubernetes cluster
│  Cluster    │
└─────────────┘
```

### CI/CD (GitHub Actions)

```
┌──────────────────┐
│  GitHub Actions  │
│    Runner        │
├──────────────────┤
│  1. Build        │ ← Build frontend + backend
│  2. Docker       │ ← Create Docker image
│  3. kind         │ ← Create K8s cluster
│  4. Deploy       │ ← Load image, apply fixtures
│  5. Test         │ ← Run Playwright tests
│  6. Report       │ ← Upload artifacts
│  7. Cleanup      │ ← Teardown cluster
└──────────────────┘
```

## Test Fixtures

### Namespaces
- `test-namespace`: Main testing namespace
- `monitoring`: For monitoring/observability features

### Secrets
- `test-secret`: Basic username/password
- `db-secret`: Database connection string
- `tls-secret`: TLS certificate (dummy)

### Deployments
- `test-nginx`: 2 replicas, HTTP server
- `test-app`: 1 replica, uses secrets

### Pods
- `test-standalone-pod`: Single container
- `test-multicontainer-pod`: Main + sidecar
- `test-init-container-pod`: With init container
- `prometheus-mock`: In monitoring namespace

### Services
- `test-nginx-service`: ClusterIP for nginx

## Test Scenarios

### Phase 1: Health Check ✓ (Current)

| Test | Description | Status |
|------|-------------|--------|
| App loads | Homepage loads successfully | ✓ Written |
| Health API | Backend responds to `/api/health` | ✓ Written |
| Health UI | Frontend displays health status | ✓ Written |
| Error handling | 404 for invalid routes | ✓ Written |
| SPA routing | Client-side routes work | ✓ Written |
| Method validation | Only GET allowed on health | ✓ Written |

### Phase 2: Kubernetes Integration (Next)

| Test | Description | Status |
|------|-------------|--------|
| List pods | Display pods from cluster | ⏳ Planned |
| Pod details | Show pod info and status | ⏳ Planned |
| Pod logs | View container logs | ⏳ Planned |
| List namespaces | Display all namespaces | ⏳ Planned |
| Filter resources | Search/filter functionality | ⏳ Planned |

### Phase 3: Resource Management

| Test | Description | Status |
|------|-------------|--------|
| List deployments | Show all deployments | ⏳ Planned |
| Scale deployment | Change replica count | ⏳ Planned |
| View services | List services | ⏳ Planned |
| View secrets | Show secret metadata | ⏳ Planned |
| View events | Display cluster events | ⏳ Planned |

### Phase 4: Advanced Features

| Test | Description | Status |
|------|-------------|--------|
| Real-time updates | WebSocket/polling | ⏳ Planned |
| Multi-namespace | Switch namespaces | ⏳ Planned |
| RBAC | Permission handling | ⏳ Planned |
| Error recovery | Handle cluster disconnect | ⏳ Planned |

## Success Criteria

### Test Execution

- ✅ All tests pass in CI/CD
- ✅ Tests run in < 10 minutes
- ✅ Flaky test rate < 1%
- ✅ Test coverage > 80% for critical paths

### Infrastructure

- ✅ kind cluster creates successfully
- ✅ Test fixtures apply without errors
- ✅ Backend connects to cluster
- ✅ Frontend serves correctly

### Reporting

- ✅ Playwright HTML report generated
- ✅ Screenshots on failure
- ✅ Video recordings on failure
- ✅ Test results uploaded as artifacts

## Current Test Status

### ✓ Completed

- [x] Playwright configuration
- [x] Basic health check E2E test
- [x] kind setup script
- [x] kind teardown script
- [x] Test fixtures (namespace, secret, deployment, pod)
- [x] GitHub Actions E2E workflow
- [x] Documentation

### ⏳ In Progress

- [ ] Implementing health UI in frontend (tests will pass once implemented)
- [ ] Adding data-testid attributes to frontend components

### ❌ Failing Tests (Expected - TDD Red Phase)

The following tests are currently failing because the implementation is not yet complete:

1. **should show healthy status indicator in UI**
   - Reason: Frontend doesn't have `data-testid="health-status"` element yet
   - Next step: Add health status component to frontend

2. **should connect to Kubernetes cluster when kubeconfig is available**
   - Reason: Backend doesn't expose cluster connectivity status yet
   - Next step: Add cluster connection check to health endpoint

This is **expected and correct** in TDD - we write tests first (Red phase), then implement to pass them (Green phase).

## Running Tests

### Quick Start

```bash
# Local
./scripts/kind-setup.sh
npm install
npx playwright install chromium
npm run test:e2e

# CI (automatic on push/PR)
git push origin feature-branch
```

### Detailed Commands

```bash
# 1. Setup
./scripts/kind-setup.sh
cd frontend && npm ci && npm run build && cd ..
go build -o kubernetes-dashboard .

# 2. Start backend
export KUBECONFIG=~/.kube/config
./kubernetes-dashboard &

# 3. Run tests
npm run test:e2e              # All tests
npm run test:e2e:ui           # Interactive UI
npm run test:e2e:headed       # See browser
npm run test:e2e:debug        # Debug mode

# 4. View results
npm run test:e2e:report

# 5. Cleanup
./scripts/kind-teardown.sh
```

## Maintenance

### Adding New Tests

1. Create test file in `test/e2e/`
2. Follow existing patterns (AAA, descriptive names)
3. Add fixtures if needed
4. Update this document
5. Run locally before committing

### Updating Fixtures

1. Edit YAML in `test/fixtures/`
2. Run `./scripts/kind-setup.sh` to test
3. Verify in CI
4. Document changes

### Debugging Failures

1. Check CI logs
2. Download Playwright report artifact
3. Review screenshots/videos
4. Reproduce locally
5. Fix and re-test

## Known Issues

None currently.

## Future Improvements

1. **Cross-browser testing** - Add Firefox, Safari
2. **Performance tests** - Measure load times
3. **Accessibility tests** - WCAG compliance
4. **Visual regression** - Screenshot comparison
5. **Load testing** - Simulate many pods
6. **Chaos testing** - Network failures, pod crashes

## References

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Kubernetes Applications](https://kubernetes.io/docs/tasks/debug/)
- [kind Quick Start](https://kind.sigs.k8s.io/docs/user/quick-start/)
- [TDD Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Metrics

We track:
- Test execution time
- Pass/fail rate
- Flaky test count
- Coverage percentage
- CI pipeline duration

Target: 100% pass rate in < 10 minutes
