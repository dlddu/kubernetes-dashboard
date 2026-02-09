package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/metrics/pkg/client/clientset/versioned"
)

// OverviewResponse represents the overview data structure
type OverviewResponse struct {
	Nodes struct {
		Ready int `json:"ready"`
		Total int `json:"total"`
	} `json:"nodes"`
	UnhealthyPods      int                `json:"unhealthyPods"`
	AverageCPUUsage    float64            `json:"averageCPUUsage"`
	AverageMemoryUsage float64            `json:"averageMemoryUsage"`
	UnhealthyPodsList  []UnhealthyPod     `json:"unhealthyPodsList,omitempty"`
	NodesList          []Node             `json:"nodesList,omitempty"`
}

// UnhealthyPod represents an unhealthy pod
type UnhealthyPod struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Status    string `json:"status"`
	Restarts  int32  `json:"restarts"`
}

// Node represents a node with usage metrics
type Node struct {
	Name         string  `json:"name"`
	CPUUsage     float64 `json:"cpuUsage"`
	MemoryUsage  float64 `json:"memoryUsage"`
	Status       string  `json:"status"`
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
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create Kubernetes client"})
		return
	}

	// Initialize response
	response := OverviewResponse{
		UnhealthyPodsList: []UnhealthyPod{},
		NodesList:         []Node{},
	}

	// Fetch nodes
	nodeList, err := clientset.CoreV1().Nodes().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to list nodes"})
		return
	}

	// Count ready nodes and populate nodes list
	response.Nodes.Total = len(nodeList.Items)
	for _, node := range nodeList.Items {
		isReady := false
		nodeStatus := "NotReady"

		for _, condition := range node.Status.Conditions {
			if condition.Type == "Ready" && condition.Status == "True" {
				isReady = true
				nodeStatus = "Ready"
				break
			}
		}

		if isReady {
			response.Nodes.Ready++
		}

		// Add node to list with default usage values
		response.NodesList = append(response.NodesList, Node{
			Name:         node.Name,
			CPUUsage:     0,
			MemoryUsage:  0,
			Status:       nodeStatus,
		})
	}

	// Try to fetch metrics (may fail if metrics-server is not installed)
	metricsClient, err := getMetricsClient()
	if err == nil {
		// Fetch node metrics
		nodeMetricsList, err := metricsClient.MetricsV1beta1().NodeMetricses().List(context.Background(), metav1.ListOptions{})
		if err == nil && len(nodeMetricsList.Items) > 0 {
			totalCPU := 0.0
			totalMemory := 0.0
			metricsCount := 0

			// Create a map for quick node lookup
			nodeMap := make(map[string]int)
			for i, node := range response.NodesList {
				nodeMap[node.Name] = i
			}

			// Calculate usage for each node
			for _, metrics := range nodeMetricsList.Items {
				// Find corresponding node
				for _, node := range nodeList.Items {
					if node.Name == metrics.Name {
						cpuQuantity := metrics.Usage.Cpu()
						memoryQuantity := metrics.Usage.Memory()

						cpuAllocatable := node.Status.Allocatable.Cpu()
						memoryAllocatable := node.Status.Allocatable.Memory()

						cpuUsagePercent := 0.0
						memoryUsagePercent := 0.0

						if !cpuAllocatable.IsZero() {
							cpuUsagePercent = float64(cpuQuantity.MilliValue()) / float64(cpuAllocatable.MilliValue()) * 100
							if cpuUsagePercent > 100 {
								cpuUsagePercent = 100
							}
						}

						if !memoryAllocatable.IsZero() {
							memoryUsagePercent = float64(memoryQuantity.Value()) / float64(memoryAllocatable.Value()) * 100
							if memoryUsagePercent > 100 {
								memoryUsagePercent = 100
							}
						}

						totalCPU += cpuUsagePercent
						totalMemory += memoryUsagePercent
						metricsCount++

						// Update node in list
						if idx, ok := nodeMap[metrics.Name]; ok {
							response.NodesList[idx].CPUUsage = cpuUsagePercent
							response.NodesList[idx].MemoryUsage = memoryUsagePercent
						}
						break
					}
				}
			}

			// Calculate averages
			if metricsCount > 0 {
				response.AverageCPUUsage = totalCPU / float64(metricsCount)
				response.AverageMemoryUsage = totalMemory / float64(metricsCount)
			}
		}
	}

	// Fetch pods from all namespaces
	podList, err := clientset.CoreV1().Pods("").List(context.Background(), metav1.ListOptions{})
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to list pods"})
		return
	}

	// Count unhealthy pods
	for _, pod := range podList.Items {
		isUnhealthy := false
		restarts := int32(0)

		// Check pod phase
		if pod.Status.Phase != "Running" && pod.Status.Phase != "Succeeded" {
			isUnhealthy = true
		}

		// Check container statuses
		for _, containerStatus := range pod.Status.ContainerStatuses {
			restarts += containerStatus.RestartCount

			if !containerStatus.Ready {
				isUnhealthy = true
			}

			if containerStatus.State.Waiting != nil || containerStatus.State.Terminated != nil {
				isUnhealthy = true
			}
		}

		// Check if any container has high restart count
		if restarts > 0 {
			isUnhealthy = true
		}

		if isUnhealthy {
			response.UnhealthyPods++

			// Add to unhealthy pods list
			status := string(pod.Status.Phase)
			if pod.Status.Reason != "" {
				status = pod.Status.Reason
			}

			// Check for more specific status from container states
			for _, containerStatus := range pod.Status.ContainerStatuses {
				if containerStatus.State.Waiting != nil {
					status = containerStatus.State.Waiting.Reason
					break
				} else if containerStatus.State.Terminated != nil {
					status = containerStatus.State.Terminated.Reason
					break
				}
			}

			response.UnhealthyPodsList = append(response.UnhealthyPodsList, UnhealthyPod{
				Name:      pod.Name,
				Namespace: pod.Namespace,
				Status:    status,
				Restarts:  restarts,
			})
		}
	}

	// Send response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// getMetricsClient creates and returns a Kubernetes metrics client
func getMetricsClient() (*versioned.Clientset, error) {
	config, err := getKubernetesConfig()
	if err != nil {
		return nil, err
	}

	metricsClient, err := versioned.NewForConfig(config)
	if err != nil {
		return nil, err
	}

	return metricsClient, nil
}
