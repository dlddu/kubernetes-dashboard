#!/bin/bash
# Verify e2e test setup
# This script checks that all required files and dependencies are in place

set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

FAILED=0

check_file() {
    local file=$1
    local description=$2

    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description: $file"
    else
        echo -e "${RED}✗${NC} $description: $file (MISSING)"
        FAILED=1
    fi
}

check_dir() {
    local dir=$1
    local description=$2

    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $description: $dir"
    else
        echo -e "${RED}✗${NC} $description: $dir (MISSING)"
        FAILED=1
    fi
}

check_executable() {
    local file=$1
    local description=$2

    if [ -f "$file" ] && [ -x "$file" ]; then
        echo -e "${GREEN}✓${NC} $description: $file (executable)"
    elif [ -f "$file" ]; then
        echo -e "${YELLOW}⚠${NC} $description: $file (not executable - will be fixed)"
        chmod +x "$file" 2>/dev/null || echo -e "${RED}  Failed to make executable${NC}"
    else
        echo -e "${RED}✗${NC} $description: $file (MISSING)"
        FAILED=1
    fi
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}E2E Test Setup Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}Checking configuration files...${NC}"
check_file "playwright.config.ts" "Playwright config"
check_file "package.json" "Root package.json"
check_file ".gitignore" "Gitignore"
check_file "Makefile" "Makefile"
echo ""

echo -e "${BLUE}Checking test files...${NC}"
check_dir "e2e" "E2E tests directory"
check_file "e2e/health.spec.ts" "Health E2E test"
check_file "e2e/README.md" "E2E README"
echo ""

echo -e "${BLUE}Checking test scripts...${NC}"
check_dir "test" "Test directory"
check_executable "test/kind-setup.sh" "kind setup script"
check_executable "test/e2e_test.sh" "E2E validation script"
check_file "test/e2e_helper.go" "Go E2E helper"
echo ""

echo -e "${BLUE}Checking test fixtures...${NC}"
check_dir "test/fixtures" "Fixtures directory"
check_file "test/fixtures/namespace.yaml" "Namespace fixture"
check_file "test/fixtures/deployment.yaml" "Deployment fixture"
check_file "test/fixtures/pod.yaml" "Pod fixture"
check_file "test/fixtures/secret.yaml" "Secret fixture"
echo ""

echo -e "${BLUE}Checking CI/CD...${NC}"
check_dir ".github/workflows" "GitHub workflows directory"
check_file ".github/workflows/e2e.yaml" "E2E workflow"
echo ""

echo -e "${BLUE}Checking documentation...${NC}"
check_file "docs/E2E_TESTING.md" "E2E testing guide"
echo ""

echo -e "${BLUE}Checking backend files...${NC}"
check_file "main.go" "Main backend"
check_file "handlers/health.go" "Health handler"
check_file "go.mod" "Go module"
echo ""

echo -e "${BLUE}Checking scripts...${NC}"
check_dir "scripts" "Scripts directory"
check_executable "scripts/setup-e2e.sh" "E2E setup script"
check_executable "scripts/verify-e2e-setup.sh" "This script"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Install dependencies: make setup-e2e"
    echo "  2. Setup kind cluster: make e2e-setup"
    echo "  3. Build project: make build"
    echo "  4. Run E2E tests: make test-e2e"
    echo ""
    echo "Or run full cycle: make test-e2e-full"
    exit 0
else
    echo -e "${RED}✗ Some checks failed${NC}"
    echo ""
    echo "Please review the missing files or permissions above."
    exit 1
fi
