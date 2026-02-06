.PHONY: help test test-go test-web build build-frontend build-backend docker-build clean install dev

help:
	@echo "Available targets:"
	@echo "  install         - Install dependencies (Go and Node.js)"
	@echo "  test            - Run all tests (Go and React)"
	@echo "  test-go         - Run Go tests"
	@echo "  test-web        - Run React tests"
	@echo "  build           - Build the entire application"
	@echo "  build-frontend  - Build React frontend"
	@echo "  build-backend   - Build Go backend"
	@echo "  docker-build    - Build Docker image"
	@echo "  dev             - Run development servers"
	@echo "  clean           - Clean build artifacts"

install:
	@echo "Installing Go dependencies..."
	go mod download
	@echo "Installing Node.js dependencies..."
	cd web && npm install

test: test-go test-web

test-go:
	@echo "Running Go tests..."
	go test -v ./...

test-web:
	@echo "Running React tests..."
	cd web && npm test

build: build-frontend build-backend

build-frontend:
	@echo "Building React frontend..."
	cd web && npm run build
	@echo "Copying frontend build to internal/server/dist..."
	rm -rf internal/server/dist
	cp -r web/dist internal/server/dist

build-backend:
	@echo "Building Go backend..."
	go build -o bin/kubernetes-dashboard .

docker-build:
	@echo "Building Docker image..."
	docker build -t kubernetes-dashboard:latest .

dev:
	@echo "Starting development servers..."
	@echo "Start Go backend: go run main.go"
	@echo "Start React dev server: cd web && npm run dev"

clean:
	@echo "Cleaning build artifacts..."
	rm -rf web/dist
	rm -rf internal/server/dist
	rm -rf bin
	go clean
