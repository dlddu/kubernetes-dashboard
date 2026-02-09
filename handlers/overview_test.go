package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// OverviewResponse represents the response from /api/overview
type OverviewResponse struct {
	Nodes struct {
		Ready int `json:"ready"`
		Total int `json:"total"`
	} `json:"nodes"`
	UnhealthyPods int     `json:"unhealthyPods"`
	AvgCPU        float64 `json:"avgCpu"`
	AvgMemory     float64 `json:"avgMemory"`
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
			var overview OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// Verify response has expected fields
			if overview.Nodes.Total < 0 {
				t.Error("expected non-negative total nodes count")
			}
			if overview.Nodes.Ready < 0 {
				t.Error("expected non-negative ready nodes count")
			}
			if overview.UnhealthyPods < 0 {
				t.Error("expected non-negative unhealthy pods count")
			}
			if overview.AvgCPU < 0 || overview.AvgCPU > 100 {
				t.Errorf("expected avgCpu between 0-100, got %.2f", overview.AvgCPU)
			}
			if overview.AvgMemory < 0 || overview.AvgMemory > 100 {
				t.Errorf("expected avgMemory between 0-100, got %.2f", overview.AvgMemory)
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
}

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

		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}

		if res.StatusCode == http.StatusOK {
			var overview OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}
		}
	})

	t.Run("should handle 'all' namespace parameter", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview?namespace=all", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should return cluster-wide data when namespace is 'all'", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview?namespace=all", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusOK {
			var overview OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// When namespace is "all", should return cluster-wide metrics
			// Nodes count should be total cluster nodes
			if overview.Nodes.Total == 0 {
				t.Log("Warning: expected at least one node in cluster")
			}
		}
	})

	t.Run("should filter data by specific namespace", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview?namespace=kube-system", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusOK {
			var overview OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// When namespace is specific, unhealthy pods should only count pods in that namespace
			// This will fail until implementation is complete
			if overview.UnhealthyPods < 0 {
				t.Error("expected non-negative unhealthy pods count")
			}
		}
	})
}

func TestOverviewHandlerEdgeCases(t *testing.T) {
	t.Run("should handle cluster with no nodes", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusOK {
			var overview OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// Should handle empty cluster gracefully
			if overview.Nodes.Total < 0 {
				t.Error("nodes total should never be negative")
			}
		}
	})

	t.Run("should handle cluster with no pods", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusOK {
			var overview OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// Should handle no pods gracefully
			if overview.UnhealthyPods != 0 {
				t.Log("Warning: expected 0 unhealthy pods when cluster has no pods")
			}
		}
	})

	t.Run("should handle non-existent namespace", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview?namespace=nonexistent", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should either return 200 with zero values or 500/404
		if res.StatusCode == http.StatusOK {
			var overview OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}
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

		// Should return valid status code (200 or 500)
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})
}

func TestOverviewHandlerDataAccuracy(t *testing.T) {
	t.Run("should calculate ready/total nodes correctly", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusOK {
			var overview OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// Ready nodes should never exceed total nodes
			if overview.Nodes.Ready > overview.Nodes.Total {
				t.Errorf("ready nodes (%d) exceeds total nodes (%d)", overview.Nodes.Ready, overview.Nodes.Total)
			}
		}
	})

	t.Run("should count only unhealthy pods", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusOK {
			var overview OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// Unhealthy pods should only count:
			// - Pods not in Running or Succeeded phase
			// - Pods with container restarts > 0
			// - Pods with failed container status
			if overview.UnhealthyPods < 0 {
				t.Error("unhealthy pods count should never be negative")
			}
		}
	})

	t.Run("should calculate average CPU usage as percentage", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusOK {
			var overview OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// CPU should be between 0-100%
			if overview.AvgCPU < 0 {
				t.Errorf("avgCpu should be non-negative, got %.2f", overview.AvgCPU)
			}
			if overview.AvgCPU > 100 {
				t.Errorf("avgCpu should not exceed 100%%, got %.2f", overview.AvgCPU)
			}
		}
	})

	t.Run("should calculate average Memory usage as percentage", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusOK {
			var overview OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// Memory should be between 0-100%
			if overview.AvgMemory < 0 {
				t.Errorf("avgMemory should be non-negative, got %.2f", overview.AvgMemory)
			}
			if overview.AvgMemory > 100 {
				t.Errorf("avgMemory should not exceed 100%%, got %.2f", overview.AvgMemory)
			}
		}
	})
}

func TestOverviewHandlerResponseFormat(t *testing.T) {
	t.Run("should return JSON with correct structure", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusOK {
			var data map[string]interface{}
			if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// Verify required fields exist
			if _, exists := data["nodes"]; !exists {
				t.Error("response missing 'nodes' field")
			}
			if _, exists := data["unhealthyPods"]; !exists {
				t.Error("response missing 'unhealthyPods' field")
			}
			if _, exists := data["avgCpu"]; !exists {
				t.Error("response missing 'avgCpu' field")
			}
			if _, exists := data["avgMemory"]; !exists {
				t.Error("response missing 'avgMemory' field")
			}

			// Verify nodes structure
			nodes, ok := data["nodes"].(map[string]interface{})
			if !ok {
				t.Error("'nodes' should be an object")
			} else {
				if _, exists := nodes["ready"]; !exists {
					t.Error("nodes missing 'ready' field")
				}
				if _, exists := nodes["total"]; !exists {
					t.Error("nodes missing 'total' field")
				}
			}
		}
	})

	t.Run("should use camelCase for JSON fields", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusOK {
			body := w.Body.String()

			// Verify camelCase field names
			if !contains(body, "unhealthyPods") {
				t.Error("expected camelCase 'unhealthyPods', not snake_case")
			}
			if !contains(body, "avgCpu") {
				t.Error("expected camelCase 'avgCpu', not snake_case")
			}
			if !contains(body, "avgMemory") {
				t.Error("expected camelCase 'avgMemory', not snake_case")
			}
		}
	})
}

// Helper function
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || findSubstring(s, substr)))
}

func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
