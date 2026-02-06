#!/bin/bash
# kind cluster setup and teardown script for e2e tests

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CLUSTER_NAME="${KIND_CLUSTER_NAME:-k8s-dashboard-e2e}"
KUBECONFIG_PATH="${KUBECONFIG:-$HOME/.kube/config}"

log() {
    echo -e "${BLUE}[kind-setup]${NC} $1"
}

success() {
    echo -e "${GREEN}[kind-setup]${NC} $1"
}

error() {
    echo -e "${RED}[kind-setup]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[kind-setup]${NC} $1"
}

# Function to check if kind is installed
check_kind_installed() {
    if ! command -v kind &> /dev/null; then
        error "kind is not installed"
        echo "Install kind from: https://kind.sigs.k8s.io/docs/user/quick-start/#installation"
        exit 1
    fi
    success "kind is installed: $(kind version)"
}

# Function to check if kubectl is installed
check_kubectl_installed() {
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed"
        echo "Install kubectl from: https://kubernetes.io/docs/tasks/tools/"
        exit 1
    fi
    success "kubectl is installed: $(kubectl version --client --short 2>/dev/null || kubectl version --client)"
}

# Function to create kind cluster
create_cluster() {
    log "Creating kind cluster: $CLUSTER_NAME"

    # Check if cluster already exists
    if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
        warn "Cluster $CLUSTER_NAME already exists, deleting first..."
        delete_cluster
    fi

    # Create cluster with config
    cat <<EOF | kind create cluster --name "$CLUSTER_NAME" --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 30000
    hostPort: 30000
    protocol: TCP
EOF

    success "Cluster $CLUSTER_NAME created successfully"

    # Set kubectl context
    kubectl cluster-info --context "kind-${CLUSTER_NAME}"
    success "kubectl context set to kind-${CLUSTER_NAME}"
}

# Function to delete kind cluster
delete_cluster() {
    log "Deleting kind cluster: $CLUSTER_NAME"

    if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
        kind delete cluster --name "$CLUSTER_NAME"
        success "Cluster $CLUSTER_NAME deleted successfully"
    else
        warn "Cluster $CLUSTER_NAME does not exist, skipping deletion"
    fi
}

# Function to apply test fixtures
apply_fixtures() {
    log "Applying Kubernetes test fixtures"

    local fixtures_dir="test/fixtures"

    if [ ! -d "$fixtures_dir" ]; then
        error "Fixtures directory not found: $fixtures_dir"
        exit 1
    fi

    # Apply namespace files first (must be created before other resources)
    if [ -f "$fixtures_dir/namespace.yaml" ]; then
        log "Applying namespace.yaml first..."
        kubectl apply -f "$fixtures_dir/namespace.yaml"
        # Wait for namespaces to be created
        sleep 2
    fi

    # Apply all other YAML files in fixtures directory
    for file in "$fixtures_dir"/*.yaml; do
        if [ -f "$file" ] && [ "$(basename "$file")" != "namespace.yaml" ]; then
            log "Applying $(basename "$file")..."
            kubectl apply -f "$file"
        fi
    done

    success "Test fixtures applied successfully"

    # Wait for pods to be ready
    log "Waiting for pods to be ready..."
    kubectl wait --for=condition=ready pod --all --all-namespaces --timeout=60s || true
    success "Pods are ready"
}

# Function to verify cluster is ready
verify_cluster() {
    log "Verifying cluster is ready"

    # Check if cluster exists
    if ! kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
        error "Cluster $CLUSTER_NAME does not exist"
        exit 1
    fi

    # Check if kubectl can connect
    if ! kubectl cluster-info --context "kind-${CLUSTER_NAME}" > /dev/null 2>&1; then
        error "Cannot connect to cluster $CLUSTER_NAME"
        exit 1
    fi

    # Check if nodes are ready
    if ! kubectl get nodes --context "kind-${CLUSTER_NAME}" | grep -q "Ready"; then
        error "Cluster nodes are not ready"
        kubectl get nodes --context "kind-${CLUSTER_NAME}"
        exit 1
    fi

    success "Cluster is ready and healthy"
}

# Function to get kubeconfig
get_kubeconfig() {
    log "Getting kubeconfig for cluster: $CLUSTER_NAME"

    # Export kubeconfig
    kind get kubeconfig --name "$CLUSTER_NAME" > /dev/null

    success "Kubeconfig is available at: $KUBECONFIG_PATH"
    echo "export KUBECONFIG=$KUBECONFIG_PATH"
}

# Function to show cluster info
show_info() {
    log "Cluster information"

    echo ""
    echo "Cluster name: $CLUSTER_NAME"
    echo "Kubectl context: kind-${CLUSTER_NAME}"
    echo ""

    kubectl cluster-info --context "kind-${CLUSTER_NAME}"

    echo ""
    log "Nodes:"
    kubectl get nodes --context "kind-${CLUSTER_NAME}"

    echo ""
    log "All resources:"
    kubectl get all --all-namespaces --context "kind-${CLUSTER_NAME}"
}

# Main script logic
case "${1:-}" in
    create)
        check_kind_installed
        check_kubectl_installed
        create_cluster
        ;;
    delete)
        check_kind_installed
        delete_cluster
        ;;
    apply-fixtures)
        check_kubectl_installed
        apply_fixtures
        ;;
    verify)
        check_kind_installed
        check_kubectl_installed
        verify_cluster
        ;;
    info)
        check_kubectl_installed
        show_info
        ;;
    kubeconfig)
        check_kind_installed
        get_kubeconfig
        ;;
    setup)
        # Full setup: create + apply fixtures + verify
        check_kind_installed
        check_kubectl_installed
        create_cluster
        apply_fixtures
        verify_cluster
        show_info
        ;;
    teardown)
        # Full teardown
        check_kind_installed
        delete_cluster
        ;;
    *)
        echo "Usage: $0 {create|delete|apply-fixtures|verify|info|kubeconfig|setup|teardown}"
        echo ""
        echo "Commands:"
        echo "  create          - Create kind cluster"
        echo "  delete          - Delete kind cluster"
        echo "  apply-fixtures  - Apply test fixtures to cluster"
        echo "  verify          - Verify cluster is ready"
        echo "  info            - Show cluster information"
        echo "  kubeconfig      - Get kubeconfig path"
        echo "  setup           - Full setup (create + fixtures + verify)"
        echo "  teardown        - Full teardown (delete cluster)"
        echo ""
        echo "Environment variables:"
        echo "  KIND_CLUSTER_NAME - Cluster name (default: k8s-dashboard-e2e)"
        echo "  KUBECONFIG        - Kubeconfig path (default: ~/.kube/config)"
        exit 1
        ;;
esac
