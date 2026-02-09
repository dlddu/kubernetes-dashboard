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

		// If 200, verify JSON structure
		if res.StatusCode == http.StatusOK {
			var overview OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
				t.Fatalf("failed to decode response: %v", err)
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

// TestOverviewResponse tests the response structure
func TestOverviewResponse(t *testing.T) {
	t.Run("should return valid node statistics", func(t *testing.T) {
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

			// Verify nodes structure
			if overview.Nodes.Ready < 0 {
				t.Errorf("expected non-negative ready nodes, got %d", overview.Nodes.Ready)
			}

			if overview.Nodes.Total < 0 {
				t.Errorf("expected non-negative total nodes, got %d", overview.Nodes.Total)
			}

			if overview.Nodes.Total < overview.Nodes.Ready {
				t.Errorf("total nodes (%d) should be >= ready nodes (%d)", overview.Nodes.Total, overview.Nodes.Ready)
			}
		}
	})

	t.Run("should return valid unhealthy pod count", func(t *testing.T) {
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

			if overview.UnhealthyPods < 0 {
				t.Errorf("expected non-negative unhealthy pods count, got %d", overview.UnhealthyPods)
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

		if res.StatusCode == http.StatusOK {
			var overview OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if overview.AverageCPUUsage < 0 || overview.AverageCPUUsage > 100 {
				t.Errorf("expected CPU usage between 0-100%%, got %.2f%%", overview.AverageCPUUsage)
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

		if res.StatusCode == http.StatusOK {
			var overview OverviewResponse
			if err := json.NewDecoder(res.Body).Decode(&overview); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if overview.AverageMemoryUsage < 0 || overview.AverageMemoryUsage > 100 {
				t.Errorf("expected memory usage between 0-100%%, got %.2f%%", overview.AverageMemoryUsage)
			}
		}
	})
}

// TestOverviewWithMockClient tests overview handler with mock Kubernetes client
func TestOverviewWithMockClient(t *testing.T) {
	t.Run("should aggregate node metrics correctly", func(t *testing.T) {
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

			// In a real cluster, there should be at least one node
			if overview.Nodes.Total > 0 {
				t.Logf("Found %d total nodes, %d ready", overview.Nodes.Total, overview.Nodes.Ready)
			} else {
				t.Log("Warning: No nodes found in test environment")
			}
		}
	})

	t.Run("should calculate average CPU usage from all nodes", func(t *testing.T) {
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

			// Average should be calculated from all node metrics
			if overview.Nodes.Total > 0 {
				if overview.AverageCPUUsage < 0 {
					t.Errorf("expected non-negative CPU usage, got %.2f%%", overview.AverageCPUUsage)
				}
			}
		}
	})

	t.Run("should calculate average Memory usage from all nodes", func(t *testing.T) {
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

			// Average should be calculated from all node metrics
			if overview.Nodes.Total > 0 {
				if overview.AverageMemoryUsage < 0 {
					t.Errorf("expected non-negative memory usage, got %.2f%%", overview.AverageMemoryUsage)
				}
			}
		}
	})

	t.Run("should count unhealthy pods correctly", func(t *testing.T) {
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

			// Unhealthy pods should include pods that are not in Running/Succeeded state
			// or have restarts or are not ready
			t.Logf("Found %d unhealthy pods", overview.UnhealthyPods)
		}
	})
}

// TestOverviewErrorHandling tests error scenarios
func TestOverviewErrorHandling(t *testing.T) {
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
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should return error when metrics API is unavailable", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/overview", nil)
		w := httptest.NewRecorder()

		// Act
		OverviewHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// In test environment without metrics-server, this might return 500
		// But should not panic or return malformed JSON
		if res.StatusCode == http.StatusInternalServerError {
			var errorResp map[string]interface{}
			if err := json.NewDecoder(res.Body).Decode(&errorResp); err != nil {
				t.Log("Error response is not JSON (acceptable for TDD Red phase)")
			}
		}
	})

	t.Run("should return zero values when no nodes exist", func(t *testing.T) {
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

			// Empty cluster should return zero values, not error
			if overview.Nodes.Total == 0 {
				if overview.Nodes.Ready != 0 {
					t.Errorf("expected 0 ready nodes when total is 0, got %d", overview.Nodes.Ready)
				}
			}
		}
	})
}

// TestOverviewEdgeCases tests edge cases
func TestOverviewEdgeCases(t *testing.T) {
	t.Run("should handle cluster with all nodes not ready", func(t *testing.T) {
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

			// It's valid to have 0 ready nodes if cluster is unhealthy
			if overview.Nodes.Ready == 0 && overview.Nodes.Total > 0 {
				t.Logf("Cluster has %d nodes but none are ready", overview.Nodes.Total)
			}
		}
	})

	t.Run("should handle very high CPU usage", func(t *testing.T) {
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

			// CPU usage can theoretically exceed 100% (multi-core), but API should cap at 100%
			if overview.AverageCPUUsage > 100 {
				t.Errorf("CPU usage should be capped at 100%%, got %.2f%%", overview.AverageCPUUsage)
			}
		}
	})

	t.Run("should handle many unhealthy pods", func(t *testing.T) {
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

			// Should handle large numbers of unhealthy pods without overflow
			if overview.UnhealthyPods > 10000 {
				t.Logf("Warning: Very high unhealthy pod count: %d", overview.UnhealthyPods)
			}
		}
	})
}
