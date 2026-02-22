#!/bin/bash
# argo_cluster_script_test.sh
#
# DLD-437: Argo Workflows CRD 설치 및 e2e 테스트 환경 구성
#
# 이 스크립트는 TDD Red Phase 셸 테스트입니다.
# 실제 클러스터를 요구하지 않고 파일 존재 여부와 내용을 정적으로 검증합니다.
#
# 테스트 항목:
#   1.  scripts/kind-cluster.sh 에 install_argo_crds 함수가 존재하는지
#   2.  install_argo_crds 함수가 CRD 설치 명령(kubectl apply ... argoproj/argo-workflows)을 포함하는지
#   3.  create_cluster 함수가 install_argo_crds 를 호출하는지
#   4.  test/fixtures/ 하위에 Argo fixture 파일 5종이 모두 존재하는지
#   5.  각 Argo fixture 파일이 유효한 YAML(python3 safe_load)인지
#   6.  WorkflowTemplate fixture들이 apiVersion: argoproj.io/v1alpha1 과 kind: WorkflowTemplate을 포함하는지
#   7.  workflow-template-with-params.yaml 에 4개의 required parameter가 존재하는지
#   8.  workflow-template-no-params.yaml 에 parameters 섹션이 없는지
#   9.  Workflow fixture들이 apiVersion: argoproj.io/v1alpha1 과 kind: Workflow를 포함하는지
#   10. workflow-running.yaml 의 status.phase 가 Running 이고 Succeeded/Running/Pending 노드를 포함하는지
#   11. workflow-succeeded.yaml 의 status.phase 가 Succeeded 인지
#   12. workflow-failed.yaml 의 status.phase 가 Failed 이고 Failed/Omitted 노드를 포함하는지
#   13. 각 Workflow fixture 의 status.nodes 에 inputs/outputs 데이터가 존재하는지
#   14. test/fixtures/apply-all.sh 에 Argo fixture 5종이 모두 참조되는지

set -euo pipefail

# ---- utilities ----

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

pass() {
    echo -e "  ${GREEN}PASS${NC}: $1"
    PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
    echo -e "  ${RED}FAIL${NC}: $1"
    FAIL_COUNT=$((FAIL_COUNT + 1))
}

skip() {
    echo -e "  ${YELLOW}SKIP${NC}: $1"
    SKIP_COUNT=$((SKIP_COUNT + 1))
}

# Determine repo root relative to this script's location.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FIXTURES_DIR="$REPO_ROOT/test/fixtures"
KIND_CLUSTER_SCRIPT="$REPO_ROOT/scripts/kind-cluster.sh"

# ---- Test 1: install_argo_crds function exists in kind-cluster.sh ----
echo ""
echo "Test 1: install_argo_crds function defined in kind-cluster.sh"
if [ ! -f "$KIND_CLUSTER_SCRIPT" ]; then
    fail "kind-cluster.sh not found at $KIND_CLUSTER_SCRIPT"
elif grep -q "install_argo_crds()" "$KIND_CLUSTER_SCRIPT" || grep -q "install_argo_crds ()" "$KIND_CLUSTER_SCRIPT"; then
    pass "install_argo_crds function declaration found"
else
    fail "install_argo_crds function not declared in kind-cluster.sh"
fi

# ---- Test 2: install_argo_crds references an Argo CRD manifest URL ----
echo ""
echo "Test 2: install_argo_crds references kubectl apply with Argo CRD manifest"
if [ ! -f "$KIND_CLUSTER_SCRIPT" ]; then
    skip "kind-cluster.sh not found"
elif grep -A 20 "install_argo_crds" "$KIND_CLUSTER_SCRIPT" | grep -q "kubectl apply" && \
     grep -A 20 "install_argo_crds" "$KIND_CLUSTER_SCRIPT" | grep -qE "(argoproj|argo-workflows)"; then
    pass "kubectl apply with argoproj/argo-workflows reference found in install_argo_crds"
else
    fail "install_argo_crds must contain: kubectl apply -f <argo-crd-manifest-url>"
fi

# ---- Test 3: create_cluster calls install_argo_crds ----
echo ""
echo "Test 3: create_cluster calls install_argo_crds"
if [ ! -f "$KIND_CLUSTER_SCRIPT" ]; then
    skip "kind-cluster.sh not found"
else
    # Extract create_cluster function body and check for the call.
    if awk '/^create_cluster\(\)/{found=1} found && /^}$/{exit} found{print}' "$KIND_CLUSTER_SCRIPT" \
        | grep -q "install_argo_crds"; then
        pass "create_cluster calls install_argo_crds"
    else
        fail "create_cluster does not call install_argo_crds"
    fi
fi

# ---- Test 4: Argo fixture files exist ----
echo ""
echo "Test 4: Argo fixture YAML files exist under test/fixtures/"

