#!/bin/bash

# kind-teardown.sh
# Tears down a kind (Kubernetes IN Docker) cluster after E2E testing
#
# Usage: ./scripts/kind-teardown.sh [cluster-name]
#
# This script:
# - Deletes the kind cluster
# - Cleans up any leftover resources

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# Configuration
CLUSTER_NAME="${1:-kubernetes-dashboard-e2e}"

echo "=========================================="
echo "Tearing down kind cluster: $CLUSTER_NAME"
echo "=========================================="

# Check if kind is installed
if ! command -v kind &> /dev/null; then
    echo "WARNING: kind is not installed, nothing to clean up"
    exit 0
fi

# Check if cluster exists
if ! kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "Cluster '$CLUSTER_NAME' does not exist"
    echo "Nothing to clean up"
    exit 0
fi

# Show cluster info before deletion
echo "Cluster info before deletion:"
kubectl cluster-info --context "kind-${CLUSTER_NAME}" || true

# Delete the cluster
echo "Deleting kind cluster..."
kind delete cluster --name "$CLUSTER_NAME"

# Verify deletion
if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "ERROR: Failed to delete cluster '$CLUSTER_NAME'"
    exit 1
fi

echo ""
echo "=========================================="
echo "kind cluster teardown complete!"
echo "=========================================="
echo "Cluster '$CLUSTER_NAME' has been deleted"
echo "=========================================="
