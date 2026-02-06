.PHONY: help test test-go test-frontend test-docker test-k8s test-scaffolding test-e2e e2e-setup e2e-teardown e2e-validate e2e-install-playwright test-e2e-full setup-e2e verify-e2e build clean

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

e2e-validate: ## Validate e2e test setup
	@echo "Validating e2e test environment..."
	@chmod +x test/e2e_test.sh
	@./test/e2e_test.sh

e2e-setup: ## Setup kind cluster and test fixtures for e2e tests
	@echo "Setting up e2e test environment..."
	@chmod +x test/kind-setup.sh
	@./test/kind-setup.sh setup

e2e-teardown: ## Teardown kind cluster
	@echo "Tearing down e2e test environment..."
	@chmod +x test/kind-setup.sh
	@./test/kind-setup.sh teardown

e2e-install-playwright: ## Install Playwright dependencies
	@echo "Installing Playwright dependencies..."
	@npm install
	@npm run playwright:install

test-e2e: build e2e-validate ## Run end-to-end tests (requires kind cluster)
	@echo "Running e2e tests..."
	@echo "Note: Ensure kind cluster is running (make e2e-setup)"
	@echo "Starting backend server..."
	@./kubernetes-dashboard &
	@SERVER_PID=$$!; \
	sleep 3; \
	echo "Running Playwright tests..."; \
	npm run test:e2e || (kill $$SERVER_PID && exit 1); \
	kill $$SERVER_PID; \
	echo "E2E tests passed!"

test-e2e-full: e2e-install-playwright e2e-setup build test-e2e e2e-teardown ## Full e2e test cycle (setup, test, teardown)

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
	@rm -rf node_modules
	@rm -rf playwright-report
	@rm -rf test-results
	@rm -f package-lock.json
	@go clean

deps: ## Install dependencies
	@echo "Installing Go dependencies..."
	@go mod download
	@echo "Installing frontend dependencies..."
	@cd frontend && npm ci

setup-e2e: ## Setup e2e test environment (install all dependencies)
	@echo "Setting up e2e test environment..."
	@chmod +x scripts/setup-e2e.sh
	@./scripts/setup-e2e.sh

verify-e2e: ## Verify e2e test setup is complete
	@echo "Verifying e2e test setup..."
	@chmod +x scripts/verify-e2e-setup.sh
	@./scripts/verify-e2e-setup.sh

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
