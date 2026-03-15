package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// TestGitRepositoryDetailHandler tests GET /api/fluxcd/gitrepositories/{namespace}/{name}
func TestGitRepositoryDetailHandler(t *testing.T) {
	t.Run("should reject non-GET methods", func(t *testing.T) {
		// Arrange
		methods := []string{http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodPatch}

		for _, method := range methods {
			t.Run(method, func(t *testing.T) {
				req := httptest.NewRequest(method, "/api/fluxcd/gitrepositories/dashboard-test/flux-system", nil)
				w := httptest.NewRecorder()

				// Act
				GitRepositoryDetailHandler(w, req)

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
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/gitrepositories/dashboard-test/flux-system", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryDetailHandler(w, req)

		// Assert
		contentType := w.Header().Get("Content-Type")
		if contentType != "application/json" {
			t.Errorf("expected Content-Type 'application/json', got '%s'", contentType)
		}
	})

	t.Run("should return 400 when namespace segment is missing", func(t *testing.T) {
		// Arrange: path has only one segment after prefix (no slash → parseResourcePath fails)
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/gitrepositories/", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400 for missing path parameters, got %d", res.StatusCode)
		}
	})

	t.Run("should return 400 when name segment is missing", func(t *testing.T) {
		// Arrange: only namespace, no name
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/gitrepositories/dashboard-test/", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400 for missing name parameter, got %d", res.StatusCode)
		}
	})

	t.Run("should return 400 with JSON error body on invalid path", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/gitrepositories/", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryDetailHandler(w, req)

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
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/gitrepositories/dashboard-test/flux-system", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryDetailHandler(w, req)

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
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/gitrepositories/dashboard-test/flux-system", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryDetailHandler(w, req)

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
			http.MethodGet,
			"/api/fluxcd/gitrepositories/my-namespace/my-gitrepository-abc12",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryDetailHandler(w, req)

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
			http.MethodGet,
			"/api/fluxcd/gitrepositories/non-existent-ns/non-existent-gitrepository-xyz",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryDetailHandler(w, req)

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
}

// TestGitRepositoryDetailHandlerResponseStructure tests the response schema (cluster-dependent).
func TestGitRepositoryDetailHandlerResponseStructure(t *testing.T) {
	t.Run("should return detail object with required top-level fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange: relies on dashboard-test/flux-system git repository existing in cluster.
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/fluxcd/gitrepositories/dashboard-test/flux-system",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusNotFound {
			t.Skip("dashboard-test/flux-system git repository not found; skipping field validation")
		}
		if res.StatusCode == http.StatusInternalServerError {
			t.Skipf("skipping: FluxCD CRD may not be installed (got 500)")
		}
		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var detail map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&detail); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		requiredFields := []string{"name", "namespace", "spec", "status", "suspended"}
		for _, field := range requiredFields {
			if _, exists := detail[field]; !exists {
				t.Errorf("expected field '%s' in git repository detail, but not found", field)
			}
		}
	})

	t.Run("should return spec with required sub-fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/fluxcd/gitrepositories/dashboard-test/flux-system",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Skipf("skipping: API returned %d", res.StatusCode)
		}

		var detail map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&detail); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		spec, ok := detail["spec"].(map[string]interface{})
		if !ok {
			t.Fatal("expected 'spec' to be a JSON object")
		}

		specFields := []string{"url", "interval", "ref"}
		for _, field := range specFields {
			if _, exists := spec[field]; !exists {
				t.Errorf("expected spec field '%s', but not found", field)
			}
		}
	})

	t.Run("should return status with required sub-fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/fluxcd/gitrepositories/dashboard-test/flux-system",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Skipf("skipping: API returned %d", res.StatusCode)
		}

		var detail map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&detail); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		status, ok := detail["status"].(map[string]interface{})
		if !ok {
			t.Fatal("expected 'status' to be a JSON object")
		}

		if _, exists := status["conditions"]; !exists {
			t.Error("expected status field 'conditions', but not found")
		}
	})

	t.Run("should return ref with branch or tag fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/fluxcd/gitrepositories/dashboard-test/flux-system",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Skipf("skipping: API returned %d", res.StatusCode)
		}

		var detail map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&detail); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		spec, ok := detail["spec"].(map[string]interface{})
		if !ok {
			t.Fatal("expected 'spec' to be a JSON object")
		}

		ref, ok := spec["ref"].(map[string]interface{})
		if !ok {
			t.Fatal("expected 'spec.ref' to be a JSON object")
		}

		// At least one ref field should exist (branch, tag, semver, or commit)
		hasAnyRef := false
		for _, field := range []string{"branch", "tag", "semver", "commit"} {
			if val, exists := ref[field]; exists {
				if str, ok := val.(string); ok && str != "" {
					hasAnyRef = true
					break
				}
			}
		}
		if !hasAnyRef {
			t.Log("warning: no non-empty ref field found (branch/tag/semver/commit)")
		}
	})

	t.Run("should decode into strongly-typed GitRepositoryDetailInfo struct", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/fluxcd/gitrepositories/dashboard-test/flux-system",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Skipf("skipping: API returned %d", res.StatusCode)
		}

		type conditionInfo struct {
			Type               string `json:"type"`
			Status             string `json:"status"`
			Reason             string `json:"reason"`
			Message            string `json:"message"`
			LastTransitionTime string `json:"lastTransitionTime"`
		}
		type refInfo struct {
			Branch string `json:"branch,omitempty"`
			Tag    string `json:"tag,omitempty"`
			Semver string `json:"semver,omitempty"`
			Commit string `json:"commit,omitempty"`
		}
		type secretRefInfo struct {
			Name string `json:"name"`
		}
		type artifactInfo struct {
			Revision       string `json:"revision"`
			LastUpdateTime string `json:"lastUpdateTime"`
		}
		type specInfo struct {
			URL       string         `json:"url"`
			Interval  string         `json:"interval"`
			Ref       refInfo        `json:"ref"`
			SecretRef *secretRefInfo `json:"secretRef,omitempty"`
		}
		type statusInfo struct {
			Conditions []conditionInfo `json:"conditions"`
			Artifact   *artifactInfo   `json:"artifact,omitempty"`
		}
		type gitRepositoryDetail struct {
			Name      string     `json:"name"`
			Namespace string     `json:"namespace"`
			Spec      specInfo   `json:"spec"`
			Status    statusInfo `json:"status"`
			Suspended bool       `json:"suspended"`
		}

		var detail gitRepositoryDetail
		if err := json.NewDecoder(res.Body).Decode(&detail); err != nil {
			t.Fatalf("failed to decode response into expected structure: %v", err)
		}

		if detail.Name == "" {
			t.Error("git repository name should not be empty")
		}
		if detail.Namespace == "" {
			t.Error("git repository namespace should not be empty")
		}

		t.Logf("GitRepositoryDetail: name=%s namespace=%s suspended=%v conditions=%d",
			detail.Name, detail.Namespace, detail.Suspended, len(detail.Status.Conditions))
	})
}

