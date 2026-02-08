package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/metrics/pkg/client/clientset/versioned"
)

// OverviewResponse represents the response structure for /api/overview
type OverviewResponse struct {
	Nodes struct {
		Ready int `json:"ready"`
		Total int `json:"total"`
	} `json:"nodes"`
	UnhealthyPods int     `json:"unhealthyPods"`
	AverageCPU    float64 `json:"averageCpu"`
	AverageMemory float64 `json:"averageMemory"`
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

	// Get Kubernetes client
	clientset, err := getKubernetesClient()
	if err != nil {
		// If client creation fails, return 500
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(OverviewResponse{})
		return
	}

	// Get namespace from query parameter (optional)
	namespace := r.URL.Query().Get("namespace")
	if namespace == "" {
		namespace = metav1.NamespaceAll
	}

	// Fetch nodes
	nodeList, err := clientset.CoreV1().Nodes().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(OverviewResponse{})
		return
	}

	// Fetch pods
	podList, err := clientset.CoreV1().Pods(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(OverviewResponse{})
		return
	}

	// Calculate node statistics
	totalNodes := len(nodeList.Items)
	readyNodes := 0
	for _, node := range nodeList.Items {
		for _, condition := range node.Status.Conditions {
			if condition.Type == corev1.NodeReady && condition.Status == corev1.ConditionTrue {
				readyNodes++
				break
			}
		}
	}

	// Calculate unhealthy pods
	unhealthyPods := 0
	for _, pod := range podList.Items {
		if pod.Status.Phase != corev1.PodRunning && pod.Status.Phase != corev1.PodSucceeded {
			unhealthyPods++
		}
	}

	// Calculate average CPU and Memory usage from metrics
	avgCPU, avgMemory := getNodeMetrics(clientset)

	// Create response
	response := OverviewResponse{}
	response.Nodes.Ready = readyNodes
	response.Nodes.Total = totalNodes
	response.UnhealthyPods = unhealthyPods
	response.AverageCPU = avgCPU
	response.AverageMemory = avgMemory

	// Send response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// getNodeMetrics fetches and calculates average node metrics
func getNodeMetrics(clientset *kubernetes.Clientset) (float64, float64) {
	// Try to get metrics client
	config, err := rest.InClusterConfig()
	if err != nil {
		// Return zeros if metrics are not available
		return 0.0, 0.0
	}

	metricsClient, err := versioned.NewForConfig(config)
	if err != nil {
		return 0.0, 0.0
	}

	// Fetch node metrics
	nodeMetricsList, err := metricsClient.MetricsV1beta1().NodeMetricses().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		// Metrics API might not be available
		return 0.0, 0.0
	}

	if len(nodeMetricsList.Items) == 0 {
		return 0.0, 0.0
	}

	// Get node list to calculate capacity
	nodeList, err := clientset.CoreV1().Nodes().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return 0.0, 0.0
	}

	// Build node capacity map
	nodeCapacity := make(map[string]*corev1.Node)
	for i := range nodeList.Items {
		node := &nodeList.Items[i]
		nodeCapacity[node.Name] = node
	}

	// Calculate average usage
	totalCPUPercent := 0.0
	totalMemoryPercent := 0.0
	validNodes := 0

	for _, nodeMetrics := range nodeMetricsList.Items {
		node, exists := nodeCapacity[nodeMetrics.Name]
		if !exists {
			continue
		}

		// Get CPU usage in millicores
		cpuUsage := nodeMetrics.Usage.Cpu().MilliValue()
		cpuCapacity := node.Status.Capacity.Cpu().MilliValue()

		// Get Memory usage in bytes
		memoryUsage := nodeMetrics.Usage.Memory().Value()
		memoryCapacity := node.Status.Capacity.Memory().Value()

		if cpuCapacity > 0 && memoryCapacity > 0 {
			cpuPercent := float64(cpuUsage) / float64(cpuCapacity) * 100
			memoryPercent := float64(memoryUsage) / float64(memoryCapacity) * 100

			totalCPUPercent += cpuPercent
			totalMemoryPercent += memoryPercent
			validNodes++
		}
	}

	if validNodes == 0 {
		return 0.0, 0.0
	}

	avgCPU := totalCPUPercent / float64(validNodes)
	avgMemory := totalMemoryPercent / float64(validNodes)

	// Ensure values are within 0-100 range
	if avgCPU < 0 {
		avgCPU = 0
	}
	if avgCPU > 100 {
		avgCPU = 100
	}
	if avgMemory < 0 {
		avgMemory = 0
	}
	if avgMemory > 100 {
		avgMemory = 100
	}

	return avgCPU, avgMemory
}
