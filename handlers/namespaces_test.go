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

		if res.StatusCode != http.StatusOK {
			t.Errorf("expected status 200, got %d", res.StatusCode)
		}

		var namespacesResp NamespacesResponse
		if err := json.NewDecoder(res.Body).Decode(&namespacesResp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if namespacesResp.Items == nil {
			t.Error("expected items array to be non-nil")
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

	t.Run("should return namespaces with name and status fields", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/namespaces", nil)
		w := httptest.NewRecorder()

		// Act
		NamespacesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var namespacesResp NamespacesResponse
		if err := json.NewDecoder(res.Body).Decode(&namespacesResp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if len(namespacesResp.Items) > 0 {
			namespace := namespacesResp.Items[0]
			if namespace.Name == "" {
				t.Error("expected namespace name to be non-empty")
			}
			if namespace.Status == "" {
				t.Error("expected namespace status to be non-empty")
			}
		}
	})

	t.Run("should include default namespace in the list", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/namespaces", nil)
		w := httptest.NewRecorder()

		// Act
		NamespacesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var namespacesResp NamespacesResponse
		if err := json.NewDecoder(res.Body).Decode(&namespacesResp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Check if default namespace exists
		hasDefault := false
		for _, ns := range namespacesResp.Items {
			if ns.Name == "default" {
				hasDefault = true
				if ns.Status != "Active" {
					t.Errorf("expected default namespace status to be 'Active', got '%s'", ns.Status)
				}
				break
			}
		}

		if !hasDefault {
			t.Error("expected default namespace in the list")
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

	t.Run("should handle kubernetes client errors gracefully", func(t *testing.T) {
		// Arrange - when k8s client is not available or has errors
		req := httptest.NewRequest(http.MethodGet, "/api/namespaces", nil)
		w := httptest.NewRecorder()

		// Act
		NamespacesHandler(w, req)

		// Assert - should return valid JSON response even on error
		res := w.Result()
		defer res.Body.Close()

		// Either 200 with empty list or 500 with error message
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}

		var result map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
			t.Fatalf("response should be valid JSON: %v", err)
		}
	})

	t.Run("should return empty items array when no namespaces exist", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/namespaces", nil)
		w := httptest.NewRecorder()

		// Act
		NamespacesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var namespacesResp NamespacesResponse
		if err := json.NewDecoder(res.Body).Decode(&namespacesResp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Items should be an array (even if empty), not null
		if namespacesResp.Items == nil {
			t.Error("expected items to be an empty array, not nil")
		}
	})
}
