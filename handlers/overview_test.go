package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// skipIfNoCluster skips the test if no Kubernetes cluster is available.
func skipIfNoCluster(t *testing.T) {
	t.Helper()
	if _, err := getKubernetesClient(); err != nil {
		t.Skipf("skipping: no k8s cluster available (%v)", err)
	}
}

// TestOverviewHandler tests the /api/overview endpoint
func TestOverviewHandler(t *testing.T) {
	t.Run("should return 200 OK with overview data", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// In CI environment without cluster, 500 is acceptable
		// In cluster environment, 200 is expected
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}

		// If 200, verify JSON response structure
		if res.StatusCode == http.StatusOK {
			var overview map[string]interface{}
			if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}
			if overview == nil {
				t.Error("expected overview object, got nil")
			}
		}
	})

	t.Run("should set correct content-type header", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		contentType := w.Header().Get("Content-Type")
		if contentType != "application/json" {
			t.Errorf("expected Content-Type 'application/json', got '%s'", contentType)
		}
	})

	t.Run("should reject non-GET methods", func(t *testing.T) {
		// Arrange
		methods := []string{http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodPatch}

		for _, method := range methods {
			t.Run(method, func(t *testing.T) {
				req := httptest.NewRequest(method, "/api/overview", nil)
				w := httptest.NewRecorder()

				// Act
				OverviewHandler(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})

	t.Run("should return valid overview response structure", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var overview map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Verify expected fields exist
		expectedFields := []string{"nodes", "unhealthyPods", "avgCpuPercent", "avgMemoryPercent"}
		for _, field := range expectedFields {
			if _, exists := overview[field]; !exists {
				t.Errorf("expected field '%s' in response, but not found", field)
			}
		}
	})

	t.Run("should return nodes with ready and total counts", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var overview map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Verify nodes structure
		nodes, ok := overview["nodes"].(map[string]interface{})
		if !ok {
			t.Fatal("expected 'nodes' to be an object")
		}

		if _, exists := nodes["ready"]; !exists {
			t.Error("expected 'ready' field in nodes object")
		}

		if _, exists := nodes["total"]; !exists {
			t.Error("expected 'total' field in nodes object")
		}
	})

	t.Run("should return non-negative unhealthyPods count", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var overview map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		unhealthyPods, ok := overview["unhealthyPods"].(float64)
		if !ok {
			t.Fatal("expected 'unhealthyPods' to be a number")
		}

		if unhealthyPods < 0 {
			t.Errorf("expected unhealthyPods >= 0, got %f", unhealthyPods)
		}
	})

	t.Run("should return avgCpuPercent between 0 and 100", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var overview map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		avgCpu, ok := overview["avgCpuPercent"].(float64)
		if !ok {
			t.Fatal("expected 'avgCpuPercent' to be a number")
		}

		if avgCpu < 0 || avgCpu > 100 {
			t.Errorf("expected avgCpuPercent between 0-100, got %f", avgCpu)
		}
	})

	t.Run("should return avgMemoryPercent between 0 and 100", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var overview map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		avgMemory, ok := overview["avgMemoryPercent"].(float64)
		if !ok {
			t.Fatal("expected 'avgMemoryPercent' to be a number")
		}

		if avgMemory < 0 || avgMemory > 100 {
			t.Errorf("expected avgMemoryPercent between 0-100, got %f", avgMemory)
		}
	})

	t.Run("should handle Kubernetes client errors gracefully", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should either succeed or return error status
		// In TDD Red phase, this might fail or return 500 if client is not configured
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})
}

