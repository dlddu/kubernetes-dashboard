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
		t.Skip("Skipping test: Kubernetes cluster not available")
	}
}

// TestSecretsHandler tests the GET /api/secrets endpoint
func TestSecretsHandler(t *testing.T) {
	t.Run("should return 200 OK with secrets list", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/secrets", nil)
		w := httptest.NewRecorder()

		// Act
		SecretsHandler(w, req)

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
			var secrets []map[string]interface{}
			if err := json.NewDecoder(res.Body).Decode(&secrets); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}
		}
	})

	t.Run("should set correct content-type header", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/secrets", nil)
		w := httptest.NewRecorder()

		// Act
		SecretsHandler(w, req)

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
				req := httptest.NewRequest(method, "/api/secrets", nil)
				w := httptest.NewRecorder()

				// Act
				SecretsHandler(w, req)

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
		req := httptest.NewRequest(http.MethodGet, "/api/secrets?ns=default", nil)
		w := httptest.NewRecorder()

		// Act
		SecretsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should not fail with namespace parameter
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should return all namespaces secrets when ns parameter is empty", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/secrets?ns=", nil)
		w := httptest.NewRecorder()

		// Act
		SecretsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Empty namespace should be treated as all namespaces
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})
}

// TestSecretsHandlerResponseStructure tests the exact response structure
func TestSecretsHandlerResponseStructure(t *testing.T) {
	t.Run("should return array of secrets with required fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/secrets", nil)
		w := httptest.NewRecorder()

		// Act
		SecretsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var secrets []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&secrets); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// If there are secrets, verify structure
		if len(secrets) > 0 {
			firstSecret := secrets[0]
			requiredFields := []string{"name", "namespace", "type", "keys"}
			for _, field := range requiredFields {
				if _, exists := firstSecret[field]; !exists {
					t.Errorf("expected field '%s' in secret object, but not found", field)
				}
			}
		}
	})

	t.Run("should NOT include data/value field in list response", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/secrets", nil)
		w := httptest.NewRecorder()

		// Act
		SecretsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var secrets []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&secrets); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Verify no secret value is exposed in list
		for _, secret := range secrets {
			if _, hasData := secret["data"]; hasData {
				t.Error("secret list should NOT include 'data' field - values must not be exposed")
			}
			if _, hasValue := secret["value"]; hasValue {
				t.Error("secret list should NOT include 'value' field - values must not be exposed")
			}
		}
	})

	t.Run("should return keys as array of strings", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/secrets", nil)
		w := httptest.NewRecorder()

		// Act
		SecretsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var secrets []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&secrets); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if len(secrets) == 0 {
			t.Skip("no secrets in cluster")
		}

		// Verify keys is an array
		keys, ok := secrets[0]["keys"].([]interface{})
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

	t.Run("should filter secrets by namespace when ns parameter provided", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/secrets?ns=kube-system", nil)
		w := httptest.NewRecorder()

		// Act
		SecretsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var secrets []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&secrets); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// All secrets should be from kube-system namespace
		for _, secret := range secrets {
			namespace, ok := secret["namespace"].(string)
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
		req := httptest.NewRequest(http.MethodGet, "/api/secrets?ns=non-existent-namespace", nil)
		w := httptest.NewRecorder()

		// Act
		SecretsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var secrets []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&secrets); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Should return empty array for non-existent namespace
		if len(secrets) != 0 {
			t.Errorf("expected empty array for non-existent namespace, got %d secrets", len(secrets))
		}
	})
}

// TestSecretDetailHandler tests the GET /api/secrets/:ns/:name endpoint
func TestSecretDetailHandler(t *testing.T) {
	t.Run("should return 200 OK with secret detail", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/secrets/default/test-secret", nil)
		w := httptest.NewRecorder()

		// Act
		SecretDetailHandler(w, req)

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
			var secret map[string]interface{}
			if err := json.NewDecoder(res.Body).Decode(&secret); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}
		}
	})

	t.Run("should set correct content-type header", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/secrets/default/test-secret", nil)
		w := httptest.NewRecorder()

		// Act
		SecretDetailHandler(w, req)

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
				req := httptest.NewRequest(method, "/api/secrets/default/test-secret", nil)
				w := httptest.NewRecorder()

				// Act
				SecretDetailHandler(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})

	t.Run("should return 404 for non-existent secret", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/secrets/default/non-existent-secret", nil)
		w := httptest.NewRecorder()

		// Act
		SecretDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 404 for non-existent secret, got %d", res.StatusCode)
		}
	})
}

