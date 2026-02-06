#!/bin/bash
# E2E test validation script
# This script verifies that all e2e test components are ready

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

pass() {
    echo -e "${GREEN}PASS${NC}: $1"
}

fail() {
    echo -e "${RED}FAIL${NC}: $1"
    exit 1
}

skip() {
    echo -e "${YELLOW}SKIP${NC}: $1"
}

info() {
    echo -e "${BLUE}INFO${NC}: $1"
}

echo "=== E2E Test Validation ==="
echo ""

# Test 1: Check Playwright config
echo "Test 1: Playwright configuration"
if [ ! -f playwright.config.ts ]; then
    fail "playwright.config.ts not found"
else
    pass "playwright.config.ts exists"
fi

# Test 2: Check e2e test files
echo ""
echo "Test 2: E2E test files"
if [ ! -d e2e ]; then
    fail "e2e/ directory not found"
else
    pass "e2e/ directory exists"
fi

if [ ! -f e2e/health.spec.ts ]; then
    fail "e2e/health.spec.ts not found"
else
    pass "e2e/health.spec.ts exists"
fi

# Test 3: Check kind setup script
echo ""
echo "Test 3: kind setup script"
if [ ! -f test/kind-setup.sh ]; then
    fail "test/kind-setup.sh not found"
else
    pass "test/kind-setup.sh exists"
fi

if [ ! -x test/kind-setup.sh ]; then
    fail "test/kind-setup.sh is not executable"
else
    pass "test/kind-setup.sh is executable"
fi

# Test 4: Check test fixtures
echo ""
echo "Test 4: Kubernetes test fixtures"
if [ ! -d test/fixtures ]; then
    fail "test/fixtures/ directory not found"
else
    pass "test/fixtures/ directory exists"
fi

REQUIRED_FIXTURES=("namespace.yaml" "deployment.yaml" "pod.yaml" "secret.yaml")
for fixture in "${REQUIRED_FIXTURES[@]}"; do
    if [ ! -f "test/fixtures/$fixture" ]; then
        fail "test/fixtures/$fixture not found"
    else
        pass "test/fixtures/$fixture exists"
    fi
done

# Test 5: Check Go e2e helper
echo ""
echo "Test 5: Go e2e helper"
if [ ! -f test/e2e_helper.go ]; then
    fail "test/e2e_helper.go not found"
else
    pass "test/e2e_helper.go exists"
fi

# Test 6: Check GitHub Actions workflow
echo ""
echo "Test 6: GitHub Actions e2e workflow"
if [ ! -f .github/workflows/e2e.yaml ]; then
    fail ".github/workflows/e2e.yaml not found"
else
    pass ".github/workflows/e2e.yaml exists"
fi

# Test 7: Check package.json
echo ""
echo "Test 7: package.json configuration"
if [ ! -f package.json ]; then
    fail "package.json not found"
else
    pass "package.json exists"
fi

if ! grep -q "@playwright/test" package.json; then
    fail "@playwright/test not found in package.json"
else
    pass "@playwright/test dependency exists"
fi

# Test 8: Verify frontend build setup
echo ""
echo "Test 8: Frontend build configuration"
if [ ! -f frontend/package.json ]; then
    fail "frontend/package.json not found"
else
    pass "frontend/package.json exists"
fi

if [ ! -f frontend/vite.config.ts ]; then
    fail "frontend/vite.config.ts not found"
else
    pass "frontend/vite.config.ts exists"
fi

# Test 9: Verify Go module
echo ""
echo "Test 9: Go module configuration"
if [ ! -f go.mod ]; then
    fail "go.mod not found"
else
    pass "go.mod exists"
fi

if ! grep -q "k8s.io/client-go" go.mod; then
    fail "k8s.io/client-go not found in go.mod"
else
    pass "k8s.io/client-go dependency exists"
fi

# Test 10: Check commands availability
echo ""
echo "Test 10: Required tools"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    pass "node is installed: $NODE_VERSION"
else
    skip "node is not installed (required for local testing)"
fi

if command -v go &> /dev/null; then
    GO_VERSION=$(go version | awk '{print $3}')
    pass "go is installed: $GO_VERSION"
else
    skip "go is not installed (required for backend)"
fi

if command -v kind &> /dev/null; then
    KIND_VERSION=$(kind version)
    pass "kind is installed: $KIND_VERSION"
else
    skip "kind is not installed (required for local e2e testing)"
fi

if command -v kubectl &> /dev/null; then
    KUBECTL_VERSION=$(kubectl version --client --short 2>/dev/null || kubectl version --client | head -n1)
    pass "kubectl is installed: $KUBECTL_VERSION"
else
    skip "kubectl is not installed (required for local e2e testing)"
fi

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    pass "docker is installed: $DOCKER_VERSION"
else
    skip "docker is not installed (required for kind)"
fi

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}E2E test setup validation passed!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Install Playwright: npm install && npm run playwright:install"
echo "  2. Setup kind cluster: ./test/kind-setup.sh setup"
echo "  3. Build frontend: cd frontend && npm ci && npm run build && cd .."
echo "  4. Build backend: go build -o kubernetes-dashboard ."
echo "  5. Run backend: ./kubernetes-dashboard"
echo "  6. Run e2e tests: npm run test:e2e"
echo ""
echo "Or run in CI: GitHub Actions will automatically run e2e tests"
