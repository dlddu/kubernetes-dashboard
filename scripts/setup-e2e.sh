#!/bin/bash
# Setup script for e2e test environment
# This script ensures all prerequisites are in place

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[setup-e2e]${NC} $1"
}

success() {
    echo -e "${GREEN}[setup-e2e]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[setup-e2e]${NC} $1"
}

log "Setting up e2e test environment..."

# Make all test scripts executable
log "Making test scripts executable..."
chmod +x test/*.sh 2>/dev/null || true
success "Test scripts are now executable"

# Install Go dependencies
log "Installing Go dependencies..."
go mod download
go mod tidy
success "Go dependencies installed"

# Install Node.js dependencies
log "Installing Node.js dependencies..."
npm install
success "Node.js dependencies installed"

# Install Playwright browsers
log "Installing Playwright browsers..."
npm run playwright:install
success "Playwright browsers installed"

success "E2E test environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Setup kind cluster: make e2e-setup"
echo "  2. Build project: make build"
echo "  3. Run e2e tests: make test-e2e"
echo ""
echo "Or run full cycle: make test-e2e-full"
