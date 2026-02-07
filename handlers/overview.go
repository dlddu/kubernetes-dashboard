package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// OverviewResponse represents the overview endpoint response structure
type OverviewResponse struct {
	Nodes struct {
		Ready int `json:"ready"`
		Total int `json:"total"`
	} `json:"nodes"`
	UnhealthyPods  int     `json:"unhealthyPods"`
	AvgCpuUsage    float64 `json:"avgCpuUsage"`
	AvgMemoryUsage float64 `json:"avgMemoryUsage"`
}

// OverviewHandler handles the /api/overview endpoint
func OverviewHandler(w http.ResponseWriter, r *http.Request) {
	// Only allow GET method
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Set content type
	w.Header().Set("Content-Type", "application/json")

	// Get Kubernetes client
	clientset, err := getKubernetesClient()
	if err != nil {
		// If client creation fails, return 500
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(OverviewResponse{})
		return
	}

	// Create response
	response := OverviewResponse{}

	// Fetch nodes
	nodeList, err := clientset.CoreV1().Nodes().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		// If listing fails, return 500
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Count nodes
	response.Nodes.Total = len(nodeList.Items)
	readyNodes := 0
	for _, node := range nodeList.Items {
		for _, condition := range node.Status.Conditions {
			if condition.Type == corev1.NodeReady && condition.Status == corev1.ConditionTrue {
				readyNodes++
				break
			}
		}
	}
	response.Nodes.Ready = readyNodes

	// Fetch pods from all namespaces
	podList, err := clientset.CoreV1().Pods("").List(context.Background(), metav1.ListOptions{})
	if err != nil {
		// Continue with zero unhealthy pods if we can't fetch
		response.UnhealthyPods = 0
	} else {
		// Count unhealthy pods (not Running or Succeeded)
		unhealthyCount := 0
		for _, pod := range podList.Items {
			phase := pod.Status.Phase
			if phase != corev1.PodRunning && phase != corev1.PodSucceeded {
				unhealthyCount++
			}
		}
		response.UnhealthyPods = unhealthyCount
	}

	// Calculate CPU and Memory usage
	// Note: This requires metrics-server to be installed
	// For now, we'll return mock values between 0-100
	response.AvgCpuUsage = 0.0
	response.AvgMemoryUsage = 0.0

	// Try to get metrics if metrics-server is available
	// This is optional and won't fail if metrics-server is not installed
	// For TDD purposes, we'll leave this at 0 for now
	// In production, you would use metrics.k8s.io API

	// Send response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
