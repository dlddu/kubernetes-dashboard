package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestReadinessHandler(t *testing.T) {
	t.Run("should reject non-GET methods", func(t *testing.T) {
		methods := []string{http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodPatch}

		for _, method := range methods {
			t.Run(method, func(t *testing.T) {
				req := httptest.NewRequest(method, "/api/ready", nil)
				w := httptest.NewRecorder()

				ReadinessHandler(w, req)

				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})

	t.Run("should return JSON response", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/ready", nil)
		w := httptest.NewRecorder()

		ReadinessHandler(w, req)

		contentType := w.Header().Get("Content-Type")
		if contentType != "application/json" {
			t.Errorf("expected Content-Type 'application/json', got '%s'", contentType)
		}

		var resp map[string]string
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		status := resp["status"]
		if status != "ready" && status != "unavailable" {
			t.Errorf("expected status 'ready' or 'unavailable', got '%s'", status)
		}
	})

	t.Run("should return 200 when cluster is available", func(t *testing.T) {
		skipIfNoCluster(t)

		req := httptest.NewRequest(http.MethodGet, "/api/ready", nil)
		w := httptest.NewRecorder()

		ReadinessHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Errorf("expected status 200, got %d", res.StatusCode)
		}

		var resp map[string]string
		if err := json.NewDecoder(res.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if resp["status"] != "ready" {
			t.Errorf("expected status 'ready', got '%s'", resp["status"])
		}
	})

	t.Run("should return 503 when cluster is not available", func(t *testing.T) {
		// Without a cluster, the handler should return 503
		_, err := getKubernetesClient()
		if err == nil {
			t.Skip("skipping: cluster is available, cannot test unavailable path")
		}

		req := httptest.NewRequest(http.MethodGet, "/api/ready", nil)
		w := httptest.NewRecorder()

		ReadinessHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusServiceUnavailable {
			t.Errorf("expected status 503, got %d", res.StatusCode)
		}
	})
}
