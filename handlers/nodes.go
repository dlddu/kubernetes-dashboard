package handlers

import (
	"context"
	"net/http"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	metricsv "k8s.io/metrics/pkg/client/clientset/versioned"
)

// NodeDetailInfo extends NodeInfo with pod count for the /api/nodes endpoint.
type NodeDetailInfo struct {
	NodeInfo
	PodCount int `json:"podCount"`
}

// NodesHandler handles the /api/nodes endpoint
var NodesHandler = handleGet("Failed to fetch nodes data", func(r *http.Request) (interface{}, error) {
	clientset, err := getKubernetesClient()
	if err != nil {
		return nil, err
	}
	metricsClient := getMetricsClientSafe()
	return getNodesData(r.Context(), clientset, metricsClient)
})

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
		nodesData = append(nodesData, NodeDetailInfo{
			NodeInfo: buildNodeInfo(node, metricsMap),
			PodCount: nodePodCount[node.Name],
		})
	}

	return nodesData, nil
}
