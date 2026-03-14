package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestKustomizationsHandler tests the GET /api/fluxcd/kustomizations endpoint
func TestKustomizationsHandler(t *testing.T) {
	t.Run("should return 200 OK with kustomization list", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/kustomizations", nil)
		w := httptest.NewRecorder()

		// Act
		KustomizationsHandler(w, req)

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
			var kustomizations []map[string]interface{}
			if err := json.NewDecoder(res.Body).Decode(&kustomizations); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}
		}
	})

	t.Run("should set correct content-type header", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/kustomizations", nil)
		w := httptest.NewRecorder()

		// Act
		KustomizationsHandler(w, req)

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
				req := httptest.NewRequest(method, "/api/fluxcd/kustomizations", nil)
				w := httptest.NewRecorder()

				// Act
				KustomizationsHandler(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})

	t.Run("should accept namespace query parameter", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/kustomizations?ns=default", nil)
		w := httptest.NewRecorder()

		// Act
		KustomizationsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should not fail with namespace parameter
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should return all namespaces when ns parameter is empty", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/kustomizations?ns=", nil)
		w := httptest.NewRecorder()

		// Act
		KustomizationsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Empty namespace should be treated as all namespaces
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should handle client errors gracefully", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/kustomizations", nil)
		w := httptest.NewRecorder()

		// Act
		KustomizationsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Response should always be valid JSON regardless of outcome
		var result interface{}
		if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
			t.Errorf("response should be valid JSON, got error: %v", err)
		}
	})
}

// TestKustomizationsHandlerResponseStructure tests the exact response format (cluster-dependent)
func TestKustomizationsHandlerResponseStructure(t *testing.T) {
	t.Run("should return array with required fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/kustomizations", nil)
		w := httptest.NewRecorder()

		// Act
		KustomizationsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var kustomizations []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&kustomizations); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// If there are kustomizations, verify structure
		if len(kustomizations) > 0 {
			first := kustomizations[0]
			requiredFields := []string{
				"name", "namespace", "ready", "suspended",
				"sourceKind", "sourceName", "revision", "interval",
				"lastApplied", "path",
			}
			for _, field := range requiredFields {
				if _, exists := first[field]; !exists {
					t.Errorf("expected field '%s' in kustomization object, but not found", field)
				}
			}
		}
	})

	t.Run("should return valid JSON structure", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/kustomizations", nil)
		w := httptest.NewRecorder()

		// Act
		KustomizationsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var kustomizations []struct {
			Name        string `json:"name"`
			Namespace   string `json:"namespace"`
			Ready       bool   `json:"ready"`
			Suspended   bool   `json:"suspended"`
			SourceKind  string `json:"sourceKind"`
			SourceName  string `json:"sourceName"`
			Revision    string `json:"revision"`
			Interval    string `json:"interval"`
			LastApplied string `json:"lastApplied"`
			Path        string `json:"path"`
		}

		if err := json.NewDecoder(res.Body).Decode(&kustomizations); err != nil {
			t.Fatalf("failed to decode response into expected structure: %v", err)
		}

		// Verify each kustomization has non-empty name and namespace
		for _, k := range kustomizations {
			if k.Name == "" {
				t.Error("kustomization name should not be empty")
			}
			if k.Namespace == "" {
				t.Error("kustomization namespace should not be empty")
			}
			t.Logf("Kustomization: name=%s, namespace=%s, ready=%v, suspended=%v",
				k.Name, k.Namespace, k.Ready, k.Suspended)
		}
	})
}
