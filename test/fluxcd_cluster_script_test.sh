#!/bin/bash
# fluxcd_cluster_script_test.sh
#
# DLD-743: e2e 테스트 환경에 FluxCD CRD 등록
#
# 이 스크립트는 TDD Red Phase 셸 테스트입니다.
# 실제 클러스터를 요구하지 않고 파일 존재 여부와 내용을 정적으로 검증합니다.
#
# 테스트 항목:
#   1.  scripts/kind-cluster.sh 에 install_fluxcd_crds 함수가 존재하는지
#   2.  install_fluxcd_crds 함수가 CRD 설치 명령(kubectl apply ... fluxcd 관련)을 포함하는지
#   3.  create_cluster 함수가 install_fluxcd_crds 를 호출하는지
#   4.  test/fixtures/ 하위에 FluxCD fixture 파일 4종이 모두 존재하는지
#   5.  각 FluxCD fixture 파일이 유효한 YAML(python3 safe_load)인지
#   6.  모든 fixture가 apiVersion: kustomize.toolkit.fluxcd.io/v1 과 kind: Kustomization을 포함하는지
#   7.  kustomization-ready.yaml 에 Ready 상태(status: "True") 확인
#   8.  kustomization-not-ready.yaml 에 Not Ready 상태(status: "False") 확인
#   9.  kustomization-suspended.yaml 에 suspend: true 확인
#   10. kustomization-multi-ns.yaml 에 dashboard-test와 dashboard-empty 네임스페이스 포함
#   11. test/fixtures/apply-all.sh 에 FluxCD fixture 4종이 모두 참조되는지

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

FLUXCD_FIXTURES=(
    "kustomization-ready.yaml"
    "kustomization-not-ready.yaml"
    "kustomization-suspended.yaml"
    "kustomization-multi-ns.yaml"
)

# ---- Test 1: install_fluxcd_crds function exists in kind-cluster.sh ----
echo ""
echo "Test 1: install_fluxcd_crds function defined in kind-cluster.sh"
if [ ! -f "$KIND_CLUSTER_SCRIPT" ]; then
    fail "kind-cluster.sh not found at $KIND_CLUSTER_SCRIPT"
elif grep -q "install_fluxcd_crds()" "$KIND_CLUSTER_SCRIPT" || grep -q "install_fluxcd_crds ()" "$KIND_CLUSTER_SCRIPT"; then
    pass "install_fluxcd_crds function declaration found"
else
    fail "install_fluxcd_crds function not declared in kind-cluster.sh"
fi

# ---- Test 2: install_fluxcd_crds references a FluxCD CRD manifest ----
echo ""
echo "Test 2: install_fluxcd_crds references kubectl apply with FluxCD CRD manifest"
if [ ! -f "$KIND_CLUSTER_SCRIPT" ]; then
    skip "kind-cluster.sh not found"
elif grep -A 20 "install_fluxcd_crds" "$KIND_CLUSTER_SCRIPT" | grep -q "kubectl apply" && \
     grep -A 20 "install_fluxcd_crds" "$KIND_CLUSTER_SCRIPT" | grep -qE "(fluxcd|kustomize\.toolkit\.fluxcd\.io)"; then
    pass "kubectl apply with fluxcd/kustomize.toolkit.fluxcd.io reference found in install_fluxcd_crds"
else
    fail "install_fluxcd_crds must contain: kubectl apply -f <fluxcd-crd-manifest>"
fi

# ---- Test 3: create_cluster calls install_fluxcd_crds ----
echo ""
echo "Test 3: create_cluster calls install_fluxcd_crds"
if [ ! -f "$KIND_CLUSTER_SCRIPT" ]; then
    skip "kind-cluster.sh not found"
else
    # Extract create_cluster function body and check for the call.
    if awk '/^create_cluster\(\)/{found=1} found && /^}$/{exit} found{print}' "$KIND_CLUSTER_SCRIPT" \
        | grep -q "install_fluxcd_crds"; then
        pass "create_cluster calls install_fluxcd_crds"
    else
        fail "create_cluster does not call install_fluxcd_crds"
    fi
fi

# ---- Test 4: FluxCD fixture files exist ----
echo ""
echo "Test 4: FluxCD fixture YAML files exist under test/fixtures/"

ALL_FIXTURES_PRESENT=true
for fixture in "${FLUXCD_FIXTURES[@]}"; do
    if [ -f "$FIXTURES_DIR/$fixture" ]; then
        pass "  $fixture exists"
    else
        fail "  $fixture NOT FOUND at $FIXTURES_DIR/$fixture"
        ALL_FIXTURES_PRESENT=false
    fi
done

# ---- Test 5: Each fixture is valid YAML ----
echo ""
echo "Test 5: FluxCD fixture files are valid YAML"

if ! command -v python3 &>/dev/null; then
    skip "python3 not available — skipping YAML parse validation"
else
    for fixture in "${FLUXCD_FIXTURES[@]}"; do
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