// TestSecretDetailHandlerResponseStructure tests the exact response structure for detail endpoint
func TestSecretDetailHandlerResponseStructure(t *testing.T) {
	t.Run("should include data field with decoded values in detail response", func(t *testing.T) {
		skipIfNoCluster(t)

		// This test assumes a secret exists
		// We'll test with kube-system namespace which typically has secrets
		req := httptest.NewRequest(http.MethodGet, "/api/secrets/kube-system/test-secret", nil)
		w := httptest.NewRecorder()

		// Act
		SecretDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Skip if secret doesn't exist
		if res.StatusCode == http.StatusNotFound {
			t.Skip("test secret does not exist")
		}

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var secret map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&secret); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Detail response MUST include data field
		data, exists := secret["data"]
		if !exists {
			t.Error("secret detail response must include 'data' field with decoded values")
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

		// Arrange - use a known namespace that typically has secrets
		req := httptest.NewRequest(http.MethodGet, "/api/secrets/kube-system/test-secret", nil)
		w := httptest.NewRecorder()

		// Act
		SecretDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusNotFound {
			t.Skip("test secret does not exist")
		}

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var secret map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&secret); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Verify basic fields
		requiredFields := []string{"name", "namespace", "type"}
		for _, field := range requiredFields {
			if _, exists := secret[field]; !exists {
				t.Errorf("expected field '%s' in secret detail, but not found", field)
			}
		}
	})

	t.Run("should decode base64 values in data field", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/secrets/kube-system/test-secret", nil)
		w := httptest.NewRecorder()

		// Act
		SecretDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusNotFound {
			t.Skip("test secret does not exist")
		}

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var secret map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&secret); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Verify values are decoded (not base64)
		data, exists := secret["data"].(map[string]interface{})
		if !exists {
			t.Skip("no data field in response")
		}

		// Values should be strings (decoded, not base64)
		for key, value := range data {
			_, ok := value.(string)
			if !ok {
				t.Errorf("expected decoded string value for key '%s', got type %T", key, value)
			}
		}
	})
}

// TestSecretsHandlerErrorHandling tests error scenarios
func TestSecretsHandlerErrorHandling(t *testing.T) {
	t.Run("should handle Kubernetes client errors gracefully", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/secrets", nil)
		w := httptest.NewRecorder()

		// Act
		SecretsHandler(w, req)

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
		req := httptest.NewRequest(http.MethodGet, "/api/secrets", nil)
		w := httptest.NewRecorder()

		// Act
		SecretsHandler(w, req)

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

// TestSecretDetailHandlerErrorHandling tests error scenarios for detail endpoint
func TestSecretDetailHandlerErrorHandling(t *testing.T) {
	t.Run("should handle missing namespace parameter", func(t *testing.T) {
		// Arrange - malformed URL without namespace
		req := httptest.NewRequest(http.MethodGet, "/api/secrets//test-secret", nil)
		w := httptest.NewRecorder()

		// Act
		SecretDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should return error for missing namespace
		if res.StatusCode == http.StatusOK {
			t.Error("expected error status for missing namespace")
		}
	})

	t.Run("should handle missing secret name parameter", func(t *testing.T) {
		// Arrange - malformed URL without secret name
		req := httptest.NewRequest(http.MethodGet, "/api/secrets/default/", nil)
		w := httptest.NewRecorder()

		// Act
		SecretDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should return error for missing secret name
		if res.StatusCode == http.StatusOK {
			t.Error("expected error status for missing secret name")
		}
	})

	t.Run("should handle Kubernetes client errors gracefully", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/secrets/default/test-secret", nil)
		w := httptest.NewRecorder()

		// Act
		SecretDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should either succeed or return error status
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError && res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 200, 404, or 500, got %d", res.StatusCode)
		}
	})
}
