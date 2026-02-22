// Package versioned provides a stub Argo Workflows versioned clientset
// for use by kubernetes-dashboard.
package versioned

import (
	"context"
	"encoding/json"
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/runtime/serializer"
	"k8s.io/client-go/rest"
)

// WorkflowTemplate represents an Argo Workflows WorkflowTemplate CRD object.
type WorkflowTemplate struct {
	Name      string
	Namespace string
	Spec      WorkflowTemplateSpec
}

// WorkflowTemplateSpec holds the spec of a WorkflowTemplate.
type WorkflowTemplateSpec struct {
	Arguments Arguments
}

// Arguments holds the arguments for a WorkflowTemplate.
type Arguments struct {
	Parameters []Parameter
}

// Parameter represents a single parameter in a WorkflowTemplate.
type Parameter struct {
	Name        string
	Value       *string
	Description *string
	Enum        []string
}

// WorkflowTemplateList represents a list of WorkflowTemplates.
type WorkflowTemplateList struct {
	Items []WorkflowTemplate
}

// workflowTemplateAPIResponse is used to parse the raw Kubernetes API JSON response.
type workflowTemplateAPIResponse struct {
	Items []workflowTemplateAPIItem `json:"items"`
}

type workflowTemplateAPIItem struct {
	Metadata workflowTemplateMetadata `json:"metadata"`
	Spec     workflowTemplateSpecAPI  `json:"spec"`
}

type workflowTemplateMetadata struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
}

type workflowTemplateSpecAPI struct {
	Arguments workflowTemplateArgumentsAPI `json:"arguments"`
}

type workflowTemplateArgumentsAPI struct {
	Parameters []workflowTemplateParameterAPI `json:"parameters"`
}

type workflowTemplateParameterAPI struct {
	Name        string   `json:"name"`
	Value       *string  `json:"value,omitempty"`
	Description *string  `json:"description,omitempty"`
	Enum        []string `json:"enum,omitempty"`
}

// WorkflowTemplateInterface defines the operations on WorkflowTemplates.
type WorkflowTemplateInterface interface {
	List(ctx context.Context, opts metav1.ListOptions) (*WorkflowTemplateList, error)
}

// workflowTemplateClient implements WorkflowTemplateInterface using a REST client.
type workflowTemplateClient struct {
	restClient rest.Interface
	namespace  string
}

// List retrieves WorkflowTemplates from the Kubernetes API.
func (c *workflowTemplateClient) List(ctx context.Context, _ metav1.ListOptions) (*WorkflowTemplateList, error) {
	var path string
	if c.namespace != "" {
		path = fmt.Sprintf("/apis/argoproj.io/v1alpha1/namespaces/%s/workflowtemplates", c.namespace)
	} else {
		path = "/apis/argoproj.io/v1alpha1/workflowtemplates"
	}

	result := c.restClient.Get().AbsPath(path).Do(ctx)
	raw, err := result.Raw()
	if err != nil {
		return nil, fmt.Errorf("failed to list WorkflowTemplates: %w", err)
	}

	var apiResponse workflowTemplateAPIResponse
	if err := json.Unmarshal(raw, &apiResponse); err != nil {
		return nil, fmt.Errorf("failed to parse WorkflowTemplates response: %w", err)
	}

	items := make([]WorkflowTemplate, 0, len(apiResponse.Items))
	for _, item := range apiResponse.Items {
		params := make([]Parameter, 0, len(item.Spec.Arguments.Parameters))
		for _, p := range item.Spec.Arguments.Parameters {
			params = append(params, Parameter{
				Name:        p.Name,
				Value:       p.Value,
				Description: p.Description,
				Enum:        p.Enum,
			})
		}
		items = append(items, WorkflowTemplate{
			Name:      item.Metadata.Name,
			Namespace: item.Metadata.Namespace,
			Spec: WorkflowTemplateSpec{
				Arguments: Arguments{
					Parameters: params,
				},
			},
		})
	}

	return &WorkflowTemplateList{Items: items}, nil
}

// ArgoprojV1alpha1Interface defines the Argo Proj V1alpha1 API group.
type ArgoprojV1alpha1Interface interface {
	WorkflowTemplates(namespace string) WorkflowTemplateInterface
}

// argoprojV1alpha1Client implements ArgoprojV1alpha1Interface.
type argoprojV1alpha1Client struct {
	restClient rest.Interface
}

// WorkflowTemplates returns a WorkflowTemplateInterface for the given namespace.
func (c *argoprojV1alpha1Client) WorkflowTemplates(namespace string) WorkflowTemplateInterface {
	return &workflowTemplateClient{restClient: c.restClient, namespace: namespace}
}

// Clientset implements a minimal Argo Workflows clientset.
type Clientset struct {
	config     *rest.Config
	restClient rest.Interface
}

// NewForConfig creates a new Argo Workflows Clientset from the given REST config.
func NewForConfig(config *rest.Config) (*Clientset, error) {
	configCopy := rest.CopyConfig(config)
	configCopy.APIPath = "/apis"
	gv := schema.GroupVersion{Group: "argoproj.io", Version: "v1alpha1"}
	configCopy.GroupVersion = &gv
	s := runtime.NewScheme()
	configCopy.NegotiatedSerializer = serializer.NewCodecFactory(s).WithoutConversion()

	restClient, err := rest.RESTClientFor(configCopy)
	if err != nil {
		return nil, fmt.Errorf("failed to create REST client for Argo Workflows: %w", err)
	}

	return &Clientset{config: config, restClient: restClient}, nil
}

// NewForConfigOrDie creates a new Argo Workflows Clientset from the given REST
// config or panics if an error occurs.
func NewForConfigOrDie(config *rest.Config) *Clientset {
	cs, err := NewForConfig(config)
	if err != nil {
		panic(err)
	}
	return cs
}

// ArgoprojV1alpha1 returns an ArgoprojV1alpha1Interface for the given clientset.
func (c *Clientset) ArgoprojV1alpha1() ArgoprojV1alpha1Interface {
	return &argoprojV1alpha1Client{restClient: c.restClient}
}
