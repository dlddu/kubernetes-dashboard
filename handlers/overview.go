package handlers

import (
	"context"
	"log"
	"net/http"
	"strings"

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
	Role          string  `json:"role"`
	CpuPercent    float64 `json:"cpuPercent"`
	MemoryPercent float64 `json:"memoryPercent"`
}

// OverviewResponse represents the overview data
type OverviewResponse struct {
	Nodes             NodesResponse      `json:"nodes"`
	UnhealthyPods     int                `json:"unhealthyPods"`
	UnhealthyPodsList []UnhealthyPodInfo `json:"unhealthyPodsList,omitempty"`
	AvgCpuPercent     float64            `json:"avgCpuPercent"`
	AvgMemoryPercent  float64            `json:"avgMemoryPercent"`
	NodesList         []NodeInfo         `json:"nodesList,omitempty"`
}

// OverviewHandler handles the /api/overview endpoint
func OverviewHandler(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodGet) {
		return
	}

	namespace := r.URL.Query().Get("namespace")

	clientset, err := getKubernetesClient()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create Kubernetes client")
		return
	}

	metricsClient, err := getMetricsClient()
	if err != nil {
		log.Printf("metrics client unavailable, falling back to capacity-allocatable: %v", err)
	}

	overview, err := getOverviewData(r.Context(), clientset, metricsClient, namespace)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch overview data")
		return
	}

	writeJSON(w, http.StatusOK, overview)
}

