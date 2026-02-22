package handlers

import (
	"context"
	"fmt"
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
	Nodes        []WorkflowDetailStepInfo `json:"nodes"`
}

// WorkflowDetailHandler handles GET /api/argo/workflows/{name}.
var WorkflowDetailHandler http.HandlerFunc = func(w http.ResponseWriter, r *http.Request) {
	// Content-Type is always JSON
	w.Header().Set("Content-Type", "application/json")

	if !requireMethod(w, r, http.MethodGet) {
		return
	}

	// Parse name from the path: strip prefix, remainder is the name
	name := strings.TrimPrefix(r.URL.Path, workflowDetailPathPrefix)
	name = strings.TrimRight(name, "/")
	if name == "" || strings.Contains(name, "/") {
		writeError(w, http.StatusBadRequest,
			fmt.Sprintf("invalid path format, expected %s{name}", workflowDetailPathPrefix))
		return
	}

	r = withTimeout(r)

	clientset, err := getArgoClient()
	if err != nil {
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
		writeError(w, http.StatusInternalServerError, "Failed to fetch workflow detail")
		return
	}

	writeJSON(w, http.StatusOK, detail)
}

// getWorkflowDetailData fetches the detailed workflow data from Argo by name,
// searching across all namespaces.
func getWorkflowDetailData(ctx context.Context, clientset *versioned.Clientset, name string) (*WorkflowDetailInfo, error) {
	// Step 1: List all workflows to find the namespace for the given name.
	workflowList, err := clientset.ArgoprojV1alpha1().Workflows("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	// Step 2: Find the workflow's namespace by matching the name.
	namespace := ""
	for _, wf := range workflowList.Items {
		if wf.Name == name {
			namespace = wf.Namespace
			break
		}
	}
	if namespace == "" {
		return nil, fmt.Errorf("workflow %q not found", name)
	}

	// Step 3: Get the detailed workflow using the resolved namespace.
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
				artifacts = append(artifacts, WorkflowDetailArtifactInfo{Name: a.Name, Path: a.Path})
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
				artifacts = append(artifacts, WorkflowDetailArtifactInfo{Name: a.Name, Path: a.Path})
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

	return &WorkflowDetailInfo{
		Name:         wfDetail.Name,
		Namespace:    wfDetail.Namespace,
		TemplateName: wfDetail.TemplateName,
		Phase:        wfDetail.Phase,
		StartedAt:    wfDetail.StartedAt,
		FinishedAt:   wfDetail.FinishedAt,
		Nodes:        nodes,
	}, nil
}
