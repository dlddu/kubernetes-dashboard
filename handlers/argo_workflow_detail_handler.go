package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	versioned "github.com/argoproj/argo-workflows/v3/pkg/client/clientset/versioned"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// workflowDetailPathPrefix is the URL prefix for workflow detail paths.
const workflowDetailPathPrefix = "/api/argo/workflows/"

// WorkflowDetailParameterInfo represents a single workflow-level parameter.
type WorkflowDetailParameterInfo struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

// WorkflowDetailArtifactInfo represents an artifact in inputs/outputs.
type WorkflowDetailArtifactInfo struct {
	Name string `json:"name"`
	Path string `json:"path"`
	From string `json:"from"`
	Size string `json:"size"`
}

// WorkflowDetailIOInfo represents inputs or outputs for a workflow node.
type WorkflowDetailIOInfo struct {
	Parameters []WorkflowDetailParameterInfo `json:"parameters"`
	Artifacts  []WorkflowDetailArtifactInfo  `json:"artifacts"`
}

// WorkflowDetailNodeInfo represents a single node (step) with full detail.
type WorkflowDetailNodeInfo struct {
	Name       string               `json:"name"`
	Phase      string               `json:"phase"`
	StartedAt  string               `json:"startedAt"`
	FinishedAt string               `json:"finishedAt"`
	Message    string               `json:"message"`
	Inputs     WorkflowDetailIOInfo `json:"inputs"`
	Outputs    WorkflowDetailIOInfo `json:"outputs"`
}

// WorkflowDetailInfo represents the full detail of a single Argo Workflow run.
type WorkflowDetailInfo struct {
	Name         string                        `json:"name"`
	Namespace    string                        `json:"namespace"`
	TemplateName string                        `json:"templateName"`
	Phase        string                        `json:"phase"`
	StartedAt    string                        `json:"startedAt"`
	FinishedAt   string                        `json:"finishedAt"`
	Parameters   []WorkflowDetailParameterInfo `json:"parameters"`
	Nodes        []WorkflowDetailNodeInfo      `json:"nodes"`
}

// parseWorkflowDetailPath extracts the workflow name from a URL path of the form
// /api/argo/workflows/{name}. Returns an error if the name is missing.
func parseWorkflowDetailPath(path string) (string, error) {
	name := strings.TrimPrefix(path, workflowDetailPathPrefix)
	if name == "" || name == path {
		return "", fmt.Errorf("workflow name is missing from path %q", path)
	}
	// Reject paths that still contain slashes (unexpected extra segments)
	if strings.Contains(name, "/") {
		return "", fmt.Errorf("invalid path: unexpected extra segments in %q", path)
	}
	return name, nil
}

// WorkflowDetailHandler handles GET /api/argo/workflows/{name}.
var WorkflowDetailHandler http.HandlerFunc = func(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodGet) {
		return
	}

	r = withTimeout(r)

	name, err := parseWorkflowDetailPath(r.URL.Path)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	clientset, err := getArgoClient()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create Argo client")
		return
	}

	namespace := r.URL.Query().Get("ns")

	detail, err := getWorkflowDetailData(r.Context(), clientset, namespace, name)
	if err != nil {
		if strings.Contains(err.Error(), "not found") ||
			strings.Contains(err.Error(), "404") ||
			strings.Contains(strings.ToLower(err.Error()), "not found") {
			writeError(w, http.StatusNotFound, fmt.Sprintf("workflow %q not found", name))
			return
		}
		writeError(w, http.StatusInternalServerError, "Failed to fetch workflow detail")
		return
	}

	writeJSON(w, http.StatusOK, detail)
}

// getWorkflowDetailData fetches detailed Workflow data from Argo.
func getWorkflowDetailData(ctx context.Context, clientset *versioned.Clientset, namespace, name string) (*WorkflowDetailInfo, error) {
	wf, err := clientset.ArgoprojV1alpha1().Workflows(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	// Convert parameters
	params := make([]WorkflowDetailParameterInfo, 0, len(wf.Parameters))
	for _, p := range wf.Parameters {
		params = append(params, WorkflowDetailParameterInfo{
			Name:  p.Name,
			Value: p.Value,
		})
	}

	// Convert nodes
	nodes := make([]WorkflowDetailNodeInfo, 0, len(wf.Nodes))
	for _, node := range wf.Nodes {
		inputParams := make([]WorkflowDetailParameterInfo, 0, len(node.Inputs.Parameters))
		for _, p := range node.Inputs.Parameters {
			inputParams = append(inputParams, WorkflowDetailParameterInfo{
				Name:  p.Name,
				Value: p.Value,
			})
		}
		inputArtifacts := make([]WorkflowDetailArtifactInfo, 0, len(node.Inputs.Artifacts))
		for _, a := range node.Inputs.Artifacts {
			inputArtifacts = append(inputArtifacts, WorkflowDetailArtifactInfo{
				Name: a.Name,
				Path: a.Path,
				From: a.From,
				Size: a.Size,
			})
		}

		outputParams := make([]WorkflowDetailParameterInfo, 0, len(node.Outputs.Parameters))
		for _, p := range node.Outputs.Parameters {
			outputParams = append(outputParams, WorkflowDetailParameterInfo{
				Name:  p.Name,
				Value: p.Value,
			})
		}
		outputArtifacts := make([]WorkflowDetailArtifactInfo, 0, len(node.Outputs.Artifacts))
		for _, a := range node.Outputs.Artifacts {
			outputArtifacts = append(outputArtifacts, WorkflowDetailArtifactInfo{
				Name: a.Name,
				Path: a.Path,
				From: a.From,
				Size: a.Size,
			})
		}

		nodes = append(nodes, WorkflowDetailNodeInfo{
			Name:       node.Name,
			Phase:      node.Phase,
			StartedAt:  node.StartedAt,
			FinishedAt: node.FinishedAt,
			Message:    node.Message,
			Inputs: WorkflowDetailIOInfo{
				Parameters: inputParams,
				Artifacts:  inputArtifacts,
			},
			Outputs: WorkflowDetailIOInfo{
				Parameters: outputParams,
				Artifacts:  outputArtifacts,
			},
		})
	}

	return &WorkflowDetailInfo{
		Name:         wf.Name,
		Namespace:    wf.Namespace,
		TemplateName: wf.TemplateName,
		Phase:        wf.Phase,
		StartedAt:    wf.StartedAt,
		FinishedAt:   wf.FinishedAt,
		Parameters:   params,
		Nodes:        nodes,
	}, nil
}
