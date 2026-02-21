#!/bin/bash

set -euo pipefail

# Configuration
CLUSTER_NAME="${KIND_CLUSTER_NAME:-kubernetes-dashboard-e2e}"
KIND_CONFIG_FILE="${KIND_CONFIG_FILE:-/tmp/kind-config.yaml}"
KUBECONFIG_PATH="${KUBECONFIG:-$HOME/.kube/config}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kind is installed
check_kind_installed() {
    if ! command -v kind &> /dev/null; then
        log_error "kind is not installed"
        log_info "Install kind from: https://kind.sigs.k8s.io/docs/user/quick-start/#installation"
        exit 1
    fi
    log_info "kind version: $(kind --version)"
}

# Check if kubectl is installed
check_kubectl_installed() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        log_info "Install kubectl from: https://kubernetes.io/docs/tasks/tools/"
        exit 1
    fi
    log_info "kubectl version: $(kubectl version --client --short 2>/dev/null || kubectl version --client)"
}

# Create kind cluster configuration
create_kind_config() {
    cat > "$KIND_CONFIG_FILE" <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 30080
        hostPort: 30080
        protocol: TCP
EOF
    log_info "Created kind config at $KIND_CONFIG_FILE"
}

# Create kind cluster
create_cluster() {
    log_info "Creating kind cluster: $CLUSTER_NAME"

    # Check if cluster already exists
    if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
        log_warn "Cluster '$CLUSTER_NAME' already exists"
        log_info "Deleting existing cluster..."
        kind delete cluster --name "$CLUSTER_NAME"
    fi

    # Create the cluster
    create_kind_config
    kind create cluster --name "$CLUSTER_NAME" --config "$KIND_CONFIG_FILE"

    # Wait for cluster to be ready
    log_info "Waiting for cluster to be ready..."
    kubectl wait --for=condition=Ready nodes --all --timeout=120s

    # Verify cluster
    log_info "Cluster nodes:"
    kubectl get nodes

    log_info "Cluster created successfully"

    # Install metrics-server
    install_metrics_server

    # Install Argo Workflows CRDs
    install_argo_crds
}

# Install metrics-server for real CPU/Memory metrics
install_metrics_server() {
    log_info "Installing metrics-server..."
    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

    # Patch metrics-server for kind (needs --kubelet-insecure-tls)
    kubectl patch deployment metrics-server -n kube-system --type='json' -p='[
      {"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"},
      {"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-preferred-address-types=InternalIP"}
    ]'

    log_info "Waiting for metrics-server to be ready..."
    kubectl wait --for=condition=Available deployment/metrics-server -n kube-system --timeout=120s

    # Wait for metrics data to be available (metrics-server needs ~60s to collect first metrics)
    log_info "Waiting for metrics data to be available..."
    for i in $(seq 1 30); do
        if kubectl top nodes > /dev/null 2>&1; then
            log_info "metrics-server is ready and serving metrics"
            return 0
        fi
        log_warn "Waiting for metrics data... (attempt $i/30)"
        sleep 5
    done
    log_warn "metrics-server deployed but metrics data may not be available yet"
}

# Install Argo Workflows CRDs for e2e test environment
install_argo_crds() {
    log_info "Installing Argo Workflows CRDs..."
    kubectl apply -k "https://github.com/argoproj/argo-workflows/manifests/base/crds/minimal?ref=v3.6.4"

    log_info "Waiting for Argo Workflows CRDs to be established..."
    kubectl wait --for=condition=Established crd/workflows.argoproj.io --timeout=60s || true
    kubectl wait --for=condition=Established crd/workflowtemplates.argoproj.io --timeout=60s || true

    log_info "Argo Workflows CRDs installed successfully"
}

# Delete kind cluster
delete_cluster() {
    log_info "Deleting kind cluster: $CLUSTER_NAME"

    if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
        kind delete cluster --name "$CLUSTER_NAME"
        log_info "Cluster deleted successfully"
    else
        log_warn "Cluster '$CLUSTER_NAME' does not exist"
    fi

    # Clean up config file
    if [ -f "$KIND_CONFIG_FILE" ]; then
        rm "$KIND_CONFIG_FILE"
        log_info "Removed kind config file"
    fi
}

# Get cluster status
cluster_status() {
    if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
        log_info "Cluster '$CLUSTER_NAME' exists"
        kubectl cluster-info --context "kind-${CLUSTER_NAME}"
        kubectl get nodes
        return 0
    else
        log_warn "Cluster '$CLUSTER_NAME' does not exist"
        return 1
    fi
}

# Export kubeconfig
export_kubeconfig() {
    local output_path="${1:-./kubeconfig}"

    if ! kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
        log_error "Cluster '$CLUSTER_NAME' does not exist"
        exit 1
    fi

    kind get kubeconfig --name "$CLUSTER_NAME" > "$output_path"
    log_info "Kubeconfig exported to: $output_path"
    echo "export KUBECONFIG=$output_path"
}

# Load docker image to kind cluster
load_image() {
    local image_name="${1:-}"

    if [ -z "$image_name" ]; then
        log_error "Image name is required"
        echo "Usage: $0 load-image <image-name>"
        exit 1
    fi

    if ! kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
        log_error "Cluster '$CLUSTER_NAME' does not exist"
        exit 1
    fi

    log_info "Loading image '$image_name' to cluster '$CLUSTER_NAME'"
    kind load docker-image "$image_name" --name "$CLUSTER_NAME"
    log_info "Image loaded successfully"
}

# Main
main() {
    local command="${1:-help}"

    check_kind_installed
    check_kubectl_installed

    case "$command" in
        create)
            create_cluster
            ;;
        delete)
            delete_cluster
            ;;
        status)
            cluster_status
            ;;
        export-kubeconfig)
            export_kubeconfig "${2:-./kubeconfig}"
            ;;
        load-image)
            load_image "${2:-}"
            ;;
        help|*)
            echo "Usage: $0 {create|delete|status|export-kubeconfig|load-image} [args]"
            echo ""
            echo "Commands:"
            echo "  create              Create a new kind cluster"
            echo "  delete              Delete the kind cluster"
            echo "  status              Show cluster status"
            echo "  export-kubeconfig   Export kubeconfig to file (default: ./kubeconfig)"
            echo "  load-image <name>   Load docker image to cluster"
            echo ""
            echo "Environment variables:"
            echo "  KIND_CLUSTER_NAME   Cluster name (default: kubernetes-dashboard-e2e)"
            echo "  KIND_CONFIG_FILE    Config file path (default: /tmp/kind-config.yaml)"
            echo "  KUBECONFIG          Kubeconfig path (default: ~/.kube/config)"
            ;;
    esac
}

main "$@"
