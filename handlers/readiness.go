package handlers

import (
	"context"
	"net/http"
	"time"
)

// readinessTimeout is the maximum time allowed for the readiness check.
const readinessTimeout = 2 * time.Second

// ReadinessHandler handles the /api/ready endpoint.
// Unlike the health endpoint, this verifies actual Kubernetes API connectivity
// to determine whether the pod is ready to serve traffic.
var ReadinessHandler = func(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodGet) {
		return
	}

	clientset, err := getKubernetesClient()
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"status": "unavailable",
			"reason": "kubernetes client not initialized",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), readinessTimeout)
	defer cancel()

	// Verify connectivity by calling the server version API (lightweight, no RBAC needed).
	_, err = clientset.Discovery().ServerVersion()
	if err != nil {
		select {
		case <-ctx.Done():
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{
				"status": "unavailable",
				"reason": "kubernetes API timeout",
			})
		default:
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{
				"status": "unavailable",
				"reason": "kubernetes API unreachable",
			})
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status": "ready",
	})
}
