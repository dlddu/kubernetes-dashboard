package handlers

import (
	"context"
	"net/http"

	versioned "github.com/argoproj/argo-workflows/v3/pkg/client/clientset/versioned"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// ParameterInfo represents a single parameter of a WorkflowTemplate.
type ParameterInfo struct {
	Name        string   `json:"name"`
	Value       *string  `json:"value,omitempty"`
	Description *string  `json:"description,omitempty"`
	Enum        []string `json:"enum,omitempty"`
}

// WorkflowTemplateInfo represents a summarised view of an Argo WorkflowTemplate.
type WorkflowTemplateInfo struct {
	Name       string          `json:"name"`
	Namespace  string          `json:"namespace"`
	Parameters []ParameterInfo `json:"parameters"`
}

// WorkflowTemplatesHandler handles the GET /api/argo/workflow-templates endpoint.
var WorkflowTemplatesHandler = handleGet("Failed to fetch workflow templates data", func(r *http.Request) (interface{}, error) {
	clientset, err := getArgoClient()
	if err != nil {
		return nil, err
	}
	namespace := r.URL.Query().Get("ns")
	return getWorkflowTemplatesData(r.Context(), clientset, namespace)
})

// getWorkflowTemplatesData fetches WorkflowTemplate data from Argo.
func getWorkflowTemplatesData(ctx context.Context, clientset *versioned.Clientset, namespace string) ([]WorkflowTemplateInfo, error) {
	templateList, err := clientset.ArgoprojV1alpha1().WorkflowTemplates(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	result := make([]WorkflowTemplateInfo, 0, len(templateList.Items))
	for _, tmpl := range templateList.Items {
		params := make([]ParameterInfo, 0, len(tmpl.Spec.Arguments.Parameters))
		for _, p := range tmpl.Spec.Arguments.Parameters {
			param := ParameterInfo{
				Name:        p.Name,
				Value:       p.Value,
				Description: p.Description,
				Enum:        p.Enum,
			}
			params = append(params, param)
		}

		result = append(result, WorkflowTemplateInfo{
			Name:       tmpl.Name,
			Namespace:  tmpl.Namespace,
			Parameters: params,
		})
	}

	return result, nil
}
