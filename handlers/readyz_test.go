package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestReadyzHandler(t *testing.T) {
	t.Run("should reject non-GET methods", func(t *testing.T) {
		methods := []string{http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodPatch}

		for _, method := range methods {
			t.Run(method, func(t *testing.T) {
				req := httptest.NewRequest(method, "/api/readyz", nil)
				w := httptest.NewRecorder()

				ReadyzHandler(w, req)

				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})

	t.Run("should set correct content-type header", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/readyz", nil)
		w := httptest.NewRecorder()

		ReadyzHandler(w, req)

		contentType := w.Header().Get("Content-Type")
		if contentType != "application/json" {
			t.Errorf("expected Content-Type 'application/json', got '%s'", contentType)
		}
	})

	t.Run("should return valid JSON response", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/readyz", nil)
		w := httptest.NewRecorder()

		ReadyzHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		var resp HealthResponse
		if err := json.NewDecoder(res.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if resp.Status == "" {
			t.Error("expected non-empty status")
		}
		if resp.Message == "" {
			t.Error("expected non-empty message")
		}
	})

	t.Run("should return 200 or 503 depending on cluster connectivity", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/readyz", nil)
		w := httptest.NewRecorder()

		ReadyzHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		// Without a real cluster, expect 503; with a cluster, expect 200.
		// Both are valid — the important thing is we don't panic or return unexpected codes.
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusServiceUnavailable {
			t.Errorf("expected status 200 or 503, got %d", res.StatusCode)
		}
	})
}
