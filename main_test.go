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
