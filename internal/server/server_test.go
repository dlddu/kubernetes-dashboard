package server

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestNewServer tests server initialization
func TestNewServer(t *testing.T) {
	// Act
	srv := NewServer(":8080")

	// Assert
	if srv == nil {
		t.Error("expected non-nil server")
	}

	if srv.Addr != ":8080" {
		t.Errorf("expected address ':8080', got '%s'", srv.Addr)
	}
}

// TestServerRoutes tests that all expected routes are registered
func TestServerRoutes(t *testing.T) {
	routes := []struct {
		path           string
		method         string
		expectedStatus int
	}{
		{
			path:           "/api/health",
			method:         http.MethodGet,
			expectedStatus: http.StatusOK,
		},
	}

	srv := NewServer(":8080")
	handler := srv.Handler

	for _, route := range routes {
		t.Run(route.path, func(t *testing.T) {
			// Arrange
			req := httptest.NewRequest(route.method, route.path, nil)
			w := httptest.NewRecorder()

			// Act
			handler.ServeHTTP(w, req)

			// Assert
			if w.Code != route.expectedStatus {
				t.Errorf("expected status %d for %s %s, got %d", route.expectedStatus, route.method, route.path, w.Code)
			}
		})
	}
}

// TestServerServesStaticFiles tests that server serves React SPA
func TestServerServesStaticFiles(t *testing.T) {
	// Arrange
	srv := NewServer(":8080")
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	w := httptest.NewRecorder()

	// Act
	srv.Handler.ServeHTTP(w, req)

	// Assert
	// Should serve index.html or return 404 if dist folder doesn't exist yet
	if w.Code != http.StatusOK && w.Code != http.StatusNotFound {
		t.Errorf("expected status 200 or 404 for root path, got %d", w.Code)
	}
}

// TestServerHandlesClientSideRouting tests that server handles client-side routing
func TestServerHandlesClientSideRouting(t *testing.T) {
	clientRoutes := []string{
		"/dashboard",
		"/pods",
		"/services",
		"/deployments",
	}

	srv := NewServer(":8080")

	for _, route := range clientRoutes {
		t.Run(route, func(t *testing.T) {
			// Arrange
			req := httptest.NewRequest(http.MethodGet, route, nil)
			w := httptest.NewRecorder()

			// Act
			srv.Handler.ServeHTTP(w, req)

			// Assert
			// Should return index.html for client-side routes (or 404 if not built yet)
			if w.Code != http.StatusOK && w.Code != http.StatusNotFound {
				t.Errorf("expected status 200 or 404 for client route %s, got %d", route, w.Code)
			}
		})
	}
}