ARGO_FIXTURES=(
    "workflow-template-with-params.yaml"
    "workflow-template-no-params.yaml"
    "workflow-running.yaml"
    "workflow-succeeded.yaml"
    "workflow-failed.yaml"
)

ALL_FIXTURES_PRESENT=true
for fixture in "${ARGO_FIXTURES[@]}"; do
    if [ -f "$FIXTURES_DIR/$fixture" ]; then
        pass "  $fixture exists"
    else
        fail "  $fixture NOT FOUND at $FIXTURES_DIR/$fixture"
        ALL_FIXTURES_PRESENT=false
    fi
done

# ---- Test 5: Each fixture is valid YAML ----
echo ""
echo "Test 5: Argo fixture files are valid YAML"

if ! command -v python3 &>/dev/null; then
    skip "python3 not available — skipping YAML parse validation"
else
    for fixture in "${ARGO_FIXTURES[@]}"; do
        fixture_path="$FIXTURES_DIR/$fixture"
        if [ ! -f "$fixture_path" ]; then
            skip "$fixture not found — cannot validate YAML"
            continue
        fi
        if python3 -c "
import yaml, sys
docs = list(yaml.safe_load_all(open('$fixture_path')))
if not docs or all(d is None for d in docs):
    sys.exit(1)
" 2>/dev/null; then
            pass "$fixture is valid YAML"
        else
            fail "$fixture contains invalid YAML"
        fi
    done
fi

# ---- Test 6: WorkflowTemplate fixtures have correct apiVersion and kind ----
echo ""
echo "Test 6: WorkflowTemplate fixtures declare correct apiVersion and kind"

for fixture in "workflow-template-with-params.yaml" "workflow-template-no-params.yaml"; do
    fixture_path="$FIXTURES_DIR/$fixture"
    if [ ! -f "$fixture_path" ]; then
        fail "$fixture not found"
        continue
    fi
    if grep -q "apiVersion: argoproj.io/v1alpha1" "$fixture_path" && \
       grep -q "kind: WorkflowTemplate" "$fixture_path"; then
        pass "$fixture has correct apiVersion and kind"
    else
        fail "$fixture missing 'apiVersion: argoproj.io/v1alpha1' or 'kind: WorkflowTemplate'"
    fi
done

# ---- Test 7: workflow-template-with-params.yaml declares 4 required parameters ----
echo ""
echo "Test 7: workflow-template-with-params.yaml contains required parameters"

PARAMS_FIXTURE="$FIXTURES_DIR/workflow-template-with-params.yaml"
if [ ! -f "$PARAMS_FIXTURE" ]; then
    fail "workflow-template-with-params.yaml not found"
else
    REQUIRED_PARAMS=("input-path" "output-path" "batch-size" "env")
    for param in "${REQUIRED_PARAMS[@]}"; do
        if grep -q "name: $param" "$PARAMS_FIXTURE"; then
            pass "  parameter '$param' declared"
        else
            fail "  parameter '$param' not found in workflow-template-with-params.yaml"
        fi
    done

    # env parameter must include enum
    if grep -q "enum:" "$PARAMS_FIXTURE"; then
        pass "  'env' parameter has enum field"
    else
        fail "  'env' parameter missing enum field in workflow-template-with-params.yaml"
    fi
fi

# ---- Test 8: workflow-template-no-params.yaml has no parameters section ----
echo ""
echo "Test 8: workflow-template-no-params.yaml has no input parameters"

NO_PARAMS_FIXTURE="$FIXTURES_DIR/workflow-template-no-params.yaml"
if [ ! -f "$NO_PARAMS_FIXTURE" ]; then
    fail "workflow-template-no-params.yaml not found"
else
    # The file must not declare spec-level input parameters.
    # Allow the word "parameters:" to appear only inside templates (e.g. container args),
    # but the arguments.parameters block must be absent.
    if grep -q "arguments:" "$NO_PARAMS_FIXTURE" && grep -A 5 "arguments:" "$NO_PARAMS_FIXTURE" | grep -q "parameters:"; then
        fail "workflow-template-no-params.yaml must not declare arguments.parameters"
    else
        pass "workflow-template-no-params.yaml has no arguments.parameters section"
    fi
fi

# ---- Test 9: Workflow fixtures have correct apiVersion and kind ----
echo ""
echo "Test 9: Workflow fixtures declare correct apiVersion and kind"

for fixture in "workflow-running.yaml" "workflow-succeeded.yaml" "workflow-failed.yaml"; do
    fixture_path="$FIXTURES_DIR/$fixture"
    if [ ! -f "$fixture_path" ]; then
        fail "$fixture not found"
        continue
    fi
    if grep -q "apiVersion: argoproj.io/v1alpha1" "$fixture_path" && \
       grep -q "kind: Workflow" "$fixture_path"; then
        pass "$fixture has correct apiVersion and kind"
    else
        fail "$fixture missing 'apiVersion: argoproj.io/v1alpha1' or 'kind: Workflow'"
    fi
done

