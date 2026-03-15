package handlers

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	versioned "github.com/dlddu/kubernetes-dashboard/internal/fluxcdversioned/pkg/client/clientset/versioned"
)

// KustomizationReconcileHandler handles POST /api/fluxcd/kustomizations/{namespace}/{name}/reconcile
func KustomizationReconcileHandler(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodPost) {
		return
	}

	r = withTimeout(r)

	namespace, name, err := parseResourcePath(r.URL.Path, fluxcdKustomizationsPathPrefix, reconcilePathSuffix)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid path format. Expected /api/fluxcd/kustomizations/{namespace}/{name}/reconcile")
		return
	}

	clientset, err := getFluxCDClient()
	if err != nil {
		slog.Error("Failed to create FluxCD client", "error", err)
		writeError(w, http.StatusInternalServerError, errMsgFluxCDClientCreate)
		return
	}

	err = reconcileKustomization(r.Context(), clientset, namespace, name)
	if err != nil {
		if k8serrors.IsNotFound(err) {
			writeError(w, http.StatusNotFound, errMsgKustomizationNotFound)
			return
		}
		slog.Error("Failed to reconcile Kustomization", "error", err, "namespace", namespace, "name", name)
		writeError(w, http.StatusInternalServerError, errMsgKustomizationReconcile)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "Reconciliation triggered",
	})
}

// reconcileKustomization triggers a reconciliation of the given Kustomization
// by patching the reconcile.fluxcd.io/requestedAt annotation with the current time.
func reconcileKustomization(ctx context.Context, clientset *versioned.Clientset, namespace, name string) error {
	patchData := map[string]interface{}{
		"metadata": map[string]interface{}{
			"annotations": map[string]string{
				annotationReconcileRequestedAt: time.Now().Format(time.RFC3339),
			},
		},
	}
	data, err := json.Marshal(patchData)
	if err != nil {
		return err
	}

	return clientset.FluxCDV1().Kustomizations(namespace).Patch(ctx, name, data)
}
