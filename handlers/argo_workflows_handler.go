package handlers

import (
	"context"
	"net/http"
	"strings"

	versioned "github.com/argoproj/argo-workflows/v3/pkg/client/clientset/versioned"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// WorkflowStepInfo represents a summarised view of a single step in a Workflow.
type WorkflowStepInfo struct {
	Name  string `json:"name"`
	Phase string `json:"phase"`
}

// WorkflowInfo represents a summarised view of an Argo Workflow run.
type WorkflowInfo struct {
	Name         string             `json:"name"`
	Namespace    string             `json:"namespace"`
	TemplateName string             `json:"templateName"`
	Phase        string             `json:"phase"`
	StartedAt    string             `json:"startedAt"`
	FinishedAt   string             `json:"finishedAt"`
	Nodes        []WorkflowStepInfo `json:"nodes"`
}

// WorkflowsHandler handles the GET /api/argo/workflows endpoint.
var WorkflowsHandler = handleGet("Failed to fetch workflow runs data", func(r *http.Request) (interface{}, error) {
	clientset, err := getArgoClient()
	if err != nil {
		return nil, err
	}
	namespace := r.URL.Query().Get("ns")
	return getWorkflowsData(r.Context(), clientset, namespace)
})

// getWorkflowsData fetches Workflow data from Argo.
func getWorkflowsData(ctx context.Context, clientset *versioned.Clientset, namespace string) ([]WorkflowInfo, error) {
	workflowList, err := clientset.ArgoprojV1alpha1().Workflows(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		// Argo CRD가 설치되지 않은 클러스터에서는 빈 목록을 반환합니다.
		if strings.Contains(err.Error(), "the server could not find the requested resource") ||
			strings.Contains(strings.ToLower(err.Error()), "not found") {
			return []WorkflowInfo{}, nil
		}
		return nil, err
	}

	result := make([]WorkflowInfo, 0, len(workflowList.Items))
	for _, wf := range workflowList.Items {
		nodes := make([]WorkflowStepInfo, 0, len(wf.Nodes))
		for _, node := range wf.Nodes {
			nodes = append(nodes, WorkflowStepInfo{
				Name:  node.Name,
				Phase: node.Phase,
			})
		}

		result = append(result, WorkflowInfo{
			Name:         wf.Name,
			Namespace:    wf.Namespace,
			TemplateName: wf.TemplateName,
			Phase:        wf.Phase,
			StartedAt:    wf.StartedAt,
			FinishedAt:   wf.FinishedAt,
			Nodes:        nodes,
		})
	}

	return result, nil
}
