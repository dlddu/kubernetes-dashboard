#!/bin/bash

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    log_error "kubectl is not installed"
    exit 1
fi

# Apply manifests in order
log_info "Applying Kubernetes test fixtures..."

# 1. Create namespaces first
log_info "Creating namespaces..."
kubectl apply -f "$SCRIPT_DIR/namespace.yaml"
kubectl apply -f "$SCRIPT_DIR/empty-namespace.yaml"

# Wait for namespaces to be created
log_info "Waiting for namespaces to be active..."
kubectl wait --for=jsonpath='{.status.phase}'=Active namespace/dashboard-test --timeout=30s
kubectl wait --for=jsonpath='{.status.phase}'=Active namespace/dashboard-empty --timeout=30s

# 2. Apply secrets and configmaps
log_info "Creating secrets and configmaps..."
kubectl apply -f "$SCRIPT_DIR/secret.yaml"

# 3. Apply pods
log_info "Creating standalone pods..."
kubectl apply -f "$SCRIPT_DIR/pod.yaml"
kubectl apply -f "$SCRIPT_DIR/verbose-pod.yaml"

# 4. Apply unhealthy pods (intentionally fail for testing)
log_info "Creating unhealthy pods (will remain in ImagePullBackOff state)..."
kubectl apply -f "$SCRIPT_DIR/unhealthy-pod.yaml"

# 5. Apply deployment
log_info "Creating deployment..."
kubectl apply -f "$SCRIPT_DIR/deployment.yaml"

# Wait for deployments to be ready
log_info "Waiting for deployments to be ready..."
kubectl wait --for=condition=Available deployment/nginx-test -n dashboard-test --timeout=120s

# Wait for healthy pods to be ready (skip unhealthy-test-pod)
log_info "Waiting for healthy pods to be ready..."
kubectl wait --for=condition=Ready pod/busybox-test -n dashboard-test --timeout=60s
kubectl wait --for=condition=Ready pod/verbose-log-test -n dashboard-test --timeout=60s

# Display status
log_info "Test fixtures applied successfully!"
echo ""
log_warn "Note: unhealthy-test-pod-1~4 are intentionally configured to fail (ImagePullBackOff)"
echo ""
log_info "Resources in dashboard-test namespace:"
kubectl get all,secrets,configmaps -n dashboard-test

echo ""
log_info "Pod status details:"
kubectl get pods -n dashboard-test -o wide

# 6. Apply Argo Workflows fixtures
log_info "Applying Argo Workflows fixtures..."
kubectl apply -f "$SCRIPT_DIR/workflow-template-with-params.yaml"
kubectl apply -f "$SCRIPT_DIR/workflow-template-no-params.yaml"
kubectl apply -f "$SCRIPT_DIR/workflow-template-empty-runs.yaml"
kubectl apply -f "$SCRIPT_DIR/workflow-template-ml-pipeline.yaml"
kubectl apply -f "$SCRIPT_DIR/workflow-running.yaml"
kubectl apply -f "$SCRIPT_DIR/workflow-succeeded.yaml"
kubectl apply -f "$SCRIPT_DIR/workflow-failed.yaml"
kubectl apply -f "$SCRIPT_DIR/workflow-ml-pipeline.yaml"

echo ""

# 7. Apply FluxCD Kustomization fixtures
log_info "Applying FluxCD Kustomization fixtures..."
kubectl apply -f "$SCRIPT_DIR/kustomization-ready.yaml"
kubectl apply -f "$SCRIPT_DIR/kustomization-not-ready.yaml"
kubectl apply -f "$SCRIPT_DIR/kustomization-suspended.yaml"
kubectl apply -f "$SCRIPT_DIR/kustomization-multi-ns.yaml"

echo ""
log_info "To clean up, run: kubectl delete namespace dashboard-test"
