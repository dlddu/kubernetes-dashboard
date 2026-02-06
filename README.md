# Kubernetes Dashboard

A modern Kubernetes dashboard built with Go and React.

## Tech Stack

- **Backend**: Go 1.22
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest + Testing Library (React), Go testing (Backend)

## Project Structure

```
.
├── internal/
│   └── server/          # Go HTTP server
│       ├── health.go    # Health endpoint handler
│       ├── server.go    # Server setup and routing
│       └── dist/        # Embedded React build (generated)
├── web/                 # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API services
│   │   ├── test/        # Test setup
│   │   ├── App.tsx      # Main app component
│   │   ├── main.tsx     # React entry point
│   │   └── index.css    # Tailwind CSS imports
│   ├── index.html       # HTML entry point
│   ├── vite.config.ts   # Vite configuration
│   └── package.json     # Node.js dependencies
├── k8s/                 # Kubernetes manifests
├── main.go              # Go entry point
├── Dockerfile           # Multi-stage build
└── Makefile             # Build automation
```

## Prerequisites

- Go 1.22 or later
- Node.js 20 or later
- Docker (for containerization)

## Getting Started

### Install Dependencies

```bash
make install
```

### Run Tests

```bash
# Run all tests
make test

# Run Go tests only
make test-go

# Run React tests only
make test-web
```

### Development

#### Start Backend Server

```bash
go run main.go
# Server will start on http://localhost:8080
```

#### Start Frontend Dev Server

```bash
cd web
npm run dev
# Dev server will start on http://localhost:5173
# API calls will be proxied to http://localhost:8080
```

### Build

```bash
# Build everything
make build

# Build frontend only
make build-frontend

# Build backend only
make build-backend
```

### Docker

```bash
# Build Docker image
make docker-build

# Run container
docker run -p 8080:8080 kubernetes-dashboard:latest
```

## Deployment to Kubernetes

```bash
# Create namespace and deploy
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/serviceaccount.yaml
kubectl apply -f k8s/clusterrole.yaml
kubectl apply -f k8s/clusterrolebinding.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Port forward to access locally
kubectl port-forward -n kubernetes-dashboard service/kubernetes-dashboard 8080:80
```

## API Endpoints

- `GET /api/health` - Health check endpoint

## License

MIT