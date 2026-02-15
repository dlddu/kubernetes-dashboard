package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	metricsv "k8s.io/metrics/pkg/client/clientset/versioned"
)

// NodeDetailInfo represents detailed information about a node including pod count
type NodeDetailInfo struct {
	Name          string  `json:"name"`
	Status        string  `json:"status"`
	Role          string  `json:"role"`
	CPUPercent    float64 `json:"cpuPercent"`
	MemoryPercent float64 `json:"memoryPercent"`
	PodCount      int     `json:"podCount"`
}

// NodesHandler handles the /api/nodes endpoint
func NodesHandler(w http.ResponseWriter, r *http.Request) {
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
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create Kubernetes client"})
		return
	}

	// Attempt to create metrics client (nil on failure — graceful fallback)
	metricsClient, _ := getMetricsClient()

	// Fetch nodes data
	nodes, err := getNodesData(clientset, metricsClient)
	if err != nil {
		// If fetching fails, return 500
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch nodes data"})
		return
	}

	// Send response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(nodes)
}

// getNodesData fetches nodes data from Kubernetes
func getNodesData(clientset *kubernetes.Clientset, metricsClient *metricsv.Clientset) ([]NodeDetailInfo, error) {
	ctx := context.Background()

	// Fetch nodes
	nodeList, err := clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	// Fetch all pods to count pods per node
	podList, err := clientset.CoreV1().Pods("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	// Build a map of node name -> pod count
	nodePodCount := make(map[string]int)
	for _, pod := range podList.Items {
		if pod.Spec.NodeName != "" {
			nodePodCount[pod.Spec.NodeName]++
		}
	}

	// Fetch real metrics from metrics-server (nil if unavailable)
	metricsMap := fetchNodeMetrics(metricsClient)

	// Build nodes list with detailed information
	nodesData := make([]NodeDetailInfo, 0, len(nodeList.Items))

	for _, node := range nodeList.Items {
		// Determine node status
		status := "NotReady"
		if isNodeReady(node) {
			status = "Ready"
		}

		// Calculate CPU and memory percentages for this node
		cpuPercent, memoryPercent := calculateNodeResourceUsage(node, metricsMap)

		// Get pod count for this node
		podCount := nodePodCount[node.Name]

		// Extract node role from labels
		role := getNodeRole(node)

		nodesData = append(nodesData, NodeDetailInfo{
			Name:          node.Name,
			Status:        status,
			Role:          role,
			CPUPercent:    cpuPercent,
			MemoryPercent: memoryPercent,
			PodCount:      podCount,
		})
	}

	return nodesData, nil
}
