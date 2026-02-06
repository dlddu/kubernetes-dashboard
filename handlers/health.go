package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/dlddu/kubernetes-dashboard/pkg/k8s"
)

// HealthResponse represents the health check response structure
type HealthResponse struct {
	Status           string `json:"status"`
	Message          string `json:"message"`
	ClusterConnected *bool  `json:"cluster_connected,omitempty"`
}

// HealthHandler handles the /api/health endpoint
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	// Only allow GET method
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Set content type
	w.Header().Set("Content-Type", "application/json")

	// Check cluster connectivity
	clusterConnected := k8s.CheckClusterConnection()

	// Create response
	response := HealthResponse{
		Status:           "ok",
		Message:          "Backend is healthy",
		ClusterConnected: &clusterConnected,
	}

	// Send response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