# ---- Test 10: workflow-running.yaml has correct phase and mixed node phases ----
echo ""
echo "Test 10: workflow-running.yaml status.phase is Running with mixed node phases"

RUNNING_FIXTURE="$FIXTURES_DIR/workflow-running.yaml"
if [ ! -f "$RUNNING_FIXTURE" ]; then
    fail "workflow-running.yaml not found"
else
    if grep -q "phase: Running" "$RUNNING_FIXTURE"; then
        pass "status.phase is Running"
    else
        fail "workflow-running.yaml: status.phase is not Running"
    fi

    for expected_phase in "Succeeded" "Running" "Pending"; do
        if grep -q "phase: $expected_phase" "$RUNNING_FIXTURE"; then
            pass "  node with phase=$expected_phase found"
        else
            fail "  no node with phase=$expected_phase in workflow-running.yaml"
        fi
    done
fi

# ---- Test 11: workflow-succeeded.yaml has Succeeded phase ----
echo ""
echo "Test 11: workflow-succeeded.yaml status.phase is Succeeded"

SUCCEEDED_FIXTURE="$FIXTURES_DIR/workflow-succeeded.yaml"
if [ ! -f "$SUCCEEDED_FIXTURE" ]; then
    fail "workflow-succeeded.yaml not found"
else
    if grep -q "phase: Succeeded" "$SUCCEEDED_FIXTURE"; then
        pass "status.phase is Succeeded"
    else
        fail "workflow-succeeded.yaml: status.phase is not Succeeded"
    fi
fi

# ---- Test 12: workflow-failed.yaml has Failed phase with Failed/Omitted nodes ----
echo ""
echo "Test 12: workflow-failed.yaml status.phase is Failed with Failed/Omitted nodes"

FAILED_FIXTURE="$FIXTURES_DIR/workflow-failed.yaml"
if [ ! -f "$FAILED_FIXTURE" ]; then
    fail "workflow-failed.yaml not found"
else
    if grep -q "phase: Failed" "$FAILED_FIXTURE"; then
        pass "status.phase is Failed"
    else
        fail "workflow-failed.yaml: status.phase is not Failed"
    fi

    for expected_phase in "Failed" "Omitted"; do
        if grep -q "phase: $expected_phase" "$FAILED_FIXTURE"; then
            pass "  node with phase=$expected_phase found"
        else
            fail "  no node with phase=$expected_phase in workflow-failed.yaml"
        fi
    done
fi

# ---- Test 13: Each Workflow fixture has inputs/outputs with parameters and artifacts ----
echo ""
echo "Test 13: Workflow fixtures contain inputs/outputs with parameters and artifacts in nodes"

for fixture in "workflow-running.yaml" "workflow-succeeded.yaml" "workflow-failed.yaml"; do
    fixture_path="$FIXTURES_DIR/$fixture"
    if [ ! -f "$fixture_path" ]; then
        skip "$fixture not found"
        continue
    fi

    has_inputs=false
    has_outputs=false
    has_parameters=false
    has_artifacts=false

    grep -q "inputs:" "$fixture_path"    && has_inputs=true
    grep -q "outputs:" "$fixture_path"   && has_outputs=true
    grep -q "parameters:" "$fixture_path" && has_parameters=true
    grep -q "artifacts:" "$fixture_path"  && has_artifacts=true

    if $has_inputs && $has_outputs && $has_parameters && $has_artifacts; then
        pass "$fixture contains inputs, outputs, parameters, and artifacts in nodes"
    else
        [ "$has_inputs"     = false ] && fail "$fixture: nodes missing 'inputs:' section"
        [ "$has_outputs"    = false ] && fail "$fixture: nodes missing 'outputs:' section"
        [ "$has_parameters" = false ] && fail "$fixture: nodes missing 'parameters:' section"
        [ "$has_artifacts"  = false ] && fail "$fixture: nodes missing 'artifacts:' section"
    fi
done

# ---- Test 14: apply-all.sh references all Argo fixtures ----
echo ""
echo "Test 14: test/fixtures/apply-all.sh references all Argo fixture files"

APPLY_ALL="$FIXTURES_DIR/apply-all.sh"
if [ ! -f "$APPLY_ALL" ]; then
    fail "apply-all.sh not found"
else
    for fixture in "${ARGO_FIXTURES[@]}"; do
        if grep -q "$fixture" "$APPLY_ALL"; then
            pass "  apply-all.sh references $fixture"
        else
            fail "  apply-all.sh does NOT reference $fixture"
        fi
    done
fi

# ---- Summary ----
echo ""
echo "============================================="
echo "Test Summary"
echo "  PASS: $PASS_COUNT"
echo "  FAIL: $FAIL_COUNT"
echo "  SKIP: $SKIP_COUNT"
echo "============================================="

if [ "$FAIL_COUNT" -gt 0 ]; then
    echo -e "${RED}Some tests FAILED. Implement the required changes (DLD-437).${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed.${NC}"
fi
