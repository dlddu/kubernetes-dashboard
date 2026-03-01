package handlers

import (
	"context"
	"net/http"
	"time"
)

// readinessTimeout is the timeout for readiness probe checks.
const readinessTimeout = 2 * time.Second

// ReadyzHandler handles the /api/readyz endpoint.
// It verifies that the backend can actually serve requests by checking
// Kubernetes API server connectivity.
func ReadyzHandler(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodGet) {
		return
	}

	clientset, err := getKubernetesClient()
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, HealthResponse{
			Status:  "error",
			Message: "Kubernetes client not available",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), readinessTimeout)
	defer cancel()

	// Use RESTClient with context so the readinessTimeout is enforced.
	// /version is a lightweight, permission-free endpoint.
	_, err = clientset.Discovery().RESTClient().Get().AbsPath("/version").Do(ctx).Raw()
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, HealthResponse{
			Status:  "error",
			Message: "Kubernetes API server unreachable",
		})
		return
	}

	writeJSON(w, http.StatusOK, HealthResponse{
		Status:  "ok",
		Message: "Ready",
	})
}
