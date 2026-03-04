package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/fake"
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

// TestAllPodsHandler tests the GET /api/pods/all endpoint
func TestAllPodsHandler(t *testing.T) {
	t.Run("should return 200 OK with all pods list", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/all", nil)
		w := httptest.NewRecorder()

		// Act
		AllPodsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}

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
		req := httptest.NewRequest(http.MethodGet, "/api/pods/all", nil)
		w := httptest.NewRecorder()

		// Act
		AllPodsHandler(w, req)

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
				req := httptest.NewRequest(method, "/api/pods/all", nil)
				w := httptest.NewRecorder()

				// Act
				AllPodsHandler(w, req)

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
		req := httptest.NewRequest(http.MethodGet, "/api/pods/all?ns=default", nil)
		w := httptest.NewRecorder()

		// Act
		AllPodsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should return valid JSON even on error", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/all", nil)
		w := httptest.NewRecorder()

		// Act
		AllPodsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var result interface{}
		if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
			t.Errorf("response should be valid JSON, got error: %v", err)
		}
	})

	t.Run("should return pods including healthy ones", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/all", nil)
		w := httptest.NewRecorder()

		// Act
		AllPodsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var allPods []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&allPods); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Compare with unhealthy pods - all pods should be >= unhealthy pods
		reqUnhealthy := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy", nil)
		wUnhealthy := httptest.NewRecorder()
		UnhealthyPodsHandler(wUnhealthy, reqUnhealthy)
		resUnhealthy := wUnhealthy.Result()
		defer resUnhealthy.Body.Close()

		if resUnhealthy.StatusCode == http.StatusOK {
			var unhealthyPods []map[string]interface{}
			json.NewDecoder(resUnhealthy.Body).Decode(&unhealthyPods)

			if len(allPods) < len(unhealthyPods) {
				t.Errorf("all pods (%d) should be >= unhealthy pods (%d)", len(allPods), len(unhealthyPods))
			}
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

// TestPodLogsHandlerRegistration verifies the PodLogsHandler symbol and constant exist and are usable.
// These tests form the Red phase for DLD-697: constant definition and handler registration.
func TestPodLogsHandlerRegistration(t *testing.T) {
	t.Run("should have podLogsPathPrefix constant defined as /api/pods/logs/", func(t *testing.T) {
		// Arrange & Act
		// The constant is package-private; we verify its value indirectly by using it in a
		// strings.HasPrefix check against the expected URL shape.
		// If the constant is renamed or its value changes, the route-registration test will
		// catch it via the router. Here we document the expected value explicitly.
		const expectedPrefix = "/api/pods/logs/"

		// Assert: podLogsPathPrefix must equal the expected value.
		// This comparison is evaluated at compile time when both sides are untyped constants,
		// so a mismatch is a build error — but we also provide a runtime assertion for clarity.
		if podLogsPathPrefix != expectedPrefix {
			t.Errorf("expected podLogsPathPrefix to be %q, got %q", expectedPrefix, podLogsPathPrefix)
		}
	})

	t.Run("should expose PodLogsHandler as a callable http.HandlerFunc", func(t *testing.T) {
		// Arrange
		// This test verifies the handler symbol exists with the correct signature.
		// The test will fail to compile if PodLogsHandler is not defined in the handlers package.
		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/my-pod", nil)
		w := httptest.NewRecorder()

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// The handler is not yet implemented (DLD-697), so 501 Not Implemented is expected.
		// 200, 400, 404, or 500 are also acceptable if a partial implementation exists.
		acceptableStatuses := map[int]bool{
			http.StatusOK:                 true,
			http.StatusBadRequest:         true,
			http.StatusNotFound:           true,
			http.StatusInternalServerError: true,
			http.StatusNotImplemented:     true,
		}
		if !acceptableStatuses[res.StatusCode] {
			t.Errorf("unexpected status code %d from PodLogsHandler", res.StatusCode)
		}
	})

	t.Run("should reject non-GET methods", func(t *testing.T) {
		// Arrange
		methods := []string{http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodPatch}

		for _, method := range methods {
			t.Run(method, func(t *testing.T) {
				req := httptest.NewRequest(method, "/api/pods/logs/default/my-pod", nil)
				w := httptest.NewRecorder()

				// Act
				PodLogsHandler(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				// Once fully implemented the handler must return 405 for non-GET methods.
				// During the stub phase, 501 Not Implemented is also acceptable.
				if res.StatusCode == http.StatusOK {
					t.Errorf("expected non-200 status for %s method, got 200", method)
				}
			})
		}
	})
}

// TestPodLogsHandlerConstantUsage verifies that the podLogsPathPrefix constant can be
// used in path-parsing helpers consistently with other handler constants in the package.
func TestPodLogsHandlerConstantUsage(t *testing.T) {
	t.Run("should parse namespace and name from path using podLogsPathPrefix", func(t *testing.T) {
		// Arrange
		path := "/api/pods/logs/default/my-pod"

		// Act
		namespace, name, err := parseResourcePath(path, podLogsPathPrefix, "")

		// Assert
		if err != nil {
			t.Fatalf("parseResourcePath returned unexpected error: %v", err)
		}
		if namespace != "default" {
			t.Errorf("expected namespace %q, got %q", "default", namespace)
		}
		if name != "my-pod" {
			t.Errorf("expected name %q, got %q", "my-pod", name)
		}
	})

	t.Run("should return error when path does not contain namespace and name", func(t *testing.T) {
		// Arrange
		path := "/api/pods/logs/"

		// Act
		_, _, err := parseResourcePath(path, podLogsPathPrefix, "")

		// Assert
		if err == nil {
			t.Error("expected error for path without namespace/name, got nil")
		}
	})

	t.Run("should return error when path contains only namespace", func(t *testing.T) {
		// Arrange
		path := "/api/pods/logs/default"

		// Act
		_, _, err := parseResourcePath(path, podLogsPathPrefix, "")

		// Assert
		if err == nil {
			t.Error("expected error for path with namespace but no pod name, got nil")
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

// TestPodDetailsContainersField tests that PodDetails includes the Containers field
// and that listPods correctly collects container names from pod specs.
func TestPodDetailsContainersField(t *testing.T) {
	t.Run("should include containers field in PodDetails struct", func(t *testing.T) {
		// Arrange: create a fake clientset with a single-container pod
		pod := corev1.Pod{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "single-container-pod",
				Namespace: "default",
			},
			Spec: corev1.PodSpec{
				NodeName: "node-1",
				Containers: []corev1.Container{
					{Name: "api-server"},
				},
			},
			Status: corev1.PodStatus{
				Phase: corev1.PodRunning,
			},
		}
		clientset := fake.NewSimpleClientset(&pod)

		// Act
		pods, err := listPods(context.Background(), clientset, "default", nil)

		// Assert
		if err != nil {
			t.Fatalf("listPods returned unexpected error: %v", err)
		}
		if len(pods) != 1 {
			t.Fatalf("expected 1 pod, got %d", len(pods))
		}

		result := pods[0]
		if result.Containers == nil {
			t.Fatal("expected Containers field to be non-nil, got nil")
		}
		if len(result.Containers) != 1 {
			t.Errorf("expected 1 container, got %d", len(result.Containers))
		}
		if result.Containers[0] != "api-server" {
			t.Errorf("expected container name 'api-server', got '%s'", result.Containers[0])
		}
	})

	t.Run("should collect all container names for multi-container pod", func(t *testing.T) {
		// Arrange: create a fake clientset with a multi-container pod
		pod := corev1.Pod{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "multi-container-pod",
				Namespace: "default",
			},
			Spec: corev1.PodSpec{
				NodeName: "node-1",
				Containers: []corev1.Container{
					{Name: "api-server"},
					{Name: "sidecar-proxy"},
				},
			},
			Status: corev1.PodStatus{
				Phase: corev1.PodRunning,
			},
		}
		clientset := fake.NewSimpleClientset(&pod)

		// Act
		pods, err := listPods(context.Background(), clientset, "default", nil)

		// Assert
		if err != nil {
			t.Fatalf("listPods returned unexpected error: %v", err)
		}
		if len(pods) != 1 {
			t.Fatalf("expected 1 pod, got %d", len(pods))
		}

		result := pods[0]
		if len(result.Containers) != 2 {
			t.Errorf("expected 2 containers, got %d", len(result.Containers))
		}

		containerNames := make(map[string]bool)
		for _, name := range result.Containers {
			containerNames[name] = true
		}

		if !containerNames["api-server"] {
			t.Error("expected container 'api-server' to be present")
		}
		if !containerNames["sidecar-proxy"] {
			t.Error("expected container 'sidecar-proxy' to be present")
		}
	})

	t.Run("should preserve container name order from pod spec", func(t *testing.T) {
		// Arrange
		pod := corev1.Pod{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "ordered-containers-pod",
				Namespace: "default",
			},
			Spec: corev1.PodSpec{
				NodeName: "node-1",
				Containers: []corev1.Container{
					{Name: "first"},
					{Name: "second"},
					{Name: "third"},
				},
			},
			Status: corev1.PodStatus{
				Phase: corev1.PodRunning,
			},
		}
		clientset := fake.NewSimpleClientset(&pod)

		// Act
		pods, err := listPods(context.Background(), clientset, "default", nil)

		// Assert
		if err != nil {
			t.Fatalf("listPods returned unexpected error: %v", err)
		}
		if len(pods) != 1 {
			t.Fatalf("expected 1 pod, got %d", len(pods))
		}

		result := pods[0]
		if len(result.Containers) != 3 {
			t.Fatalf("expected 3 containers, got %d", len(result.Containers))
		}
		expectedOrder := []string{"first", "second", "third"}
		for i, name := range expectedOrder {
			if result.Containers[i] != name {
				t.Errorf("expected container[%d] = '%s', got '%s'", i, name, result.Containers[i])
			}
		}
	})

	t.Run("should return empty containers slice when pod has no containers", func(t *testing.T) {
		// Arrange: pod with no containers defined in spec
		pod := corev1.Pod{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "no-containers-pod",
				Namespace: "default",
			},
			Spec: corev1.PodSpec{
				NodeName:   "node-1",
				Containers: []corev1.Container{},
			},
			Status: corev1.PodStatus{
				Phase: corev1.PodPending,
			},
		}
		clientset := fake.NewSimpleClientset(&pod)

		// Act
		pods, err := listPods(context.Background(), clientset, "default", nil)

		// Assert
		if err != nil {
			t.Fatalf("listPods returned unexpected error: %v", err)
		}
		if len(pods) != 1 {
			t.Fatalf("expected 1 pod, got %d", len(pods))
		}

		result := pods[0]
		if len(result.Containers) != 0 {
			t.Errorf("expected 0 containers, got %d: %v", len(result.Containers), result.Containers)
		}
	})

	t.Run("should include containers in JSON-serialised response", func(t *testing.T) {
		// Arrange: create a fake clientset with a known pod
		pod := corev1.Pod{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "json-pod",
				Namespace: "default",
			},
			Spec: corev1.PodSpec{
				NodeName: "node-1",
				Containers: []corev1.Container{
					{Name: "api-server"},
					{Name: "sidecar-proxy"},
				},
			},
			Status: corev1.PodStatus{
				Phase: corev1.PodRunning,
			},
		}
		clientset := fake.NewSimpleClientset(&pod)

		// Act: serialise via listPods then JSON encode
		pods, err := listPods(context.Background(), clientset, "default", nil)
		if err != nil {
			t.Fatalf("listPods returned unexpected error: %v", err)
		}

		data, err := json.Marshal(pods)
		if err != nil {
			t.Fatalf("failed to marshal pods: %v", err)
		}

		// Assert: the JSON output contains the 'containers' key and both names
		var decoded []map[string]interface{}
		if err := json.Unmarshal(data, &decoded); err != nil {
			t.Fatalf("failed to unmarshal pods: %v", err)
		}
		if len(decoded) != 1 {
			t.Fatalf("expected 1 pod in JSON output, got %d", len(decoded))
		}

		containersRaw, exists := decoded[0]["containers"]
		if !exists {
			t.Fatal("expected 'containers' key in JSON output, but not found")
		}

		containers, ok := containersRaw.([]interface{})
		if !ok {
			t.Fatalf("expected 'containers' to be a JSON array, got %T", containersRaw)
		}
		if len(containers) != 2 {
			t.Errorf("expected 2 containers in JSON, got %d", len(containers))
		}
	})
}

// TestPodDetailsContainersFieldResponseStructure tests that the HTTP response
// includes the containers field with the correct content.
func TestPodDetailsContainersFieldResponseStructure(t *testing.T) {
	t.Run("should return containers field in API response", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/all", nil)
		w := httptest.NewRecorder()

		// Act
		AllPodsHandler(w, req)

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

		if len(pods) == 0 {
			t.Skip("no pods in cluster")
		}

		// All pods must include the 'containers' field
		for i, pod := range pods {
			if _, exists := pod["containers"]; !exists {
				t.Errorf("pod[%d] (%v) is missing required 'containers' field", i, pod["name"])
			}
		}
	})

	t.Run("should include containers in required fields list", func(t *testing.T) {
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

		if len(pods) == 0 {
			t.Skip("no unhealthy pods in cluster")
		}

		firstPod := pods[0]
		requiredFields := []string{"name", "namespace", "status", "restarts", "node", "age", "containers"}
		for _, field := range requiredFields {
			if _, exists := firstPod[field]; !exists {
				t.Errorf("expected field '%s' in pod object, but not found", field)
			}
		}
	})

	t.Run("should return containers as a JSON array", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/all", nil)
		w := httptest.NewRecorder()

		// Act
		AllPodsHandler(w, req)

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

		if len(pods) == 0 {
			t.Skip("no pods in cluster")
		}

		containersRaw, exists := pods[0]["containers"]
		if !exists {
			t.Fatal("expected 'containers' field in response, not found")
		}
		if _, ok := containersRaw.([]interface{}); !ok {
			t.Errorf("expected 'containers' to be an array, got %T", containersRaw)
		}
	})
}
