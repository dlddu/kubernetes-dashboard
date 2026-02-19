package handlers

import (
	"context"
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
var OverviewHandler = handleGet("Failed to fetch overview data", func(r *http.Request) (interface{}, error) {
	clientset, err := getKubernetesClient()
	if err != nil {
		return nil, err
	}
	metricsClient := getMetricsClientSafe()
	namespace := r.URL.Query().Get("ns")
	return getOverviewData(r.Context(), clientset, metricsClient, namespace)
})

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

// buildNodesList creates a list of NodeInfo from Kubernetes nodes.
func buildNodesList(nodes []corev1.Node, metricsMap map[string]nodeMetricsUsage) []NodeInfo {
	nodesList := make([]NodeInfo, 0, len(nodes))
	for _, node := range nodes {
		nodesList = append(nodesList, buildNodeInfo(node, metricsMap))
	}
	return nodesList
}
