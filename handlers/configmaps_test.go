package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestConfigMapsHandler tests the GET /api/configmaps endpoint
func TestConfigMapsHandler(t *testing.T) {
	t.Run("should return 200 OK with configmaps list", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/configmaps", nil)
		w := httptest.NewRecorder()

		// Act
		ConfigMapsHandler(w, req)

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
			var configMaps []map[string]interface{}
			if err := json.NewDecoder(res.Body).Decode(&configMaps); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}
		}
	})

	t.Run("should set correct content-type header", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/configmaps", nil)
		w := httptest.NewRecorder()

		// Act
		ConfigMapsHandler(w, req)

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
				req := httptest.NewRequest(method, "/api/configmaps", nil)
				w := httptest.NewRecorder()

				// Act
				ConfigMapsHandler(w, req)

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
		req := httptest.NewRequest(http.MethodGet, "/api/configmaps?ns=default", nil)
		w := httptest.NewRecorder()

		// Act
		ConfigMapsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should not fail with namespace parameter
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should return all namespaces configmaps when ns parameter is empty", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/configmaps?ns=", nil)
		w := httptest.NewRecorder()

		// Act
		ConfigMapsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Empty namespace should be treated as all namespaces
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})
}

// TestConfigMapsHandlerResponseStructure tests the exact response structure
func TestConfigMapsHandlerResponseStructure(t *testing.T) {
	t.Run("should return array of configmaps with required fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/configmaps", nil)
		w := httptest.NewRecorder()

		// Act
		ConfigMapsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var configMaps []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&configMaps); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// If there are configmaps, verify structure
		if len(configMaps) > 0 {
			firstConfigMap := configMaps[0]
			requiredFields := []string{"name", "namespace", "keys"}
			for _, field := range requiredFields {
				if _, exists := firstConfigMap[field]; !exists {
					t.Errorf("expected field '%s' in configmap object, but not found", field)
				}
			}
		}
	})

	t.Run("should NOT include data field in list response", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/configmaps", nil)
		w := httptest.NewRecorder()

		// Act
		ConfigMapsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var configMaps []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&configMaps); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Verify values are not included in the list response
		for _, configMap := range configMaps {
			if _, hasData := configMap["data"]; hasData {
				t.Error("configmap list should NOT include 'data' field - only keys are exposed in list view")
			}
		}
	})

	t.Run("should return keys as array of strings", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/configmaps", nil)
		w := httptest.NewRecorder()

		// Act
		ConfigMapsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var configMaps []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&configMaps); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if len(configMaps) == 0 {
			t.Skip("no configmaps in cluster")
		}

		// Verify keys is an array
		keys, ok := configMaps[0]["keys"].([]interface{})
		if !ok {
			t.Fatal("expected 'keys' to be an array")
		}

		// Verify keys contain strings
		if len(keys) > 0 {
			_, ok := keys[0].(string)
			if !ok {
				t.Error("expected keys array to contain strings")
			}
		}
	})

	t.Run("should filter configmaps by namespace when ns parameter provided", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/configmaps?ns=kube-system", nil)
		w := httptest.NewRecorder()

		// Act
		ConfigMapsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var configMaps []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&configMaps); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// All configmaps should be from kube-system namespace
		for _, configMap := range configMaps {
			namespace, ok := configMap["namespace"].(string)
			if !ok {
				t.Error("namespace field should be a string")
				continue
			}
			if namespace != "kube-system" {
				t.Errorf("expected namespace 'kube-system', got '%s'", namespace)
			}
		}
	})

	t.Run("should handle non-existent namespace gracefully", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/configmaps?ns=non-existent-namespace", nil)
		w := httptest.NewRecorder()

		// Act
		ConfigMapsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var configMaps []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&configMaps); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Should return empty array for non-existent namespace
		if len(configMaps) != 0 {
			t.Errorf("expected empty array for non-existent namespace, got %d configmaps", len(configMaps))
		}
	})
}

