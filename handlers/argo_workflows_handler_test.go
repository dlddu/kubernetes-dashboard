package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestWorkflowsHandler tests the GET /api/argo/workflows endpoint.
func TestWorkflowsHandler(t *testing.T) {
	t.Run("should return 200 OK or 500 when cluster is unavailable", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// In CI without a cluster, 500 is acceptable.
		// When a cluster is present, 200 is expected.
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should set Content-Type to application/json", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowsHandler(w, req)

		// Assert
		contentType := w.Header().Get("Content-Type")
		if contentType != "application/json" {
			t.Errorf("expected Content-Type 'application/json', got '%s'", contentType)
		}
	})

	t.Run("should reject non-GET methods", func(t *testing.T) {
		// Arrange
		methods := []string{
			http.MethodPost,
			http.MethodPut,
			http.MethodDelete,
			http.MethodPatch,
		}

		for _, method := range methods {
			t.Run(method, func(t *testing.T) {
				req := httptest.NewRequest(method, "/api/argo/workflows", nil)
				w := httptest.NewRecorder()

				// Act
				WorkflowsHandler(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})

	t.Run("should accept ns query parameter without error", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows?ns=default", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should not fail solely because of the namespace parameter
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should treat empty ns parameter as all-namespaces query", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows?ns=", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should always return valid JSON", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var result interface{}
		if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
			t.Errorf("response body is not valid JSON: %v", err)
		}
	})
}

// TestWorkflowsHandlerResponseStructure tests that the response matches the
// expected WorkflowInfo schema when a cluster is available.
func TestWorkflowsHandlerResponseStructure(t *testing.T) {
	t.Run("should return array of workflow objects with required fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var workflows []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&workflows); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if len(workflows) == 0 {
			t.Skip("no workflows in cluster, skipping field validation")
		}

		requiredFields := []string{"name", "namespace", "templateName", "phase", "startedAt", "finishedAt", "nodes"}
		for _, field := range requiredFields {
			if _, exists := workflows[0][field]; !exists {
				t.Errorf("expected field '%s' in workflow object, but not found", field)
			}
		}
	})

	t.Run("should return nodes array without inputs or outputs fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var workflows []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&workflows); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if len(workflows) == 0 {
			t.Skip("no workflows in cluster, skipping nodes field validation")
		}

		nodes, ok := workflows[0]["nodes"].([]interface{})
		if !ok {
			// nodes can be null for a just-started workflow
			if workflows[0]["nodes"] != nil {
				t.Errorf("expected 'nodes' to be an array or null, got %T", workflows[0]["nodes"])
			}
			return
		}

		for _, node := range nodes {
			nodeMap, ok := node.(map[string]interface{})
			if !ok {
				t.Error("each node should be a JSON object")
				continue
			}

			// inputs and outputs must NOT appear in the summary list response
			if _, hasInputs := nodeMap["inputs"]; hasInputs {
				t.Error("node should not contain 'inputs' field in list response")
			}
			if _, hasOutputs := nodeMap["outputs"]; hasOutputs {
				t.Error("node should not contain 'outputs' field in list response")
			}

			// name and phase must be present
			if _, hasName := nodeMap["name"]; !hasName {
				t.Error("node should contain 'name' field")
			}
			if _, hasPhase := nodeMap["phase"]; !hasPhase {
				t.Error("node should contain 'phase' field")
			}
		}
	})

	t.Run("should decode response into strongly-typed WorkflowInfo slice", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Skipf("skipping: API returned %d", res.StatusCode)
		}

		// WorkflowInfo mirrors the expected JSON shape
		type nodeInfo struct {
			Name  string `json:"name"`
			Phase string `json:"phase"`
		}
		type workflowInfo struct {
			Name         string     `json:"name"`
			Namespace    string     `json:"namespace"`
			TemplateName string     `json:"templateName"`
			Phase        string     `json:"phase"`
			StartedAt    string     `json:"startedAt"`
			FinishedAt   string     `json:"finishedAt"`
			Nodes        []nodeInfo `json:"nodes"`
		}

		var workflows []workflowInfo
		if err := json.NewDecoder(res.Body).Decode(&workflows); err != nil {
			t.Fatalf("failed to decode response into expected structure: %v", err)
		}

		for _, wf := range workflows {
			if wf.Name == "" {
				t.Error("workflow name should not be empty")
			}
			if wf.Namespace == "" {
				t.Error("workflow namespace should not be empty")
			}
			t.Logf("Workflow: name=%s namespace=%s phase=%s nodes=%d",
				wf.Name, wf.Namespace, wf.Phase, len(wf.Nodes))
		}
	})
}

// TestWorkflowsHandlerNamespaceFilter tests that the ns query parameter
// correctly scopes the returned workflow list.
func TestWorkflowsHandlerNamespaceFilter(t *testing.T) {
	t.Run("should return only workflows in the specified namespace", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows?ns=dashboard-test", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var workflows []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&workflows); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		for _, wf := range workflows {
			namespace, ok := wf["namespace"].(string)
			if !ok {
				t.Error("namespace field should be a string")
				continue
			}
			if namespace != "dashboard-test" {
				t.Errorf("expected namespace 'dashboard-test', got '%s'", namespace)
			}
		}
	})

	t.Run("should return empty array for namespace with no workflows", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows?ns=non-existent-ns-xyz", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowsHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var workflows []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&workflows); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if len(workflows) != 0 {
			t.Errorf("expected empty array for non-existent namespace, got %d workflows", len(workflows))
		}
	})

	t.Run("should return workflows from all namespaces when ns is not provided", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange: fetch all namespaces, then per-namespace, compare totals
		reqAll := httptest.NewRequest(http.MethodGet, "/api/argo/workflows", nil)
		wAll := httptest.NewRecorder()

		// Act
		WorkflowsHandler(wAll, reqAll)

		// Assert
		resAll := wAll.Result()
		defer resAll.Body.Close()

		if resAll.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", resAll.StatusCode)
		}

		var allWorkflows []map[string]interface{}
		if err := json.NewDecoder(resAll.Body).Decode(&allWorkflows); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// Fetch scoped to dashboard-test namespace
		reqNs := httptest.NewRequest(http.MethodGet, "/api/argo/workflows?ns=dashboard-test", nil)
		wNs := httptest.NewRecorder()
		WorkflowsHandler(wNs, reqNs)
		resNs := wNs.Result()
		defer resNs.Body.Close()

		var nsWorkflows []map[string]interface{}
		if err := json.NewDecoder(resNs.Body).Decode(&nsWorkflows); err != nil {
			t.Fatalf("failed to decode namespaced response: %v", err)
		}

		// All-namespace result must be >= single-namespace result
		if len(allWorkflows) < len(nsWorkflows) {
			t.Errorf(
				"all-namespace count (%d) should be >= dashboard-test count (%d)",
				len(allWorkflows), len(nsWorkflows),
			)
		}
	})
}
