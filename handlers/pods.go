package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

// PodDetails represents detailed information about a pod
type PodDetails struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Status    string `json:"status"`
	Restarts  int32  `json:"restarts"`
	Node      string `json:"node"`
	Age       string `json:"age"`
}

// AllPodsHandler handles the GET /api/pods endpoint
func AllPodsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	namespace := r.URL.Query().Get("ns")

	clientset, err := getKubernetesClient()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create Kubernetes client"})
		return
	}

	pods, err := getAllPodsData(clientset, namespace)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch pods data"})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(pods)
}

// getAllPodsData fetches all pods data from Kubernetes
func getAllPodsData(clientset *kubernetes.Clientset, namespace string) ([]PodDetails, error) {
	ctx := context.Background()

	podList, err := clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	pods := make([]PodDetails, 0, len(podList.Items))

	for _, pod := range podList.Items {
		status := getPodStatusDetailed(pod)
		restarts := getPodRestartCount(pod)
		nodeName := pod.Spec.NodeName
		if nodeName == "" {
			nodeName = "Pending"
		}
		age := formatPodAge(pod.CreationTimestamp.Time)

		pods = append(pods, PodDetails{
			Name:      pod.Name,
			Namespace: pod.Namespace,
			Status:    status,
			Restarts:  restarts,
			Node:      nodeName,
			Age:       age,
		})
	}

	return pods, nil
}

// UnhealthyPodsHandler handles the GET /api/pods/unhealthy endpoint
func UnhealthyPodsHandler(w http.ResponseWriter, r *http.Request) {
	// Only allow GET method
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Set content type
	w.Header().Set("Content-Type", "application/json")

	// Get namespace from query parameter
	namespace := r.URL.Query().Get("ns")
	if namespace == "" {
		namespace = "" // Empty string means all namespaces
	}

	// Get Kubernetes client
	clientset, err := getKubernetesClient()
	if err != nil {
		// If client creation fails, return 500
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create Kubernetes client"})
		return
	}

	// Fetch unhealthy pods data
	unhealthyPods, err := getUnhealthyPodsData(clientset, namespace)
	if err != nil {
		// If fetching fails, return 500
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch pods data"})
		return
	}

	// Send response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(unhealthyPods)
}

// getUnhealthyPodsData fetches unhealthy pods data from Kubernetes
func getUnhealthyPodsData(clientset *kubernetes.Clientset, namespace string) ([]PodDetails, error) {
	ctx := context.Background()

	// Fetch pods
	podList, err := clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	// Build unhealthy pods list with detailed information
	unhealthyPods := make([]PodDetails, 0)

	for _, pod := range podList.Items {
		if !isPodHealthyDetailed(pod) {
			// Get pod status
			status := getPodStatusDetailed(pod)

			// Get restart count
			restarts := getPodRestartCount(pod)

			// Get node name
			nodeName := pod.Spec.NodeName
			if nodeName == "" {
				nodeName = "Pending"
			}

			// Get pod age
			age := formatPodAge(pod.CreationTimestamp.Time)

			unhealthyPods = append(unhealthyPods, PodDetails{
				Name:      pod.Name,
				Namespace: pod.Namespace,
				Status:    status,
				Restarts:  restarts,
				Node:      nodeName,
				Age:       age,
			})
		}
	}

	return unhealthyPods, nil
}

// isPodHealthyDetailed checks if a pod is healthy
// A pod is considered unhealthy if:
// - It's not in Running phase (except Succeeded), OR
// - It has container issues (Waiting or Terminated state)
func isPodHealthyDetailed(pod corev1.Pod) bool {
	// Succeeded pods are considered healthy (completed jobs)
	if pod.Status.Phase == corev1.PodSucceeded {
		return true
	}

	// Check for container issues first (e.g., ImagePullBackOff, CrashLoopBackOff)
	for _, containerStatus := range pod.Status.ContainerStatuses {
		// Container is waiting (e.g., ImagePullBackOff, CrashLoopBackOff)
		if containerStatus.State.Waiting != nil {
			return false
		}
		// Container is terminated
		if containerStatus.State.Terminated != nil {
			return false
		}
	}

	// If pod is not running and has no container status issues, it's unhealthy
	if pod.Status.Phase != corev1.PodRunning {
		return false
	}

	return true
}

// getPodStatusDetailed returns the detailed status string for a pod
func getPodStatusDetailed(pod corev1.Pod) string {
	// Check container statuses first for more detailed information
	// This ensures we catch specific issues like ImagePullBackOff, CrashLoopBackOff, etc.
	for _, containerStatus := range pod.Status.ContainerStatuses {
		if containerStatus.State.Waiting != nil {
			reason := containerStatus.State.Waiting.Reason
			if reason != "" {
				return reason
			}
		}
		if containerStatus.State.Terminated != nil {
			reason := containerStatus.State.Terminated.Reason
			if reason != "" {
				return reason
			}
		}
	}

	// If no container status reason found, check pod phase
	if pod.Status.Phase == corev1.PodSucceeded {
		return "Succeeded"
	}
	if pod.Status.Phase == corev1.PodFailed {
		return "Failed"
	}
	if pod.Status.Phase == corev1.PodUnknown {
		return "Unknown"
	}
	if pod.Status.Phase == corev1.PodPending {
		return "Pending"
	}

	// Return phase as default
	return string(pod.Status.Phase)
}

// getPodRestartCount calculates the total restart count for all containers in a pod
func getPodRestartCount(pod corev1.Pod) int32 {
	var totalRestarts int32 = 0

	for _, containerStatus := range pod.Status.ContainerStatuses {
		totalRestarts += containerStatus.RestartCount
	}

	return totalRestarts
}

// formatPodAge formats the pod age in a human-readable format (e.g., "2h30m", "3d", "45s")
func formatPodAge(creationTime time.Time) string {
	age := time.Since(creationTime)

	// Days
	days := int(age.Hours() / 24)
	if days > 0 {
		return formatDuration(days, int(age.Hours())%24, int(age.Minutes())%60)
	}

	// Hours
	hours := int(age.Hours())
	if hours > 0 {
		return formatDuration(0, hours, int(age.Minutes())%60)
	}

	// Minutes
	minutes := int(age.Minutes())
	if minutes > 0 {
		return formatDuration(0, 0, minutes)
	}

	// Seconds
	seconds := int(age.Seconds())
	return formatDuration(0, 0, 0, seconds)
}

// formatDuration formats duration components into a string
func formatDuration(days, hours, minutes int, seconds ...int) string {
	if days > 0 {
		if hours > 0 {
			return formatTimeString(days, "d", hours, "h")
		}
		return formatTimeString(days, "d")
	}

	if hours > 0 {
		if minutes > 0 {
			return formatTimeString(hours, "h", minutes, "m")
		}
		return formatTimeString(hours, "h")
	}

	if minutes > 0 {
		return formatTimeString(minutes, "m")
	}

	if len(seconds) > 0 && seconds[0] > 0 {
		return formatTimeString(seconds[0], "s")
	}

	return "0s"
}

// formatTimeString formats time values with their units
func formatTimeString(values ...interface{}) string {
	result := ""
	for i := 0; i < len(values); i += 2 {
		if i+1 < len(values) {
			result += formatValue(values[i]) + formatValue(values[i+1])
		}
	}
	return result
}

// formatValue converts a value to string
func formatValue(v interface{}) string {
	switch val := v.(type) {
	case int:
		return fmt.Sprintf("%d", val)
	case string:
		return val
	default:
		return ""
	}
}
