package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	metricsv "k8s.io/metrics/pkg/client/clientset/versioned"
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

	// Attempt to create metrics client (nil on failure — graceful fallback)
	metricsClient, _ := getMetricsClient()

	// Fetch overview data
	overview, err := getOverviewData(clientset, metricsClient, namespace)
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
func getOverviewData(clientset *kubernetes.Clientset, metricsClient *metricsv.Clientset, namespace string) (*OverviewResponse, error) {
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

	// Fetch real metrics from metrics-server (nil if unavailable)
	metricsMap := fetchNodeMetrics(metricsClient)

	// Calculate CPU and Memory averages
	avgCpu, avgMemory := calculateResourceUsage(nodeList.Items, metricsMap)

	// Build nodes list with detailed information
	nodesList := buildNodesList(nodeList.Items, metricsMap)

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

// nodeMetricsUsage holds the actual CPU and memory usage for a node.
type nodeMetricsUsage struct {
	cpuMillis   int64
	memoryBytes int64
}

// fetchNodeMetrics queries the metrics-server for actual node resource usage.
// Returns a map of node name to usage, or nil if metrics-server is unavailable.
func fetchNodeMetrics(metricsClient *metricsv.Clientset) map[string]nodeMetricsUsage {
	if metricsClient == nil {
		return nil
	}

	nodeMetricsList, err := metricsClient.MetricsV1beta1().NodeMetricses().List(
		context.Background(), metav1.ListOptions{},
	)
	if err != nil {
		log.Printf("metrics-server unavailable, falling back to capacity-allocatable: %v", err)
		return nil
	}

	result := make(map[string]nodeMetricsUsage, len(nodeMetricsList.Items))
	for _, nm := range nodeMetricsList.Items {
		cpu := nm.Usage[corev1.ResourceCPU]
		mem := nm.Usage[corev1.ResourceMemory]
		result[nm.Name] = nodeMetricsUsage{
			cpuMillis:   cpu.MilliValue(),
			memoryBytes: mem.Value(),
		}
	}
	return result
}

// clamp constrains a value between min and max.
func clamp(val, min, max float64) float64 {
	if val < min {
		return min
	}
	if val > max {
		return max
	}
	return val
}

// calculateResourceUsage calculates average CPU and memory usage across all nodes.
// Uses real metrics from metrics-server when available, falls back to capacity-allocatable.
func calculateResourceUsage(nodes []corev1.Node, metricsMap map[string]nodeMetricsUsage) (float64, float64) {
	if len(nodes) == 0 {
		return 0, 0
	}

	var totalCpuUsedMilli int64
	var totalCpuCapacityMilli int64
	var totalMemUsedBytes int64
	var totalMemCapacityBytes int64

	for _, node := range nodes {
		cpuCapacity := node.Status.Capacity[corev1.ResourceCPU]
		memCapacity := node.Status.Capacity[corev1.ResourceMemory]
		totalCpuCapacityMilli += cpuCapacity.MilliValue()
		totalMemCapacityBytes += memCapacity.Value()

		if usage, ok := metricsMap[node.Name]; metricsMap != nil && ok {
			// Use real metrics from metrics-server
			totalCpuUsedMilli += usage.cpuMillis
			totalMemUsedBytes += usage.memoryBytes
		} else {
			// Fallback: capacity - allocatable
			cpuAllocatable := node.Status.Allocatable[corev1.ResourceCPU]
			memAllocatable := node.Status.Allocatable[corev1.ResourceMemory]
			cpuUsed := cpuCapacity.DeepCopy()
			cpuUsed.Sub(cpuAllocatable)
			totalCpuUsedMilli += cpuUsed.MilliValue()
			memUsed := memCapacity.DeepCopy()
			memUsed.Sub(memAllocatable)
			totalMemUsedBytes += memUsed.Value()
		}
	}

	var cpuPercent, memoryPercent float64
	if totalCpuCapacityMilli > 0 {
		cpuPercent = float64(totalCpuUsedMilli) / float64(totalCpuCapacityMilli) * 100
	}
	if totalMemCapacityBytes > 0 {
		memoryPercent = float64(totalMemUsedBytes) / float64(totalMemCapacityBytes) * 100
	}

	return clamp(cpuPercent, 0, 100), clamp(memoryPercent, 0, 100)
}

// buildNodesList creates a list of NodeInfo from Kubernetes nodes
func buildNodesList(nodes []corev1.Node, metricsMap map[string]nodeMetricsUsage) []NodeInfo {
	nodesList := make([]NodeInfo, 0, len(nodes))

	for _, node := range nodes {
		// Determine node status
		status := "NotReady"
		if isNodeReady(node) {
			status = "Ready"
		}

		// Calculate CPU and memory percentages for this node
		cpuPercent, memoryPercent := calculateNodeResourceUsage(node, metricsMap)

		nodesList = append(nodesList, NodeInfo{
			Name:          node.Name,
			Status:        status,
			CpuPercent:    cpuPercent,
			MemoryPercent: memoryPercent,
		})
	}

	return nodesList
}

// calculateNodeResourceUsage calculates CPU and memory usage for a single node.
// Uses real metrics from metrics-server when available, falls back to capacity-allocatable.
func calculateNodeResourceUsage(node corev1.Node, metricsMap map[string]nodeMetricsUsage) (float64, float64) {
	cpuCapacity := node.Status.Capacity[corev1.ResourceCPU]
	memCapacity := node.Status.Capacity[corev1.ResourceMemory]

	var cpuUsedMilli int64
	var memUsedBytes int64

	if usage, ok := metricsMap[node.Name]; metricsMap != nil && ok {
		// Use real metrics from metrics-server
		cpuUsedMilli = usage.cpuMillis
		memUsedBytes = usage.memoryBytes
	} else {
		// Fallback: capacity - allocatable
		cpuAllocatable := node.Status.Allocatable[corev1.ResourceCPU]
		memAllocatable := node.Status.Allocatable[corev1.ResourceMemory]
		cpuUsed := cpuCapacity.DeepCopy()
		cpuUsed.Sub(cpuAllocatable)
		cpuUsedMilli = cpuUsed.MilliValue()
		memUsed := memCapacity.DeepCopy()
		memUsed.Sub(memAllocatable)
		memUsedBytes = memUsed.Value()
	}

	var cpuPercent, memoryPercent float64
	if cpuCapacity.MilliValue() > 0 {
		cpuPercent = float64(cpuUsedMilli) / float64(cpuCapacity.MilliValue()) * 100
	}
	if memCapacity.Value() > 0 {
		memoryPercent = float64(memUsedBytes) / float64(memCapacity.Value()) * 100
	}

	return clamp(cpuPercent, 0, 100), clamp(memoryPercent, 0, 100)
}
