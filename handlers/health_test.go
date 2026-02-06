package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// HealthResponse represents the expected health check response
type HealthResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// TestHealthHandler tests the /api/health endpoint
func TestHealthHandler(t *testing.T) {
	t.Run("should return 200 OK with health check response", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
		w := httptest.NewRecorder()

		// Act
		HealthHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Errorf("expected status 200, got %d", res.StatusCode)
		}

		var healthResp HealthResponse
		if err := json.NewDecoder(res.Body).Decode(&healthResp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if healthResp.Status != "ok" {
			t.Errorf("expected status 'ok', got '%s'", healthResp.Status)
		}

		if healthResp.Message == "" {
			t.Error("expected non-empty message")
		}
	})

	t.Run("should set correct content-type header", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
		w := httptest.NewRecorder()

		// Act
		HealthHandler(w, req)

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
				req := httptest.NewRequest(method, "/api/health", nil)
				w := httptest.NewRecorder()

				// Act
				HealthHandler(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})
}
