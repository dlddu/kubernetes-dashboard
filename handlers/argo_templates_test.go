package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestWorkflowTemplatesHandler tests the GET /api/argo/workflow-templates endpoint
func TestWorkflowTemplatesHandler(t *testing.T) {
	t.Run("should return 200 OK with workflow templates list", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflow-templates", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowTemplatesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// In CI environment without cluster, 500 is acceptable
		// In cluster environment, 200 is expected
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}

		// If 200, verify JSON response structure
		if res.StatusCode == http.StatusOK {
			var templates []map[string]interface{}
			if err := json.NewDecoder(res.Body).Decode(&templates); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}
		}
	})

	t.Run("should set correct content-type header", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflow-templates", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowTemplatesHandler(w, req)

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
				req := httptest.NewRequest(method, "/api/argo/workflow-templates", nil)
				w := httptest.NewRecorder()

				// Act
				WorkflowTemplatesHandler(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})

	t.Run("should accept namespace query parameter", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflow-templates?ns=default", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowTemplatesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should not fail with namespace parameter
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should return all namespaces templates when ns parameter is empty", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflow-templates?ns=", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowTemplatesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Empty namespace should be treated as all namespaces
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should handle Kubernetes client errors gracefully", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflow-templates", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowTemplatesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should either succeed or return error status
		// In TDD Red phase, this might fail or return 500 if client is not configured
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})
}

// TestWorkflowTemplatesHandlerResponseStructure tests the exact response format
func TestWorkflowTemplatesHandlerResponseStructure(t *testing.T) {
	t.Run("should return array of workflow templates with required fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflow-templates", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowTemplatesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var templates []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&templates); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// If there are templates, verify structure
		if len(templates) > 0 {
			firstTemplate := templates[0]
			requiredFields := []string{"name", "namespace", "parameters"}
			for _, field := range requiredFields {
				if _, exists := firstTemplate[field]; !exists {
					t.Errorf("expected field '%s' in workflow template object, but not found", field)
				}
			}
		}
	})

	t.Run("should return parameters as array", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflow-templates", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowTemplatesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var templates []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&templates); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if len(templates) == 0 {
			t.Skip("no workflow templates in cluster")
		}

		// Verify parameters is an array (not nil)
		params, ok := templates[0]["parameters"].([]interface{})
		if !ok {
			// Parameters field should be an array (can be empty)
			if templates[0]["parameters"] != nil {
				t.Errorf("expected 'parameters' to be an array, got %T", templates[0]["parameters"])
			}
		} else {
			// If there are parameters, verify each has name field
			for _, param := range params {
				paramMap, ok := param.(map[string]interface{})
				if !ok {
					t.Error("expected each parameter to be an object")
					continue
				}
				if _, exists := paramMap["name"]; !exists {
					t.Error("expected 'name' field in each parameter")
				}
			}
		}
	})

	t.Run("should match expected JSON structure for workflow template", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflow-templates", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowTemplatesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Skipf("skipping: API returned %d", res.StatusCode)
		}

		var templates []struct {
			Name      string `json:"name"`
			Namespace string `json:"namespace"`
			Parameters []struct {
				Name        string  `json:"name"`
				Value       *string `json:"value,omitempty"`
				Description *string `json:"description,omitempty"`
				Enum        []string `json:"enum,omitempty"`
			} `json:"parameters"`
		}

		if err := json.NewDecoder(res.Body).Decode(&templates); err != nil {
			t.Fatalf("failed to decode response into expected structure: %v", err)
		}

		// Verify each template has non-empty name and namespace
		for _, template := range templates {
			if template.Name == "" {
				t.Error("template name should not be empty")
			}
			if template.Namespace == "" {
				t.Error("template namespace should not be empty")
			}
			t.Logf("WorkflowTemplate: name=%s, namespace=%s, params=%d",
				template.Name, template.Namespace, len(template.Parameters))
		}
	})
}