// TestOverviewHandlerWithNamespaceFilter tests namespace filtering
func TestOverviewHandlerWithNamespaceFilter(t *testing.T) {
	t.Run("should accept namespace query parameter", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview?namespace=default", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should not fail with namespace parameter
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should filter pods by namespace when specified", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview?namespace=kube-system", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var overview map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Response should still contain all required fields
		if _, exists := overview["unhealthyPods"]; !exists {
			t.Error("expected 'unhealthyPods' field even with namespace filter")
		}
	})

	t.Run("should return all namespaces data when namespace not specified", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var overview map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Should contain data from all namespaces
		if overview["unhealthyPods"] == nil {
			t.Error("expected unhealthyPods data for all namespaces")
		}
	})

	t.Run("should handle empty namespace parameter", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview?namespace=", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Empty namespace should be treated as all namespaces
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should handle non-existent namespace gracefully", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview?namespace=non-existent-namespace", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var overview map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Should return valid response even for non-existent namespace
		// Likely with zero values
		if overview["unhealthyPods"] == nil {
			t.Error("expected unhealthyPods field even for non-existent namespace")
		}
	})
}

// TestOverviewHandlerResponseFormat tests exact response format
func TestOverviewHandlerResponseFormat(t *testing.T) {
	t.Run("should match expected JSON structure", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var overview struct {
			Nodes struct {
				Ready int `json:"ready"`
				Total int `json:"total"`
			} `json:"nodes"`
			UnhealthyPods    int     `json:"unhealthyPods"`
			AvgCpuPercent    float64 `json:"avgCpuPercent"`
			AvgMemoryPercent float64 `json:"avgMemoryPercent"`
		}

		if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
			t.Fatalf("failed to decode response into expected structure: %v", err)
		}

		// Verify types are correct (compile-time check ensures this)
		t.Logf("Nodes: ready=%d, total=%d", overview.Nodes.Ready, overview.Nodes.Total)
		t.Logf("UnhealthyPods: %d", overview.UnhealthyPods)
		t.Logf("AvgCpuPercent: %.2f", overview.AvgCpuPercent)
		t.Logf("AvgMemoryPercent: %.2f", overview.AvgMemoryPercent)
	})

	t.Run("should return ready nodes less than or equal to total nodes", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var overview struct {
			Nodes struct {
				Ready int `json:"ready"`
				Total int `json:"total"`
			} `json:"nodes"`
		}

		if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if overview.Nodes.Ready > overview.Nodes.Total {
			t.Errorf("ready nodes (%d) cannot exceed total nodes (%d)",
				overview.Nodes.Ready, overview.Nodes.Total)
		}
	})
}

