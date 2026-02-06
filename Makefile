.PHONY: help test test-go test-frontend test-docker test-k8s test-scaffolding build clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

test: test-scaffolding test-go test-frontend ## Run all tests

test-scaffolding: ## Verify project scaffolding is complete
	@echo "Running scaffolding tests..."
	@./test/scaffolding_test.sh

test-go: ## Run Go unit tests
	@echo "Running Go tests..."
	@go test -v -race -coverprofile=coverage.out ./...
	@go tool cover -func=coverage.out

test-frontend: ## Run frontend tests
	@echo "Running frontend tests..."
	@cd frontend && npm test -- --run

test-docker: ## Test Docker build and container
	@echo "Running Docker tests..."
	@./test/docker_test.sh

test-k8s: ## Validate Kubernetes manifests
	@echo "Running Kubernetes manifest tests..."
	@./test/k8s_manifest_test.sh

test-integration: build ## Run integration tests
	@echo "Running integration tests..."
	@./kubernetes-dashboard &
	@SERVER_PID=$$!; \
	sleep 3; \
	curl -f http://localhost:8080/api/health || (kill $$SERVER_PID && exit 1); \
	curl -f http://localhost:8080/ || (kill $$SERVER_PID && exit 1); \
	kill $$SERVER_PID; \
	echo "Integration tests passed!"

build: build-frontend build-go ## Build the entire project

build-frontend: ## Build React frontend
	@echo "Building frontend..."
	@cd frontend && npm ci && npm run build

build-go: ## Build Go backend
	@echo "Building Go backend..."
	@go build -o kubernetes-dashboard .

build-docker: ## Build Docker image
	@echo "Building Docker image..."
	@docker build -t kubernetes-dashboard:latest .

run: build ## Build and run the application locally
	@echo "Starting application..."
	@./kubernetes-dashboard

run-docker: build-docker ## Build and run Docker container
	@echo "Starting Docker container..."
	@docker run -p 8080:8080 kubernetes-dashboard:latest

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	@rm -f kubernetes-dashboard
	@rm -f coverage.out
	@rm -rf frontend/dist
	@rm -rf frontend/node_modules
	@go clean

deps: ## Install dependencies
	@echo "Installing Go dependencies..."
	@go mod download
	@echo "Installing frontend dependencies..."
	@cd frontend && npm ci

lint: ## Run linters
	@echo "Running Go linters..."
	@go vet ./...
	@echo "Running frontend linters..."
	@cd frontend && npm run lint

fmt: ## Format code
	@echo "Formatting Go code..."
	@go fmt ./...
	@echo "Formatting frontend code..."
	@cd frontend && npm run format || true