# ---- Test 6: All fixtures have correct apiVersion and kind ----
echo ""
echo "Test 6: FluxCD fixtures declare correct apiVersion and kind"

for fixture in "${FLUXCD_FIXTURES[@]}"; do
    fixture_path="$FIXTURES_DIR/$fixture"
    if [ ! -f "$fixture_path" ]; then
        fail "$fixture not found"
        continue
    fi
    if grep -q "apiVersion: kustomize.toolkit.fluxcd.io/v1" "$fixture_path" && \
       grep -q "kind: Kustomization" "$fixture_path"; then
        pass "$fixture has correct apiVersion and kind"
    else
        fail "$fixture missing 'apiVersion: kustomize.toolkit.fluxcd.io/v1' or 'kind: Kustomization'"
    fi
done

# ---- Test 7: kustomization-ready.yaml has Ready status=True ----
echo ""
echo "Test 7: kustomization-ready.yaml has Ready condition with status: \"True\""

READY_FIXTURE="$FIXTURES_DIR/kustomization-ready.yaml"
if [ ! -f "$READY_FIXTURE" ]; then
    fail "kustomization-ready.yaml not found"
else
    if grep -q "type: Ready" "$READY_FIXTURE" && grep -q 'status: "True"' "$READY_FIXTURE"; then
        pass "kustomization-ready.yaml has Ready condition with status: \"True\""
    else
        fail "kustomization-ready.yaml: missing type: Ready condition or status: \"True\""
    fi
fi

# ---- Test 8: kustomization-not-ready.yaml has Ready status=False ----
echo ""
echo "Test 8: kustomization-not-ready.yaml has Ready condition with status: \"False\""

NOT_READY_FIXTURE="$FIXTURES_DIR/kustomization-not-ready.yaml"
if [ ! -f "$NOT_READY_FIXTURE" ]; then
    fail "kustomization-not-ready.yaml not found"
else
    if grep -q "type: Ready" "$NOT_READY_FIXTURE" && grep -q 'status: "False"' "$NOT_READY_FIXTURE"; then
        pass "kustomization-not-ready.yaml has Ready condition with status: \"False\""
    else
        fail "kustomization-not-ready.yaml: missing type: Ready condition or status: \"False\""
    fi
fi

# ---- Test 9: kustomization-suspended.yaml has suspend: true ----
echo ""
echo "Test 9: kustomization-suspended.yaml has spec.suspend: true"

SUSPENDED_FIXTURE="$FIXTURES_DIR/kustomization-suspended.yaml"
if [ ! -f "$SUSPENDED_FIXTURE" ]; then
    fail "kustomization-suspended.yaml not found"
else
    if grep -q "suspend: true" "$SUSPENDED_FIXTURE"; then
        pass "kustomization-suspended.yaml has spec.suspend: true"
    else
        fail "kustomization-suspended.yaml: spec.suspend: true not found"
    fi
fi

# ---- Test 10: kustomization-multi-ns.yaml contains both namespaces ----
echo ""
echo "Test 10: kustomization-multi-ns.yaml contains dashboard-test and dashboard-empty namespaces"

MULTI_NS_FIXTURE="$FIXTURES_DIR/kustomization-multi-ns.yaml"
if [ ! -f "$MULTI_NS_FIXTURE" ]; then
    fail "kustomization-multi-ns.yaml not found"
else
    has_dashboard_test=false
    has_dashboard_empty=false

    grep -q "namespace: dashboard-test"  "$MULTI_NS_FIXTURE" && has_dashboard_test=true
    grep -q "namespace: dashboard-empty" "$MULTI_NS_FIXTURE" && has_dashboard_empty=true

    if $has_dashboard_test; then
        pass "  namespace dashboard-test found"
    else
        fail "  namespace dashboard-test NOT found in kustomization-multi-ns.yaml"
    fi

    if $has_dashboard_empty; then
        pass "  namespace dashboard-empty found"
    else
        fail "  namespace dashboard-empty NOT found in kustomization-multi-ns.yaml"
    fi

    # File must contain YAML document separator (---)
    if grep -q "^---" "$MULTI_NS_FIXTURE"; then
        pass "  kustomization-multi-ns.yaml contains multiple YAML documents (---)"
    else
        fail "  kustomization-multi-ns.yaml does not use --- document separator for multiple documents"
    fi
fi

# ---- Test 11: apply-all.sh references all FluxCD fixtures ----
echo ""
echo "Test 11: test/fixtures/apply-all.sh references all FluxCD fixture files"

APPLY_ALL="$FIXTURES_DIR/apply-all.sh"
if [ ! -f "$APPLY_ALL" ]; then
    fail "apply-all.sh not found"
else
    for fixture in "${FLUXCD_FIXTURES[@]}"; do
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
    echo -e "${RED}Some tests FAILED. Implement the required changes (DLD-743).${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed.${NC}"
fi
