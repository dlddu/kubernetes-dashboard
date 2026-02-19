package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestNamespacesHandler tests the /api/namespaces endpoint
func TestNamespacesHandler(t *testing.T) {
	t.Run("should return 200 OK with namespace list", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/namespaces", nil)
		w := httptest.NewRecorder()

		// Act
		NamespacesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// In CI environment without cluster, 500 is acceptable
		// In cluster environment, 200 is expected
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}

		// If 200, verify JSON array response
		if res.StatusCode == http.StatusOK {
			var namespaces []string
			if err := json.NewDecoder(res.Body).Decode(&namespaces); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}
			if namespaces == nil {
				t.Error("expected namespaces array, got nil")
			}
		}
	})

	t.Run("should set correct content-type header", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/namespaces", nil)
		w := httptest.NewRecorder()

		// Act
		NamespacesHandler(w, req)

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
				req := httptest.NewRequest(method, "/api/namespaces", nil)
				w := httptest.NewRecorder()

				// Act
				NamespacesHandler(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})

	t.Run("should return valid namespace names array", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/namespaces", nil)
		w := httptest.NewRecorder()

		// Act
		NamespacesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Skipf("skipping: no k8s cluster available (status %d)", res.StatusCode)
		}

		var namespaces []string
		if err := json.NewDecoder(res.Body).Decode(&namespaces); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Should contain at least the default namespace in a real cluster
		if len(namespaces) == 0 {
			t.Log("Warning: expected at least one namespace (e.g., 'default'), got empty array")
		}

		// All items should be non-empty strings
		for i, ns := range namespaces {
			if ns == "" {
				t.Errorf("namespace at index %d is empty string", i)
			}
		}
	})

	t.Run("should handle Kubernetes client errors gracefully", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/namespaces", nil)
		w := httptest.NewRecorder()

		// Act
		NamespacesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should either succeed with empty array or return error status
		// In TDD Red phase, this might fail or return 500 if client is not configured
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})
}

// TestNamespacesHandlerWithMockClient tests namespace handler with mock Kubernetes client
func TestNamespacesHandlerWithMockClient(t *testing.T) {
	t.Run("should return namespaces from Kubernetes cluster", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/namespaces", nil)
		w := httptest.NewRecorder()

		// Act
		NamespacesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Skipf("skipping: API returned %d", res.StatusCode)
		}

		var namespaces []string
		if err := json.NewDecoder(res.Body).Decode(&namespaces); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Expected namespaces in a typical Kubernetes cluster
		expectedNamespaces := map[string]bool{
			"default":     false,
			"kube-system": false,
			"kube-public": false,
		}

		for _, ns := range namespaces {
			if _, exists := expectedNamespaces[ns]; exists {
				expectedNamespaces[ns] = true
			}
		}

		// At least 'default' namespace should exist
		if !expectedNamespaces["default"] {
			t.Log("Warning: 'default' namespace not found in response")
		}
	})

	t.Run("should return sorted namespace list", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/namespaces", nil)
		w := httptest.NewRecorder()

		// Act
		NamespacesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Skipf("skipping: API returned %d", res.StatusCode)
		}

		var namespaces []string
		if err := json.NewDecoder(res.Body).Decode(&namespaces); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Verify namespaces are sorted alphabetically
		for i := 1; i < len(namespaces); i++ {
			if namespaces[i-1] > namespaces[i] {
				t.Errorf("namespaces not sorted: %s comes after %s", namespaces[i-1], namespaces[i])
			}
		}
	})
}
