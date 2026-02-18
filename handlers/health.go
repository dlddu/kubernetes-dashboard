package handlers

import (
	"net/http"
)

// HealthResponse represents the health check response structure
type HealthResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// HealthHandler handles the /api/health endpoint
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodGet) {
		return
	}

	writeJSON(w, http.StatusOK, HealthResponse{
		Status:  "ok",
		Message: "Backend is healthy",
	})
}