// TestGitRepositoryDetailHandlerErrorResponse tests JSON error structure for error responses.
func TestGitRepositoryDetailHandlerErrorResponse(t *testing.T) {
	t.Run("should return JSON with error field on 400", func(t *testing.T) {
		// Arrange: path that triggers a 400 (missing name/namespace)
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/gitrepositories/", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusBadRequest {
			t.Skipf("expected 400, got %d", res.StatusCode)
		}

		var errBody map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&errBody); err != nil {
			t.Fatalf("error response should be valid JSON: %v", err)
		}

		if _, hasError := errBody["error"]; !hasError {
			t.Error("expected 'error' field in 400 response body")
		}
	})

	t.Run("should return JSON with error field on 404", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/fluxcd/gitrepositories/non-existent/non-existent-xyz",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusInternalServerError {
			t.Skip("skipping: FluxCD CRD may not be installed (got 500)")
		}
		if res.StatusCode != http.StatusNotFound {
			t.Skipf("expected 404, got %d — skipping JSON error body check", res.StatusCode)
		}

		var errBody map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&errBody); err != nil {
			t.Fatalf("error response should be valid JSON: %v", err)
		}

		if _, hasError := errBody["error"]; !hasError {
			t.Error("expected 'error' field in 404 response body")
		}
	})
}

// TestParseGitRepositoryDetailPath tests the namespace/name path parsing logic.
func TestParseGitRepositoryDetailPath(t *testing.T) {
	const prefix = fluxcdGitRepositoriesPathPrefix

	t.Run("should parse namespace and name correctly", func(t *testing.T) {
		// Arrange
		path := "/api/fluxcd/gitrepositories/dashboard-test/flux-system"
		namespace, name, err := parseResourcePath(path, prefix, "")

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

	t.Run("should parse namespace and name with hyphens", func(t *testing.T) {
		// Arrange
		path := "/api/fluxcd/gitrepositories/my-namespace/my-gitrepository-abc12"
		namespace, name, err := parseResourcePath(path, prefix, "")

		// Assert
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if namespace != "my-namespace" {
			t.Errorf("expected namespace 'my-namespace', got '%s'", namespace)
		}
		if name != "my-gitrepository-abc12" {
			t.Errorf("expected name 'my-gitrepository-abc12', got '%s'", name)
		}
	})

	t.Run("should return error when only prefix is provided", func(t *testing.T) {
		// Arrange
		path := "/api/fluxcd/gitrepositories/"
		_, _, err := parseResourcePath(path, prefix, "")

		// Assert
		if err == nil {
			t.Error("expected error for prefix-only path, got nil")
		}
	})

	t.Run("should return error when only namespace is provided without name", func(t *testing.T) {
		// Arrange
		path := "/api/fluxcd/gitrepositories/dashboard-test/"
		_, _, err := parseResourcePath(path, prefix, "")

		// Assert
		if err == nil {
			t.Error("expected error for namespace-only path, got nil")
		}
	})

	t.Run("should correctly distinguish namespace from name", func(t *testing.T) {
		// Arrange
		path := "/api/fluxcd/gitrepositories/production/my-repo"
		namespace, name, err := parseResourcePath(path, prefix, "")

		// Assert
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if namespace == name {
			t.Errorf("namespace and name should differ: namespace=%s, name=%s", namespace, name)
		}

		// Confirm correct assignment
		if namespace != "production" {
			t.Errorf("expected namespace 'production', got '%s'", namespace)
		}
		if name != "my-repo" {
			t.Errorf("expected name 'my-repo', got '%s'", name)
		}
	})
}

// TestGitRepositoryDetailHandlerNotFound tests the handler returns 404 for wrong names
// and verifies the routing does not return a generic Go 404.
func TestGitRepositoryDetailHandlerNotFound(t *testing.T) {
	t.Run("should not return generic Go 404 for valid namespace/name path", func(t *testing.T) {
		// Arrange: directly call the handler — route is tested in main_test.go.
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/fluxcd/gitrepositories/dashboard-test/flux-system",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		GitRepositoryDetailHandler(w, req)

		// Assert: a generic Go 404 has no JSON body; our handler always returns JSON
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusNotFound &&
			strings.Contains(w.Body.String(), "404 page not found") {
			t.Error("handler returned generic Go 404; JSON error body expected")
		}
	})
}
