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

# 4.0.1 Apply completed pod (will reach Succeeded phase)
log_info "Creating completed pod (will reach Succeeded phase)..."
kubectl apply -f "$SCRIPT_DIR/completed-pod.yaml"

# 4.1 Apply terminating pod (will be deleted to enter Terminating state)
log_info "Creating terminating test pod..."
kubectl apply -f "$SCRIPT_DIR/terminating-pod.yaml"

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

# Wait for completed-job-pod to finish (Succeeded phase)
log_info "Waiting for completed-job-pod to finish..."
kubectl wait --for=jsonpath='{.status.phase}'=Succeeded pod/completed-job-pod -n dashboard-test --timeout=60s

# Wait for terminating-test-pod to be ready, then delete it to enter Terminating state
log_info "Waiting for terminating-test-pod to be ready..."
kubectl wait --for=condition=Ready pod/terminating-test-pod -n dashboard-test --timeout=60s
log_info "Deleting terminating-test-pod (will remain in Terminating state due to long grace period)..."
kubectl delete pod/terminating-test-pod -n dashboard-test --wait=false

# Display status
log_info "Test fixtures applied successfully!"
echo ""
log_warn "Note: unhealthy-test-pod-1~4 are intentionally configured to fail (ImagePullBackOff)"
log_warn "Note: completed-job-pod has finished successfully (Succeeded phase)"
log_warn "Note: terminating-test-pod is in Terminating state (long terminationGracePeriodSeconds)"
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

# Relocate backend-app from dashboard-empty to default namespace.
# The fixture YAML keeps dashboard-empty for static validation (DLD-743 shell tests),
# but E2E tests expect dashboard-empty to have zero Kustomizations.
log_info "Relocating backend-app from dashboard-empty to default namespace..."
kubectl delete kustomization backend-app -n dashboard-empty --ignore-not-found
kubectl apply -f - <<RELOCATE_EOF
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: backend-app
  namespace: default
spec:
  interval: 10m
  path: ./backend
  prune: false
  sourceRef:
    kind: GitRepository
    name: flux-system
RELOCATE_EOF

echo ""
log_info "To clean up, run: kubectl delete namespace dashboard-test"

# 8. Patch FluxCD Kustomization status subresources
# kubectl apply does not persist status fields; we must patch them via the status subresource.
log_info "Patching FluxCD Kustomization status subresources..."

# app-ready (dashboard-test): Ready=True, revision=main@sha1:abc123def456
kubectl patch kustomization app-ready -n dashboard-test --type=merge --subresource=status -p '{
  "status": {
    "conditions": [
      {
        "type": "Ready",
        "status": "True",
        "lastTransitionTime": "2026-03-14T06:00:00Z",
        "reason": "ReconciliationSucceeded",
        "message": "Applied revision: main@sha1:abc123def456"
      }
    ],
    "lastAppliedRevision": "main@sha1:abc123def456"
  }
}'

# app-not-ready (dashboard-test): Ready=False
kubectl patch kustomization app-not-ready -n dashboard-test --type=merge --subresource=status -p '{
  "status": {
    "conditions": [
      {
        "type": "Ready",
        "status": "False",
        "lastTransitionTime": "2026-03-14T05:30:00Z",
        "reason": "ArtifactFailed",
        "message": "Source artifact not found: GitRepository/flux-system/app-source"
      }
    ]
  }
}'

# app-suspended (dashboard-test): Ready=True (but spec.suspend=true)
kubectl patch kustomization app-suspended -n dashboard-test --type=merge --subresource=status -p '{
  "status": {
    "conditions": [
      {
        "type": "Ready",
        "status": "True",
        "lastTransitionTime": "2026-03-14T04:00:00Z",
        "reason": "ReconciliationSucceeded",
        "message": "Applied revision: main@sha1:abc123def456"
      }
    ],
    "lastAppliedRevision": "main@sha1:abc123def456"
  }
}'

# frontend-app (dashboard-test): Ready=True
kubectl patch kustomization frontend-app -n dashboard-test --type=merge --subresource=status -p '{
  "status": {
    "conditions": [
      {
        "type": "Ready",
        "status": "True",
        "lastTransitionTime": "2026-03-14T06:00:00Z",
        "reason": "ReconciliationSucceeded",
        "message": "Applied revision: main@sha1:abc123"
      }
    ],
    "lastAppliedRevision": "main@sha1:abc123"
  }
}'

# backend-app (default): Ready=True
kubectl patch kustomization backend-app -n default --type=merge --subresource=status -p '{
  "status": {
    "conditions": [
      {
        "type": "Ready",
        "status": "True",
        "lastTransitionTime": "2026-03-14T06:05:00Z",
        "reason": "ReconciliationSucceeded",
        "message": "Applied revision: main@sha1:def456"
      }
    ],
    "lastAppliedRevision": "main@sha1:def456"
  }
}'

log_info "FluxCD Kustomization status patching completed"
