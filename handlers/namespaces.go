package handlers

import (
	"encoding/json"
	"net/http"
)

// Namespace represents a Kubernetes namespace
type Namespace struct {
	Name   string `json:"name"`
	Status string `json:"status"`
}

// NamespacesResponse represents the namespace list response structure
type NamespacesResponse struct {
	Items []Namespace `json:"items"`
}

// NamespacesHandler handles the /api/namespaces endpoint
func NamespacesHandler(w http.ResponseWriter, r *http.Request) {
	// Only allow GET method
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Set content type
	w.Header().Set("Content-Type", "application/json")

	// Mock data for now (will be replaced with actual K8s API calls later)
	response := NamespacesResponse{
		Items: []Namespace{
			{Name: "default", Status: "Active"},
			{Name: "kube-system", Status: "Active"},
			{Name: "kube-public", Status: "Active"},
			{Name: "kube-node-lease", Status: "Active"},
		},
	}

	// Send response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
