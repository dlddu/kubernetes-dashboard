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

// UnhealthyPodDetails represents detailed information about an unhealthy pod
type UnhealthyPodDetails struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Status    string `json:"status"`
	Restarts  int32  `json:"restarts"`
	Node      string `json:"node"`
	Age       string `json:"age"`
}

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

	unhealthyPods, err := getUnhealthyPodsData(clientset, namespace)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch pods data")
		return
	}

	writeJSON(w, http.StatusOK, unhealthyPods)
}

// getUnhealthyPodsData fetches unhealthy pods data from Kubernetes
func getUnhealthyPodsData(clientset *kubernetes.Clientset, namespace string) ([]UnhealthyPodDetails, error) {
	ctx := context.Background()

	podList, err := clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	unhealthyPods := make([]UnhealthyPodDetails, 0)
	for _, pod := range podList.Items {
		if !isPodHealthy(pod) {
			nodeName := pod.Spec.NodeName
			if nodeName == "" {
				nodeName = "Pending"
			}

			unhealthyPods = append(unhealthyPods, UnhealthyPodDetails{
				Name:      pod.Name,
				Namespace: pod.Namespace,
				Status:    getPodStatus(pod),
				Restarts:  getPodRestartCount(pod),
				Node:      nodeName,
				Age:       formatPodAge(pod.CreationTimestamp.Time),
			})
		}
	}

	return unhealthyPods, nil
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

	allPods, err := getAllPodsData(clientset, namespace)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch pods data")
		return
	}

	writeJSON(w, http.StatusOK, allPods)
}

// getAllPodsData fetches all pods data from Kubernetes
func getAllPodsData(clientset *kubernetes.Clientset, namespace string) ([]UnhealthyPodDetails, error) {
	ctx := context.Background()

	podList, err := clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	allPods := make([]UnhealthyPodDetails, 0)
	for _, pod := range podList.Items {
		nodeName := pod.Spec.NodeName
		if nodeName == "" {
			nodeName = "Pending"
		}

		allPods = append(allPods, UnhealthyPodDetails{
			Name:      pod.Name,
			Namespace: pod.Namespace,
			Status:    getPodStatus(pod),
			Restarts:  getPodRestartCount(pod),
			Node:      nodeName,
			Age:       formatPodAge(pod.CreationTimestamp.Time),
		})
	}

	return allPods, nil
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
	if days > 0 {
		return formatDuration(days, int(age.Hours())%24, int(age.Minutes())%60)
	}

	hours := int(age.Hours())
	if hours > 0 {
		return formatDuration(0, hours, int(age.Minutes())%60)
	}

	minutes := int(age.Minutes())
	if minutes > 0 {
		return formatDuration(0, 0, minutes)
	}

	seconds := int(age.Seconds())
	return formatDuration(0, 0, 0, seconds)
}

// formatDuration formats duration components into a string
func formatDuration(days, hours, minutes int, seconds ...int) string {
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

	if len(seconds) > 0 && seconds[0] > 0 {
		return fmt.Sprintf("%ds", seconds[0])
	}

	return "0s"
}
