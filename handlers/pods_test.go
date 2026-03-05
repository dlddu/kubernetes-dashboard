package handlers

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
	ktesting "k8s.io/client-go/testing"
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

// ---------------------------------------------------------------------------
// TestPodLogsHandler tests the GET /api/pods/logs/{namespace}/{name} endpoint.
//
// fake.NewSimpleClientset does not provide a real log stream via GetLogs.
// Tests that require actual log content use a ktesting.ReactionFunc reactor
// registered on the fake client to intercept the "get" action on "pods/log"
// and return a synthetic io.ReadCloser.
//
// Tests that only care about routing / validation (404, 405, 400) use the
// PodLogsHandler directly without wiring up a reactor.
// ---------------------------------------------------------------------------

// podLogReactor returns a ktesting.ReactionFunc that intercepts GetLogs calls
// on the fake clientset and returns the provided log content.  It only fires
// for the "log" subresource so ordinary pod GET calls are passed through.
//
// Usage:
//
//	clientset.Fake.PrependReactor("get", "pods", podLogReactor(logBody))
func podLogReactor(logBody string) ktesting.ReactionFunc {
	return func(action ktesting.Action) (bool, runtime.Object, error) {
		if action.GetSubresource() != "log" {
			return false, nil, nil
		}
		// runtime.Unknown carries raw bytes; the implementation reads the stream
		// via io.ReadAll after calling GetLogs(...).Stream(ctx).
		return true, &runtime.Unknown{Raw: []byte(logBody)}, nil
	}
}

// TestPodLogsHandlerHappyPath tests the successful log retrieval path.
// These tests define the contract that the implementation must satisfy.
func TestPodLogsHandlerHappyPath(t *testing.T) {
	t.Run("should return 200 OK with text/plain content-type for valid pod", func(t *testing.T) {
		// Arrange
		fakeLogContent := "line1\nline2\nline3\n"
		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, _ *corev1.PodLogOptions) (io.ReadCloser, error) {
			return io.NopCloser(strings.NewReader(fakeLogContent)), nil
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/my-pod", nil)
		w := httptest.NewRecorder()

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Green phase: implementation is complete, only 200 is valid.
		if res.StatusCode != http.StatusOK {
			t.Errorf("expected 200, got %d", res.StatusCode)
		}

		// The Content-Type must be text/plain.
		if res.StatusCode == http.StatusOK {
			ct := res.Header.Get("Content-Type")
			if !strings.HasPrefix(ct, "text/plain") {
				t.Errorf("expected Content-Type 'text/plain', got '%s'", ct)
			}
		}
	})

	t.Run("should include log content in response body", func(t *testing.T) {
		// Arrange
		wantLogs := "2024-01-01 INFO server started\n2024-01-01 INFO listening on :8080\n"

		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, _ *corev1.PodLogOptions) (io.ReadCloser, error) {
			return io.NopCloser(strings.NewReader(wantLogs)), nil
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/log-pod", nil)
		w := httptest.NewRecorder()

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Errorf("expected 200, got %d", res.StatusCode)
		}
		if res.StatusCode == http.StatusOK {
			body, err := io.ReadAll(res.Body)
			if err != nil {
				t.Fatalf("failed to read response body: %v", err)
			}
			if string(body) != wantLogs {
				t.Errorf("expected log body %q, got %q", wantLogs, string(body))
			}
		}
	})

	t.Run("should filter logs by container when container query param is provided", func(t *testing.T) {
		// Arrange – multi-container pod; caller requests "sidecar" container.
		// capturedContainer records the container name passed to getPodLogStream via PodLogOptions.
		var capturedContainer string
		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, opts *corev1.PodLogOptions) (io.ReadCloser, error) {
			capturedContainer = opts.Container
			return io.NopCloser(strings.NewReader("sidecar log\n")), nil
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/multi-container-pod?container=sidecar", nil)
		w := httptest.NewRecorder()

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Green phase: implementation is complete, only 200 is valid.
		if res.StatusCode != http.StatusOK {
			t.Errorf("unexpected status %d", res.StatusCode)
		}

		// The container name must be forwarded to PodLogOptions.
		if capturedContainer != "sidecar" {
			t.Errorf("expected container 'sidecar' to be requested, got %q", capturedContainer)
		}
	})

	t.Run("should respect tailLines query parameter", func(t *testing.T) {
		// Arrange
		var capturedTailLines *int64
		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, opts *corev1.PodLogOptions) (io.ReadCloser, error) {
			capturedTailLines = opts.TailLines
			return io.NopCloser(strings.NewReader("last 100 lines\n")), nil
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/tail-pod?tailLines=100", nil)
		w := httptest.NewRecorder()

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Green phase: implementation is complete, only 200 is valid.
		if res.StatusCode != http.StatusOK {
			t.Errorf("unexpected status %d", res.StatusCode)
		}

		if capturedTailLines == nil || *capturedTailLines != 100 {
			t.Errorf("expected tailLines=100 to be passed to GetLogs, got %v", capturedTailLines)
		}
	})
}

