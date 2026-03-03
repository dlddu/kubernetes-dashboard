#!/bin/bash
# Test script for Kubernetes manifests validation

set -e

echo "=== Kubernetes Manifest Test ==="

K8S_DIR="k8s"

# Test 1: Required manifest files should exist
echo "Test 1: Checking required manifest files..."
REQUIRED_FILES=("deployment.yaml" "service.yaml" "rbac.yaml")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$K8S_DIR/$file" ]; then
        echo "FAIL: Required file $K8S_DIR/$file not found"
        exit 1
    fi
    echo "  - Found: $K8S_DIR/$file"
done
echo "PASS: All required manifest files exist"

# Test 2: Manifests should be valid YAML
echo "Test 2: Validating YAML syntax..."
for file in "$K8S_DIR"/*.yaml; do
    if ! yamllint -d relaxed "$file" 2>/dev/null; then
        # Fallback to basic YAML parsing if yamllint not available
        if ! python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
            echo "FAIL: Invalid YAML in $file"
            exit 1
        fi
    fi
    echo "  - Valid: $file"
done
echo "PASS: All manifests are valid YAML"

# Test 3: Deployment should have required fields
echo "Test 3: Validating Deployment manifest..."
if ! grep -q "kind: Deployment" "$K8S_DIR/deployment.yaml"; then
    echo "FAIL: deployment.yaml missing 'kind: Deployment'"
    exit 1
fi
if ! grep -q "replicas:" "$K8S_DIR/deployment.yaml"; then
    echo "FAIL: deployment.yaml missing 'replicas' field"
    exit 1
fi
if ! grep -q "image:" "$K8S_DIR/deployment.yaml"; then
    echo "FAIL: deployment.yaml missing 'image' field"
    exit 1
fi
echo "PASS: Deployment manifest is valid"

# Test 4: Service should expose correct port
echo "Test 4: Validating Service manifest..."
if ! grep -q "kind: Service" "$K8S_DIR/service.yaml"; then
    echo "FAIL: service.yaml missing 'kind: Service'"
    exit 1
fi
if ! grep -q "port: 80" "$K8S_DIR/service.yaml"; then
    echo "FAIL: service.yaml should expose port 80"
    exit 1
fi
echo "PASS: Service manifest is valid"

# Test 5: RBAC should have ServiceAccount, ClusterRole, and ClusterRoleBinding
echo "Test 5: Validating RBAC manifest..."
if ! grep -q "kind: ServiceAccount" "$K8S_DIR/rbac.yaml"; then
    echo "FAIL: rbac.yaml missing ServiceAccount"
    exit 1
fi
if ! grep -q "kind: ClusterRole" "$K8S_DIR/rbac.yaml"; then
    echo "FAIL: rbac.yaml missing ClusterRole"
    exit 1
fi
if ! grep -q "kind: ClusterRoleBinding" "$K8S_DIR/rbac.yaml"; then
    echo "FAIL: rbac.yaml missing ClusterRoleBinding"
    exit 1
fi
echo "PASS: RBAC manifest is valid"

# Test 6: Deployment should reference ServiceAccount
echo "Test 6: Checking ServiceAccount reference in Deployment..."
if ! grep -q "serviceAccountName:" "$K8S_DIR/deployment.yaml"; then
    echo "FAIL: Deployment should reference serviceAccountName"
    exit 1
fi
echo "PASS: Deployment references ServiceAccount"

# Test 7: ClusterRole should have pods/log subresource declared
echo "Test 7: Checking pods/log subresource in ClusterRole..."
if ! grep -q "pods/log" "$K8S_DIR/rbac.yaml"; then
    echo "FAIL: rbac.yaml ClusterRole missing pods/log subresource"
    exit 1
fi
echo "PASS: ClusterRole has pods/log subresource"

# Test 8: pods/log subresource should allow get verb
echo "Test 8: Checking get verb is allowed for pods/log..."
# Extract the block containing pods/log and verify get verb is present in the same rule block
PODS_LOG_BLOCK=$(python3 - <<'EOF'
import yaml, sys

with open("k8s/rbac.yaml") as f:
    docs = list(yaml.safe_load_all(f))

cluster_role = next((d for d in docs if d and d.get("kind") == "ClusterRole"), None)
if not cluster_role:
    sys.exit(1)

for rule in cluster_role.get("rules", []):
    resources = rule.get("resources", [])
    if "pods/log" in resources:
        verbs = rule.get("verbs", [])
        if "get" in verbs:
            print("found")
            sys.exit(0)

sys.exit(1)
EOF
)
if [ "$PODS_LOG_BLOCK" != "found" ]; then
    echo "FAIL: pods/log rule does not include get verb"
    exit 1
fi
echo "PASS: pods/log allows get verb"

# Test 9: pods/log subresource should belong to core API group ("")
echo "Test 9: Checking pods/log belongs to core apiGroup [\"\"]..."
PODS_LOG_APIGROUP=$(python3 - <<'EOF'
import yaml, sys

with open("k8s/rbac.yaml") as f:
    docs = list(yaml.safe_load_all(f))

cluster_role = next((d for d in docs if d and d.get("kind") == "ClusterRole"), None)
if not cluster_role:
    sys.exit(1)

for rule in cluster_role.get("rules", []):
    resources = rule.get("resources", [])
    if "pods/log" in resources:
        api_groups = rule.get("apiGroups", [])
        if "" in api_groups:
            print("found")
            sys.exit(0)

sys.exit(1)
EOF
)
if [ "$PODS_LOG_APIGROUP" != "found" ]; then
    echo "FAIL: pods/log rule is not in core apiGroup [\"\"]"
    exit 1
fi
echo "PASS: pods/log belongs to core apiGroup [\"\"]"

# Test 10: Validate with kubectl (if available)
if command -v kubectl &> /dev/null; then
    echo "Test 10: Validating with kubectl dry-run..."
    for file in "$K8S_DIR"/*.yaml; do
        if ! kubectl apply --dry-run=client -f "$file" > /dev/null 2>&1; then
            echo "FAIL: kubectl validation failed for $file"
            exit 1
        fi
        echo "  - Validated: $file"
    done
    echo "PASS: kubectl validation successful"
else
    echo "SKIP: kubectl not available, skipping validation"
fi

echo ""
echo "=== All Kubernetes manifest tests passed! ==="
