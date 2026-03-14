package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// TestKustomizationDetailHandler tests GET /api/fluxcd/kustomizations/{namespace}/{name}
func TestKustomizationDetailHandler(t *testing.T) {
	t.Run("should reject non-GET methods", func(t *testing.T) {
		// Arrange
		methods := []string{http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodPatch}

		for _, method := range methods {
			t.Run(method, func(t *testing.T) {
				req := httptest.NewRequest(method, "/api/fluxcd/kustomizations/flux-system/flux-system", nil)
				w := httptest.NewRecorder()

				// Act
				KustomizationDetailHandler(w, req)

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
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/kustomizations/flux-system/flux-system", nil)
		w := httptest.NewRecorder()

		// Act
		KustomizationDetailHandler(w, req)

		// Assert
		contentType := w.Header().Get("Content-Type")
		if contentType != "application/json" {
			t.Errorf("expected Content-Type 'application/json', got '%s'", contentType)
		}
	})

	t.Run("should return 400 when namespace segment is missing", func(t *testing.T) {
		// Arrange: path has only one segment after prefix (no slash → parseResourcePath fails)
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/kustomizations/", nil)
		w := httptest.NewRecorder()

		// Act
		KustomizationDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400 for missing path parameters, got %d", res.StatusCode)
		}
	})

	t.Run("should return 400 when name segment is missing", func(t *testing.T) {
		// Arrange: only namespace, no name
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/kustomizations/flux-system/", nil)
		w := httptest.NewRecorder()

		// Act
		KustomizationDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400 for missing name parameter, got %d", res.StatusCode)
		}
	})

	t.Run("should return 400 with JSON error body on invalid path", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/kustomizations/", nil)
		w := httptest.NewRecorder()

		// Act
		KustomizationDetailHandler(w, req)

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
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/kustomizations/flux-system/flux-system", nil)
		w := httptest.NewRecorder()

		// Act
		KustomizationDetailHandler(w, req)

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
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/kustomizations/flux-system/flux-system", nil)
		w := httptest.NewRecorder()

		// Act
		KustomizationDetailHandler(w, req)

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
			"/api/fluxcd/kustomizations/my-namespace/my-kustomization-abc12",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		KustomizationDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should not return 400 — the path is valid
		if res.StatusCode == http.StatusBadRequest {
			t.Error("expected handler to parse namespace/name with hyphens correctly (should not be 400)")
		}
	})

	t.Run("should return 404 when kustomization does not exist", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/fluxcd/kustomizations/non-existent-ns/non-existent-kustomization-xyz",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		KustomizationDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusInternalServerError {
			t.Skip("skipping: FluxCD CRD may not be installed in cluster (got 500)")
		}

		if res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 404 for non-existent kustomization, got %d", res.StatusCode)
		}
	})
}

// TestKustomizationDetailHandlerResponseStructure tests the response schema (cluster-dependent).
func TestKustomizationDetailHandlerResponseStructure(t *testing.T) {
	t.Run("should return detail object with required top-level fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange: relies on flux-system/flux-system kustomization existing in cluster.
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/fluxcd/kustomizations/flux-system/flux-system",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		KustomizationDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusNotFound {
			t.Skip("flux-system/flux-system kustomization not found; skipping field validation")
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
				t.Errorf("expected field '%s' in kustomization detail, but not found", field)
			}
		}
	})

	t.Run("should return spec with required sub-fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/fluxcd/kustomizations/flux-system/flux-system",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		KustomizationDetailHandler(w, req)

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

		specFields := []string{"interval", "path", "prune", "sourceRef"}
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
			"/api/fluxcd/kustomizations/flux-system/flux-system",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		KustomizationDetailHandler(w, req)

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

		statusFields := []string{"lastAppliedRevision", "conditions"}
		for _, field := range statusFields {
			if _, exists := status[field]; !exists {
				t.Errorf("expected status field '%s', but not found", field)
			}
		}
	})

	t.Run("should return sourceRef with kind and name fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/fluxcd/kustomizations/flux-system/flux-system",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		KustomizationDetailHandler(w, req)

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

		sourceRef, ok := spec["sourceRef"].(map[string]interface{})
		if !ok {
			t.Fatal("expected 'spec.sourceRef' to be a JSON object")
		}

		if _, hasKind := sourceRef["kind"]; !hasKind {
			t.Error("expected 'sourceRef.kind' field")
		}
		if _, hasName := sourceRef["name"]; !hasName {
			t.Error("expected 'sourceRef.name' field")
		}
	})

	t.Run("should decode into strongly-typed KustomizationDetailInfo struct", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/fluxcd/kustomizations/flux-system/flux-system",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		KustomizationDetailHandler(w, req)

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
		type sourceRefInfo struct {
			Kind      string `json:"kind"`
			Name      string `json:"name"`
			Namespace string `json:"namespace,omitempty"`
		}
		type dependsOnRef struct {
			Name      string `json:"name"`
			Namespace string `json:"namespace,omitempty"`
		}
		type specInfo struct {
			Interval  string       `json:"interval"`
			Path      string       `json:"path"`
			Prune     bool         `json:"prune"`
			SourceRef sourceRefInfo `json:"sourceRef"`
			DependsOn []dependsOnRef `json:"dependsOn"`
		}
		type statusInfo struct {
			LastAppliedRevision string          `json:"lastAppliedRevision"`
			Conditions          []conditionInfo `json:"conditions"`
		}
		type kustomizationDetail struct {
			Name      string     `json:"name"`
			Namespace string     `json:"namespace"`
			Spec      specInfo   `json:"spec"`
			Status    statusInfo `json:"status"`
			Suspended bool       `json:"suspended"`
		}

		var detail kustomizationDetail
		if err := json.NewDecoder(res.Body).Decode(&detail); err != nil {
			t.Fatalf("failed to decode response into expected structure: %v", err)
		}

		if detail.Name == "" {
			t.Error("kustomization name should not be empty")
		}
		if detail.Namespace == "" {
			t.Error("kustomization namespace should not be empty")
		}

		t.Logf("KustomizationDetail: name=%s namespace=%s suspended=%v revision=%s conditions=%d",
			detail.Name, detail.Namespace, detail.Suspended,
			detail.Status.LastAppliedRevision, len(detail.Status.Conditions))
	})
}

