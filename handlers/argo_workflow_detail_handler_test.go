package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestWorkflowDetailHandler tests the GET /api/argo/workflows/{name} endpoint.
//
// TDD Red Phase: WorkflowDetailHandler is not yet implemented.
// These tests define the expected behavior of the workflow detail endpoint.
// The handler should:
//   - Accept GET requests to /api/argo/workflows/{name}
//   - Accept an optional ?ns= query parameter for namespace scoping
//   - Return a single WorkflowDetailInfo JSON object
//   - Include enriched node data with inputs, outputs, message, startedAt, finishedAt
//   - Reject non-GET methods with 405
//   - Return 404 when the workflow does not exist
func TestWorkflowDetailHandler(t *testing.T) {
	t.Run("should return 200 OK or 500 when cluster is unavailable", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/some-workflow", nil)
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
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/some-workflow", nil)
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
				req := httptest.NewRequest(method, "/api/argo/workflows/some-workflow", nil)
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

	t.Run("should accept ns query parameter without error", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/some-workflow?ns=default", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

		// Assert: should not fail solely because of the namespace parameter
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK &&
			res.StatusCode != http.StatusInternalServerError &&
			res.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 200, 404, or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should always return valid JSON", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/some-workflow", nil)
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

	t.Run("should extract workflow name from URL path", func(t *testing.T) {
		// Arrange: request with a specific workflow name in the path
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/data-processing-abc12", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

		// Assert: should not return 400 (bad request) — name extraction must succeed
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusBadRequest {
			t.Errorf("expected handler to extract workflow name correctly, got 400 Bad Request")
		}
	})

	t.Run("should return 400 when no workflow name is provided", func(t *testing.T) {
		// Arrange: path ends with trailing slash but no name
		// /api/argo/workflows/ with empty name segment
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode == http.StatusOK {
			t.Error("expected error status when no workflow name is provided, got 200")
		}
	})
}

// TestWorkflowDetailHandlerResponseStructure tests that the response matches the
// expected WorkflowDetailInfo schema when a cluster is available.
func TestWorkflowDetailHandlerResponseStructure(t *testing.T) {
	t.Run("should return a single workflow object with required top-level fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange: assumes at least one workflow exists in the cluster
		// First, get a workflow name from the list endpoint
		listReq := httptest.NewRequest(http.MethodGet, "/api/argo/workflows", nil)
		listW := httptest.NewRecorder()
		WorkflowsHandler(listW, listReq)
		listRes := listW.Result()
		defer listRes.Body.Close()

		if listRes.StatusCode != http.StatusOK {
			t.Fatalf("prerequisite failed: list endpoint returned %d", listRes.StatusCode)
		}

		var workflows []map[string]interface{}
		if err := json.NewDecoder(listRes.Body).Decode(&workflows); err != nil {
			t.Fatalf("failed to decode workflow list: %v", err)
		}

		if len(workflows) == 0 {
			t.Skip("no workflows in cluster, skipping field validation")
		}

		// Act: fetch the first workflow by name
		name, _ := workflows[0]["name"].(string)
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/"+name, nil)
		w := httptest.NewRecorder()
		WorkflowDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var detail map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&detail); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		requiredFields := []string{"name", "namespace", "templateName", "phase", "startedAt", "finishedAt", "parameters", "nodes"}
		for _, field := range requiredFields {
			if _, exists := detail[field]; !exists {
				t.Errorf("expected field '%s' in workflow detail object, but not found", field)
			}
		}
	})

	t.Run("should return nodes with enriched fields including inputs and outputs", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange: get a workflow name
		listReq := httptest.NewRequest(http.MethodGet, "/api/argo/workflows", nil)
		listW := httptest.NewRecorder()
		WorkflowsHandler(listW, listReq)
		listRes := listW.Result()
		defer listRes.Body.Close()

		if listRes.StatusCode != http.StatusOK {
			t.Fatalf("prerequisite failed: list endpoint returned %d", listRes.StatusCode)
		}

		var workflows []map[string]interface{}
		if err := json.NewDecoder(listRes.Body).Decode(&workflows); err != nil {
			t.Fatalf("failed to decode workflow list: %v", err)
		}

		if len(workflows) == 0 {
			t.Skip("no workflows in cluster, skipping nodes validation")
		}

		// Act
		name, _ := workflows[0]["name"].(string)
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/"+name, nil)
		w := httptest.NewRecorder()
		WorkflowDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Skipf("skipping: detail API returned %d", res.StatusCode)
		}

		var detail map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&detail); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		nodes, ok := detail["nodes"].([]interface{})
		if !ok || len(nodes) == 0 {
			t.Skip("no step nodes in this workflow, skipping node field validation")
		}

		nodeRequiredFields := []string{"name", "phase", "startedAt", "finishedAt", "message", "inputs", "outputs"}
		for _, node := range nodes {
			nodeMap, ok := node.(map[string]interface{})
			if !ok {
				t.Error("each node should be a JSON object")
				continue
			}

			for _, field := range nodeRequiredFields {
				if _, exists := nodeMap[field]; !exists {
					t.Errorf("expected field '%s' in node object, but not found", field)
				}
			}
		}
	})

	t.Run("should return nodes with inputs and outputs as objects with parameters and artifacts arrays", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		listReq := httptest.NewRequest(http.MethodGet, "/api/argo/workflows", nil)
		listW := httptest.NewRecorder()
		WorkflowsHandler(listW, listReq)
		listRes := listW.Result()
		defer listRes.Body.Close()

		if listRes.StatusCode != http.StatusOK {
			t.Fatalf("prerequisite failed: %d", listRes.StatusCode)
		}

		var workflows []map[string]interface{}
		if err := json.NewDecoder(listRes.Body).Decode(&workflows); err != nil {
			t.Fatalf("failed to decode: %v", err)
		}

		if len(workflows) == 0 {
			t.Skip("no workflows in cluster")
		}

		// Act
		name, _ := workflows[0]["name"].(string)
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/"+name, nil)
		w := httptest.NewRecorder()
		WorkflowDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Skipf("skipping: API returned %d", res.StatusCode)
		}

		var detail map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&detail); err != nil {
			t.Fatalf("failed to decode: %v", err)
		}

		nodes, ok := detail["nodes"].([]interface{})
		if !ok || len(nodes) == 0 {
			t.Skip("no nodes to validate")
		}

		for _, node := range nodes {
			nodeMap, ok := node.(map[string]interface{})
			if !ok {
				continue
			}

			for _, section := range []string{"inputs", "outputs"} {
				sectionVal, exists := nodeMap[section]
				if !exists {
					t.Errorf("node should have '%s' field", section)
					continue
				}

				sectionMap, ok := sectionVal.(map[string]interface{})
				if !ok {
					t.Errorf("node '%s' field should be an object", section)
					continue
				}

				// parameters and artifacts must be present (may be empty arrays)
				if _, hasParams := sectionMap["parameters"]; !hasParams {
					t.Errorf("node '%s' should contain 'parameters' field", section)
				}
				if _, hasArtifacts := sectionMap["artifacts"]; !hasArtifacts {
					t.Errorf("node '%s' should contain 'artifacts' field", section)
				}
			}
		}
	})

	t.Run("should decode response into strongly-typed WorkflowDetailInfo struct", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		listReq := httptest.NewRequest(http.MethodGet, "/api/argo/workflows", nil)
		listW := httptest.NewRecorder()
		WorkflowsHandler(listW, listReq)
		listRes := listW.Result()
		defer listRes.Body.Close()

		if listRes.StatusCode != http.StatusOK {
			t.Fatalf("prerequisite failed: %d", listRes.StatusCode)
		}

		var workflows []map[string]interface{}
		if err := json.NewDecoder(listRes.Body).Decode(&workflows); err != nil {
			t.Fatalf("failed to decode: %v", err)
		}

		if len(workflows) == 0 {
			t.Skip("no workflows in cluster")
		}

		// Act
		name, _ := workflows[0]["name"].(string)
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/"+name, nil)
		w := httptest.NewRecorder()
		WorkflowDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Skipf("skipping: API returned %d", res.StatusCode)
		}

		// WorkflowDetailInfo mirrors the expected JSON shape
		type artifactInfo struct {
			Name string `json:"name"`
			Path string `json:"path"`
			From string `json:"from"`
			Size string `json:"size"`
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
			Name       string `json:"name"`
			Phase      string `json:"phase"`
			StartedAt  string `json:"startedAt"`
			FinishedAt string `json:"finishedAt"`
			Message    string `json:"message"`
			Inputs     ioInfo `json:"inputs"`
			Outputs    ioInfo `json:"outputs"`
		}
		type workflowDetailInfo struct {
			Name         string          `json:"name"`
			Namespace    string          `json:"namespace"`
			TemplateName string          `json:"templateName"`
			Phase        string          `json:"phase"`
			StartedAt    string          `json:"startedAt"`
			FinishedAt   string          `json:"finishedAt"`
			Parameters   []parameterInfo `json:"parameters"`
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
		t.Logf("Workflow detail: name=%s namespace=%s phase=%s nodes=%d",
			detail.Name, detail.Namespace, detail.Phase, len(detail.Nodes))
	})
}