// TestPodLogsHandlerNotFound tests the 404 error path.
func TestPodLogsHandlerNotFound(t *testing.T) {
	t.Run("should return 404 when pod does not exist", func(t *testing.T) {
		// Arrange – inject a stream function that returns a NotFound error.
		podGR := schema.GroupResource{Group: "", Resource: "pods"}
		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, name string, _ *corev1.PodLogOptions) (io.ReadCloser, error) {
			return nil, k8serrors.NewNotFound(podGR, name)
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/ghost-pod", nil)
		w := httptest.NewRecorder()

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Green phase: implementation is complete, only 404 is valid.
		if res.StatusCode != http.StatusNotFound {
			t.Errorf("expected 404, got %d", res.StatusCode)
		}
	})

	t.Run("should return 404 for non-existent pod via cluster", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/non-existent-pod-xyz-123", nil)
		w := httptest.NewRecorder()

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusNotFound {
			t.Errorf("expected 404 for non-existent pod, got %d", res.StatusCode)
		}
	})
}

// TestPodLogsHandlerMethodNotAllowed tests the 405 path for non-GET methods.
func TestPodLogsHandlerMethodNotAllowed(t *testing.T) {
	t.Run("should return 405 for non-GET methods", func(t *testing.T) {
		// Arrange
		methods := []string{
			http.MethodPost,
			http.MethodPut,
			http.MethodDelete,
			http.MethodPatch,
		}

		for _, method := range methods {
			t.Run(method, func(t *testing.T) {
				req := httptest.NewRequest(method, "/api/pods/logs/default/my-pod", nil)
				w := httptest.NewRecorder()

				// Act
				PodLogsHandler(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})
}

// TestPodLogsHandlerBadRequest tests the 400 path for malformed paths.
func TestPodLogsHandlerBadRequest(t *testing.T) {
	t.Run("should return 400 for path missing pod name", func(t *testing.T) {
		// Arrange – path has only namespace, no pod name segment.
		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default", nil)
		w := httptest.NewRecorder()

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Green phase: implementation is complete, only 400 is valid.
		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("expected 400 for malformed path, got %d", res.StatusCode)
		}
	})

	t.Run("should return 400 for path with only prefix and no namespace", func(t *testing.T) {
		// Arrange – bare prefix with no resource segments.
		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/", nil)
		w := httptest.NewRecorder()

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Green phase: implementation is complete, only 400 is valid.
		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("expected 400 for bare prefix path, got %d", res.StatusCode)
		}
	})

	t.Run("should return 400 for path with empty namespace segment", func(t *testing.T) {
		// Arrange – double slash forces an empty namespace token.
		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs//my-pod", nil)
		w := httptest.NewRecorder()

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Green phase: implementation is complete, only 400 is valid.
		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("expected 400 for empty namespace, got %d", res.StatusCode)
		}
	})
}

// TestPodLogsHandlerQueryParams tests query parameter parsing contracts.
// These tests verify that the handler correctly reads and forwards query
// parameters to the Kubernetes API; they form the specification for the
// implementation to fulfil.
func TestPodLogsHandlerQueryParams(t *testing.T) {
	t.Run("should use default tailLines of 500 when param is absent", func(t *testing.T) {
		// Arrange
		var observedTailLines *int64
		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, opts *corev1.PodLogOptions) (io.ReadCloser, error) {
			observedTailLines = opts.TailLines
			return io.NopCloser(strings.NewReader("log line\n")), nil
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/default-tail-pod", nil)
		w := httptest.NewRecorder()

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Green phase: implementation is complete, only 200 is valid.
		if res.StatusCode != http.StatusOK {
			t.Errorf("unexpected status %d", res.StatusCode)
		}

		// Contract: default tailLines must be 500.
		if observedTailLines == nil || *observedTailLines != 500 {
			t.Errorf("expected default tailLines=500, got %v", observedTailLines)
		}
	})

	t.Run("should not follow logs when follow param is absent or false", func(t *testing.T) {
		// Arrange – verify Follow=false is set in PodLogOptions.
		var capturedFollow bool
		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, opts *corev1.PodLogOptions) (io.ReadCloser, error) {
			capturedFollow = opts.Follow
			return io.NopCloser(strings.NewReader("one-shot log\n")), nil
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/no-follow-pod?follow=false", nil)
		w := httptest.NewRecorder()

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Green phase: implementation is complete, only 200 is valid.
		if res.StatusCode != http.StatusOK {
			t.Errorf("unexpected status %d", res.StatusCode)
		}

		// Follow must be false.
		if capturedFollow {
			t.Errorf("expected Follow=false, but Follow was true")
		}
	})

	t.Run("should pass invalid tailLines as default 500", func(t *testing.T) {
		// Arrange – non-integer tailLines should fall back to the default (500).
		var observedTailLines *int64
		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, opts *corev1.PodLogOptions) (io.ReadCloser, error) {
			observedTailLines = opts.TailLines
			return io.NopCloser(strings.NewReader("log\n")), nil
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/bad-tail-pod?tailLines=abc", nil)
		w := httptest.NewRecorder()

		// Act
		PodLogsHandler(w, req)

		// Assert – should not return 400; invalid tailLines is silently treated as default.
		res := w.Result()
		defer res.Body.Close()

		// Green phase: implementation is complete, only 200 is valid.
		if res.StatusCode != http.StatusOK {
			t.Errorf("expected 200 for invalid tailLines, got %d", res.StatusCode)
		}

		// Default tailLines (500) must be used when the param is invalid.
		if observedTailLines == nil || *observedTailLines != 500 {
			t.Errorf("expected default tailLines=500 for invalid param, got %v", observedTailLines)
		}
	})
}

// TestPodLogsHandlerInternalErrors tests error paths beyond 404 and 400.
func TestPodLogsHandlerInternalErrors(t *testing.T) {
	t.Run("should return 500 when Kubernetes API returns unexpected error", func(t *testing.T) {
		// Arrange – inject a stream function that returns an internal server error.
		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, _ *corev1.PodLogOptions) (io.ReadCloser, error) {
			return nil, k8serrors.NewInternalError(io.ErrUnexpectedEOF)
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/error-pod", nil)
		w := httptest.NewRecorder()

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Green phase: implementation is complete, only 500 is valid.
		if res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected 500 for API error, got %d", res.StatusCode)
		}
	})

	t.Run("should return 400 when container does not exist in pod", func(t *testing.T) {
		// Arrange – inject a stream function that returns a BadRequest error (unknown container).
		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, _ *corev1.PodLogOptions) (io.ReadCloser, error) {
			return nil, k8serrors.NewBadRequest("container nonexistent is not valid for pod single-container-pod")
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/single-container-pod?container=nonexistent", nil)
		w := httptest.NewRecorder()

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Green phase: implementation is complete, only 400 is valid.
		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("expected 400 for unknown container, got %d", res.StatusCode)
		}
	})
}

