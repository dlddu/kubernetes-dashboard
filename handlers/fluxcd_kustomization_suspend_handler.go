package handlers

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"

	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	versioned "github.com/dlddu/kubernetes-dashboard/internal/fluxcdversioned/pkg/client/clientset/versioned"
)

// KustomizationSuspendHandler handles POST /api/fluxcd/kustomizations/{namespace}/{name}/suspend
func KustomizationSuspendHandler(w http.ResponseWriter, r *http.Request) {
	handleKustomizationSuspendToggle(w, r, true, suspendPathSuffix, errMsgKustomizationSuspend, "Suspended")
}

// KustomizationResumeHandler handles POST /api/fluxcd/kustomizations/{namespace}/{name}/resume
func KustomizationResumeHandler(w http.ResponseWriter, r *http.Request) {
	handleKustomizationSuspendToggle(w, r, false, resumePathSuffix, errMsgKustomizationResume, "Resumed")
}

func handleKustomizationSuspendToggle(
	w http.ResponseWriter, r *http.Request,
	suspend bool, suffix, errMsg, successMsg string,
) {
	if !requireMethod(w, r, http.MethodPost) {
		return
	}

	r = withTimeout(r)

	namespace, name, err := parseResourcePath(r.URL.Path, fluxcdKustomizationsPathPrefix, suffix)
	if err != nil {
		writeError(w, http.StatusBadRequest,
			"Invalid path format. Expected /api/fluxcd/kustomizations/{namespace}/{name}"+suffix)
		return
	}

	clientset, err := getFluxCDClient()
	if err != nil {
		slog.Error("Failed to create FluxCD client", "error", err)
		writeError(w, http.StatusInternalServerError, errMsgFluxCDClientCreate)
		return
	}

	if err := setKustomizationSuspend(r.Context(), clientset, namespace, name, suspend); err != nil {
		if k8serrors.IsNotFound(err) {
			writeError(w, http.StatusNotFound, errMsgKustomizationNotFound)
			return
		}
		slog.Error("Failed to toggle Kustomization suspend",
			"error", err, "namespace", namespace, "name", name, "suspend", suspend)
		writeError(w, http.StatusInternalServerError, errMsg)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": successMsg})
}

// setKustomizationSuspend patches spec.suspend on the given Kustomization
// using a JSON merge patch.
func setKustomizationSuspend(ctx context.Context, clientset *versioned.Clientset, namespace, name string, suspend bool) error {
	patchData := map[string]interface{}{
		"spec": map[string]interface{}{
			"suspend": suspend,
		},
	}
	data, err := json.Marshal(patchData)
	if err != nil {
		return err
	}

	return clientset.FluxCDV1().Kustomizations(namespace).Patch(ctx, name, data)
}
