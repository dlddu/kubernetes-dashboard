package handlers

import (
	"context"
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
	if !requireMethod(w, r, http.MethodGet) {
		return
	}

	clientset, err := getKubernetesClient()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create Kubernetes client")
		return
	}

	metricsClient := getMetricsClientSafe()

	nodes, err := getNodesData(r.Context(), clientset, metricsClient)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch nodes data")
		return
	}

	writeJSON(w, http.StatusOK, nodes)
}

// getNodesData fetches nodes data from Kubernetes
func getNodesData(ctx context.Context, clientset *kubernetes.Clientset, metricsClient *metricsv.Clientset) ([]NodeDetailInfo, error) {
	nodeList, err := clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	podList, err := clientset.CoreV1().Pods("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	nodePodCount := make(map[string]int)
	for _, pod := range podList.Items {
		if pod.Spec.NodeName != "" {
			nodePodCount[pod.Spec.NodeName]++
		}
	}

	metricsMap := fetchNodeMetrics(ctx, metricsClient)

	nodesData := make([]NodeDetailInfo, 0, len(nodeList.Items))
	for _, node := range nodeList.Items {
		cpuPercent, memoryPercent := calculateNodeResourceUsage(node, metricsMap)

		nodesData = append(nodesData, NodeDetailInfo{
			Name:          node.Name,
			Status:        nodeStatusString(node),
			Role:          getNodeRole(node),
			CPUPercent:    cpuPercent,
			MemoryPercent: memoryPercent,
			PodCount:      nodePodCount[node.Name],
		})
	}

	return nodesData, nil
}
