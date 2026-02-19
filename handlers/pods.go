package handlers

import (
	"context"
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

// podFilter is a predicate used to select which pods to include in results.
type podFilter func(corev1.Pod) bool

// UnhealthyPodsHandler handles the GET /api/pods/unhealthy endpoint
func UnhealthyPodsHandler(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodGet) {
		return
	}

	namespace := r.URL.Query().Get("ns")

	clientset, err := getKubernetesClient()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create Kubernetes client")
		return
	}

	unhealthyPods, err := listPods(r.Context(), clientset, namespace, func(pod corev1.Pod) bool {
		return !isPodHealthy(pod)
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch pods data")
		return
	}

	writeJSON(w, http.StatusOK, unhealthyPods)
}

// AllPodsHandler handles the GET /api/pods/all endpoint
func AllPodsHandler(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodGet) {
		return
	}

	namespace := r.URL.Query().Get("ns")

	clientset, err := getKubernetesClient()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create Kubernetes client")
		return
	}

	allPods, err := listPods(r.Context(), clientset, namespace, nil)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch pods data")
		return
	}

	writeJSON(w, http.StatusOK, allPods)
}

// listPods fetches pods from Kubernetes and converts them to PodDetails.
// If filter is non-nil, only pods matching the filter are included.
func listPods(ctx context.Context, clientset *kubernetes.Clientset, namespace string, filter podFilter) ([]PodDetails, error) {
	podList, err := clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	pods := make([]PodDetails, 0, len(podList.Items))
	for _, pod := range podList.Items {
		if filter != nil && !filter(pod) {
			continue
		}

		nodeName := pod.Spec.NodeName
		if nodeName == "" {
			nodeName = "Pending"
		}

		pods = append(pods, PodDetails{
			Name:      pod.Name,
			Namespace: pod.Namespace,
			Status:    getPodStatus(pod),
			Restarts:  getPodRestartCount(pod),
			Node:      nodeName,
			Age:       formatPodAge(pod.CreationTimestamp.Time),
		})
	}

	return pods, nil
}

// getPodRestartCount calculates the total restart count for all containers in a pod
func getPodRestartCount(pod corev1.Pod) int32 {
	var totalRestarts int32
	for _, containerStatus := range pod.Status.ContainerStatuses {
		totalRestarts += containerStatus.RestartCount
	}
	return totalRestarts
}

// formatPodAge formats the pod age in a human-readable format (e.g., "2h30m", "3d", "45s")
func formatPodAge(creationTime time.Time) string {
	age := time.Since(creationTime)

	days := int(age.Hours() / 24)
	hours := int(age.Hours()) % 24
	minutes := int(age.Minutes()) % 60
	seconds := int(age.Seconds()) % 60

	return formatDuration(days, hours, minutes, seconds)
}

// formatDuration formats duration components into a human-readable string.
func formatDuration(days, hours, minutes, seconds int) string {
	if days > 0 {
		if hours > 0 {
			return fmt.Sprintf("%dd%dh", days, hours)
		}
		return fmt.Sprintf("%dd", days)
	}

	if hours > 0 {
		if minutes > 0 {
			return fmt.Sprintf("%dh%dm", hours, minutes)
		}
		return fmt.Sprintf("%dh", hours)
	}

	if minutes > 0 {
		return fmt.Sprintf("%dm", minutes)
	}

	if seconds > 0 {
		return fmt.Sprintf("%ds", seconds)
	}

	return "0s"
}
