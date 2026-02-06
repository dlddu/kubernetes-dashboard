#!/bin/bash

# verify-e2e-setup.sh
# Verifies that all E2E test infrastructure is in place
#
# This script checks:
# - Required files exist
# - Scripts are executable
# - Dependencies are documented
# - Test structure is correct

set -e
set -u

echo "=========================================="
echo "Verifying E2E Test Setup"
echo "=========================================="

EXIT_CODE=0

# Function to check file exists
check_file() {
    local file=$1
    local description=$2

    if [ -f "$file" ]; then
        echo "✓ $description"
    else
        echo "✗ $description - MISSING: $file"
        EXIT_CODE=1
    fi
}

# Function to check directory exists
check_dir() {
    local dir=$1
    local description=$2

    if [ -d "$dir" ]; then
        echo "✓ $description"
    else
        echo "✗ $description - MISSING: $dir"
        EXIT_CODE=1
    fi
}

# Function to check file is executable
check_executable() {
    local file=$1
    local description=$2

    if [ -x "$file" ]; then
        echo "✓ $description"
    else
        echo "✗ $description - NOT EXECUTABLE: $file"
        EXIT_CODE=1
    fi
}

echo ""
echo "1. Configuration Files"
echo "----------------------"
check_file "playwright.config.ts" "Playwright config"
check_file "package.json" "Root package.json for Playwright"
check_file ".github/workflows/e2e.yaml" "E2E GitHub Actions workflow"

echo ""
echo "2. Test Files"
echo "-------------"
check_dir "test/e2e" "E2E test directory"
check_file "test/e2e/health.spec.ts" "Health check E2E test"
check_file "test/e2e/README.md" "E2E tests documentation"

echo ""
echo "3. Scripts"
echo "----------"
check_file "scripts/kind-setup.sh" "kind setup script"
check_executable "scripts/kind-setup.sh" "kind setup script is executable"
check_file "scripts/kind-teardown.sh" "kind teardown script"
check_executable "scripts/kind-teardown.sh" "kind teardown script is executable"

echo ""
echo "4. Test Fixtures"
echo "----------------"
check_dir "test/fixtures" "Fixtures directory"
check_file "test/fixtures/test-namespace.yaml" "Namespace fixtures"
check_file "test/fixtures/test-secret.yaml" "Secret fixtures"
check_file "test/fixtures/test-deployment.yaml" "Deployment fixtures"
check_file "test/fixtures/test-pod.yaml" "Pod fixtures"

echo ""
echo "5. Documentation"
echo "----------------"
check_file "test/E2E_TEST_PLAN.md" "E2E test plan"
check_file "test/e2e/README.md" "E2E README"

echo ""
echo "6. Counting Test Cases"
echo "----------------------"
if [ -f "test/e2e/health.spec.ts" ]; then
    TEST_COUNT=$(grep -c "test(" test/e2e/health.spec.ts || true)
    DESCRIBE_COUNT=$(grep -c "test.describe(" test/e2e/health.spec.ts || true)
    echo "✓ Found $DESCRIBE_COUNT test suites"
    echo "✓ Found $TEST_COUNT test cases"
fi

echo ""
echo "7. Fixture Summary"
echo "------------------"
if [ -d "test/fixtures" ]; then
    echo "Namespaces:"
    grep -h "kind: Namespace" test/fixtures/*.yaml | wc -l || true
    echo "Secrets:"
    grep -h "kind: Secret" test/fixtures/*.yaml | wc -l || true
    echo "Deployments:"
    grep -h "kind: Deployment" test/fixtures/*.yaml | wc -l || true
    echo "Services:"
    grep -h "kind: Service" test/fixtures/*.yaml | wc -l || true
    echo "Pods:"
    grep -h "kind: Pod" test/fixtures/*.yaml | wc -l || true
fi

echo ""
echo "=========================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "✓ All E2E test infrastructure is in place!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Install dependencies: npm install"
    echo "2. Install Playwright browsers: npx playwright install chromium"
    echo "3. Set up kind cluster: ./scripts/kind-setup.sh"
    echo "4. Build and run backend: make run"
    echo "5. Run E2E tests: npm run test:e2e"
else
    echo "✗ Some files are missing or incorrect"
    echo "=========================================="
fi

exit $EXIT_CODE