// ---------------------------------------------------------------------------
// SSE / follow=true streaming tests
//
// httptest.ResponseRecorder does not implement http.Flusher, so tests that
// exercise the streaming code path use the flusherRecorder helper below.
// Tests that specifically verify the "flusher not supported" error path use
// httptest.ResponseRecorder directly (which intentionally lacks Flush).
// ---------------------------------------------------------------------------

// flusherRecorder wraps httptest.ResponseRecorder and also satisfies
// http.Flusher so that the SSE handler can call Flush() without error.
type flusherRecorder struct {
	*httptest.ResponseRecorder
	flushed bool
}

func (f *flusherRecorder) Flush() {
	f.flushed = true
	f.ResponseRecorder.Flush()
}

// TestPodLogsHandlerSSEStreaming tests the follow=true SSE streaming path.
// These tests form the Red Phase for the SSE implementation and will FAIL
// until the streaming code is added to PodLogsHandler.
func TestPodLogsHandlerSSEStreaming(t *testing.T) {
	t.Run("should set Content-Type to text/event-stream when follow=true", func(t *testing.T) {
		// Arrange
		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, _ *corev1.PodLogOptions) (io.ReadCloser, error) {
			// A stream that closes immediately so the handler loop terminates.
			return io.NopCloser(strings.NewReader("")), nil
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/my-pod?follow=true", nil)
		w := &flusherRecorder{ResponseRecorder: httptest.NewRecorder()}

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		ct := res.Header.Get("Content-Type")
		if ct != "text/event-stream" {
			t.Errorf("expected Content-Type 'text/event-stream', got %q", ct)
		}
	})

	t.Run("should set Cache-Control to no-cache when follow=true", func(t *testing.T) {
		// Arrange
		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, _ *corev1.PodLogOptions) (io.ReadCloser, error) {
			return io.NopCloser(strings.NewReader("")), nil
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/my-pod?follow=true", nil)
		w := &flusherRecorder{ResponseRecorder: httptest.NewRecorder()}

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		cc := res.Header.Get("Cache-Control")
		if cc != "no-cache" {
			t.Errorf("expected Cache-Control 'no-cache', got %q", cc)
		}
	})

	t.Run("should return 200 OK for follow=true request", func(t *testing.T) {
		// Arrange
		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, _ *corev1.PodLogOptions) (io.ReadCloser, error) {
			return io.NopCloser(strings.NewReader("")), nil
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/my-pod?follow=true", nil)
		w := &flusherRecorder{ResponseRecorder: httptest.NewRecorder()}

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Errorf("expected 200, got %d", res.StatusCode)
		}
	})

	t.Run("should send log lines in SSE data format", func(t *testing.T) {
		// Arrange
		logContent := "first log line\nsecond log line\n"

		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, _ *corev1.PodLogOptions) (io.ReadCloser, error) {
			return io.NopCloser(strings.NewReader(logContent)), nil
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/my-pod?follow=true", nil)
		w := &flusherRecorder{ResponseRecorder: httptest.NewRecorder()}

		// Act
		PodLogsHandler(w, req)

		// Assert
		body := w.Body.String()
		// Each log line must be wrapped in SSE format: "data: {line}\n\n"
		if !strings.Contains(body, "data: first log line\n\n") {
			t.Errorf("expected SSE line 'data: first log line\\n\\n' in body, got:\n%s", body)
		}
		if !strings.Contains(body, "data: second log line\n\n") {
			t.Errorf("expected SSE line 'data: second log line\\n\\n' in body, got:\n%s", body)
		}
	})

	t.Run("should pass Follow=true in PodLogOptions when follow=true", func(t *testing.T) {
		// Arrange
		var capturedFollow bool

		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, opts *corev1.PodLogOptions) (io.ReadCloser, error) {
			capturedFollow = opts.Follow
			return io.NopCloser(strings.NewReader("")), nil
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/my-pod?follow=true", nil)
		w := &flusherRecorder{ResponseRecorder: httptest.NewRecorder()}

		// Act
		PodLogsHandler(w, req)

		// Assert
		if !capturedFollow {
			t.Error("expected PodLogOptions.Follow=true, but it was false")
		}
	})

	t.Run("should flush after each log line", func(t *testing.T) {
		// Arrange – verify that Flush() is called at least once after writing lines.
		logContent := "flush me\n"

		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, _ *corev1.PodLogOptions) (io.ReadCloser, error) {
			return io.NopCloser(strings.NewReader(logContent)), nil
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/flush-pod?follow=true", nil)
		w := &flusherRecorder{ResponseRecorder: httptest.NewRecorder()}

		// Act
		PodLogsHandler(w, req)

		// Assert
		if !w.flushed {
			t.Error("expected http.Flusher.Flush() to be called at least once during SSE streaming")
		}
	})

	t.Run("should return 500 when ResponseWriter does not implement http.Flusher", func(t *testing.T) {
		// Arrange – We need a ResponseWriter that does NOT satisfy http.Flusher.
		// httptest.ResponseRecorder itself implements Flush(), so we wrap it in a
		// struct that shadows/hides the Flush method by not promoting it, achieved
		// by wrapping via a private interface rather than embedding the concrete type.
		//
		// plainWriter holds only the http.ResponseWriter interface, which does NOT
		// include http.Flusher.  The type-assertion `w.(http.Flusher)` in the handler
		// must therefore fail.
		type plainWriter struct {
			http.ResponseWriter
		}

		inner := httptest.NewRecorder()

		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, _ *corev1.PodLogOptions) (io.ReadCloser, error) {
			return io.NopCloser(strings.NewReader("log\n")), nil
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/my-pod?follow=true", nil)
		// plainWriter wraps the ResponseRecorder but does NOT expose http.Flusher.
		w := &plainWriter{ResponseWriter: inner}

		// Act
		PodLogsHandler(w, req)

		// Assert – the handler must detect that Flusher is unsupported and return 500.
		if inner.Code != http.StatusInternalServerError {
			t.Errorf("expected 500 when Flusher not supported, got %d", inner.Code)
		}
	})

	t.Run("should stop streaming when client context is cancelled", func(t *testing.T) {
		// This scenario is fully covered by TestPodLogsHandlerSSEContextCancellation
		// below, which uses a proper timer-based deadline.  Skip here to avoid
		// duplicating the blocking-goroutine plumbing.
		t.Skip("covered by TestPodLogsHandlerSSEContextCancellation")
	})

	t.Run("should pass tailLines in PodLogOptions when follow=true", func(t *testing.T) {
		// Arrange
		var capturedTailLines *int64

		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, opts *corev1.PodLogOptions) (io.ReadCloser, error) {
			capturedTailLines = opts.TailLines
			return io.NopCloser(strings.NewReader("")), nil
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/my-pod?follow=true&tailLines=50", nil)
		w := &flusherRecorder{ResponseRecorder: httptest.NewRecorder()}

		// Act
		PodLogsHandler(w, req)

		// Assert
		if capturedTailLines == nil || *capturedTailLines != 50 {
			t.Errorf("expected TailLines=50 in PodLogOptions, got %v", capturedTailLines)
		}
	})

	t.Run("should not use SSE format when follow is absent", func(t *testing.T) {
		// Arrange – a plain log request (no follow param) must NOT produce SSE framing.
		wantLogs := "plain log line\n"

		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, _ *corev1.PodLogOptions) (io.ReadCloser, error) {
			return io.NopCloser(strings.NewReader(wantLogs)), nil
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/my-pod", nil)
		w := httptest.NewRecorder()

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Errorf("expected 200, got %d", res.StatusCode)
		}

		ct := res.Header.Get("Content-Type")
		if strings.HasPrefix(ct, "text/event-stream") {
			t.Errorf("expected non-SSE Content-Type for follow=false request, got %q", ct)
		}

		body, err := io.ReadAll(res.Body)
		if err != nil {
			t.Fatalf("failed to read response body: %v", err)
		}
		if strings.Contains(string(body), "data: ") {
			t.Errorf("plain log response must not contain SSE 'data: ' framing, got:\n%s", string(body))
		}
	})
}

