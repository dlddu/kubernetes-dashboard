#!/bin/bash
# Test script to verify project scaffolding is complete

set -e

echo "=== Project Scaffolding Test ==="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Test 1: Go module initialization
echo ""
echo "Test 1: Go module initialization"
if [ ! -f go.mod ]; then
    fail "go.mod not found - run 'go mod init'"
else
    pass "go.mod exists"
fi

if ! grep -q "module" go.mod; then
    fail "go.mod is invalid - missing module declaration"
else
    pass "go.mod has valid module declaration"
fi

# Test 2: client-go dependency
echo ""
echo "Test 2: Kubernetes client-go dependency"
if ! grep -q "k8s.io/client-go" go.mod; then
    fail "k8s.io/client-go not found in go.mod"
else
    pass "k8s.io/client-go dependency added"
fi

# Test 3: Go backend structure
echo ""
echo "Test 3: Go backend structure"
if [ ! -f main.go ]; then
    fail "main.go not found"
else
    pass "main.go exists"
fi

if [ ! -d handlers ]; then
    fail "handlers/ directory not found"
else
    pass "handlers/ directory exists"
fi

# Test 4: React frontend structure
echo ""
echo "Test 4: React frontend structure"
if [ ! -d frontend ]; then
    fail "frontend/ directory not found"
else
    pass "frontend/ directory exists"
fi

if [ ! -f frontend/package.json ]; then
    fail "frontend/package.json not found"
else
    pass "frontend/package.json exists"
fi

# Test 5: Vite configuration
echo ""
echo "Test 5: Vite configuration"
if [ ! -f frontend/vite.config.ts ]; then
    fail "frontend/vite.config.ts not found"
else
    pass "frontend/vite.config.ts exists"
fi

if [ -f frontend/package.json ]; then
    if ! grep -q '"vite"' frontend/package.json; then
        fail "Vite not found in package.json dependencies"
    else
        pass "Vite is configured"
    fi
fi

# Test 6: Tailwind CSS configuration
echo ""
echo "Test 6: Tailwind CSS configuration"
if [ ! -f frontend/tailwind.config.js ] && [ ! -f frontend/tailwind.config.ts ]; then
    fail "Tailwind config not found"
else
    pass "Tailwind config exists"
fi

if [ -f frontend/package.json ]; then
    if ! grep -q '"tailwindcss"' frontend/package.json; then
        fail "Tailwind CSS not found in package.json"
    else
        pass "Tailwind CSS is configured"
    fi
fi

# Test 7: API proxy configuration
echo ""
echo "Test 7: API proxy configuration in Vite"
if [ -f frontend/vite.config.ts ]; then
    if ! grep -q "proxy" frontend/vite.config.ts && ! grep -q "'/api'" frontend/vite.config.ts; then
        fail "API proxy not configured in vite.config.ts"
    else
        pass "API proxy is configured"
    fi
else
    skip "vite.config.ts not found, skipping proxy check"
fi

# Test 8: Kubernetes manifests
echo ""
echo "Test 8: Kubernetes manifests"
if [ ! -d k8s ]; then
    fail "k8s/ directory not found"
else
    pass "k8s/ directory exists"
fi

REQUIRED_MANIFESTS=("deployment.yaml" "service.yaml" "rbac.yaml")
for manifest in "${REQUIRED_MANIFESTS[@]}"; do
    if [ ! -f "k8s/$manifest" ]; then
        fail "k8s/$manifest not found"
    else
        pass "k8s/$manifest exists"
    fi
done

# Test 9: Dockerfile
echo ""
echo "Test 9: Dockerfile"
if [ ! -f Dockerfile ]; then
    fail "Dockerfile not found"
else
    pass "Dockerfile exists"
fi

if [ -f Dockerfile ]; then
    if ! grep -q "FROM.*golang" Dockerfile; then
        fail "Dockerfile missing Go build stage"
    else
        pass "Dockerfile has Go build stage"
    fi

    if ! grep -q "FROM.*node" Dockerfile; then
        fail "Dockerfile missing Node.js build stage"
    else
        pass "Dockerfile has Node.js build stage"
    fi
fi

# Test 10: GitHub Actions CI
echo ""
echo "Test 10: GitHub Actions CI workflow"
if [ ! -f .github/workflows/ci.yaml ] && [ ! -f .github/workflows/ci.yml ]; then
    fail "GitHub Actions CI workflow not found"
else
    pass "GitHub Actions CI workflow exists"
fi

# Test 11: Health endpoint implementation
echo ""
echo "Test 11: Health endpoint handler"
if [ ! -f handlers/health.go ]; then
    fail "handlers/health.go not found"
else
    pass "handlers/health.go exists"
fi

if [ -f handlers/health.go ]; then
    if ! grep -q "HealthHandler" handlers/health.go; then
        fail "HealthHandler function not found in health.go"
    else
        pass "HealthHandler function exists"
    fi
fi

# Test 12: Frontend React App component
echo ""
echo "Test 12: React App component"
if [ ! -f frontend/src/App.tsx ] && [ ! -f frontend/src/App.jsx ]; then
    fail "frontend/src/App.tsx not found"
else
    pass "frontend/src/App.tsx exists"
fi

# Test 13: Test files exist
echo ""
echo "Test 13: Test files"
TEST_FILES=(
    "handlers/health_test.go"
    "main_test.go"
    "frontend/src/App.test.tsx"
)

for test_file in "${TEST_FILES[@]}"; do
    if [ ! -f "$test_file" ]; then
        fail "$test_file not found"
    else
        pass "$test_file exists"
    fi
done

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}All scaffolding tests passed!${NC}"
echo "======================================"
echo ""
echo "Project structure is ready for implementation."
echo ""
echo "Next steps:"
echo "  1. Implement Go handlers (handlers/health.go)"
echo "  2. Implement main.go server setup"
echo "  3. Implement React frontend components"
echo "  4. Run tests: go test ./... && cd frontend && npm test"
echo "  5. Build Docker image: docker build -t kubernetes-dashboard ."
echo "  6. Deploy to Kubernetes: kubectl apply -f k8s/"
