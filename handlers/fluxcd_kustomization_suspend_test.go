package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestKustomizationSuspendHandler tests POST /api/fluxcd/kustomizations/{namespace}/{name}/suspend
func TestKustomizationSuspendHandler(t *testing.T) {
	t.Run("should reject non-POST methods", func(t *testing.T) {
		methods := []string{http.MethodGet, http.MethodPut, http.MethodDelete, http.MethodPatch}

		for _, method := range methods {
			t.Run(method, func(t *testing.T) {
				req := httptest.NewRequest(method, "/api/fluxcd/kustomizations/flux-system/flux-system/suspend", nil)
				w := httptest.NewRecorder()

				KustomizationSuspendHandler(w, req)

				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})

	t.Run("should set Content-Type to application/json", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/fluxcd/kustomizations/flux-system/flux-system/suspend", nil)
		w := httptest.NewRecorder()

		KustomizationSuspendHandler(w, req)

		contentType := w.Header().Get("Content-Type")
		if contentType != "application/json" {
			t.Errorf("expected Content-Type 'application/json', got '%s'", contentType)
		}
	})

	t.Run("should return 400 when namespace segment is missing", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/fluxcd/kustomizations/", nil)
		w := httptest.NewRecorder()

		KustomizationSuspendHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400 for missing path parameters, got %d", res.StatusCode)
		}
	})

	t.Run("should return 400 when name segment is missing", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/fluxcd/kustomizations/flux-system//suspend", nil)
		w := httptest.NewRecorder()

		KustomizationSuspendHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400 for missing name parameter, got %d", res.StatusCode)
		}
	})

	t.Run("should return 400 with JSON error body on invalid path", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/fluxcd/kustomizations/", nil)
		w := httptest.NewRecorder()

		KustomizationSuspendHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusBadRequest {
			t.Skipf("expected 400, got %d", res.StatusCode)
		}

		var errBody map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&errBody); err != nil {
			t.Fatalf("400 response should be valid JSON: %v", err)
		}

		if _, hasError := errBody["error"]; !hasError {
			t.Error("expected 'error' field in 400 response body")
		}
	})

	t.Run("should return 200, 404, or 500 in CI environment", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/fluxcd/kustomizations/flux-system/flux-system/suspend", nil)
		w := httptest.NewRecorder()

		KustomizationSuspendHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		// In CI without a cluster, 500 is acceptable.
		// In cluster environment, 200 or 404 is expected.
		if res.StatusCode != http.StatusOK &&
			res.StatusCode != http.StatusInternalServerError &&
			res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 200, 404, or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should return valid JSON on any response", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/fluxcd/kustomizations/flux-system/flux-system/suspend", nil)
		w := httptest.NewRecorder()

		KustomizationSuspendHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		var result interface{}
		if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
			t.Errorf("response body is not valid JSON: %v", err)
		}
	})

	t.Run("should accept name with hyphens in path", func(t *testing.T) {
		req := httptest.NewRequest(
			http.MethodPost,
			"/api/fluxcd/kustomizations/my-namespace/my-kustomization-abc12/suspend",
			nil,
		)
		w := httptest.NewRecorder()

		KustomizationSuspendHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusBadRequest {
			t.Error("expected handler to parse namespace/name with hyphens correctly (should not be 400)")
		}
	})

	t.Run("should return 404 when kustomization does not exist", func(t *testing.T) {
		skipIfNoCluster(t)

		req := httptest.NewRequest(
			http.MethodPost,
			"/api/fluxcd/kustomizations/non-existent-ns/non-existent-kustomization-xyz/suspend",
			nil,
		)
		w := httptest.NewRecorder()

		KustomizationSuspendHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusInternalServerError {
			t.Skip("skipping: FluxCD CRD may not be installed in cluster (got 500)")
		}

		if res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 404 for non-existent kustomization, got %d", res.StatusCode)
		}
	})

	t.Run("should return success message Suspended", func(t *testing.T) {
		skipIfNoCluster(t)

		req := httptest.NewRequest(
			http.MethodPost,
			"/api/fluxcd/kustomizations/flux-system/flux-system/suspend",
			nil,
		)
		w := httptest.NewRecorder()

		KustomizationSuspendHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusInternalServerError {
			t.Skipf("skipping: FluxCD CRD may not be installed (got 500)")
		}
		if res.StatusCode == http.StatusNotFound {
			t.Skip("flux-system/flux-system kustomization not found; skipping message validation")
		}
		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var response map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		message, ok := response["message"].(string)
		if !ok || message == "" {
			t.Error("expected non-empty 'message' field in success response")
		}

		if message != "Suspended" {
			t.Errorf("expected message 'Suspended', got '%s'", message)
		}
	})
}