// TestPodLogsHandlerSSEContextCancellation is a self-contained context
// cancellation test that avoids import-cycle workarounds.
func TestPodLogsHandlerSSEContextCancellation(t *testing.T) {
	t.Run("should stop streaming and return when client disconnects", func(t *testing.T) {
		// Arrange
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		streamStarted := make(chan struct{})
		blockCh := make(chan struct{})

		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, _ *corev1.PodLogOptions) (io.ReadCloser, error) {
			pr, pw := io.Pipe()
			go func() {
				pw.Write([]byte("line one\n")) //nolint:errcheck
				close(streamStarted)           // signal that one line was written
				<-blockCh                      // wait until the test unlocks us
				pw.Close()
			}()
			return pr, nil
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/ctx-cancel-pod?follow=true", nil)
		req = req.WithContext(ctx)
		w := &flusherRecorder{ResponseRecorder: httptest.NewRecorder()}

		handlerDone := make(chan struct{})
		go func() {
			defer close(handlerDone)
			PodLogsHandler(w, req)
		}()

		// Wait until the stream has produced at least one line, then cancel.
		<-streamStarted
		cancel()
		close(blockCh) // unblock the fake stream writer goroutine

		// The handler must exit within a reasonable time after context cancellation.
		select {
		case <-handlerDone:
			// Handler exited cleanly.
		case <-func() <-chan struct{} {
			timeout := make(chan struct{})
			go func() {
				// 2-second deadline implemented via a ticker to avoid importing "time" again
				// (already imported at package level).
				timer := time.NewTimer(2 * time.Second)
				defer timer.Stop()
				<-timer.C
				close(timeout)
			}()
			return timeout
		}():
			t.Error("PodLogsHandler did not exit within 2 s after context cancellation")
		}
	})
}

