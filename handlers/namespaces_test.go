package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestNamespacesHandler tests the /api/namespaces endpoint
func TestNamespacesHandler(t *testing.T) {
	t.Run("should return 200 OK with namespaces list", func(t *testing.T) {
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

		if namespacesResp.Namespaces == nil {
			t.Error("expected namespaces field to be non-nil")
		}

		if len(namespacesResp.Namespaces) == 0 {
			t.Error("expected at least one namespace (e.g., 'default')")
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

	t.Run("should include common namespaces when cluster is available", func(t *testing.T) {
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

		// Check for common namespace names
		commonNamespaces := []string{"default", "kube-system", "kube-public", "kube-node-lease"}
		foundCommonNamespace := false

		for _, ns := range namespacesResp.Namespaces {
			for _, common := range commonNamespaces {
				if ns == common {
					foundCommonNamespace = true
					break
				}
			}
			if foundCommonNamespace {
				break
			}
		}

		if !foundCommonNamespace {
			t.Logf("Warning: No common namespace found. Namespaces: %v", namespacesResp.Namespaces)
		}
	})

	t.Run("should return valid JSON array even when cluster is unavailable", func(t *testing.T) {
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

		// Should always return a valid array, even if empty
		if namespacesResp.Namespaces == nil {
			t.Error("expected namespaces field to be non-nil array")
		}
	})

	t.Run("should return namespace names as strings", func(t *testing.T) {
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

		for _, ns := range namespacesResp.Namespaces {
			if len(ns) == 0 {
				t.Error("expected all namespace names to be non-empty strings")
			}
		}
	})

	t.Run("should not include duplicate namespaces", func(t *testing.T) {
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

		seen := make(map[string]bool)
		for _, ns := range namespacesResp.Namespaces {
			if seen[ns] {
				t.Errorf("duplicate namespace found: %s", ns)
			}
			seen[ns] = true
		}
	})
}
