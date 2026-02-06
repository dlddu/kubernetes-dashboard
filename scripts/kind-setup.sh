#!/bin/bash

# kind-setup.sh
# Sets up a kind (Kubernetes IN Docker) cluster for E2E testing
#
# Usage: ./scripts/kind-setup.sh [cluster-name]
#
# This script:
# - Creates a kind cluster with appropriate configuration
# - Waits for the cluster to be ready
# - Loads Docker images into the cluster (if IMAGE_NAME is set)
# - Applies test fixtures to the cluster

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# Configuration
CLUSTER_NAME="${1:-kubernetes-dashboard-e2e}"
KUBECONFIG_PATH="${KUBECONFIG:-$HOME/.kube/config}"
KIND_CONFIG_FILE="/tmp/kind-config.yaml"

echo "=========================================="
echo "Setting up kind cluster: $CLUSTER_NAME"
echo "=========================================="

# Check if kind is installed
if ! command -v kind &> /dev/null; then
    echo "ERROR: kind is not installed"
    echo "Please install kind: https://kind.sigs.k8s.io/docs/user/quick-start/#installation"
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "ERROR: kubectl is not installed"
    echo "Please install kubectl: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi

# Check if cluster already exists
if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "Cluster '$CLUSTER_NAME' already exists"
    echo "Using existing cluster..."
else
    # Create kind config with port mapping for the dashboard
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

    echo "Creating kind cluster..."
    kind create cluster --name "$CLUSTER_NAME" --config "$KIND_CONFIG_FILE"

    # Clean up config file
    rm -f "$KIND_CONFIG_FILE"
fi

# Wait for cluster to be ready
echo "Waiting for cluster to be ready..."
kubectl wait --for=condition=Ready nodes --all --timeout=120s

# Verify cluster is accessible
echo "Verifying cluster access..."
kubectl cluster-info --context "kind-${CLUSTER_NAME}"

# Create namespaces for testing
echo "Creating test namespaces..."
kubectl create namespace test-namespace --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# Apply test fixtures if they exist
FIXTURES_DIR="$(dirname "$0")/../test/fixtures"
if [ -d "$FIXTURES_DIR" ]; then
    echo "Applying test fixtures..."

    # Apply in order: namespaces, secrets, deployments, pods
    for resource in namespace secret deployment pod; do
        if ls "$FIXTURES_DIR"/*-${resource}.yaml 1> /dev/null 2>&1; then
            echo "Applying ${resource} fixtures..."
            kubectl apply -f "$FIXTURES_DIR"/*-${resource}.yaml
        fi
    done
fi

# Load Docker image into kind cluster if IMAGE_NAME is set
if [ -n "${IMAGE_NAME:-}" ]; then
    echo "Loading Docker image '$IMAGE_NAME' into kind cluster..."
    kind load docker-image "$IMAGE_NAME" --name "$CLUSTER_NAME"
fi

# Show cluster info
echo ""
echo "=========================================="
echo "kind cluster setup complete!"
echo "=========================================="
echo "Cluster name: $CLUSTER_NAME"
echo "Context: kind-${CLUSTER_NAME}"
echo ""
echo "Available nodes:"
kubectl get nodes
echo ""
echo "Available namespaces:"
kubectl get namespaces
echo ""
echo "To use this cluster, run:"
echo "  export KUBECONFIG=\$(kind get kubeconfig --name $CLUSTER_NAME)"
echo ""
echo "To interact with the cluster:"
echo "  kubectl --context kind-${CLUSTER_NAME} get pods -A"
echo "=========================================="
