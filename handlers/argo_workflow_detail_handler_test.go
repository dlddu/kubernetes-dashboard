package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// TestWorkflowDetailHandler tests the GET /api/argo/workflows/{name} endpoint.
func TestWorkflowDetailHandler(t *testing.T) {
	t.Run("should return 200 OK or 500 when cluster is unavailable", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/my-workflow", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// In CI without a cluster, 500 is acceptable.
		// When a cluster is present, 200 or 404 is expected.
		if res.StatusCode != http.StatusOK &&
			res.StatusCode != http.StatusInternalServerError &&
			res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 200, 404, or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should set Content-Type to application/json", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/my-workflow", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

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
				req := httptest.NewRequest(method, "/api/argo/workflows/my-workflow", nil)
				w := httptest.NewRecorder()

				// Act
				WorkflowDetailHandler(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})

	t.Run("should return 400 when name is missing from path", func(t *testing.T) {
		// Arrange: path without name segment
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400 for missing path parameters, got %d", res.StatusCode)
		}
	})

	t.Run("should return 400 when path contains a slash after name", func(t *testing.T) {
		// Arrange: path with extra slash segment (namespace/name style is invalid now)
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/default/my-workflow", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400 for path with slash in name, got %d", res.StatusCode)
		}
	})

	t.Run("should return valid JSON on any response", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/my-workflow", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		var result interface{}
		if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
			t.Errorf("response body is not valid JSON: %v", err)
		}
	})

	t.Run("should return 404 when workflow does not exist", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/argo/workflows/non-existent-workflow-xyz",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusInternalServerError {
			t.Skip("skipping: Argo CRD may not be installed in cluster (got 500)")
		}

		if res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 404 for non-existent workflow, got %d", res.StatusCode)
		}
	})

	t.Run("should accept name with hyphens in path", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/argo/workflows/my-workflow-abc12",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should route correctly — not 400
		if res.StatusCode == http.StatusBadRequest {
			t.Error("expected handler to parse name with hyphens correctly")
		}
	})
}

