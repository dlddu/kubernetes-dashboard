package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

// NodesResponse represents the node status
type NodesResponse struct {
	Ready int `json:"ready"`
	Total int `json:"total"`
}

// OverviewResponse represents the overview data
type OverviewResponse struct {
	Nodes            NodesResponse `json:"nodes"`
	UnhealthyPods    int           `json:"unhealthyPods"`
	AvgCpuPercent    float64       `json:"avgCpuPercent"`
	AvgMemoryPercent float64       `json:"avgMemoryPercent"`
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

	// Get namespace from query parameter
	namespace := r.URL.Query().Get("namespace")
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

	// Fetch overview data
	overview, err := getOverviewData(clientset, namespace)
	if err != nil {
		// If fetching fails, return 500
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch overview data"})
		return
	}

	// Send response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(overview)
}

// getOverviewData fetches overview data from Kubernetes
func getOverviewData(clientset *kubernetes.Clientset, namespace string) (*OverviewResponse, error) {
	ctx := context.Background()

	// Fetch nodes
	nodeList, err := clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	// Calculate ready nodes
	readyNodes := 0
	totalNodes := len(nodeList.Items)
	for _, node := range nodeList.Items {
		if isNodeReady(node) {
			readyNodes++
		}
	}

	// Fetch pods
	podList, err := clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	// Calculate unhealthy pods
	unhealthyPods := 0
	for _, pod := range podList.Items {
		if !isPodHealthy(pod) {
			unhealthyPods++
		}
	}

	// Calculate CPU and Memory averages
	avgCpu, avgMemory := calculateResourceUsage(nodeList.Items)

	overview := &OverviewResponse{
		Nodes: NodesResponse{
			Ready: readyNodes,
			Total: totalNodes,
		},
		UnhealthyPods:    unhealthyPods,
		AvgCpuPercent:    avgCpu,
		AvgMemoryPercent: avgMemory,
	}

	return overview, nil
}

// isNodeReady checks if a node is ready
func isNodeReady(node corev1.Node) bool {
	for _, condition := range node.Status.Conditions {
		if condition.Type == corev1.NodeReady {
			return condition.Status == corev1.ConditionTrue
		}
	}
	return false
}

// isPodHealthy checks if a pod is healthy
func isPodHealthy(pod corev1.Pod) bool {
	// A pod is healthy if it's in Running phase
	return pod.Status.Phase == corev1.PodRunning
}

// calculateResourceUsage calculates average CPU and memory usage
func calculateResourceUsage(nodes []corev1.Node) (float64, float64) {
	if len(nodes) == 0 {
		return 0, 0
	}

	totalCpuUsed := resource.NewQuantity(0, resource.DecimalSI)
	totalCpuCapacity := resource.NewQuantity(0, resource.DecimalSI)
	totalMemoryUsed := resource.NewQuantity(0, resource.DecimalSI)
	totalMemoryCapacity := resource.NewQuantity(0, resource.DecimalSI)

	for _, node := range nodes {
		// Get capacity
		cpuCapacity := node.Status.Capacity[corev1.ResourceCPU]
		memCapacity := node.Status.Capacity[corev1.ResourceMemory]

		totalCpuCapacity.Add(cpuCapacity)
		totalMemoryCapacity.Add(memCapacity)

		// Get allocatable as a proxy for usage (simplified)
		cpuAllocatable := node.Status.Allocatable[corev1.ResourceCPU]
		memAllocatable := node.Status.Allocatable[corev1.ResourceMemory]

		// Calculate used = capacity - allocatable
		cpuUsed := cpuCapacity.DeepCopy()
		cpuUsed.Sub(cpuAllocatable)
		totalCpuUsed.Add(cpuUsed)

		memUsed := memCapacity.DeepCopy()
		memUsed.Sub(memAllocatable)
		totalMemoryUsed.Add(memUsed)
	}

	// Calculate percentages
	var cpuPercent, memoryPercent float64

	if totalCpuCapacity.MilliValue() > 0 {
		cpuPercent = float64(totalCpuUsed.MilliValue()) / float64(totalCpuCapacity.MilliValue()) * 100
	}

	if totalMemoryCapacity.Value() > 0 {
		memoryPercent = float64(totalMemoryUsed.Value()) / float64(totalMemoryCapacity.Value()) * 100
	}

	// Ensure values are between 0 and 100
	if cpuPercent < 0 {
		cpuPercent = 0
	}
	if cpuPercent > 100 {
		cpuPercent = 100
	}
	if memoryPercent < 0 {
		memoryPercent = 0
	}
	if memoryPercent > 100 {
		memoryPercent = 100
	}

	return cpuPercent, memoryPercent
}
