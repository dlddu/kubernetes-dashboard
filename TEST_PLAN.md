# Test Plan for Kubernetes Dashboard

This document describes the test strategy for the Kubernetes Dashboard scaffolding project.

## Test Structure

### Backend Tests (Go)

Location: `/internal/server/`

#### Health Endpoint Tests (`health_test.go`)
- ✅ `TestHealthEndpoint` - Verifies /api/health returns 200 OK
- ✅ `TestHealthEndpointReturnsJSON` - Verifies response is valid JSON with correct Content-Type
- ✅ `TestHealthEndpointResponseStructure` - Verifies response contains required fields (status: "healthy")
- ✅ `TestHealthEndpointMethodNotAllowed` - Verifies non-GET methods return 405

#### Server Tests (`server_test.go`)
- ✅ `TestNewServer` - Verifies server initializes correctly
- ✅ `TestServerRoutes` - Verifies all API routes are registered
- ✅ `TestServerServesStaticFiles` - Verifies server serves React SPA at root
- ✅ `TestServerHandlesClientSideRouting` - Verifies 404s redirect to index.html for client-side routing

### Frontend Tests (React + TypeScript)

Location: `/web/src/`

#### App Component Tests (`App.test.tsx`)
- ✅ `should render without crashing` - Basic render test
- ✅ `should display the application title` - Verifies title is present
- ✅ `should have proper Tailwind CSS classes applied` - Verifies styling

#### API Service Tests (`services/api.test.ts`)
- ✅ `should call /api/health endpoint` - Verifies correct endpoint is called
- ✅ `should return healthy status when API responds successfully` - Happy path test
- ✅ `should throw error when API request fails` - Error handling (HTTP errors)
- ✅ `should throw error when network request fails` - Error handling (network errors)
- ✅ `should parse JSON response correctly` - JSON parsing validation

#### HealthCheck Component Tests (`components/HealthCheck.test.tsx`)
- ✅ `should render health check component` - Basic render test
- ✅ `should display loading state initially` - Loading state UI
- ✅ `should display healthy status when API returns success` - Success state UI
- ✅ `should display error message when API call fails` - Error state UI
- ✅ `should allow retrying health check on failure` - Retry functionality
- ✅ `should call health check API on component mount` - Lifecycle test
- ✅ `should display timestamp when available` - Optional data display

## Running Tests

### Backend Tests

```bash
# Run all Go tests
go test ./...

# Run tests with coverage
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# Run tests with race detector
go test -race ./...

# Run specific package tests
go test ./internal/server/...

# Run specific test
go test ./internal/server -run TestHealthEndpoint
```

### Frontend Tests

```bash
cd web

# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- src/App.test.tsx
```

### Integration Tests

```bash
# Build frontend
cd web && npm run build && cd ..

# Build backend
go build -o bin/kubernetes-dashboard ./cmd/server

# Start server
./bin/kubernetes-dashboard &

# Test endpoints
curl http://localhost:8080/api/health
curl http://localhost:8080/

# Stop server
pkill kubernetes-dashboard
```

## Test Coverage Goals

- **Backend**: 80%+ code coverage
- **Frontend**: 80%+ code coverage
- **Critical paths**: 100% coverage (health endpoints, error handling)

## CI/CD Pipeline

Tests run automatically on:
- Push to `main` or `dld-280-1-1-scaffolding` branches
- Pull requests to `main`

Pipeline stages:
1. Backend tests (Go)
2. Frontend tests (React)
3. Integration tests (Full stack)

See `.github/workflows/test.yml` for details.

## Test Categories

### Unit Tests
- Individual function/component testing
- Mocked dependencies
- Fast execution

### Integration Tests
- Full request/response cycle
- Real HTTP server
- Built frontend + backend

### Edge Cases Covered
- Invalid HTTP methods
- Network failures
- Malformed responses
- Missing required fields
- Client-side routing edge cases

## Expected Test Results (TDD Red Phase)

⚠️ **All tests are expected to FAIL initially** - this is the TDD Red Phase.

Tests will pass after implementing:
1. Go HTTP server with health endpoint
2. React components with API integration
3. Static file serving with SPA routing support

## Next Steps

After tests are written (current phase):
1. Implement Go server (`cmd/server/main.go`, `internal/server/server.go`, `internal/server/health.go`)
2. Implement React components (`web/src/App.tsx`, `web/src/components/HealthCheck.tsx`, `web/src/services/api.ts`)
3. Configure Vite for production builds
4. Verify all tests pass (TDD Green Phase)
5. Refactor if needed (TDD Refactor Phase)