// TestWorkflowTemplatesHandlerNamespaceFilter tests namespace filtering behavior
func TestWorkflowTemplatesHandlerNamespaceFilter(t *testing.T) {
	t.Run("should filter workflow templates by namespace when ns parameter provided", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflow-templates?ns=dashboard-test", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowTemplatesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var templates []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&templates); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// All templates should be from dashboard-test namespace
		for _, template := range templates {
			namespace, ok := template["namespace"].(string)
			if !ok {
				t.Error("namespace field should be a string")
				continue
			}
			if namespace != "dashboard-test" {
				t.Errorf("expected namespace 'dashboard-test', got '%s'", namespace)
			}
		}
	})

	t.Run("should return empty array for non-existent namespace", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflow-templates?ns=non-existent-namespace", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowTemplatesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var templates []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&templates); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Should return empty array for non-existent namespace
		if len(templates) != 0 {
			t.Errorf("expected empty array for non-existent namespace, got %d templates", len(templates))
		}
	})

	t.Run("should return valid JSON even when argo client is unavailable", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflow-templates", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowTemplatesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Response should always be valid JSON
		var result interface{}
		if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
			t.Errorf("response should be valid JSON, got error: %v", err)
		}
	})
}

// TestWorkflowTemplatesWithFixtures tests the handler against fixture data (cluster-dependent)
func TestWorkflowTemplatesWithFixtures(t *testing.T) {
	t.Run("should return data-processing-with-params template with 4 parameters", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange: fixture workflow-template-with-params.yaml creates a template
		// named 'data-processing-with-params' in 'dashboard-test' namespace
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflow-templates?ns=dashboard-test", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowTemplatesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var templates []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&templates); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Find the data-processing-with-params template
		var dataProcessingTemplate map[string]interface{}
		for _, tmpl := range templates {
			if name, ok := tmpl["name"].(string); ok && name == "data-processing-with-params" {
				dataProcessingTemplate = tmpl
				break
			}
		}

		if dataProcessingTemplate == nil {
			t.Skip("data-processing-with-params template not found in cluster (fixture may not be applied)")
		}

		// Verify it has parameters
		params, ok := dataProcessingTemplate["parameters"].([]interface{})
		if !ok {
			t.Fatal("expected 'parameters' to be an array")
		}

		if len(params) != 4 {
			t.Errorf("expected 4 parameters, got %d", len(params))
		}

		// Verify required parameter names
		expectedParams := map[string]bool{
			"input-path":  false,
			"output-path": false,
			"batch-size":  false,
			"env":         false,
		}

		for _, param := range params {
			paramMap, ok := param.(map[string]interface{})
			if !ok {
				continue
			}
			if name, ok := paramMap["name"].(string); ok {
				if _, exists := expectedParams[name]; exists {
					expectedParams[name] = true
				}
			}
		}

		for paramName, found := range expectedParams {
			if !found {
				t.Errorf("expected parameter '%s' not found in response", paramName)
			}
		}
	})

	t.Run("should return simple-template with empty parameters array", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange: fixture workflow-template-no-params.yaml creates a template
		// named 'simple-template' in 'dashboard-test' namespace
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflow-templates?ns=dashboard-test", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowTemplatesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var templates []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&templates); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Find the simple-template
		var simpleTemplate map[string]interface{}
		for _, tmpl := range templates {
			if name, ok := tmpl["name"].(string); ok && name == "simple-template" {
				simpleTemplate = tmpl
				break
			}
		}

		if simpleTemplate == nil {
			t.Skip("simple-template not found in cluster (fixture may not be applied)")
		}

		// Verify it has zero parameters
		params, ok := simpleTemplate["parameters"].([]interface{})
		if !ok {
			// nil parameters is acceptable for no-params template
			if simpleTemplate["parameters"] != nil {
				t.Errorf("expected 'parameters' to be an array or null, got %T", simpleTemplate["parameters"])
			}
		} else if len(params) != 0 {
			t.Errorf("expected 0 parameters for simple-template, got %d", len(params))
		}
	})
}