// TestWorkflowDetailHandlerNotFound tests that the handler returns 404 when a workflow
// does not exist.
func TestWorkflowDetailHandlerNotFound(t *testing.T) {
	t.Run("should return 404 when the workflow does not exist", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange: request a workflow name that certainly does not exist
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/non-existent-workflow-xyz-999", nil)
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

	t.Run("should return error JSON body when workflow is not found", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/non-existent-workflow-xyz-999", nil)
		w := httptest.NewRecorder()

		// Act
		WorkflowDetailHandler(w, req)

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

// TestWorkflowDetailHandlerNamespaceFilter tests namespace scoping for the detail endpoint.
func TestWorkflowDetailHandlerNamespaceFilter(t *testing.T) {
	t.Run("should scope the lookup to the provided namespace", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange: get a workflow from a specific namespace
		listReq := httptest.NewRequest(http.MethodGet, "/api/argo/workflows?ns=dashboard-test", nil)
		listW := httptest.NewRecorder()
		WorkflowsHandler(listW, listReq)
		listRes := listW.Result()
		defer listRes.Body.Close()

		if listRes.StatusCode != http.StatusOK {
			t.Fatalf("prerequisite failed: list endpoint returned %d", listRes.StatusCode)
		}

		var workflows []map[string]interface{}
		if err := json.NewDecoder(listRes.Body).Decode(&workflows); err != nil {
			t.Fatalf("failed to decode workflow list: %v", err)
		}

		if len(workflows) == 0 {
			t.Skip("no workflows in dashboard-test namespace, skipping namespace filter test")
		}

		// Act: fetch the detail with the namespace filter
		name, _ := workflows[0]["name"].(string)
		req := httptest.NewRequest(http.MethodGet, "/api/argo/workflows/"+name+"?ns=dashboard-test", nil)
		w := httptest.NewRecorder()
		WorkflowDetailHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var detail map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&detail); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		namespace, _ := detail["namespace"].(string)
		if namespace != "dashboard-test" {
			t.Errorf("expected namespace 'dashboard-test', got '%s'", namespace)
		}
	})
}

// TestParseWorkflowDetailPath tests the path parsing helper that extracts the
// workflow name from /api/argo/workflows/{name}.
func TestParseWorkflowDetailPath(t *testing.T) {
	t.Run("should extract workflow name from a valid path", func(t *testing.T) {
		// Arrange
		path := "/api/argo/workflows/my-workflow-abc"

		// Act
		name, err := parseWorkflowDetailPath(path)

		// Assert
		if err != nil {
			t.Errorf("expected no error, got %v", err)
		}
		if name != "my-workflow-abc" {
			t.Errorf("expected name 'my-workflow-abc', got '%s'", name)
		}
	})

	t.Run("should extract workflow name that contains hyphens and digits", func(t *testing.T) {
		// Arrange
		path := "/api/argo/workflows/data-processing-abc12"

		// Act
		name, err := parseWorkflowDetailPath(path)

		// Assert
		if err != nil {
			t.Errorf("expected no error, got %v", err)
		}
		if name != "data-processing-abc12" {
			t.Errorf("expected name 'data-processing-abc12', got '%s'", name)
		}
	})

	t.Run("should return error when path has no workflow name", func(t *testing.T) {
		// Arrange: trailing slash with no name
		path := "/api/argo/workflows/"

		// Act
		name, err := parseWorkflowDetailPath(path)

		// Assert
		if err == nil {
			t.Errorf("expected error for empty workflow name, got nil (name=%q)", name)
		}
	})

	t.Run("should return error when path is just the prefix", func(t *testing.T) {
		// Arrange
		path := "/api/argo/workflows"

		// Act
		name, err := parseWorkflowDetailPath(path)

		// Assert
		if err == nil {
			t.Errorf("expected error for path without trailing name, got nil (name=%q)", name)
		}
	})
}

// TestGetWorkflowDetailData tests the internal data fetching function.
// These run without a cluster by verifying that the function exists and follows
// the expected signature; cluster-dependent assertions are guarded by skipIfNoCluster.
func TestGetWorkflowDetailData(t *testing.T) {
	t.Run("should return WorkflowDetailInfo for an existing workflow", func(t *testing.T) {
		skipIfNoCluster(t)

		clientset, err := getArgoClient()
		if err != nil {
			t.Fatalf("failed to get Argo client: %v", err)
		}

		// Arrange: get a workflow name from the list
		listReq := httptest.NewRequest(http.MethodGet, "/api/argo/workflows", nil)
		listW := httptest.NewRecorder()
		WorkflowsHandler(listW, listReq)
		listRes := listW.Result()
		defer listRes.Body.Close()

		if listRes.StatusCode != http.StatusOK {
			t.Skip("workflow list not available")
		}

		var workflows []map[string]interface{}
		if err := json.NewDecoder(listRes.Body).Decode(&workflows); err != nil || len(workflows) == 0 {
			t.Skip("no workflows available")
		}

		name, _ := workflows[0]["name"].(string)
		namespace, _ := workflows[0]["namespace"].(string)

		// Act
		detail, err := getWorkflowDetailData(context.Background(), clientset, namespace, name)

		// Assert
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if detail == nil {
			t.Fatal("expected non-nil WorkflowDetailInfo, got nil")
		}
		if detail.Name != name {
			t.Errorf("expected name %q, got %q", name, detail.Name)
		}
		if detail.Namespace != namespace {
			t.Errorf("expected namespace %q, got %q", namespace, detail.Namespace)
		}
	})
}
