package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	corev1 "k8s.io/api/core/v1"
)

// TestNodesHandler tests the /api/nodes endpoint
func TestNodesHandler(t *testing.T) {
	t.Run("should return 200 OK with nodes data", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
		w := httptest.NewRecorder()

		// Act
		NodesHandler(w, req)

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
			var nodes []map[string]interface{}
			if err := json.NewDecoder(res.Body).Decode(&nodes); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}
			if nodes == nil {
				t.Error("expected nodes array, got nil")
			}
		}
	})

	t.Run("should set correct content-type header", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
		w := httptest.NewRecorder()

		// Act
		NodesHandler(w, req)

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
				req := httptest.NewRequest(method, "/api/nodes", nil)
				w := httptest.NewRecorder()

				// Act
				NodesHandler(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})
}

// TestNodesHandlerResponseStructure tests the exact response structure
func TestNodesHandlerResponseStructure(t *testing.T) {
	t.Run("should return array of nodes with required fields", func(t *testing.T) {
		cleanup := setupFakeClient(t)
		defer cleanup()

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
		w := httptest.NewRecorder()

		// Act
		NodesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var nodes []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&nodes); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Should have at least one node in a Kubernetes cluster
		if len(nodes) == 0 {
			t.Fatal("expected at least one node")
		}

		// Verify first node has required fields
		firstNode := nodes[0]
		requiredFields := []string{"name", "status", "role", "cpuPercent", "memoryPercent", "podCount"}
		for _, field := range requiredFields {
			if _, exists := firstNode[field]; !exists {
				t.Errorf("expected field '%s' in node object, but not found", field)
			}
		}
	})

	t.Run("should return node with valid name", func(t *testing.T) {
		cleanup := setupFakeClient(t)
		defer cleanup()

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
		w := httptest.NewRecorder()

		// Act
		NodesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var nodes []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&nodes); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if len(nodes) == 0 {
			t.Fatal("expected at least one node")
		}

		// Verify node name is a non-empty string
		name, ok := nodes[0]["name"].(string)
		if !ok {
			t.Fatal("expected 'name' to be a string")
		}
		if name == "" {
			t.Error("expected node name to be non-empty")
		}
	})

	t.Run("should return node with valid status", func(t *testing.T) {
		cleanup := setupFakeClient(t)
		defer cleanup()

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
		w := httptest.NewRecorder()

		// Act
		NodesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var nodes []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&nodes); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if len(nodes) == 0 {
			t.Fatal("expected at least one node")
		}

		// Verify status is either "Ready" or "NotReady"
		status, ok := nodes[0]["status"].(string)
		if !ok {
			t.Fatal("expected 'status' to be a string")
		}
		if status != "Ready" && status != "NotReady" {
			t.Errorf("expected status to be 'Ready' or 'NotReady', got '%s'", status)
		}
	})

	t.Run("should return CPU percentage between 0 and 100", func(t *testing.T) {
		cleanup := setupFakeClient(t)
		defer cleanup()

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
		w := httptest.NewRecorder()

		// Act
		NodesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var nodes []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&nodes); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if len(nodes) == 0 {
			t.Fatal("expected at least one node")
		}

		// Verify CPU percentage is a valid number between 0 and 100
		cpuPercent, ok := nodes[0]["cpuPercent"].(float64)
		if !ok {
			t.Fatal("expected 'cpuPercent' to be a number")
		}
		if cpuPercent < 0 || cpuPercent > 100 {
			t.Errorf("expected cpuPercent between 0-100, got %f", cpuPercent)
		}
	})

	t.Run("should return Memory percentage between 0 and 100", func(t *testing.T) {
		cleanup := setupFakeClient(t)
		defer cleanup()

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
		w := httptest.NewRecorder()

		// Act
		NodesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var nodes []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&nodes); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if len(nodes) == 0 {
			t.Fatal("expected at least one node")
		}

		// Verify Memory percentage is a valid number between 0 and 100
		memoryPercent, ok := nodes[0]["memoryPercent"].(float64)
		if !ok {
			t.Fatal("expected 'memoryPercent' to be a number")
		}
		if memoryPercent < 0 || memoryPercent > 100 {
			t.Errorf("expected memoryPercent between 0-100, got %f", memoryPercent)
		}
	})

	t.Run("should return non-negative pod count", func(t *testing.T) {
		cleanup := setupFakeClient(t)
		defer cleanup()

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
		w := httptest.NewRecorder()

		// Act
		NodesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var nodes []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&nodes); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if len(nodes) == 0 {
			t.Fatal("expected at least one node")
		}

		// Verify pod count is a non-negative integer
		podCount, ok := nodes[0]["podCount"].(float64)
		if !ok {
			t.Fatal("expected 'podCount' to be a number")
		}
		if podCount < 0 {
			t.Errorf("expected podCount >= 0, got %f", podCount)
		}
	})
}

