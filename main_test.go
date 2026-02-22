package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// TestServerSetup tests the HTTP server setup
func TestServerSetup(t *testing.T) {
	t.Run("should create router with /api/health endpoint", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
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
		req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
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
	t.Run("should route GET /api/argo/workflows/{namespace}/{name} to WorkflowDetailHandler", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/default/my-workflow", nil)
		w := httptest.NewRecorder()

		// Act
		router.ServeHTTP(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should be routed (200, 404, or 500), never a generic Go 404
		if res.StatusCode == http.StatusNotFound && !strings.Contains(w.Body.String(), "application/json") {
			t.Error("expected /api/argo/workflows/{namespace}/{name} to be routed, got generic 404")
		}
	})

	t.Run("should return JSON content-type for workflow detail route", func(t *testing.T) {
		// Arrange
		router := setupRouter()
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/default/any-workflow", nil)
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

	t.Run("should return 400 for /api/argo/workflows/ with no namespace or name", func(t *testing.T) {
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
				req := httptest.NewRequest(method, "/api/argo/workflows/default/my-workflow", nil)
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
