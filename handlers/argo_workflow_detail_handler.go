package handlers

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	versioned "github.com/argoproj/argo-workflows/v3/pkg/client/clientset/versioned"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// workflowDetailPathPrefix is the URL prefix for the workflow detail endpoint.
const workflowDetailPathPrefix = "/api/argo/workflows/"

// WorkflowDetailParamInfo holds a single parameter in a workflow step's IO.
type WorkflowDetailParamInfo struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

// WorkflowDetailArtifactInfo holds a single artifact in a workflow step's IO.
type WorkflowDetailArtifactInfo struct {
	Name string `json:"name"`
	Path string `json:"path"`
	From string `json:"from,omitempty"`
	Size string `json:"size,omitempty"`
}

// IOData holds the inputs or outputs for a workflow step.
type IOData struct {
	Parameters []WorkflowDetailParamInfo    `json:"parameters"`
	Artifacts  []WorkflowDetailArtifactInfo `json:"artifacts"`
}

// WorkflowDetailStepInfo represents a single step in the workflow detail view.
type WorkflowDetailStepInfo struct {
	Name       string  `json:"name"`
	Phase      string  `json:"phase"`
	StartedAt  string  `json:"startedAt"`
	FinishedAt string  `json:"finishedAt"`
	Message    string  `json:"message"`
	Inputs     *IOData `json:"inputs"`
	Outputs    *IOData `json:"outputs"`
}

// WorkflowDetailInfo represents a full workflow detail response.
type WorkflowDetailInfo struct {
	Name         string                   `json:"name"`
	Namespace    string                   `json:"namespace"`
	TemplateName string                   `json:"templateName"`
	Phase        string                   `json:"phase"`
	StartedAt    string                   `json:"startedAt"`
	FinishedAt   string                   `json:"finishedAt"`
	Parameters   []WorkflowDetailParamInfo `json:"parameters"`
	Nodes        []WorkflowDetailStepInfo `json:"nodes"`
}

// WorkflowDetailHandler handles GET and DELETE /api/argo/workflows/{name}
// and dispatches POST .../resubmit requests to the resubmit handler.
var WorkflowDetailHandler http.HandlerFunc = func(w http.ResponseWriter, r *http.Request) {
	// Dispatch to resubmit handler if path ends with /resubmit
	if strings.HasSuffix(r.URL.Path, resubmitPathSuffix) {
		handleResubmitWorkflow(w, r)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	r = withTimeout(r)

	switch r.Method {
	case http.MethodGet:
		handleGetWorkflowDetail(w, r)
	case http.MethodDelete:
		handleDeleteWorkflow(w, r)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

// parseWorkflowName extracts and validates the workflow name from the request path.
// Returns the name and true on success; writes an error response and returns false on failure.
func parseWorkflowName(w http.ResponseWriter, r *http.Request) (string, bool) {
	name := strings.TrimPrefix(r.URL.Path, workflowDetailPathPrefix)
	name = strings.TrimRight(name, "/")
	if name == "" || strings.Contains(name, "/") {
		writeError(w, http.StatusBadRequest,
			fmt.Sprintf("invalid path format, expected %s{name}", workflowDetailPathPrefix))
		return "", false
	}
	return name, true
}

// handleGetWorkflowDetail handles GET /api/argo/workflows/{name}.
func handleGetWorkflowDetail(w http.ResponseWriter, r *http.Request) {
	name, ok := parseWorkflowName(w, r)
	if !ok {
		return
	}

	clientset, err := getArgoClient()
	if err != nil {
		slog.Error("Failed to create Argo client", "error", err)
		writeError(w, http.StatusInternalServerError, "Failed to create Argo client")
		return
	}

	detail, err := getWorkflowDetailData(r.Context(), clientset, name)
	if err != nil {
		if strings.Contains(err.Error(), "not found") ||
			strings.Contains(err.Error(), "404") {
			writeError(w, http.StatusNotFound, fmt.Sprintf("workflow %q not found", name))
			return
		}
		slog.Error("Failed to fetch workflow detail", "error", err, "name", name)
		writeError(w, http.StatusInternalServerError, "Failed to fetch workflow detail")
		return
	}

	writeJSON(w, http.StatusOK, detail)
}

// handleDeleteWorkflow handles DELETE /api/argo/workflows/{name}.
func handleDeleteWorkflow(w http.ResponseWriter, r *http.Request) {
	name, ok := parseWorkflowName(w, r)
	if !ok {
		return
	}

	clientset, err := getArgoClient()
	if err != nil {
		slog.Error("Failed to create Argo client", "error", err)
		writeError(w, http.StatusInternalServerError, "Failed to create Argo client")
		return
	}

	namespace, err := findWorkflowNamespace(r.Context(), clientset, name)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			writeError(w, http.StatusNotFound, errMsgWorkflowNotFound)
			return
		}
		slog.Error("Failed to find workflow namespace", "error", err, "name", name)
		writeError(w, http.StatusInternalServerError, errMsgWorkflowDelete)
		return
	}

	err = clientset.ArgoprojV1alpha1().Workflows(namespace).Delete(r.Context(), name, metav1.DeleteOptions{})
	if err != nil {
		if strings.Contains(err.Error(), "not found") ||
			strings.Contains(err.Error(), "404") {
			writeError(w, http.StatusNotFound, errMsgWorkflowNotFound)
			return
		}
		slog.Error("Failed to delete workflow", "error", err, "name", name, "namespace", namespace)
		writeError(w, http.StatusInternalServerError, errMsgWorkflowDelete)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "Workflow deleted successfully",
	})
}

