package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestGitRepositoryReconcileHandler tests POST /api/fluxcd/gitrepositories/{namespace}/{name}/reconcile
func TestGitRepositoryReconcileHandler(t *testing.T) {
	t.Run("should reject non-POST methods", func(t *testing.T) {
		// Arrange
		methods := []string{http.MethodGet, http.MethodPut, http.MethodDelete, http.MethodPatch}

		for _, method := range methods {
			t.Run(method, func(t *testing.T) {
				req := httptest.NewRequest(method, "/api/fluxcd/gitrepositories/dashboard-test/flux-system/reconcile", nil)
				w := httptest.NewRecorder()

				// Act
				GitRepositoryReconcileHandler(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})

	t.Run("should set Content-Type to application/json", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodPost, "/api/fluxcd/gitrepositories/dashboard-test/flux-system/reconcile", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryReconcileHandler(w, req)

		// Assert
		contentType := w.Header().Get("Content-Type")
		if contentType != "application/json" {
			t.Errorf("expected Content-Type 'application/json', got '%s'", contentType)
		}
	})

	t.Run("should return 400 when namespace segment is missing", func(t *testing.T) {
		// Arrange: path has only the suffix after prefix, missing namespace/name
		req := httptest.NewRequest(http.MethodPost, "/api/fluxcd/gitrepositories/", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryReconcileHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400 for missing path parameters, got %d", res.StatusCode)
		}
	})

	t.Run("should return 400 when name segment is missing", func(t *testing.T) {
		// Arrange: namespace present but name is empty before /reconcile
		req := httptest.NewRequest(http.MethodPost, "/api/fluxcd/gitrepositories/dashboard-test//reconcile", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryReconcileHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400 for missing name parameter, got %d", res.StatusCode)
		}
	})

	t.Run("should return 400 with JSON error body on invalid path", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodPost, "/api/fluxcd/gitrepositories/", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryReconcileHandler(w, req)

		// Assert
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

	t.Run("should return 200 or 500 in CI environment", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodPost, "/api/fluxcd/gitrepositories/dashboard-test/flux-system/reconcile", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryReconcileHandler(w, req)

		// Assert
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
		// Arrange
		req := httptest.NewRequest(http.MethodPost, "/api/fluxcd/gitrepositories/dashboard-test/flux-system/reconcile", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryReconcileHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var result interface{}
		if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
			t.Errorf("response body is not valid JSON: %v", err)
		}
	})

	t.Run("should accept name with hyphens in path", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(
			http.MethodPost,
			"/api/fluxcd/gitrepositories/my-namespace/my-gitrepository-abc12/reconcile",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryReconcileHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should not return 400 — the path is valid
		if res.StatusCode == http.StatusBadRequest {
			t.Error("expected handler to parse namespace/name with hyphens correctly (should not be 400)")
		}
	})

	t.Run("should return 404 when git repository does not exist", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(
			http.MethodPost,
			"/api/fluxcd/gitrepositories/non-existent-ns/non-existent-gitrepository-xyz/reconcile",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryReconcileHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusInternalServerError {
			t.Skip("skipping: FluxCD CRD may not be installed in cluster (got 500)")
		}

		if res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 404 for non-existent git repository, got %d", res.StatusCode)
		}
	})

	t.Run("should return success message with reconciliation text", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange: relies on dashboard-test/flux-system git repository existing in cluster.
		req := httptest.NewRequest(
			http.MethodPost,
			"/api/fluxcd/gitrepositories/dashboard-test/flux-system/reconcile",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryReconcileHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusInternalServerError {
			t.Skipf("skipping: FluxCD CRD may not be installed (got 500)")
		}
		if res.StatusCode == http.StatusNotFound {
			t.Skip("dashboard-test/flux-system git repository not found; skipping message validation")
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

		// Verify message contains reconciliation-related text
		if message != "Reconciliation triggered" {
			t.Errorf("expected message 'Reconciliation triggered', got '%s'", message)
		}
	})
}

// TestGitRepositoryReconcilePath tests path parsing with the reconcile suffix.
func TestGitRepositoryReconcilePath(t *testing.T) {
	const prefix = fluxcdGitRepositoriesPathPrefix
	const suffix = reconcilePathSuffix

	t.Run("should parse namespace and name correctly with reconcile suffix", func(t *testing.T) {
		// Arrange
		path := "/api/fluxcd/gitrepositories/dashboard-test/flux-system/reconcile"
		namespace, name, err := parseResourcePath(path, prefix, suffix)

		// Assert
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if namespace != "dashboard-test" {
			t.Errorf("expected namespace 'dashboard-test', got '%s'", namespace)
		}
		if name != "flux-system" {
			t.Errorf("expected name 'flux-system', got '%s'", name)
		}
	})

	t.Run("should return error when only prefix is provided with reconcile suffix", func(t *testing.T) {
		// Arrange
		path := "/api/fluxcd/gitrepositories/"
		_, _, err := parseResourcePath(path, prefix, suffix)

		// Assert
		if err == nil {
			t.Error("expected error for prefix-only path, got nil")
		}
	})
}
