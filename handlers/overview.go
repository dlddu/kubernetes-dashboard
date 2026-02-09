package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// OverviewHandler handles the /api/overview endpoint
func OverviewHandler(w http.ResponseWriter, r *http.Request) {
	// Only allow GET method
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Set content type
	w.Header().Set("Content-Type", "application/json")

	// Get namespace from query parameter
	namespace := r.URL.Query().Get("namespace")
	if namespace == "" {
		namespace = "all"
	}

	// Convert "all" to empty string for Kubernetes API
	kubeNamespace := namespace
	if namespace == "all" {
		kubeNamespace = ""
	}

	// Get Kubernetes client
	clientset, err := getKubernetesClient()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"nodes": map[string]int{
				"ready": 0,
				"total": 0,
			},
			"unhealthyPods": 0,
			"avgCpu":        0.0,
			"avgMemory":     0.0,
		})
		return
	}

	// Fetch nodes (always cluster-wide)
	nodeList, err := clientset.CoreV1().Nodes().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"nodes": map[string]int{
				"ready": 0,
				"total": 0,
			},
			"unhealthyPods": 0,
			"avgCpu":        0.0,
			"avgMemory":     0.0,
		})
		return
	}

	// Count ready nodes
	readyNodes := 0
	totalNodes := len(nodeList.Items)
	for _, node := range nodeList.Items {
		for _, condition := range node.Status.Conditions {
			if condition.Type == corev1.NodeReady && condition.Status == corev1.ConditionTrue {
				readyNodes++
				break
			}
		}
	}

	// Fetch pods (filtered by namespace if specified)
	podList, err := clientset.CoreV1().Pods(kubeNamespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"nodes": map[string]int{
				"ready": readyNodes,
				"total": totalNodes,
			},
			"unhealthyPods": 0,
			"avgCpu":        0.0,
			"avgMemory":     0.0,
		})
		return
	}

	// Count unhealthy pods
	unhealthyPods := 0
	for _, pod := range podList.Items {
		if !isPodHealthy(pod) {
			unhealthyPods++
		}
	}

	// Mock CPU and Memory metrics (real implementation would use metrics-server)
	// Using reasonable mock values for now
	avgCpu := 45.0
	avgMemory := 60.0

	// If no nodes, set metrics to 0
	if totalNodes == 0 {
		avgCpu = 0.0
		avgMemory = 0.0
	}

	// Build response
	response := map[string]interface{}{
		"nodes": map[string]int{
			"ready": readyNodes,
			"total": totalNodes,
		},
		"unhealthyPods": unhealthyPods,
		"avgCpu":        avgCpu,
		"avgMemory":     avgMemory,
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// isPodHealthy checks if a pod is healthy
func isPodHealthy(pod corev1.Pod) bool {
	// Pod is unhealthy if:
	// 1. Not in Running or Succeeded phase
	// 2. Has container restarts > 0
	// 3. Has failed container status

	phase := pod.Status.Phase
	if phase != corev1.PodRunning && phase != corev1.PodSucceeded {
		return false
	}

	// Check container statuses
	for _, containerStatus := range pod.Status.ContainerStatuses {
		// Check for restarts
		if containerStatus.RestartCount > 0 {
			return false
		}

		// Check if container is waiting or terminated
		if containerStatus.State.Waiting != nil || containerStatus.State.Terminated != nil {
			return false
		}

		// Check if not ready
		if !containerStatus.Ready {
			return false
		}
	}

	return true
}