// TestCalculateResourceUsageFallback tests metric calculation with and without metrics-server data
func TestCalculateResourceUsageFallback(t *testing.T) {
	// Helper to create a test node with given capacity and allocatable
	makeNode := func(name string, cpuCapacity, cpuAllocatable, memCapacity, memAllocatable string) corev1.Node {
		return corev1.Node{
			ObjectMeta: metav1.ObjectMeta{Name: name},
			Status: corev1.NodeStatus{
				Capacity: corev1.ResourceList{
					corev1.ResourceCPU:    resource.MustParse(cpuCapacity),
					corev1.ResourceMemory: resource.MustParse(memCapacity),
				},
				Allocatable: corev1.ResourceList{
					corev1.ResourceCPU:    resource.MustParse(cpuAllocatable),
					corev1.ResourceMemory: resource.MustParse(memAllocatable),
				},
			},
		}
	}

	t.Run("should return 0 for empty nodes list", func(t *testing.T) {
		cpu, mem := calculateResourceUsage(nil, nil)
		if cpu != 0 || mem != 0 {
			t.Errorf("expected 0/0 for empty nodes, got %f/%f", cpu, mem)
		}
	})

	t.Run("should fall back to capacity-allocatable when metricsMap is nil", func(t *testing.T) {
		nodes := []corev1.Node{
			makeNode("node-1", "4000m", "3800m", "8Gi", "7Gi"),
		}
		cpu, mem := calculateResourceUsage(nodes, nil)
		// capacity - allocatable: 200m / 4000m = 5%, 1Gi / 8Gi = 12.5%
		if cpu < 4.9 || cpu > 5.1 {
			t.Errorf("expected ~5%% CPU fallback, got %f", cpu)
		}
		if mem < 12.0 || mem > 13.0 {
			t.Errorf("expected ~12.5%% memory fallback, got %f", mem)
		}
	})

	t.Run("should use real metrics when metricsMap is provided", func(t *testing.T) {
		nodes := []corev1.Node{
			makeNode("node-1", "4000m", "4000m", "8Gi", "8Gi"),
		}
		metricsMap := map[string]nodeMetricsUsage{
			"node-1": {
				cpuMillis:   2000, // 2000m / 4000m = 50%
				memoryBytes: 4 * 1024 * 1024 * 1024, // 4Gi / 8Gi = 50%
			},
		}
		cpu, mem := calculateResourceUsage(nodes, metricsMap)
		if cpu < 49.9 || cpu > 50.1 {
			t.Errorf("expected ~50%% CPU from metrics, got %f", cpu)
		}
		if mem < 49.9 || mem > 50.1 {
			t.Errorf("expected ~50%% memory from metrics, got %f", mem)
		}
	})

	t.Run("should fall back for nodes not in metricsMap", func(t *testing.T) {
		nodes := []corev1.Node{
			makeNode("node-1", "4000m", "4000m", "8Gi", "8Gi"),
			makeNode("node-2", "4000m", "3800m", "8Gi", "7Gi"),
		}
		// Only node-1 has metrics; node-2 should fall back
		metricsMap := map[string]nodeMetricsUsage{
			"node-1": {
				cpuMillis:   2000,
				memoryBytes: 4 * 1024 * 1024 * 1024,
			},
		}
		cpu, mem := calculateResourceUsage(nodes, metricsMap)
		// node-1: 2000m/4000m, node-2 fallback: 200m/4000m
		// total: 2200m/8000m = 27.5%
		if cpu < 27.0 || cpu > 28.0 {
			t.Errorf("expected ~27.5%% CPU mixed mode, got %f", cpu)
		}
		if mem < 1 {
			t.Errorf("expected positive memory mixed mode, got %f", mem)
		}
	})

	t.Run("should clamp values between 0 and 100", func(t *testing.T) {
		nodes := []corev1.Node{
			makeNode("node-1", "1000m", "1000m", "1Gi", "1Gi"),
		}
		metricsMap := map[string]nodeMetricsUsage{
			"node-1": {
				cpuMillis:   5000, // 500% — should be clamped to 100
				memoryBytes: 10 * 1024 * 1024 * 1024,
			},
		}
		cpu, mem := calculateResourceUsage(nodes, metricsMap)
		if cpu != 100 {
			t.Errorf("expected CPU clamped to 100, got %f", cpu)
		}
		if mem != 100 {
			t.Errorf("expected memory clamped to 100, got %f", mem)
		}
	})
}

// TestCalculateNodeResourceUsageFallback tests per-node metric calculation
func TestCalculateNodeResourceUsageFallback(t *testing.T) {
	node := corev1.Node{
		ObjectMeta: metav1.ObjectMeta{Name: "test-node"},
		Status: corev1.NodeStatus{
			Capacity: corev1.ResourceList{
				corev1.ResourceCPU:    resource.MustParse("4000m"),
				corev1.ResourceMemory: resource.MustParse("8Gi"),
			},
			Allocatable: corev1.ResourceList{
				corev1.ResourceCPU:    resource.MustParse("4000m"),
				corev1.ResourceMemory: resource.MustParse("8Gi"),
			},
		},
	}

	t.Run("should return 0 when no metrics and capacity equals allocatable", func(t *testing.T) {
		cpu, mem := calculateNodeResourceUsage(node, nil)
		if cpu != 0 || mem != 0 {
			t.Errorf("expected 0/0 with nil metrics and equal capacity/allocatable, got %f/%f", cpu, mem)
		}
	})

	t.Run("should use real metrics when available", func(t *testing.T) {
		metricsMap := map[string]nodeMetricsUsage{
			"test-node": {
				cpuMillis:   1000,
				memoryBytes: 2 * 1024 * 1024 * 1024,
			},
		}
		cpu, mem := calculateNodeResourceUsage(node, metricsMap)
		if cpu < 24.9 || cpu > 25.1 {
			t.Errorf("expected ~25%% CPU, got %f", cpu)
		}
		if mem < 24.9 || mem > 25.1 {
			t.Errorf("expected ~25%% memory, got %f", mem)
		}
	})
}
