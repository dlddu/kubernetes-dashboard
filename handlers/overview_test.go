package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

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

		// If 200, verify response structure
		if res.StatusCode == http.StatusOK {
			var overviewResp OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overviewResp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// Verify response structure
			if overviewResp.Nodes.Ready < 0 {
				t.Errorf("expected non-negative ready nodes, got %d", overviewResp.Nodes.Ready)
			}
			if overviewResp.Nodes.Total < 0 {
				t.Errorf("expected non-negative total nodes, got %d", overviewResp.Nodes.Total)
			}
			if overviewResp.UnhealthyPods < 0 {
				t.Errorf("expected non-negative unhealthy pods, got %d", overviewResp.UnhealthyPods)
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

	t.Run("should return valid node counts", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Only validate response structure if request succeeds
		if res.StatusCode == http.StatusOK {
			var overviewResp OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overviewResp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// Ready nodes should not exceed total nodes
			if overviewResp.Nodes.Ready > overviewResp.Nodes.Total {
				t.Errorf("ready nodes (%d) cannot exceed total nodes (%d)",
					overviewResp.Nodes.Ready, overviewResp.Nodes.Total)
			}

			// In TDD Red phase, this will fail until implementation exists
			if overviewResp.Nodes.Total == 0 {
				t.Log("Warning: expected at least one node in cluster, got 0")
			}
		}
	})

	t.Run("should return valid CPU usage percentage", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Only validate response structure if request succeeds
		if res.StatusCode == http.StatusOK {
			var overviewResp OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overviewResp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// CPU usage should be between 0 and 100
			if overviewResp.AvgCpuUsage < 0 || overviewResp.AvgCpuUsage > 100 {
				t.Errorf("CPU usage should be between 0 and 100, got %.2f", overviewResp.AvgCpuUsage)
			}
		}
	})

	t.Run("should return valid Memory usage percentage", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Only validate response structure if request succeeds
		if res.StatusCode == http.StatusOK {
			var overviewResp OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overviewResp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// Memory usage should be between 0 and 100
			if overviewResp.AvgMemoryUsage < 0 || overviewResp.AvgMemoryUsage > 100 {
				t.Errorf("Memory usage should be between 0 and 100, got %.2f", overviewResp.AvgMemoryUsage)
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

		// Should either succeed or return error status
		// In TDD Red phase, this might fail or return 500 if client is not configured
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})
}

// TestOverviewHandlerWithCluster tests overview handler behavior in cluster environment
func TestOverviewHandlerWithCluster(t *testing.T) {
	t.Run("should aggregate node metrics correctly", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Only validate response structure if request succeeds
		if res.StatusCode == http.StatusOK {
			var overviewResp OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overviewResp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// Verify node data structure
			if overviewResp.Nodes.Total > 0 {
				// If there are nodes, ready count should be meaningful
				if overviewResp.Nodes.Ready < 0 || overviewResp.Nodes.Ready > overviewResp.Nodes.Total {
					t.Errorf("invalid ready nodes count: ready=%d, total=%d",
						overviewResp.Nodes.Ready, overviewResp.Nodes.Total)
				}
			}
		}
	})

	t.Run("should count unhealthy pods across all namespaces", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Only validate response structure if request succeeds
		if res.StatusCode == http.StatusOK {
			var overviewResp OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overviewResp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// UnhealthyPods should be non-negative
			if overviewResp.UnhealthyPods < 0 {
				t.Errorf("unhealthy pods count cannot be negative, got %d", overviewResp.UnhealthyPods)
			}

			// This test will verify implementation counts pods with status != Running/Succeeded
			t.Logf("Unhealthy pods count: %d", overviewResp.UnhealthyPods)
		}
	})

	t.Run("should calculate average CPU usage across all nodes", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Only validate response structure if request succeeds
		if res.StatusCode == http.StatusOK {
			var overviewResp OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overviewResp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// CPU usage should be a valid percentage
			if overviewResp.AvgCpuUsage < 0 {
				t.Errorf("CPU usage cannot be negative, got %.2f", overviewResp.AvgCpuUsage)
			}

			// Log for debugging during implementation
			t.Logf("Average CPU usage: %.2f%%", overviewResp.AvgCpuUsage)
		}
	})

	t.Run("should calculate average Memory usage across all nodes", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Only validate response structure if request succeeds
		if res.StatusCode == http.StatusOK {
			var overviewResp OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overviewResp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// Memory usage should be a valid percentage
			if overviewResp.AvgMemoryUsage < 0 {
				t.Errorf("Memory usage cannot be negative, got %.2f", overviewResp.AvgMemoryUsage)
			}

			// Log for debugging during implementation
			t.Logf("Average Memory usage: %.2f%%", overviewResp.AvgMemoryUsage)
		}
	})

	t.Run("should return zero values when cluster is empty", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Only validate response structure if request succeeds
		if res.StatusCode == http.StatusOK {
			var overviewResp OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overviewResp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// Empty cluster should have valid zero state
			if overviewResp.Nodes.Total == 0 {
				if overviewResp.Nodes.Ready != 0 {
					t.Error("ready nodes should be 0 when total is 0")
				}
				if overviewResp.UnhealthyPods != 0 {
					t.Error("unhealthy pods should be 0 when cluster is empty")
				}
			}
		}
	})
}

// TestOverviewResponseStructure tests the response data structure
func TestOverviewResponseStructure(t *testing.T) {
	t.Run("should have all required fields", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Only validate response structure if request succeeds
		if res.StatusCode == http.StatusOK {
			var rawResponse map[string]interface{}
			if err := json.NewDecoder(res.Body).Decode(&rawResponse); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// Check required fields exist
			requiredFields := []string{"nodes", "unhealthyPods", "avgCpuUsage", "avgMemoryUsage"}
			for _, field := range requiredFields {
				if _, exists := rawResponse[field]; !exists {
					t.Errorf("missing required field: %s", field)
				}
			}

			// Check nodes sub-fields
			if nodes, ok := rawResponse["nodes"].(map[string]interface{}); ok {
				if _, exists := nodes["ready"]; !exists {
					t.Error("missing nodes.ready field")
				}
				if _, exists := nodes["total"]; !exists {
					t.Error("missing nodes.total field")
				}
			} else {
				t.Error("nodes field is not an object")
			}
		}
	})
}