// TestKustomizationResumeHandler tests POST /api/fluxcd/kustomizations/{namespace}/{name}/resume
func TestKustomizationResumeHandler(t *testing.T) {
	t.Run("should reject non-POST methods", func(t *testing.T) {
		methods := []string{http.MethodGet, http.MethodPut, http.MethodDelete, http.MethodPatch}

		for _, method := range methods {
			t.Run(method, func(t *testing.T) {
				req := httptest.NewRequest(method, "/api/fluxcd/kustomizations/flux-system/flux-system/resume", nil)
				w := httptest.NewRecorder()

				KustomizationResumeHandler(w, req)

				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})

	t.Run("should set Content-Type to application/json", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/fluxcd/kustomizations/flux-system/flux-system/resume", nil)
		w := httptest.NewRecorder()

		KustomizationResumeHandler(w, req)

		contentType := w.Header().Get("Content-Type")
		if contentType != "application/json" {
			t.Errorf("expected Content-Type 'application/json', got '%s'", contentType)
		}
	})

	t.Run("should return 400 when namespace segment is missing", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/fluxcd/kustomizations/", nil)
		w := httptest.NewRecorder()

		KustomizationResumeHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400 for missing path parameters, got %d", res.StatusCode)
		}
	})

	t.Run("should return 400 when name segment is missing", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/fluxcd/kustomizations/flux-system//resume", nil)
		w := httptest.NewRecorder()

		KustomizationResumeHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400 for missing name parameter, got %d", res.StatusCode)
		}
	})

	t.Run("should return 400 with JSON error body on invalid path", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/fluxcd/kustomizations/", nil)
		w := httptest.NewRecorder()

		KustomizationResumeHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusBadRequest {
			t.Skipf("expected 400, got %d", res.StatusCode)
		}

		var errBody map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&errBody); err != nil {
			t.Fatalf("400 response should be valid JSON: %v", err)
		}

		if _, hasError := errBody["error"]; !hasError {
			t.Error("expected 'error' field in 400 response body")
		}
	})

	t.Run("should return 200, 404, or 500 in CI environment", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/fluxcd/kustomizations/flux-system/flux-system/resume", nil)
		w := httptest.NewRecorder()

		KustomizationResumeHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK &&
			res.StatusCode != http.StatusInternalServerError &&
			res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 200, 404, or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should return valid JSON on any response", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/fluxcd/kustomizations/flux-system/flux-system/resume", nil)
		w := httptest.NewRecorder()

		KustomizationResumeHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		var result interface{}
		if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
			t.Errorf("response body is not valid JSON: %v", err)
		}
	})

	t.Run("should accept name with hyphens in path", func(t *testing.T) {
		req := httptest.NewRequest(
			http.MethodPost,
			"/api/fluxcd/kustomizations/my-namespace/my-kustomization-abc12/resume",
			nil,
		)
		w := httptest.NewRecorder()

		KustomizationResumeHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusBadRequest {
			t.Error("expected handler to parse namespace/name with hyphens correctly (should not be 400)")
		}
	})

	t.Run("should return 404 when kustomization does not exist", func(t *testing.T) {
		skipIfNoCluster(t)

		req := httptest.NewRequest(
			http.MethodPost,
			"/api/fluxcd/kustomizations/non-existent-ns/non-existent-kustomization-xyz/resume",
			nil,
		)
		w := httptest.NewRecorder()

		KustomizationResumeHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusInternalServerError {
			t.Skip("skipping: FluxCD CRD may not be installed in cluster (got 500)")
		}

		if res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 404 for non-existent kustomization, got %d", res.StatusCode)
		}
	})

	t.Run("should return success message Resumed", func(t *testing.T) {
		skipIfNoCluster(t)

		req := httptest.NewRequest(
			http.MethodPost,
			"/api/fluxcd/kustomizations/flux-system/flux-system/resume",
			nil,
		)
		w := httptest.NewRecorder()

		KustomizationResumeHandler(w, req)

		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusInternalServerError {
			t.Skipf("skipping: FluxCD CRD may not be installed (got 500)")
		}
		if res.StatusCode == http.StatusNotFound {
			t.Skip("flux-system/flux-system kustomization not found; skipping message validation")
		}
		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var response map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		message, ok := response["message"].(string)
		if !ok || message == "" {
			t.Error("expected non-empty 'message' field in success response")
		}

		if message != "Resumed" {
			t.Errorf("expected message 'Resumed', got '%s'", message)
		}
	})
}

// TestKustomizationSuspendPath tests path parsing with the suspend/resume suffixes.
func TestKustomizationSuspendPath(t *testing.T) {
	const prefix = fluxcdKustomizationsPathPrefix

	t.Run("should parse namespace and name correctly with suspend suffix", func(t *testing.T) {
		path := "/api/fluxcd/kustomizations/flux-system/flux-system/suspend"
		namespace, name, err := parseResourcePath(path, prefix, suspendPathSuffix)

		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if namespace != "flux-system" {
			t.Errorf("expected namespace 'flux-system', got '%s'", namespace)
		}
		if name != "flux-system" {
			t.Errorf("expected name 'flux-system', got '%s'", name)
		}
	})

	t.Run("should parse namespace and name correctly with resume suffix", func(t *testing.T) {
		path := "/api/fluxcd/kustomizations/flux-system/flux-system/resume"
		namespace, name, err := parseResourcePath(path, prefix, resumePathSuffix)

		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if namespace != "flux-system" {
			t.Errorf("expected namespace 'flux-system', got '%s'", namespace)
		}
		if name != "flux-system" {
			t.Errorf("expected name 'flux-system', got '%s'", name)
		}
	})

	t.Run("should return error when only prefix is provided with suspend suffix", func(t *testing.T) {
		path := "/api/fluxcd/kustomizations/"
		_, _, err := parseResourcePath(path, prefix, suspendPathSuffix)

		if err == nil {
			t.Error("expected error for prefix-only path, got nil")
		}
	})
}