// findWorkflowNamespace searches all namespaces for a workflow by name and returns its namespace.
func findWorkflowNamespace(ctx context.Context, clientset *versioned.Clientset, name string) (string, error) {
	workflowList, err := clientset.ArgoprojV1alpha1().Workflows("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return "", err
	}
	for _, wf := range workflowList.Items {
		if wf.Name == name {
			return wf.Namespace, nil
		}
	}
	return "", fmt.Errorf("workflow %q not found", name)
}

// getWorkflowDetailData fetches the detailed workflow data from Argo by name,
// searching across all namespaces.
func getWorkflowDetailData(ctx context.Context, clientset *versioned.Clientset, name string) (*WorkflowDetailInfo, error) {
	namespace, err := findWorkflowNamespace(ctx, clientset, name)
	if err != nil {
		return nil, err
	}

	// Get the detailed workflow using the resolved namespace.
	wfDetail, err := clientset.ArgoprojV1alpha1().Workflows(namespace).Get(ctx, name)
	if err != nil {
		return nil, err
	}

	nodes := make([]WorkflowDetailStepInfo, 0, len(wfDetail.Nodes))
	for _, node := range wfDetail.Nodes {
		var inputs *IOData
		if node.Inputs != nil {
			params := make([]WorkflowDetailParamInfo, 0, len(node.Inputs.Parameters))
			for _, p := range node.Inputs.Parameters {
				params = append(params, WorkflowDetailParamInfo{Name: p.Name, Value: p.Value})
			}
			artifacts := make([]WorkflowDetailArtifactInfo, 0, len(node.Inputs.Artifacts))
			for _, a := range node.Inputs.Artifacts {
				artifacts = append(artifacts, WorkflowDetailArtifactInfo{Name: a.Name, Path: a.Path, From: a.From, Size: a.Size})
			}
			inputs = &IOData{Parameters: params, Artifacts: artifacts}
		}

		var outputs *IOData
		if node.Outputs != nil {
			params := make([]WorkflowDetailParamInfo, 0, len(node.Outputs.Parameters))
			for _, p := range node.Outputs.Parameters {
				params = append(params, WorkflowDetailParamInfo{Name: p.Name, Value: p.Value})
			}
			artifacts := make([]WorkflowDetailArtifactInfo, 0, len(node.Outputs.Artifacts))
			for _, a := range node.Outputs.Artifacts {
				artifacts = append(artifacts, WorkflowDetailArtifactInfo{Name: a.Name, Path: a.Path, From: a.From, Size: a.Size})
			}
			outputs = &IOData{Parameters: params, Artifacts: artifacts}
		}

		nodes = append(nodes, WorkflowDetailStepInfo{
			Name:       node.Name,
			Phase:      node.Phase,
			StartedAt:  node.StartedAt,
			FinishedAt: node.FinishedAt,
			Message:    node.Message,
			Inputs:     inputs,
			Outputs:    outputs,
		})
	}

	// Extract workflow-level parameters (submitted at creation time).
	wfParams := make([]WorkflowDetailParamInfo, 0, len(wfDetail.Parameters))
	for _, p := range wfDetail.Parameters {
		wfParams = append(wfParams, WorkflowDetailParamInfo{Name: p.Name, Value: p.Value})
	}

	return &WorkflowDetailInfo{
		Name:         wfDetail.Name,
		Namespace:    wfDetail.Namespace,
		TemplateName: wfDetail.TemplateName,
		Phase:        wfDetail.Phase,
		StartedAt:    wfDetail.StartedAt,
		FinishedAt:   wfDetail.FinishedAt,
		Parameters:   wfParams,
		Nodes:        nodes,
	}, nil
}