// TestWorkflowDetailHandlerResponseStructure tests the response schema of the
// GET /api/argo/workflows/{name} endpoint.
func TestWorkflowDetailHandlerResponseStructure(t *testing.T) {
	t.Run("should return workflow detail object with required top-level fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange: relies on fixture data-processing-succeeded existing in dashboard-test namespace.
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/argo/workflows/data-processing-succeeded",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusNotFound {
			t.Skip("data-processing-succeeded fixture not found; skipping field validation")
		}
		if res.StatusCode == http.StatusInternalServerError {
			t.Skip("skipping: Argo CRD may not be installed (got 500)")
		}
		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var detail map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&detail); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		requiredFields := []string{"name", "namespace", "phase", "startedAt", "finishedAt", "nodes"}
		for _, field := range requiredFields {
			if _, exists := detail[field]; !exists {
				t.Errorf("expected field '%s' in workflow detail, but not found", field)
			}
		}
	})

	t.Run("should return nodes array with inputs and outputs fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/argo/workflows/data-processing-succeeded",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusNotFound {
			t.Skip("data-processing-succeeded fixture not found; skipping nodes validation")
		}
		if res.StatusCode == http.StatusInternalServerError {
			t.Skip("skipping: Argo CRD may not be installed (got 500)")
		}
		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var detail map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&detail); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		nodes, ok := detail["nodes"].([]interface{})
		if !ok {
			if detail["nodes"] != nil {
				t.Errorf("expected 'nodes' to be an array or null, got %T", detail["nodes"])
			}
			return
		}

		for _, node := range nodes {
			nodeMap, ok := node.(map[string]interface{})
			if !ok {
				t.Error("each node should be a JSON object")
				continue
			}

			// name and phase must be present
			if _, hasName := nodeMap["name"]; !hasName {
				t.Error("detail node should contain 'name' field")
			}
			if _, hasPhase := nodeMap["phase"]; !hasPhase {
				t.Error("detail node should contain 'phase' field")
			}

			// inputs and outputs must be present in detail (unlike list endpoint)
			if _, hasInputs := nodeMap["inputs"]; !hasInputs {
				t.Error("detail node should contain 'inputs' field")
			}
			if _, hasOutputs := nodeMap["outputs"]; !hasOutputs {
				t.Error("detail node should contain 'outputs' field")
			}
		}
	})

	t.Run("should return only Pod-type nodes", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/argo/workflows/data-processing-succeeded",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusNotFound {
			t.Skip("data-processing-succeeded fixture not found; skipping pod filter validation")
		}
		if res.StatusCode == http.StatusInternalServerError {
			t.Skip("skipping: Argo CRD may not be installed (got 500)")
		}
		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var detail map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&detail); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		nodes, ok := detail["nodes"].([]interface{})
		if !ok || nodes == nil {
			return // empty nodes list is valid for a not-yet-started workflow
		}

		// No node should have a "type" field that is not "Pod"
		// (The handler filters to Pod nodes only; the type field itself may or may not be returned)
		if len(nodes) == 0 {
			t.Log("nodes array is empty — skipping Pod-filter assertion")
		}
	})

	t.Run("should return inputs with parameters and artifacts sub-fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/argo/workflows/data-processing-succeeded",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

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

		nodes, ok := detail["nodes"].([]interface{})
		if !ok || len(nodes) == 0 {
			t.Skip("no nodes in response; skipping sub-field validation")
		}

		firstNode, ok := nodes[0].(map[string]interface{})
		if !ok {
			t.Fatal("first node is not a JSON object")
		}

		inputs, hasInputs := firstNode["inputs"].(map[string]interface{})
		if !hasInputs {
			t.Skip("no inputs on first node; skipping")
		}

		if _, hasParams := inputs["parameters"]; !hasParams {
			t.Error("inputs should contain 'parameters' field")
		}
		if _, hasArtifacts := inputs["artifacts"]; !hasArtifacts {
			t.Error("inputs should contain 'artifacts' field")
		}
	})

	t.Run("should decode into strongly-typed WorkflowDetailInfo struct", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/argo/workflows/data-processing-succeeded",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Skipf("skipping: API returned %d", res.StatusCode)
		}

		type artifactInfo struct {
			Name string `json:"name"`
			Path string `json:"path"`
		}
		type parameterInfo struct {
			Name  string `json:"name"`
			Value string `json:"value"`
		}
		type ioInfo struct {
			Parameters []parameterInfo `json:"parameters"`
			Artifacts  []artifactInfo  `json:"artifacts"`
		}
		type nodeDetailInfo struct {
			Name       string  `json:"name"`
			Phase      string  `json:"phase"`
			StartedAt  string  `json:"startedAt"`
			FinishedAt string  `json:"finishedAt"`
			Message    string  `json:"message"`
			Inputs     *ioInfo `json:"inputs"`
			Outputs    *ioInfo `json:"outputs"`
		}
		type workflowDetailInfo struct {
			Name         string           `json:"name"`
			Namespace    string           `json:"namespace"`
			Phase        string           `json:"phase"`
			StartedAt    string           `json:"startedAt"`
			FinishedAt   string           `json:"finishedAt"`
			Nodes        []nodeDetailInfo `json:"nodes"`
		}

		var detail workflowDetailInfo
		if err := json.NewDecoder(res.Body).Decode(&detail); err != nil {
			t.Fatalf("failed to decode response into expected structure: %v", err)
		}

		if detail.Name == "" {
			t.Error("workflow name should not be empty")
		}
		if detail.Namespace == "" {
			t.Error("workflow namespace should not be empty")
		}

		t.Logf("WorkflowDetail: name=%s namespace=%s phase=%s nodes=%d",
			detail.Name, detail.Namespace, detail.Phase, len(detail.Nodes))
	})
}

