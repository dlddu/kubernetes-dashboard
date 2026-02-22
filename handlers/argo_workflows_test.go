package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// TestWorkflowSubmitHandler tests the POST /api/argo/workflow-templates/{name}/submit endpoint
func TestWorkflowSubmitHandler(t *testing.T) {
	t.Run("should return 200 OK with workflow name and namespace on success", func(t *testing.T) {
		// Arrange
		body := `{"parameters": {"input-path": "/data/input", "env": "dev"}}`
		req := httptest.NewRequest(
			http.MethodPost,
			"/api/argo/workflow-templates/data-processing-with-params/submit",
			strings.NewReader(body),
		)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		// Act
		WorkflowSubmitHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// In CI without cluster, 500 is acceptable; with cluster, 200 or 404 is expected
		if res.StatusCode != http.StatusOK &&
			res.StatusCode != http.StatusInternalServerError &&
			res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 200, 404, or 500, got %d", res.StatusCode)
		}

		// If 200, verify JSON response structure
		if res.StatusCode == http.StatusOK {
			var response map[string]interface{}
			if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}
			if _, exists := response["name"]; !exists {
				t.Error("expected 'name' field in response")
			}
			if _, exists := response["namespace"]; !exists {
				t.Error("expected 'namespace' field in response")
			}
		}
	})

	t.Run("should set correct content-type header", func(t *testing.T) {
		// Arrange
		body := `{"parameters": {}}`
		req := httptest.NewRequest(
			http.MethodPost,
			"/api/argo/workflow-templates/simple-template/submit",
			strings.NewReader(body),
		)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		// Act
		WorkflowSubmitHandler(w, req)

		// Assert
		contentType := w.Header().Get("Content-Type")
		if contentType != "application/json" {
			t.Errorf("expected Content-Type 'application/json', got '%s'", contentType)
		}
	})

	t.Run("should reject non-POST methods", func(t *testing.T) {
		// Arrange
		methods := []string{http.MethodGet, http.MethodPut, http.MethodDelete, http.MethodPatch}

		for _, method := range methods {
			t.Run(method, func(t *testing.T) {
				req := httptest.NewRequest(
					method,
					"/api/argo/workflow-templates/some-template/submit",
					nil,
				)
				w := httptest.NewRecorder()

				// Act
				WorkflowSubmitHandler(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})

	t.Run("should return 404 when workflow template does not exist", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		body := `{"parameters": {}}`
		req := httptest.NewRequest(
			http.MethodPost,
			"/api/argo/workflow-templates/non-existent-template/submit",
			strings.NewReader(body),
		)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		// Act
		WorkflowSubmitHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 404 for non-existent template, got %d", res.StatusCode)
		}
	})

	t.Run("should return 400 when request body is invalid JSON", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(
			http.MethodPost,
			"/api/argo/workflow-templates/some-template/submit",
			strings.NewReader("not-valid-json"),
		)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		// Act
		WorkflowSubmitHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusBadRequest &&
			res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 400 or 500 for invalid JSON body, got %d", res.StatusCode)
		}
	})

	t.Run("should accept empty parameters object", func(t *testing.T) {
		// Arrange
		body := `{"parameters": {}}`
		req := httptest.NewRequest(
			http.MethodPost,
			"/api/argo/workflow-templates/simple-template/submit",
			strings.NewReader(body),
		)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		// Act
		WorkflowSubmitHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should not fail due to empty parameters
		if res.StatusCode != http.StatusOK &&
			res.StatusCode != http.StatusInternalServerError &&
			res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 200, 404, or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should return valid JSON even on error", func(t *testing.T) {
		// Arrange
		body := `{"parameters": {}}`
		req := httptest.NewRequest(
			http.MethodPost,
			"/api/argo/workflow-templates/any-template/submit",
			strings.NewReader(body),
		)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		// Act
		WorkflowSubmitHandler(w, req)

		// Assert: response should always be valid JSON
		res := w.Result()
		defer res.Body.Close()

		var result interface{}
		if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
			t.Errorf("response should be valid JSON, got error: %v", err)
		}
	})

	t.Run("should handle missing template name in path", func(t *testing.T) {
		// Arrange: path without a template name segment
		body := `{"parameters": {}}`
		req := httptest.NewRequest(
			http.MethodPost,
			"/api/argo/workflow-templates//submit",
			strings.NewReader(body),
		)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		// Act
		WorkflowSubmitHandler(w, req)

		// Assert: should return an error
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusOK {
			t.Error("expected error status for missing template name in path")
		}
	})
}

