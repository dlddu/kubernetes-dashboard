package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	versioned "github.com/argoproj/argo-workflows/v3/pkg/client/clientset/versioned"
)

// submitWorkflowPathPrefix is the URL prefix for workflow template submit paths.
const submitWorkflowPathPrefix = "/api/argo/workflow-templates/"

// submitPathSuffix is the URL suffix for submit actions.
const submitPathSuffix = "/submit"

// submitRequest is the request body for submitting a workflow.
type submitRequest struct {
	Parameters map[string]string `json:"parameters"`
}

// submitResponse is the response body for a successful workflow submission.
type submitResponse struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
}

// WorkflowSubmitHandler handles POST /api/argo/workflow-templates/{name}/submit
func WorkflowSubmitHandler(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodPost) {
		return
	}

	r = withTimeout(r)

	// Parse template name from URL path
	// Expected: /api/argo/workflow-templates/{name}/submit
	templateName, err := parseWorkflowSubmitPath(r.URL.Path)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Parse request body
	var req submitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Get Argo client
	clientset, err := getArgoClient()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create Argo client")
		return
	}

	// Submit workflow
	result, err := submitWorkflow(r.Context(), clientset, templateName, req.Parameters)
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "404") {
			writeError(w, http.StatusNotFound, fmt.Sprintf("WorkflowTemplate %q not found", templateName))
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// parseWorkflowSubmitPath extracts the template name from the URL path.
// Expected format: /api/argo/workflow-templates/{name}/submit
func parseWorkflowSubmitPath(urlPath string) (string, error) {
	// Strip prefix
	path := strings.TrimPrefix(urlPath, submitWorkflowPathPrefix)
	// Strip suffix
	path = strings.TrimSuffix(path, submitPathSuffix)

	if path == "" || path == urlPath {
		return "", fmt.Errorf("invalid path format, expected %s{name}%s", submitWorkflowPathPrefix, submitPathSuffix)
	}

	// name should not contain slashes
	if strings.Contains(path, "/") || path == "" {
		return "", fmt.Errorf("invalid template name in path")
	}

	return path, nil
}

// submitWorkflow creates a new Workflow from a WorkflowTemplate.
func submitWorkflow(ctx context.Context, clientset *versioned.Clientset, templateName string, parameters map[string]string) (*submitResponse, error) {
	// First, verify the WorkflowTemplate exists by listing templates and finding the one we want.
	// We use the ArgoprojV1alpha1 API to find the template and determine its namespace.
	templateList, err := clientset.ArgoprojV1alpha1().WorkflowTemplates("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list WorkflowTemplates: %w", err)
	}

	// Find the template by name
	namespace := ""
	for _, tmpl := range templateList.Items {
		if tmpl.Name == templateName {
			namespace = tmpl.Namespace
			break
		}
	}

	if namespace == "" {
		return nil, fmt.Errorf("WorkflowTemplate %q not found", templateName)
	}

	// Build parameter list for the Workflow submission
	params := make([]map[string]string, 0, len(parameters))
	for k, v := range parameters {
		params = append(params, map[string]string{"name": k, "value": v})
	}

	// Submit the workflow via the Argo Workflows REST API directly
	result, err := createWorkflowFromTemplate(ctx, clientset, namespace, templateName, params)
	if err != nil {
		return nil, err
	}

	return result, nil
}

// createWorkflowFromTemplate creates a Workflow from a WorkflowTemplate via the Argo REST API.
func createWorkflowFromTemplate(ctx context.Context, clientset *versioned.Clientset, namespace, templateName string, params []map[string]string) (*submitResponse, error) {
	created, err := clientset.ArgoprojV1alpha1().Workflows(namespace).Create(ctx, templateName, params)
	if err != nil {
		return nil, fmt.Errorf("failed to create workflow: %w", err)
	}

	return &submitResponse{
		Name:      created.Name,
		Namespace: created.Namespace,
	}, nil
}
