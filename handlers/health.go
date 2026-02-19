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
var HealthHandler = handleGet("Health check failed", func(r *http.Request) (interface{}, error) {
	return HealthResponse{
		Status:  "ok",
		Message: "Backend is healthy",
	}, nil
})
