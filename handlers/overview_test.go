package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
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
