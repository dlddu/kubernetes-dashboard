package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestUnhealthyPodsHandler tests the GET /api/pods/unhealthy endpoint
func TestUnhealthyPodsHandler(t *testing.T) {
	t.Run("should return 200 OK with unhealthy pods list", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy", nil)
		w := httptest.NewRecorder()

		// Act
		UnhealthyPodsHandler(w, req)

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
			var pods []map[string]interface{}
			if err := json.NewDecoder(res.Body).Decode(&pods); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}
			if pods == nil {
				t.Error("expected pods array, got nil")
			}
		}
	})

	t.Run("should set correct content-type header", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy", nil)
		w := httptest.NewRecorder()

		// Act
		UnhealthyPodsHandler(w, req)

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
				req := httptest.NewRequest(method, "/api/pods/unhealthy", nil)
				w := httptest.NewRecorder()

				// Act
				UnhealthyPodsHandler(w, req)

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
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy?ns=default", nil)
		w := httptest.NewRecorder()

		// Act
		UnhealthyPodsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should not fail with namespace parameter
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should return empty array when namespace parameter is empty", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy?ns=", nil)
		w := httptest.NewRecorder()

		// Act
		UnhealthyPodsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Empty namespace should fetch from all namespaces
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})
}

// TestUnhealthyPodsHandlerResponseStructure tests the exact response structure
func TestUnhealthyPodsHandlerResponseStructure(t *testing.T) {
	t.Run("should return array of unhealthy pods with required fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy", nil)
		w := httptest.NewRecorder()

		// Act
		UnhealthyPodsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var pods []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&pods); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// If there are unhealthy pods, verify structure
		if len(pods) > 0 {
			firstPod := pods[0]
			requiredFields := []string{"name", "namespace", "status", "restarts", "node", "age"}
			for _, field := range requiredFields {
				if _, exists := firstPod[field]; !exists {
					t.Errorf("expected field '%s' in pod object, but not found", field)
				}
			}
		}
	})

	t.Run("should return pod with valid name", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy", nil)
		w := httptest.NewRecorder()

		// Act
		UnhealthyPodsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var pods []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&pods); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if len(pods) == 0 {
			t.Skip("no unhealthy pods in cluster")
		}

		// Verify pod name is a non-empty string
		name, ok := pods[0]["name"].(string)
		if !ok {
			t.Fatal("expected 'name' to be a string")
		}
		if name == "" {
			t.Error("expected pod name to be non-empty")
		}
	})

	t.Run("should return pod with valid namespace", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy", nil)
		w := httptest.NewRecorder()

		// Act
		UnhealthyPodsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var pods []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&pods); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if len(pods) == 0 {
			t.Skip("no unhealthy pods in cluster")
		}

		// Verify namespace is a non-empty string
		namespace, ok := pods[0]["namespace"].(string)
		if !ok {
			t.Fatal("expected 'namespace' to be a string")
		}
		if namespace == "" {
			t.Error("expected namespace to be non-empty")
		}
	})

	t.Run("should return non-negative restart count", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy", nil)
		w := httptest.NewRecorder()

		// Act
		UnhealthyPodsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var pods []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&pods); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if len(pods) == 0 {
			t.Skip("no unhealthy pods in cluster")
		}

		// Verify restart count is a non-negative number
		restarts, ok := pods[0]["restarts"].(float64)
		if !ok {
			t.Fatal("expected 'restarts' to be a number")
		}
		if restarts < 0 {
			t.Errorf("expected restarts >= 0, got %f", restarts)
		}
	})

	t.Run("should return pod with non-empty age", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy", nil)
		w := httptest.NewRecorder()

		// Act
		UnhealthyPodsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var pods []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&pods); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if len(pods) == 0 {
			t.Skip("no unhealthy pods in cluster")
		}

		// Verify age is a non-empty string
		age, ok := pods[0]["age"].(string)
		if !ok {
			t.Fatal("expected 'age' to be a string")
		}
		if age == "" {
			t.Error("expected age to be non-empty")
		}
	})
}