// parseWorkflowResubmitName extracts the workflow name from a resubmit request path.
// Expected format: /api/argo/workflows/{name}/resubmit
func parseWorkflowResubmitName(w http.ResponseWriter, r *http.Request) (string, bool) {
	name := strings.TrimPrefix(r.URL.Path, workflowDetailPathPrefix)
	name = strings.TrimSuffix(name, resubmitPathSuffix)
	name = strings.TrimRight(name, "/")
	if name == "" || strings.Contains(name, "/") {
		writeError(w, http.StatusBadRequest,
			fmt.Sprintf("invalid path format, expected %s{name}%s", workflowDetailPathPrefix, resubmitPathSuffix))
		return "", false
	}
	return name, true
}

// handleResubmitWorkflow handles POST /api/argo/workflows/{name}/resubmit.
// It creates a new workflow from the same template and parameters as the original.
func handleResubmitWorkflow(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if !requireMethod(w, r, http.MethodPost) {
		return
	}

	r = withTimeout(r)

	name, ok := parseWorkflowResubmitName(w, r)
	if !ok {
		return
	}

	clientset, err := getArgoClient()
	if err != nil {
		slog.Error("Failed to create Argo client", "error", err)
		writeError(w, http.StatusInternalServerError, "Failed to create Argo client")
		return
	}

	// Find the workflow's namespace.
	namespace, err := findWorkflowNamespace(r.Context(), clientset, name)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			writeError(w, http.StatusNotFound, errMsgWorkflowNotFound)
			return
		}
		slog.Error("Failed to find workflow namespace", "error", err, "name", name)
		writeError(w, http.StatusInternalServerError, errMsgWorkflowResubmit)
		return
	}

	// Get the original workflow's details to extract template name and parameters.
	wfDetail, err := clientset.ArgoprojV1alpha1().Workflows(namespace).Get(r.Context(), name)
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "404") {
			writeError(w, http.StatusNotFound, errMsgWorkflowNotFound)
			return
		}
		slog.Error("Failed to fetch workflow detail for resubmit", "error", err, "name", name)
		writeError(w, http.StatusInternalServerError, errMsgWorkflowResubmit)
		return
	}

	// Build parameter list from the original workflow.
	params := make([]map[string]string, 0, len(wfDetail.Parameters))
	for _, p := range wfDetail.Parameters {
		params = append(params, map[string]string{"name": p.Name, "value": p.Value})
	}

	// Create a new workflow from the same template.
	created, err := clientset.ArgoprojV1alpha1().Workflows(namespace).Create(r.Context(), wfDetail.TemplateName, params)
	if err != nil {
		slog.Error("Failed to resubmit workflow", "error", err, "name", name, "template", wfDetail.TemplateName)
		writeError(w, http.StatusInternalServerError, errMsgWorkflowResubmit)
		return
	}

	writeJSON(w, http.StatusOK, submitResponse{
		Name:      created.Name,
		Namespace: created.Namespace,
	})
}