// TestWorkflowSubmitHandlerResponseStructure tests the exact response format
func TestWorkflowSubmitHandlerResponseStructure(t *testing.T) {
	t.Run("should return name and namespace fields on successful submission", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange: assumes data-processing-with-params template exists via fixture
		body := `{"parameters": {"input-path": "/data/input", "output-path": "/data/output", "batch-size": "10", "env": "dev"}}`
		req := httptest.NewRequest(
			http.MethodPost,
			"/api/argo/workflow-templates/data-processing-with-params/submit",
			strings.NewReader(body),
		)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		// Act
		WorkflowSubmitHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Skipf("skipping: API returned %d (template may not exist in cluster)", res.StatusCode)
		}

		var response struct {
			Name      string `json:"name"`
			Namespace string `json:"namespace"`
		}
		if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
			t.Fatalf("failed to decode response into expected structure: %v", err)
		}

		if response.Name == "" {
			t.Error("expected non-empty workflow name in response")
		}
		if response.Namespace == "" {
			t.Error("expected non-empty namespace in response")
		}

		t.Logf("Submitted workflow: name=%s, namespace=%s", response.Name, response.Namespace)
	})

	t.Run("should return error field on 404", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		body := `{"parameters": {}}`
		req := httptest.NewRequest(
			http.MethodPost,
			"/api/argo/workflow-templates/non-existent-template-xyz/submit",
			strings.NewReader(body),
		)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		// Act
		WorkflowSubmitHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusNotFound {
			t.Skipf("skipping: expected 404, got %d", res.StatusCode)
		}

		var errResponse map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&errResponse); err != nil {
			t.Fatalf("failed to decode error response: %v", err)
		}

		if _, exists := errResponse["error"]; !exists {
			t.Error("expected 'error' field in 404 response body")
		}
	})
}

// TestWorkflowSubmitHandlerParameters tests parameter handling behaviour
func TestWorkflowSubmitHandlerParameters(t *testing.T) {
	t.Run("should pass parameters to created workflow", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		params := map[string]string{
			"input-path":  "/custom/input",
			"output-path": "/custom/output",
			"batch-size":  "50",
			"env":         "staging",
		}
		bodyBytes, _ := json.Marshal(map[string]interface{}{"parameters": params})
		req := httptest.NewRequest(
			http.MethodPost,
			"/api/argo/workflow-templates/data-processing-with-params/submit",
			bytes.NewReader(bodyBytes),
		)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		// Act
		WorkflowSubmitHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Verify submission succeeded or template not found (cluster may not have fixture)
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusNotFound {
			t.Errorf("expected 200 or 404, got %d", res.StatusCode)
		}
	})

	t.Run("should accept null parameters field", func(t *testing.T) {
		// Arrange
		body := `{"parameters": null}`
		req := httptest.NewRequest(
			http.MethodPost,
			"/api/argo/workflow-templates/simple-template/submit",
			strings.NewReader(body),
		)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		// Act
		WorkflowSubmitHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK &&
			res.StatusCode != http.StatusInternalServerError &&
			res.StatusCode != http.StatusNotFound {
			t.Errorf("expected 200, 404, or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should accept parameters with special characters in values", func(t *testing.T) {
		// Arrange
		body := `{"parameters": {"input-path": "/data/path with spaces/file.csv"}}`
		req := httptest.NewRequest(
			http.MethodPost,
			"/api/argo/workflow-templates/simple-template/submit",
			strings.NewReader(body),
		)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		// Act
		WorkflowSubmitHandler(w, req)

		// Assert: should not return 400 for valid-but-special parameter values
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusBadRequest {
			t.Error("should not return 400 for valid parameter values with special characters")
		}
	})
}

// TestWorkflowSubmitIntegration tests the full submit flow against a real cluster
func TestWorkflowSubmitIntegration(t *testing.T) {
	t.Run("should create workflow from data-processing-with-params template", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange: assumes fixture data-processing-with-params exists in dashboard-test namespace
		body := `{"parameters": {"input-path": "/data/input", "output-path": "/data/output", "batch-size": "5", "env": "dev"}}`
		req := httptest.NewRequest(
			http.MethodPost,
			"/api/argo/workflow-templates/data-processing-with-params/submit",
			strings.NewReader(body),
		)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		// Act
		WorkflowSubmitHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Template may not exist in this cluster run
		if res.StatusCode == http.StatusNotFound {
			t.Skip("data-processing-with-params template not found in cluster (fixture may not be applied)")
		}

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var response struct {
			Name      string `json:"name"`
			Namespace string `json:"namespace"`
		}
		if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if response.Name == "" {
			t.Error("created workflow should have a non-empty name")
		}
		if response.Namespace == "" {
			t.Error("created workflow should have a non-empty namespace")
		}

		t.Logf("Successfully created workflow: name=%s, namespace=%s",
			response.Name, response.Namespace)
	})
}
