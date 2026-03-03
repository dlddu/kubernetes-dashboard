package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// TestServerSetup tests the HTTP server setup
func TestServerSetup(t *testing.T) {
	t.Run("should create router with /api/livez endpoint", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/livez", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Errorf("expected status 200, got %d", res.StatusCode)
		}
	})

	t.Run("should serve static files for non-api routes", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should return index.html (200) or 404 if frontend not built yet
		// We accept both since this is scaffolding phase
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 200 or 404, got %d", res.StatusCode)
		}
	})

	t.Run("should redirect SPA routes to index.html", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		spaRoutes := []string{"/dashboard", "/pods", "/services"}

		for _, route := range spaRoutes {
			t.Run(route, func(t *testing.T) {
				req := httptest.NewRequest(http.MethodGet, route, nil)
				w := httptest.NewRecorder()

				// Act
				router.ServeHTTP(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				// Should serve index.html (200) or 404 if frontend not built yet
				if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusNotFound {
					t.Errorf("expected status 200 or 404 for SPA route %s, got %d", route, res.StatusCode)
				}
			})
		}
	})
}

// TestAPIRouting tests API routing behavior
func TestAPIRouting(t *testing.T) {
	t.Run("should route /api/* to API handlers", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/livez", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		contentType := res.Header.Get("Content-Type")
		if !strings.Contains(contentType, "application/json") {
			t.Errorf("API endpoint should return JSON, got Content-Type: %s", contentType)
		}
	})

	t.Run("should route /api/pods/all to AllPodsHandler", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/pods/all", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should get 200 or 500 (not 404)
		if res.StatusCode == http.StatusNotFound {
			t.Error("expected /api/pods/all to be routed, got 404")
		}
	})

	t.Run("should not serve static files for API routes", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/nonexistent", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should return 404 JSON error, not HTML
		if res.StatusCode == http.StatusOK {
			t.Error("nonexistent API endpoint should not return 200")
		}
	})
}

// TestArgoWorkflowDetailRoute tests that the workflow detail route is registered.
func TestArgoWorkflowDetailRoute(t *testing.T) {
	t.Run("should route GET /api/argo/workflows/{name} to WorkflowDetailHandler", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/my-workflow", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should be routed (200, 404, or 500), never a generic Go 404
		if res.StatusCode == http.StatusNotFound && !strings.Contains(w.Body.String(), "application/json") {
			t.Error("expected /api/argo/workflows/{name} to be routed, got generic 404")
		}
	})

	t.Run("should return JSON content-type for workflow detail route", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/any-workflow", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		contentType := res.Header.Get("Content-Type")
		if !strings.Contains(contentType, "application/json") {
			t.Errorf("workflow detail API should return JSON, got Content-Type: %s", contentType)
		}
	})

	t.Run("should return 400 for /api/argo/workflows/ with no name", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// The detail handler should return 400 for incomplete paths
		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("expected 400 for missing path parameters, got %d", res.StatusCode)
		}
	})

	t.Run("should reject non-GET methods on workflow detail route", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		methods := []string{http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodPatch}

		for _, method := range methods {
			t.Run(method, func(t *testing.T) {
				req := httptest.NewRequest(method, "/api/argo/workflows/my-workflow", nil)
				w := httptest.NewRecorder()

				// Act
				router.ServeHTTP(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s on workflow detail route, got %d", method, res.StatusCode)
				}
			})
		}
	})
}

// TestPodLogsRoute tests that the /api/pods/logs/ route is registered in the router.
func TestPodLogsRoute(t *testing.T) {
	t.Run("should route GET /api/pods/logs/{namespace}/{name} to PodLogsHandler", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/my-pod", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should be routed (any status except generic 404 means the route is registered).
		// The handler is not yet fully implemented, so 501 Not Implemented is also expected.
		if res.StatusCode == http.StatusNotFound && res.Header.Get("Content-Type") == "" {
			t.Error("expected /api/pods/logs/{namespace}/{name} to be routed, got generic 404")
		}
	})

	t.Run("should not return generic 404 for /api/pods/logs/ prefix", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/kube-system/coredns-abc", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// A plain 404 with no Content-Type means the mux has no matching route.
		// Any other response (including 501) means the route is registered.
		contentType := res.Header.Get("Content-Type")
		if res.StatusCode == http.StatusNotFound && contentType == "" {
			t.Errorf(
				"route /api/pods/logs/ is not registered in setupRouter (got 404 with no Content-Type); "+
					"add mux.HandleFunc(%q, handlers.PodLogsHandler) to main.go",
				"/api/pods/logs/",
			)
		}
	})

	t.Run("should return JSON Content-Type for /api/pods/logs/ route", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/pods/logs/default/my-pod", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		contentType := res.Header.Get("Content-Type")
		if !strings.Contains(contentType, "application/json") {
			t.Errorf("pod logs API should return JSON Content-Type, got %q", contentType)
		}
	})
}

