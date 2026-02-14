#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CLUSTER_NAME="${KIND_CLUSTER_NAME:-kubernetes-dashboard-e2e}"
IMAGE_NAME="${1:-kubernetes-dashboard:e2e}"
E2E_PORT="${E2E_PORT:-30080}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

log_info "Loading image '$IMAGE_NAME' into kind cluster '$CLUSTER_NAME'"
"$SCRIPT_DIR/kind-cluster.sh" load-image "$IMAGE_NAME"

log_info "Applying e2e kustomize overlay (rbac + deployment + service)"
kubectl apply -k "$PROJECT_ROOT/e2e/k8s/"

log_info "Waiting for deployment to be available..."
kubectl wait --for=condition=Available deployment/kubernetes-dashboard --timeout=120s

log_info "Verifying health endpoint via NodePort..."
for i in $(seq 1 30); do
    if curl -sf "http://localhost:${E2E_PORT}/api/health" > /dev/null 2>&1; then
        log_info "Dashboard is healthy and accessible at http://localhost:${E2E_PORT}"
        exit 0
    fi
    log_warn "Waiting for dashboard to respond... (attempt $i/30)"
    sleep 2
done

log_error "Dashboard did not become healthy within timeout"
kubectl describe deployment kubernetes-dashboard
kubectl logs -l app=kubernetes-dashboard --tail=50
exit 1
