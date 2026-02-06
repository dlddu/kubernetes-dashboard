# Kubernetes Dashboard - Project Structure

## Directory Layout

```
kubernetes-dashboard/
├── .github/
│   └── workflows/
│       └── test.yml              # CI/CD pipeline for automated testing
├── cmd/
│   └── server/
│       └── main.go               # (To be implemented) Application entry point
├── internal/
│   └── server/
│       ├── server.go             # (To be implemented) HTTP server setup
│       ├── server_test.go        # ✅ Server tests
│       ├── health.go             # (To be implemented) Health endpoint handler
│       └── health_test.go        # ✅ Health endpoint tests
├── web/
│   ├── src/
│   │   ├── components/
│   │   │   └── HealthCheck.test.tsx  # ✅ HealthCheck component tests
│   │   ├── services/
│   │   │   └── api.test.ts           # ✅ API service tests
│   │   ├── test/
│   │   │   └── setup.ts              # ✅ Test setup and configuration
│   │   ├── App.tsx                    # (To be implemented) Main App component
│   │   └── App.test.tsx               # ✅ App component tests
│   ├── package.json              # ✅ Frontend dependencies and scripts
│   ├── tsconfig.json             # ✅ TypeScript configuration
│   ├── vitest.config.ts          # ✅ Vitest test configuration
│   └── vite.config.ts            # (To be created) Vite build configuration
├── k8s/
│   ├── deployment.yaml           # (To be created) Kubernetes Deployment
│   ├── service.yaml              # (To be created) Kubernetes Service
│   ├── serviceaccount.yaml       # (To be created) Service Account
│   ├── clusterrole.yaml          # (To be created) Cluster Role
│   └── clusterrolebinding.yaml   # (To be created) Cluster Role Binding
├── Dockerfile                    # (To be created) Multi-stage Docker build
├── go.mod                        # ✅ Go module definition
├── go.sum                        # (Auto-generated) Go dependencies checksum
├── .gitignore                    # ✅ Git ignore rules
├── README.md                     # ✅ Project documentation
├── TEST_PLAN.md                  # ✅ Testing strategy and guidelines
└── PROJECT_STRUCTURE.md          # ✅ This file

✅ = Created (TDD Red Phase)
(To be implemented) = Next phase after tests pass
(To be created) = Infrastructure files
```

## Tech Stack

### Backend
- **Language**: Go 1.22
- **Framework**: Standard library net/http
- **Dependencies**: k8s.io/client-go
- **Testing**: Go testing package

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript 5
- **Testing**: Vitest + React Testing Library

### DevOps
- **CI/CD**: GitHub Actions
- **Container**: Docker (multi-stage build)
- **Orchestration**: Kubernetes
- **RBAC**: ServiceAccount + ClusterRole

## Test Files Created

### Backend Tests (Go)
1. `/internal/server/health_test.go` - 4 test cases for health endpoint
2. `/internal/server/server_test.go` - 4 test cases for server routing

### Frontend Tests (React)
1. `/web/src/App.test.tsx` - 3 test cases for App component
2. `/web/src/services/api.test.ts` - 5 test cases for API service
3. `/web/src/components/HealthCheck.test.tsx` - 7 test cases for HealthCheck component

### Total: 23 test cases written in TDD Red Phase

## API Endpoints (To Be Implemented)

- `GET /api/health` - Health check endpoint (returns JSON status)
- `GET /*` - Serve React SPA (with client-side routing support)

## Running the Project

### Development Mode
```bash
# Terminal 1: Start Go backend
go run cmd/server/main.go

# Terminal 2: Start React dev server
cd web && npm run dev
```

### Production Mode
```bash
# Build everything
cd web && npm run build && cd ..
go build -o bin/kubernetes-dashboard ./cmd/server

# Run single binary
./bin/kubernetes-dashboard
```

### Run Tests
```bash
# Backend tests
go test ./...

# Frontend tests
cd web && npm test
```

## Next Steps (Implementation Phase)

1. Implement Go server handlers
2. Implement React components
3. Configure Vite for production builds
4. Create Dockerfile
5. Create Kubernetes manifests
6. Verify all tests pass ✅