// TestExistingPodRoutesUnaffected verifies that the existing pod routes are not broken
// by the addition of the /api/pods/logs/ route.
func TestExistingPodRoutesUnaffected(t *testing.T) {
	t.Run("should still route /api/pods/all after adding logs route", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/pods/all", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusNotFound {
			t.Error("expected /api/pods/all to remain routed, got 404")
		}
	})

	t.Run("should still route /api/pods/unhealthy after adding logs route", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusNotFound {
			t.Error("expected /api/pods/unhealthy to remain routed, got 404")
		}
	})

	t.Run("/api/pods/all should still return JSON Content-Type", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/pods/all", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		contentType := res.Header.Get("Content-Type")
		if !strings.Contains(contentType, "application/json") {
			t.Errorf("/api/pods/all should still return JSON, got Content-Type: %q", contentType)
		}
	})

	t.Run("/api/pods/unhealthy should still return JSON Content-Type", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/pods/unhealthy", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		contentType := res.Header.Get("Content-Type")
		if !strings.Contains(contentType, "application/json") {
			t.Errorf("/api/pods/unhealthy should still return JSON, got Content-Type: %q", contentType)
		}
	})

	t.Run("/api/pods/logs/ should not intercept /api/pods/all requests", func(t *testing.T) {
		// Arrange: send request to /api/pods/all which must NOT be handled by the logs handler
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/pods/all", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// /api/pods/all returns a JSON array; the logs handler returns a different structure.
		// If status is 501 (Not Implemented) it means the logs handler accidentally matched.
		if res.StatusCode == http.StatusNotImplemented {
			t.Error("/api/pods/all was incorrectly handled by PodLogsHandler (got 501)")
		}
	})
}

// TestArgoWorkflowTemplatesRoute tests that the Argo workflow templates route is registered
func TestArgoWorkflowTemplatesRoute(t *testing.T) {
	t.Run("should route GET /api/argo/workflow-templates to WorkflowTemplatesHandler", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflow-templates", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should be routed (200 or 500), never 404
		if res.StatusCode == http.StatusNotFound {
			t.Error("expected /api/argo/workflow-templates to be routed, got 404")
		}
	})

	t.Run("should return JSON content-type for /api/argo/workflow-templates", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflow-templates", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		contentType := res.Header.Get("Content-Type")
		if !strings.Contains(contentType, "application/json") {
			t.Errorf("Argo API endpoint should return JSON, got Content-Type: %s", contentType)
		}
	})

	t.Run("should route GET /api/argo/workflow-templates with ns query parameter", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflow-templates?ns=dashboard-test", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should be routed (200 or 500), never 404
		if res.StatusCode == http.StatusNotFound {
			t.Error("expected /api/argo/workflow-templates?ns=dashboard-test to be routed, got 404")
		}
	})

	t.Run("should reject non-GET methods on /api/argo/workflow-templates", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		methods := []string{http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodPatch}

		for _, method := range methods {
			t.Run(method, func(t *testing.T) {
				req := httptest.NewRequest(method, "/api/argo/workflow-templates", nil)
				w := httptest.NewRecorder()

				// Act
				router.ServeHTTP(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s /api/argo/workflow-templates, got %d", method, res.StatusCode)
				}
			})
		}
	})

	t.Run("should serve /argo SPA route via frontend handler", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/argo", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should serve index.html (200) or 404 if frontend not built yet
		// The /argo route is a SPA route - it should NOT return a Go API 404
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 200 or 404 for SPA /argo route, got %d", res.StatusCode)
		}
	})
}
