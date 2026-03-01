package handlers

import (
	"net/http"
)

// HealthResponse represents the response structure for health/liveness/readiness endpoints.
type HealthResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

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