// TestConfigMapDetailHandler tests the GET /api/configmaps/:ns/:name endpoint
func TestConfigMapDetailHandler(t *testing.T) {
	t.Run("should return 200 OK with configmap detail", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/configmaps/default/test-config", nil)
		w := httptest.NewRecorder()

		// Act
		ConfigMapDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// In CI environment without cluster, 500 or 404 is acceptable
		// In cluster environment, 200 or 404 is expected
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError && res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 200, 404, or 500, got %d", res.StatusCode)
		}

		// If 200, verify JSON response
		if res.StatusCode == http.StatusOK {
			var configMap map[string]interface{}
			if err := json.NewDecoder(res.Body).Decode(&configMap); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}
		}
	})

	t.Run("should set correct content-type header", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/configmaps/default/test-config", nil)
		w := httptest.NewRecorder()

		// Act
		ConfigMapDetailHandler(w, req)

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
				req := httptest.NewRequest(method, "/api/configmaps/default/test-config", nil)
				w := httptest.NewRecorder()

				// Act
				ConfigMapDetailHandler(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})

	t.Run("should return 404 for non-existent configmap", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/configmaps/default/non-existent-configmap", nil)
		w := httptest.NewRecorder()

		// Act
		ConfigMapDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 404 for non-existent configmap, got %d", res.StatusCode)
		}
	})
}

// TestConfigMapDetailHandlerResponseStructure tests the exact response structure for detail endpoint
func TestConfigMapDetailHandlerResponseStructure(t *testing.T) {
	t.Run("should include data field with values in detail response", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/configmaps/dashboard-test/test-config", nil)
		w := httptest.NewRecorder()

		// Act
		ConfigMapDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Skip if configmap doesn't exist
		if res.StatusCode == http.StatusNotFound {
			t.Skip("test configmap does not exist")
		}

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var configMap map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&configMap); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Detail response MUST include data field
		data, exists := configMap["data"]
		if !exists {
			t.Error("configmap detail response must include 'data' field with values")
		}

		// Verify data is a map
		if data != nil {
			_, ok := data.(map[string]interface{})
			if !ok {
				t.Error("'data' field should be a map of key-value pairs")
			}
		}
	})

	t.Run("should include basic metadata in detail response", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/configmaps/dashboard-test/test-config", nil)
		w := httptest.NewRecorder()

		// Act
		ConfigMapDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusNotFound {
			t.Skip("test configmap does not exist")
		}

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var configMap map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&configMap); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Verify basic fields
		requiredFields := []string{"name", "namespace"}
		for _, field := range requiredFields {
			if _, exists := configMap[field]; !exists {
				t.Errorf("expected field '%s' in configmap detail, but not found", field)
			}
		}
	})
}

// TestConfigMapDetailHandlerErrorHandling tests error scenarios for detail endpoint
func TestConfigMapDetailHandlerErrorHandling(t *testing.T) {
	t.Run("should handle missing namespace parameter", func(t *testing.T) {
		// Arrange - malformed URL without namespace
		req := httptest.NewRequest(http.MethodGet, "/api/configmaps//test-config", nil)
		w := httptest.NewRecorder()

		// Act
		ConfigMapDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should return error for missing namespace
		if res.StatusCode == http.StatusOK {
			t.Error("expected error status for missing namespace")
		}
	})

	t.Run("should handle missing configmap name parameter", func(t *testing.T) {
		// Arrange - malformed URL without configmap name
		req := httptest.NewRequest(http.MethodGet, "/api/configmaps/default/", nil)
		w := httptest.NewRecorder()

		// Act
		ConfigMapDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should return error for missing configmap name
		if res.StatusCode == http.StatusOK {
			t.Error("expected error status for missing configmap name")
		}
	})

	t.Run("should handle Kubernetes client errors gracefully", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/configmaps/default/test-config", nil)
		w := httptest.NewRecorder()

		// Act
		ConfigMapDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should either succeed or return error status
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError && res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 200, 404, or 500, got %d", res.StatusCode)
		}
	})
}

// TestConfigMapsHandlerErrorHandling tests error scenarios
func TestConfigMapsHandlerErrorHandling(t *testing.T) {
	t.Run("should return valid JSON even on error", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/configmaps", nil)
		w := httptest.NewRecorder()

		// Act
		ConfigMapsHandler(w, req)

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