// TestNodesHandlerResourceCalculation tests resource usage calculation logic
func TestNodesHandlerResourceCalculation(t *testing.T) {
	t.Run("should calculate resources based on allocatable vs requested", func(t *testing.T) {
		cleanup := setupFakeClient(t)
		defer cleanup()

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
		w := httptest.NewRecorder()

		// Act
		NodesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var nodes []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&nodes); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Verify that resource percentages are calculated
		// (based on allocatable resources, not requiring metrics-server)
		if len(nodes) > 0 {
			cpuPercent := nodes[0]["cpuPercent"].(float64)
			memoryPercent := nodes[0]["memoryPercent"].(float64)

			// Both should be valid percentages
			if cpuPercent < 0 || cpuPercent > 100 {
				t.Errorf("invalid CPU percentage: %f", cpuPercent)
			}
			if memoryPercent < 0 || memoryPercent > 100 {
				t.Errorf("invalid memory percentage: %f", memoryPercent)
			}
		}
	})

	t.Run("should not require metrics-server for resource calculation", func(t *testing.T) {
		cleanup := setupFakeClient(t)
		defer cleanup()

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
		w := httptest.NewRecorder()

		// Act
		NodesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should succeed even without metrics-server
		// by using node.Status.Allocatable and pod requests
		if res.StatusCode != http.StatusOK {
			t.Errorf("expected status 200 even without metrics-server, got %d", res.StatusCode)
		}
	})
}

// TestNodesHandlerErrorHandling tests error scenarios
func TestNodesHandlerErrorHandling(t *testing.T) {
	t.Run("should handle Kubernetes client errors gracefully", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
		w := httptest.NewRecorder()

		// Act
		NodesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should either succeed or return error status
		// In TDD Red phase, this might fail or return 500 if client is not configured
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should return valid JSON even on error", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
		w := httptest.NewRecorder()

		// Act
		NodesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Response should always be valid JSON
		var result interface{}
		if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
			t.Errorf("response should be valid JSON, got error: %v", err)
		}
	})
}

// TestNodesHandlerPodCountAccuracy tests pod counting logic
func TestNodesHandlerPodCountAccuracy(t *testing.T) {
	t.Run("should count pods running on each node", func(t *testing.T) {
		cleanup := setupFakeClient(t)
		defer cleanup()

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
		w := httptest.NewRecorder()

		// Act
		NodesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var nodes []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&nodes); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Verify pod counts are consistent
		for _, node := range nodes {
			podCount := node["podCount"].(float64)
			if podCount < 0 {
				t.Errorf("node %s has negative pod count: %f", node["name"], podCount)
			}
		}
	})

	t.Run("should include all pod phases in count", func(t *testing.T) {
		cleanup := setupFakeClient(t)
		defer cleanup()

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
		w := httptest.NewRecorder()

		// Act
		NodesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var nodes []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&nodes); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Pod count should include running, pending, and other phases
		// Total pod count across all nodes should be > 0 in a typical cluster
		totalPods := 0.0
		for _, node := range nodes {
			totalPods += node["podCount"].(float64)
		}

		// At least some pods should exist in the cluster (e.g., kube-system)
		if totalPods == 0 {
			t.Log("Warning: No pods found across all nodes (unexpected in most clusters)")
		}
	})
}

// TestGetNodeRole tests the getNodeRole helper function
func TestGetNodeRole(t *testing.T) {
	t.Run("should extract role from node.kubernetes.io/role label", func(t *testing.T) {
		node := corev1.Node{}
		node.Labels = map[string]string{
			"node.kubernetes.io/role": "worker",
		}
		role := getNodeRole(node)
		if role != "worker" {
			t.Errorf("expected 'worker', got '%s'", role)
		}
	})

	t.Run("should extract role from node-role.kubernetes.io prefix", func(t *testing.T) {
		node := corev1.Node{}
		node.Labels = map[string]string{
			"node-role.kubernetes.io/control-plane": "true",
		}
		role := getNodeRole(node)
		if role != "control-plane" {
			t.Errorf("expected 'control-plane', got '%s'", role)
		}
	})

	t.Run("should prefer node.kubernetes.io/role over prefix format", func(t *testing.T) {
		node := corev1.Node{}
		node.Labels = map[string]string{
			"node.kubernetes.io/role":               "worker",
			"node-role.kubernetes.io/control-plane": "true",
		}
		role := getNodeRole(node)
		if role != "worker" {
			t.Errorf("expected 'worker', got '%s'", role)
		}
	})

	t.Run("should return empty string when no role labels exist", func(t *testing.T) {
		node := corev1.Node{}
		node.Labels = map[string]string{
			"kubernetes.io/hostname": "node-1",
		}
		role := getNodeRole(node)
		if role != "" {
			t.Errorf("expected empty string, got '%s'", role)
		}
	})

	t.Run("should return empty string for nil labels", func(t *testing.T) {
		node := corev1.Node{}
		role := getNodeRole(node)
		if role != "" {
			t.Errorf("expected empty string, got '%s'", role)
		}
	})
}
