package handlers

import (
	"net/http"
)

// LivezHandler handles the /api/livez endpoint.
// It performs a simple check to confirm the process is alive and responsive.
// This should NOT check external dependencies — liveness failures cause pod restarts.
func LivezHandler(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodGet) {
		return
	}

	writeJSON(w, http.StatusOK, HealthResponse{
		Status:  "ok",
		Message: "Alive",
	})
}
