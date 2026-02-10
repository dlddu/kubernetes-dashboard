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

# 1. Create namespace first
log_info "Creating namespace..."
kubectl apply -f "$SCRIPT_DIR/namespace.yaml"

# Wait for namespace to be created
log_info "Waiting for namespace to be active..."
kubectl wait --for=jsonpath='{.status.phase}'=Active namespace/dashboard-test --timeout=30s

# 2. Apply secrets and configmaps
log_info "Creating secrets and configmaps..."
kubectl apply -f "$SCRIPT_DIR/secret.yaml"

# 3. Apply pod
log_info "Creating standalone pod..."
kubectl apply -f "$SCRIPT_DIR/pod.yaml"

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

echo ""
log_info "To clean up, run: kubectl delete namespace dashboard-test"
