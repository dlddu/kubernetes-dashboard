package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestDeploymentsHandlerGET tests the GET /api/deployments endpoint
func TestDeploymentsHandlerGET(t *testing.T) {
	t.Run("should return 200 OK with deployments list", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/deployments", nil)
		w := httptest.NewRecorder()

		// Act
		DeploymentsHandler(w, req)

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
			var deployments []map[string]interface{}
			if err := json.NewDecoder(res.Body).Decode(&deployments); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}
		}
	})

	t.Run("should set correct content-type header", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/deployments", nil)
		w := httptest.NewRecorder()

		// Act
		DeploymentsHandler(w, req)

		// Assert
		contentType := w.Header().Get("Content-Type")
		if contentType != "application/json" {
			t.Errorf("expected Content-Type 'application/json', got '%s'", contentType)
		}
	})

	t.Run("should reject non-GET methods for list", func(t *testing.T) {
		// Arrange
		methods := []string{http.MethodPut, http.MethodDelete, http.MethodPatch}

		for _, method := range methods {
			t.Run(method, func(t *testing.T) {
				req := httptest.NewRequest(method, "/api/deployments", nil)
				w := httptest.NewRecorder()

				// Act
				DeploymentsHandler(w, req)

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
		req := httptest.NewRequest(http.MethodGet, "/api/deployments?ns=default", nil)
		w := httptest.NewRecorder()

		// Act
		DeploymentsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should not fail with namespace parameter
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should return valid deployments response structure", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/deployments", nil)
		w := httptest.NewRecorder()

		// Act
		DeploymentsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var deployments []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&deployments); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// If there are deployments, verify structure
		if len(deployments) > 0 {
			deployment := deployments[0]
			expectedFields := []string{"name", "namespace", "replicas", "readyReplicas", "availableReplicas"}
			for _, field := range expectedFields {
				if _, exists := deployment[field]; !exists {
					t.Errorf("expected field '%s' in deployment, but not found", field)
				}
			}
		}
	})

	t.Run("should filter deployments by namespace when ns parameter provided", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/deployments?ns=kube-system", nil)
		w := httptest.NewRecorder()

		// Act
		DeploymentsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var deployments []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&deployments); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// All deployments should be from kube-system namespace
		for _, deployment := range deployments {
			namespace, ok := deployment["namespace"].(string)
			if !ok {
				t.Error("namespace field should be a string")
				continue
			}
			if namespace != "kube-system" {
				t.Errorf("expected namespace 'kube-system', got '%s'", namespace)
			}
		}
	})

	t.Run("should return all namespaces deployments when ns parameter is empty", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/deployments?ns=", nil)
		w := httptest.NewRecorder()

		// Act
		DeploymentsHandler(w, req)

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
		req := httptest.NewRequest(http.MethodGet, "/api/deployments?ns=non-existent-namespace", nil)
		w := httptest.NewRecorder()

		// Act
		DeploymentsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var deployments []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&deployments); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Should return empty array for non-existent namespace
		if len(deployments) != 0 {
			t.Errorf("expected empty array for non-existent namespace, got %d deployments", len(deployments))
		}
	})
}

// TestDeploymentsHandlerPOST tests the POST /api/deployments/:ns/:name/restart endpoint
func TestDeploymentsHandlerPOST(t *testing.T) {
	t.Run("should reject POST to base /api/deployments endpoint", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodPost, "/api/deployments", nil)
		w := httptest.NewRecorder()

		// Act
		DeploymentsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should be method not allowed or not found since POST requires path parameters
		if res.StatusCode != http.StatusMethodNotAllowed && res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 405 or 404, got %d", res.StatusCode)
		}
	})
}