// getOverviewData fetches overview data from Kubernetes
func getOverviewData(ctx context.Context, clientset *kubernetes.Clientset, metricsClient *metricsv.Clientset, namespace string) (*OverviewResponse, error) {

	nodeList, err := clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	readyNodes := 0
	totalNodes := len(nodeList.Items)
	for _, node := range nodeList.Items {
		if isNodeReady(node) {
			readyNodes++
		}
	}

	podList, err := clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	unhealthyPods := 0
	var unhealthyPodsList []UnhealthyPodInfo
	for _, pod := range podList.Items {
		if !isPodHealthy(pod) {
			unhealthyPods++
			unhealthyPodsList = append(unhealthyPodsList, UnhealthyPodInfo{
				Name:      pod.Name,
				Namespace: pod.Namespace,
				Status:    getPodStatus(pod),
			})
		}
	}

	metricsMap := fetchNodeMetrics(ctx, metricsClient)
	avgCpu, avgMemory := calculateResourceUsage(nodeList.Items, metricsMap)
	nodesList := buildNodesList(nodeList.Items, metricsMap)

	return &OverviewResponse{
		Nodes: NodesResponse{
			Ready: readyNodes,
			Total: totalNodes,
		},
		UnhealthyPods:     unhealthyPods,
		UnhealthyPodsList: unhealthyPodsList,
		AvgCpuPercent:     avgCpu,
		AvgMemoryPercent:  avgMemory,
		NodesList:         nodesList,
	}, nil
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

// isPodHealthy checks if a pod is healthy.
// A pod is considered unhealthy if:
//   - It's not in Running phase (except Succeeded), OR
//   - It has container issues (Waiting or Terminated state)
func isPodHealthy(pod corev1.Pod) bool {
	if pod.Status.Phase == corev1.PodSucceeded {
		return true
	}

	for _, containerStatus := range pod.Status.ContainerStatuses {
		if containerStatus.State.Waiting != nil {
			return false
		}
		if containerStatus.State.Terminated != nil {
			return false
		}
	}

	return pod.Status.Phase == corev1.PodRunning
}

// getPodStatus returns the detailed status string for a pod.
// Checks container statuses first for more specific information
// (e.g., ImagePullBackOff, CrashLoopBackOff), then falls back to pod phase.
func getPodStatus(pod corev1.Pod) string {
	for _, containerStatus := range pod.Status.ContainerStatuses {
		if containerStatus.State.Waiting != nil {
			if reason := containerStatus.State.Waiting.Reason; reason != "" {
				return reason
			}
		}
		if containerStatus.State.Terminated != nil {
			if reason := containerStatus.State.Terminated.Reason; reason != "" {
				return reason
			}
		}
	}

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

	return string(pod.Status.Phase)
}

// nodeMetricsUsage holds the actual CPU and memory usage for a node.
type nodeMetricsUsage struct {
	cpuMillis   int64
	memoryBytes int64
}

// fetchNodeMetrics queries the metrics-server for actual node resource usage.
// Returns a map of node name to usage, or nil if metrics-server is unavailable.
func fetchNodeMetrics(ctx context.Context, metricsClient *metricsv.Clientset) map[string]nodeMetricsUsage {
	if metricsClient == nil {
		return nil
	}

	nodeMetricsList, err := metricsClient.MetricsV1beta1().NodeMetricses().List(
		ctx, metav1.ListOptions{},
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

// nodeResourceUsage holds raw CPU (millicores) and memory (bytes) usage and capacity for a node.
type nodeResourceUsage struct {
	cpuUsedMilli      int64
	cpuCapacityMilli  int64
	memUsedBytes      int64
	memCapacityBytes  int64
}

// getNodeResourceUsage resolves the raw CPU and memory usage for a single node.
// Uses real metrics from metrics-server when available, falls back to capacity minus allocatable.
func getNodeResourceUsage(node corev1.Node, metricsMap map[string]nodeMetricsUsage) nodeResourceUsage {
	cpuCapacity := node.Status.Capacity[corev1.ResourceCPU]
	memCapacity := node.Status.Capacity[corev1.ResourceMemory]

	var cpuUsedMilli int64
	var memUsedBytes int64

	if usage, ok := metricsMap[node.Name]; metricsMap != nil && ok {
		cpuUsedMilli = usage.cpuMillis
		memUsedBytes = usage.memoryBytes
	} else {
		cpuAllocatable := node.Status.Allocatable[corev1.ResourceCPU]
		memAllocatable := node.Status.Allocatable[corev1.ResourceMemory]
		cpuUsed := cpuCapacity.DeepCopy()
		cpuUsed.Sub(cpuAllocatable)
		cpuUsedMilli = cpuUsed.MilliValue()
		memUsed := memCapacity.DeepCopy()
		memUsed.Sub(memAllocatable)
		memUsedBytes = memUsed.Value()
	}

	return nodeResourceUsage{
		cpuUsedMilli:     cpuUsedMilli,
		cpuCapacityMilli: cpuCapacity.MilliValue(),
		memUsedBytes:     memUsedBytes,
		memCapacityBytes: memCapacity.Value(),
	}
}

// calculateNodeResourceUsage calculates CPU and memory usage percentages for a single node.
// Uses real metrics from metrics-server when available, falls back to capacity-allocatable.
func calculateNodeResourceUsage(node corev1.Node, metricsMap map[string]nodeMetricsUsage) (float64, float64) {
	usage := getNodeResourceUsage(node, metricsMap)

	var cpuPercent, memoryPercent float64
	if usage.cpuCapacityMilli > 0 {
		cpuPercent = float64(usage.cpuUsedMilli) / float64(usage.cpuCapacityMilli) * 100
	}
	if usage.memCapacityBytes > 0 {
		memoryPercent = float64(usage.memUsedBytes) / float64(usage.memCapacityBytes) * 100
	}

	return clamp(cpuPercent, 0, 100), clamp(memoryPercent, 0, 100)
}

// calculateResourceUsage calculates average CPU and memory usage across all nodes,
// weighted by each node's capacity. Uses real metrics from metrics-server when
// available, falls back to capacity-allocatable.
func calculateResourceUsage(nodes []corev1.Node, metricsMap map[string]nodeMetricsUsage) (float64, float64) {
	if len(nodes) == 0 {
		return 0, 0
	}

	var totalCpuUsedMilli, totalCpuCapacityMilli int64
	var totalMemUsedBytes, totalMemCapacityBytes int64

	for _, node := range nodes {
		usage := getNodeResourceUsage(node, metricsMap)
		totalCpuUsedMilli += usage.cpuUsedMilli
		totalCpuCapacityMilli += usage.cpuCapacityMilli
		totalMemUsedBytes += usage.memUsedBytes
		totalMemCapacityBytes += usage.memCapacityBytes
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

// nodeStatusString returns "Ready" or "NotReady" based on node condition.
func nodeStatusString(node corev1.Node) string {
	if isNodeReady(node) {
		return "Ready"
	}
	return "NotReady"
}

// buildNodesList creates a list of NodeInfo from Kubernetes nodes
func buildNodesList(nodes []corev1.Node, metricsMap map[string]nodeMetricsUsage) []NodeInfo {
	nodesList := make([]NodeInfo, 0, len(nodes))

	for _, node := range nodes {
		cpuPercent, memoryPercent := calculateNodeResourceUsage(node, metricsMap)

		nodesList = append(nodesList, NodeInfo{
			Name:          node.Name,
			Status:        nodeStatusString(node),
			Role:          getNodeRole(node),
			CpuPercent:    cpuPercent,
			MemoryPercent: memoryPercent,
		})
	}

	return nodesList
}