// TestKustomizationDetailHandlerErrorResponse tests JSON error structure for error responses.
func TestKustomizationDetailHandlerErrorResponse(t *testing.T) {
	t.Run("should return JSON with error field on 400", func(t *testing.T) {
		// Arrange: path that triggers a 400 (missing name/namespace)
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/kustomizations/", nil)
		w := httptest.NewRecorder()

		// Act
		KustomizationDetailHandler(w, req)

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
			"/api/fluxcd/kustomizations/non-existent/non-existent-xyz",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		KustomizationDetailHandler(w, req)

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

// TestParseKustomizationDetailPath tests the namespace/name path parsing logic.
func TestParseKustomizationDetailPath(t *testing.T) {
	const prefix = fluxcdKustomizationsPathPrefix

	t.Run("should parse namespace and name correctly", func(t *testing.T) {
		// Arrange
		path := "/api/fluxcd/kustomizations/flux-system/flux-system"
		namespace, name, err := parseResourcePath(path, prefix, "")

		// Assert
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

	t.Run("should parse namespace and name with hyphens", func(t *testing.T) {
		// Arrange
		path := "/api/fluxcd/kustomizations/my-namespace/my-kustomization-abc12"
		namespace, name, err := parseResourcePath(path, prefix, "")

		// Assert
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if namespace != "my-namespace" {
			t.Errorf("expected namespace 'my-namespace', got '%s'", namespace)
		}
		if name != "my-kustomization-abc12" {
			t.Errorf("expected name 'my-kustomization-abc12', got '%s'", name)
		}
	})

	t.Run("should return error when only prefix is provided", func(t *testing.T) {
		// Arrange
		path := "/api/fluxcd/kustomizations/"
		_, _, err := parseResourcePath(path, prefix, "")

		// Assert
		if err == nil {
			t.Error("expected error for prefix-only path, got nil")
		}
	})

	t.Run("should return error when only namespace is provided without name", func(t *testing.T) {
		// Arrange
		path := "/api/fluxcd/kustomizations/flux-system/"
		_, _, err := parseResourcePath(path, prefix, "")

		// Assert
		if err == nil {
			t.Error("expected error for namespace-only path, got nil")
		}
	})

	t.Run("should correctly distinguish namespace from name", func(t *testing.T) {
		// Arrange
		path := "/api/fluxcd/kustomizations/production/my-app"
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
		if name != "my-app" {
			t.Errorf("expected name 'my-app', got '%s'", name)
		}
	})
}

// TestKustomizationDetailHandlerNotFound tests the handler returns 404 for wrong names
// and verifies the routing does not return a generic Go 404.
func TestKustomizationDetailHandlerNotFound(t *testing.T) {
	t.Run("should not return generic Go 404 for valid namespace/name path", func(t *testing.T) {
		// Arrange: directly call the handler — route is tested in main_test.go.
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/fluxcd/kustomizations/flux-system/flux-system",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		KustomizationDetailHandler(w, req)

		// Assert: a generic Go 404 has no JSON body; our handler always returns JSON
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusNotFound &&
			strings.Contains(w.Body.String(), "404 page not found") {
			t.Error("handler returned generic Go 404; JSON error body expected")
		}
	})
}