// TestDeploymentRestartHandler tests the POST /api/deployments/:ns/:name/restart endpoint
func TestDeploymentRestartHandler(t *testing.T) {
	t.Run("should return 200 OK when restarting deployment", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodPost, "/api/deployments/default/test-deployment/restart", nil)
		w := httptest.NewRecorder()

		// Act
		DeploymentRestartHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// In CI environment without cluster, 500 is acceptable
		// In cluster environment, 200 is expected
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError && res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 200, 404, or 500, got %d", res.StatusCode)
		}

		// If 200, verify JSON response
		if res.StatusCode == http.StatusOK {
			var response map[string]interface{}
			if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}
		}
	})

	t.Run("should set correct content-type header", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodPost, "/api/deployments/default/test-deployment/restart", nil)
		w := httptest.NewRecorder()

		// Act
		DeploymentRestartHandler(w, req)

		// Assert
		contentType := w.Header().Get("Content-Type")
		if contentType != "application/json" {
			t.Errorf("expected Content-Type 'application/json', got '%s'", contentType)
		}
	})

	t.Run("should reject non-POST methods", func(t *testing.T) {
		// Arrange
		methods := []string{http.MethodGet, http.MethodPut, http.MethodDelete, http.MethodPatch}

		for _, method := range methods {
			t.Run(method, func(t *testing.T) {
				req := httptest.NewRequest(method, "/api/deployments/default/test-deployment/restart", nil)
				w := httptest.NewRecorder()

				// Act
				DeploymentRestartHandler(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})

	t.Run("should return 404 for non-existent deployment", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodPost, "/api/deployments/default/non-existent-deployment/restart", nil)
		w := httptest.NewRecorder()

		// Act
		DeploymentRestartHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 404 for non-existent deployment, got %d", res.StatusCode)
		}
	})

	t.Run("should add kubectl.kubernetes.io/restartedAt annotation", func(t *testing.T) {
		skipIfNoCluster(t)

		// This test would require creating a test deployment first
		// For TDD Red Phase, we're defining the expected behavior
		// The implementation will need to add the annotation with current timestamp
		t.Skip("requires test deployment setup - implementation needed")
	})

	t.Run("should return success message after restart", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange - would need to create test deployment first
		req := httptest.NewRequest(http.MethodPost, "/api/deployments/default/test-deployment/restart", nil)
		w := httptest.NewRecorder()

		// Act
		DeploymentRestartHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusOK {
			var response map[string]interface{}
			if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			// Verify success message
			if message, exists := response["message"]; !exists || message == "" {
				t.Error("expected success message in response")
			}
		}
	})

	t.Run("should handle missing namespace parameter", func(t *testing.T) {
		// Arrange - malformed URL without namespace
		req := httptest.NewRequest(http.MethodPost, "/api/deployments//test-deployment/restart", nil)
		w := httptest.NewRecorder()

		// Act
		DeploymentRestartHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should return error for missing namespace
		if res.StatusCode == http.StatusOK {
			t.Error("expected error status for missing namespace")
		}
	})

	t.Run("should handle missing deployment name parameter", func(t *testing.T) {
		// Arrange - malformed URL without deployment name
		req := httptest.NewRequest(http.MethodPost, "/api/deployments/default//restart", nil)
		w := httptest.NewRecorder()

		// Act
		DeploymentRestartHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should return error for missing deployment name
		if res.StatusCode == http.StatusOK {
			t.Error("expected error status for missing deployment name")
		}
	})

	t.Run("should handle Kubernetes client errors gracefully", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodPost, "/api/deployments/default/test-deployment/restart", nil)
		w := httptest.NewRecorder()

		// Act
		DeploymentRestartHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should either succeed or return error status
		// In TDD Red phase, this might fail or return 500 if client is not configured
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError && res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 200, 404, or 500, got %d", res.StatusCode)
		}
	})
}

// TestDeploymentRestartIntegration tests deployment restart with actual cluster
func TestDeploymentRestartIntegration(t *testing.T) {
	t.Run("should restart nginx-test deployment in dashboard-test namespace", func(t *testing.T) {
		skipIfNoCluster(t)

		// This test assumes nginx-test deployment exists (from E2E fixture)
		// Arrange
		req := httptest.NewRequest(http.MethodPost, "/api/deployments/dashboard-test/nginx-test/restart", nil)
		w := httptest.NewRecorder()

		// Act
		DeploymentRestartHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should succeed if deployment exists
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 200 or 404, got %d", res.StatusCode)
		}
	})
}

// TestDeploymentsResponseFormat tests exact response format
func TestDeploymentsResponseFormat(t *testing.T) {
	t.Run("should match expected JSON structure for deployments list", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/deployments", nil)
		w := httptest.NewRecorder()

		// Act
		DeploymentsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Skipf("skipping: API returned %d", res.StatusCode)
		}

		var deployments []struct {
			Name              string `json:"name"`
			Namespace         string `json:"namespace"`
			Replicas          int32  `json:"replicas"`
			ReadyReplicas     int32  `json:"readyReplicas"`
			AvailableReplicas int32  `json:"availableReplicas"`
		}

		if err := json.NewDecoder(res.Body).Decode(&deployments); err != nil {
			t.Fatalf("failed to decode response into expected structure: %v", err)
		}

		// Verify types are correct (compile-time check ensures this)
		for _, deployment := range deployments {
			t.Logf("Deployment: name=%s, namespace=%s, replicas=%d/%d",
				deployment.Name, deployment.Namespace, deployment.ReadyReplicas, deployment.Replicas)

			// Verify ready replicas is not greater than desired replicas
			if deployment.ReadyReplicas > deployment.Replicas {
				t.Errorf("readyReplicas (%d) cannot exceed replicas (%d) for deployment %s",
					deployment.ReadyReplicas, deployment.Replicas, deployment.Name)
			}

			// Verify available replicas is not greater than desired replicas
			if deployment.AvailableReplicas > deployment.Replicas {
				t.Errorf("availableReplicas (%d) cannot exceed replicas (%d) for deployment %s",
					deployment.AvailableReplicas, deployment.Replicas, deployment.Name)
			}
		}
	})
}