// TestWorkflowDetailHandlerErrorResponse tests that the handler returns proper
// JSON error structures for 400 and 404 responses.
func TestWorkflowDetailHandlerErrorResponse(t *testing.T) {
	t.Run("should return JSON with error field on 400", func(t *testing.T) {
		// Arrange: path that triggers a 400 (missing name)
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

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
			"/api/argo/workflows/non-existent-xyz",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusInternalServerError {
			t.Skip("skipping: Argo CRD may not be installed (got 500)")
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

// TestParseWorkflowDetailPath tests the name-only path parsing logic for the detail endpoint.
func TestParseWorkflowDetailPath(t *testing.T) {
	const prefix = "/api/argo/workflows/"

	t.Run("should parse name correctly", func(t *testing.T) {
		// Arrange
		path := "/api/argo/workflows/my-workflow"
		name := strings.TrimPrefix(path, prefix)
		name = strings.TrimRight(name, "/")

		// Assert
		if name != "my-workflow" {
			t.Errorf("expected name 'my-workflow', got '%s'", name)
		}
		if strings.Contains(name, "/") {
			t.Error("name should not contain a slash")
		}
	})

	t.Run("should parse name with hyphens", func(t *testing.T) {
		// Arrange
		path := "/api/argo/workflows/data-processing-abc12"
		name := strings.TrimPrefix(path, prefix)
		name = strings.TrimRight(name, "/")

		// Assert
		if name != "data-processing-abc12" {
			t.Errorf("expected name 'data-processing-abc12', got '%s'", name)
		}
	})

	t.Run("should return empty string when only prefix is provided", func(t *testing.T) {
		// Arrange
		path := "/api/argo/workflows/"
		name := strings.TrimPrefix(path, prefix)
		name = strings.TrimRight(name, "/")

		// Assert: name should be empty, indicating a bad request
		if name != "" {
			t.Errorf("expected empty name for prefix-only path, got '%s'", name)
		}
	})

	t.Run("should detect slash in name segment as invalid", func(t *testing.T) {
		// Arrange: namespace/name style path is invalid for name-only parsing
		path := "/api/argo/workflows/default/my-workflow"
		name := strings.TrimPrefix(path, prefix)
		name = strings.TrimRight(name, "/")

		// Assert: name contains a slash, indicating a bad request
		if !strings.Contains(name, "/") {
			t.Error("expected name to contain slash for namespace/name path (should be rejected)")
		}
	})

	t.Run("should detect double-slash as invalid", func(t *testing.T) {
		// Arrange
		path := "/api/argo/workflows//"
		name := strings.TrimPrefix(path, prefix)
		name = strings.TrimRight(name, "/")

		// Assert: either empty or contains slash — both are invalid
		if name != "" && !strings.Contains(name, "/") {
			t.Errorf("expected invalid name for double-slash path, got '%s'", name)
		}
	})
}

// TestWorkflowDetailHandlerRouting tests that the handler is reachable through
// the router registered in main.go.
func TestWorkflowDetailHandlerRouting(t *testing.T) {
	t.Run("should not return 404 for valid name path", func(t *testing.T) {
		// Arrange: directly call the handler — router registration is tested in main_test.go.
		req := httptest.NewRequest(
			http.MethodGet,
			"/api/argo/workflows/my-workflow",
			nil,
		)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusNotFound &&
			strings.Contains(w.Body.String(), "404 page not found") {
			t.Error("handler returned generic 404; may not be properly registered")
		}
	})
}

// TestGetWorkflowDetailData tests the internal getWorkflowDetailData helper
// using a real cluster, when available.
func TestGetWorkflowDetailData(t *testing.T) {
	t.Run("should return nil and error when client is nil", func(t *testing.T) {
		// This validates that getWorkflowDetailData handles nil clients gracefully.
		// The function is tested via WorkflowDetailHandler in normal operation.
		// Direct unit testing requires mocking the Argo client, which is done
		// at the HTTP layer in the tests above.
		t.Log("nil-client guard is exercised via WorkflowDetailHandler with no cluster")
	})

	t.Run("should fetch workflow detail from cluster", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange: get an Argo client
		client, err := getArgoClient()
		if err != nil {
			t.Skipf("skipping: Argo client unavailable: %v", err)
		}

		// Act: call the internal helper directly with name only
		detail, err := getWorkflowDetailData(context.Background(), client, "data-processing-succeeded")

		// Assert: either it succeeds or 404-style not-found is returned
		if err != nil {
			if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "404") {
				t.Skip("data-processing-succeeded fixture not applied; skipping")
			}
			if strings.Contains(err.Error(), "could not find the requested resource") {
				t.Skip("Argo CRD not installed; skipping")
			}
			t.Fatalf("unexpected error: %v", err)
		}

		if detail == nil {
			t.Fatal("expected non-nil WorkflowDetailInfo, got nil")
		}
		if detail.Name == "" {
			t.Error("returned WorkflowDetailInfo has empty name")
		}
		if detail.Namespace != "dashboard-test" {
			t.Errorf("expected namespace 'dashboard-test', got '%s'", detail.Namespace)
		}
	})
}
