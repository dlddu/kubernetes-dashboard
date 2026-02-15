package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

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

// UnhealthyPodInfo represents detailed information about an unhealthy pod
type UnhealthyPodInfo struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Status    string `json:"status"`
}

// NodeInfo represents detailed information about a node
type NodeInfo struct {
	Name          string  `json:"name"`
	Status        string  `json:"status"`
	Role          string  `json:"role"`
	CpuPercent    float64 `json:"cpuPercent"`
	MemoryPercent float64 `json:"memoryPercent"`
}

// OverviewResponse represents the overview data
type OverviewResponse struct {
	Nodes             NodesResponse       `json:"nodes"`
	UnhealthyPods     int                 `json:"unhealthyPods"`
	UnhealthyPodsList []UnhealthyPodInfo  `json:"unhealthyPodsList,omitempty"`
	AvgCpuPercent     float64             `json:"avgCpuPercent"`
	AvgMemoryPercent  float64             `json:"avgMemoryPercent"`
	NodesList         []NodeInfo          `json:"nodesList,omitempty"`
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

	// Calculate unhealthy pods and collect their details
	unhealthyPods := 0
	var unhealthyPodsList []UnhealthyPodInfo
	for _, pod := range podList.Items {
		if !isPodHealthy(pod) {
			unhealthyPods++
			// Get pod status
			status := getPodStatus(pod)
			unhealthyPodsList = append(unhealthyPodsList, UnhealthyPodInfo{
				Name:      pod.Name,
				Namespace: pod.Namespace,
				Status:    status,
			})
		}
	}

	// Calculate CPU and Memory averages
	avgCpu, avgMemory := calculateResourceUsage(nodeList.Items)

	// Build nodes list with detailed information
	nodesList := buildNodesList(nodeList.Items)

	overview := &OverviewResponse{
		Nodes: NodesResponse{
			Ready: readyNodes,
			Total: totalNodes,
		},
		UnhealthyPods:     unhealthyPods,
		UnhealthyPodsList: unhealthyPodsList,
		AvgCpuPercent:     avgCpu,
		AvgMemoryPercent:  avgMemory,
		NodesList:         nodesList,
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

// getNodeRole extracts the role of a node from its labels.
// It checks two label formats:
//  1. "node.kubernetes.io/role" — the value is the role name
//  2. "node-role.kubernetes.io/<role>" — the key suffix is the role name
func getNodeRole(node corev1.Node) string {
	if role, exists := node.Labels["node.kubernetes.io/role"]; exists && role != "" {
		return role
	}

	const prefix = "node-role.kubernetes.io/"
	for key := range node.Labels {
		if strings.HasPrefix(key, prefix) {
			role := strings.TrimPrefix(key, prefix)
			if role != "" {
				return role
			}
		}
	}

	return ""
}

// isPodHealthy checks if a pod is healthy
// Uses the same logic as isPodHealthyDetailed to ensure consistency
// between Overview and Pods pages
func isPodHealthy(pod corev1.Pod) bool {
	// Succeeded pods are considered healthy (completed jobs)
	if pod.Status.Phase == corev1.PodSucceeded {
		return true
	}

	// Check for container issues (e.g., ImagePullBackOff, CrashLoopBackOff)
	for _, containerStatus := range pod.Status.ContainerStatuses {
		if containerStatus.State.Waiting != nil {
			return false
		}
		if containerStatus.State.Terminated != nil {
			return false
		}
	}

	// Pod is healthy if in Running phase
	return pod.Status.Phase == corev1.PodRunning
}

// getPodStatus returns the status string for a pod
func getPodStatus(pod corev1.Pod) string {
	// Check if pod is in a terminal state
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

	// Check container statuses for more detailed information
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

	// Return phase as default
	return string(pod.Status.Phase)
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

// buildNodesList creates a list of NodeInfo from Kubernetes nodes
func buildNodesList(nodes []corev1.Node) []NodeInfo {
	nodesList := make([]NodeInfo, 0, len(nodes))

	for _, node := range nodes {
		// Determine node status
		status := "NotReady"
		if isNodeReady(node) {
			status = "Ready"
		}

		// Calculate CPU and memory percentages for this node
		cpuPercent, memoryPercent := calculateNodeResourceUsage(node)

		// Extract node role from labels
		role := getNodeRole(node)

		nodesList = append(nodesList, NodeInfo{
			Name:          node.Name,
			Status:        status,
			Role:          role,
			CpuPercent:    cpuPercent,
			MemoryPercent: memoryPercent,
		})
	}

	return nodesList
}

// calculateNodeResourceUsage calculates CPU and memory usage for a single node
func calculateNodeResourceUsage(node corev1.Node) (float64, float64) {
	// Get capacity
	cpuCapacity := node.Status.Capacity[corev1.ResourceCPU]
	memCapacity := node.Status.Capacity[corev1.ResourceMemory]

	// Get allocatable
	cpuAllocatable := node.Status.Allocatable[corev1.ResourceCPU]
	memAllocatable := node.Status.Allocatable[corev1.ResourceMemory]

	// Calculate used = capacity - allocatable
	cpuUsed := cpuCapacity.DeepCopy()
	cpuUsed.Sub(cpuAllocatable)

	memUsed := memCapacity.DeepCopy()
	memUsed.Sub(memAllocatable)

	// Calculate percentages
	var cpuPercent, memoryPercent float64

	if cpuCapacity.MilliValue() > 0 {
		cpuPercent = float64(cpuUsed.MilliValue()) / float64(cpuCapacity.MilliValue()) * 100
	}

	if memCapacity.Value() > 0 {
		memoryPercent = float64(memUsed.Value()) / float64(memCapacity.Value()) * 100
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