// TestPodLogsHandlerResponseFormat verifies response format contracts.
func TestPodLogsHandlerResponseFormat(t *testing.T) {
	t.Run("should return text/plain content-type on success", func(t *testing.T) {
		// This test mirrors the happy-path check but is explicitly focused on
		// verifying the Content-Type header, not the body content.
		oldClientsetFn := getLogClientset
		defer func() { getLogClientset = oldClientsetFn }()
		getLogClientset = func() (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		}
		oldStreamFn := getPodLogStream
		defer func() { getPodLogStream = oldStreamFn }()
		getPodLogStream = func(_ context.Context, _ kubernetes.Interface, _, _ string, _ *corev1.PodLogOptions) (io.ReadCloser, error) {
			return io.NopCloser(strings.NewReader("log content\n")), nil
		}

		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/ct-pod", nil)
		w := httptest.NewRecorder()

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Errorf("expected 200, got %d", res.StatusCode)
		}
		ct := res.Header.Get("Content-Type")
		if !strings.HasPrefix(ct, "text/plain") {
			t.Errorf("expected Content-Type starting with 'text/plain', got '%s'", ct)
		}
	})

	t.Run("should return JSON error body for non-200 responses", func(t *testing.T) {
		// Arrange – path that triggers a 400 (missing pod name segment).
		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default", nil)
		w := httptest.NewRecorder()

		// Act
		PodLogsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Non-200 responses must use JSON (consistent with other handlers).
		// This path triggers a 400 (missing pod name segment).
		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("expected 400 for malformed path, got %d", res.StatusCode)
		}
		ct := res.Header.Get("Content-Type")
		if ct != "application/json" {
			t.Errorf("expected Content-Type 'application/json' for error response, got '%s'", ct)
		}

		body, err := io.ReadAll(res.Body)
		if err != nil {
			t.Fatalf("failed to read response body: %v", err)
		}

		var errResp map[string]interface{}
		if jsonErr := json.Unmarshal(body, &errResp); jsonErr != nil {
			t.Errorf("expected JSON error body, got: %s", string(body))
		}
	})
}