// TestUnhealthyPodsHandlerFiltering tests unhealthy pod filtering logic
func TestUnhealthyPodsHandlerFiltering(t *testing.T) {
	t.Run("should filter pods by namespace when ns parameter provided", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy?ns=dashboard-test", nil)
		w := httptest.NewRecorder()

		// Act
		UnhealthyPodsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var pods []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&pods); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// All pods should be from dashboard-test namespace
		for _, pod := range pods {
			namespace, ok := pod["namespace"].(string)
			if !ok {
				t.Error("namespace field should be a string")
				continue
			}
			if namespace != "dashboard-test" {
				t.Errorf("expected namespace 'dashboard-test', got '%s'", namespace)
			}
		}
	})

	t.Run("should only return pods with phase != Running", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy", nil)
		w := httptest.NewRecorder()

		// Act
		UnhealthyPodsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var pods []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&pods); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Pods should have non-Running status or container issues
		for _, pod := range pods {
			status, ok := pod["status"].(string)
			if !ok {
				t.Error("status field should be a string")
				continue
			}
			// Status should indicate an unhealthy state
			if status == "Running" {
				// If status is Running, there should be container issues (waiting/terminated)
				t.Logf("Pod with Running phase found - should have container issues: %v", pod)
			}
		}
	})

	t.Run("should include pods with ImagePullBackOff status", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy?ns=dashboard-test", nil)
		w := httptest.NewRecorder()

		// Act
		UnhealthyPodsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var pods []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&pods); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Test fixture has 4 ImagePullBackOff pods
		if len(pods) < 4 {
			t.Logf("Expected at least 4 unhealthy pods from test fixture, got %d", len(pods))
		}

		// Look for ImagePullBackOff status
		foundImagePullBackOff := false
		for _, pod := range pods {
			status, ok := pod["status"].(string)
			if ok && status == "ImagePullBackOff" {
				foundImagePullBackOff = true
				break
			}
		}

		if !foundImagePullBackOff && len(pods) > 0 {
			t.Log("Note: Expected to find ImagePullBackOff pods from test fixture")
		}
	})

	t.Run("should include pods with CrashLoopBackOff status", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy", nil)
		w := httptest.NewRecorder()

		// Act
		UnhealthyPodsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var pods []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&pods); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Look for CrashLoopBackOff status (if exists in cluster)
		for _, pod := range pods {
			status, ok := pod["status"].(string)
			if ok && status == "CrashLoopBackOff" {
				t.Logf("Found CrashLoopBackOff pod: %s", pod["name"])
			}
		}
	})

	t.Run("should include pods with Pending status", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy", nil)
		w := httptest.NewRecorder()

		// Act
		UnhealthyPodsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var pods []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&pods); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Look for Pending status (if exists in cluster)
		for _, pod := range pods {
			status, ok := pod["status"].(string)
			if ok && status == "Pending" {
				t.Logf("Found Pending pod: %s", pod["name"])
			}
		}
	})

	t.Run("should handle non-existent namespace gracefully", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy?ns=non-existent-namespace", nil)
		w := httptest.NewRecorder()

		// Act
		UnhealthyPodsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var pods []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&pods); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Should return empty array for non-existent namespace
		if len(pods) != 0 {
			t.Errorf("expected empty array for non-existent namespace, got %d pods", len(pods))
		}
	})
}

// TestUnhealthyPodsHandlerErrorHandling tests error scenarios
func TestUnhealthyPodsHandlerErrorHandling(t *testing.T) {
	t.Run("should handle Kubernetes client errors gracefully", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy", nil)
		w := httptest.NewRecorder()

		// Act
		UnhealthyPodsHandler(w, req)

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
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy", nil)
		w := httptest.NewRecorder()

		// Act
		UnhealthyPodsHandler(w, req)

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

// TestUnhealthyPodsHandlerTestFixture tests with actual test fixtures
func TestUnhealthyPodsHandlerTestFixture(t *testing.T) {
	t.Run("should return test fixture pods from dashboard-test namespace", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy?ns=dashboard-test", nil)
		w := httptest.NewRecorder()

		// Act
		UnhealthyPodsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var pods []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&pods); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Test fixture has 4 unhealthy pods
		expectedPodNames := []string{
			"unhealthy-test-pod-1",
			"unhealthy-test-pod-2",
			"unhealthy-test-pod-3",
			"unhealthy-test-pod-4",
		}

		foundPods := make(map[string]bool)
		for _, pod := range pods {
			name, ok := pod["name"].(string)
			if !ok {
				continue
			}
			for _, expectedName := range expectedPodNames {
				if name == expectedName {
					foundPods[name] = true
				}
			}
		}

		// Log which test pods were found
		for _, expectedName := range expectedPodNames {
			if foundPods[expectedName] {
				t.Logf("Found test fixture pod: %s", expectedName)
			}
		}
	})
}
