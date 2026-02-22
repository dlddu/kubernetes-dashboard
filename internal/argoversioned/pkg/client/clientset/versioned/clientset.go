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

// Workflow represents a submitted Argo Workflow instance.
type Workflow struct {
	Name      string
	Namespace string
}

// WorkflowNode represents a single node (step) in a Workflow execution.
type WorkflowNode struct {
	Name  string
	Phase string
}

// WorkflowFull represents a full Argo Workflow with execution details.
type WorkflowFull struct {
	Name         string
	Namespace    string
	TemplateName string
	Phase        string
	StartedAt    string
	FinishedAt   string
	Nodes        []WorkflowNode
}

// WorkflowList represents a list of WorkflowFull objects.
type WorkflowList struct {
	Items []WorkflowFull
}

// workflowAPIResponse is used to parse the raw Kubernetes API JSON response for a Workflow.
type workflowAPIResponse struct {
	Metadata workflowTemplateMetadata `json:"metadata"`
}

// workflowListAPIResponse is used to parse the raw Kubernetes API JSON response for a Workflow list.
type workflowListAPIResponse struct {
	Items []workflowListAPIItem `json:"items"`
}

type workflowListAPIItem struct {
	Metadata workflowTemplateMetadata `json:"metadata"`
	Spec     workflowListSpecAPI      `json:"spec"`
	Status   workflowListStatusAPI    `json:"status"`
}

type workflowListSpecAPI struct {
	WorkflowTemplateRef workflowListTemplateRef `json:"workflowTemplateRef"`
}

type workflowListTemplateRef struct {
	Name string `json:"name"`
}

type workflowListStatusAPI struct {
	Phase      string                     `json:"phase"`
	StartedAt  string                     `json:"startedAt"`
	FinishedAt string                     `json:"finishedAt"`
	Nodes      map[string]workflowNodeAPI `json:"nodes"`
}

type workflowNodeAPI struct {
	DisplayName string `json:"displayName"`
	Phase       string `json:"phase"`
}

// workflowDetailGetAPIResponse is the raw API response for a single Workflow (Get).
type workflowDetailGetAPIResponse struct {
	Metadata workflowTemplateMetadata       `json:"metadata"`
	Spec     workflowListSpecAPI            `json:"spec"`
	Status   workflowDetailGetStatusAPI     `json:"status"`
}

type workflowDetailGetStatusAPI struct {
	Phase      string                               `json:"phase"`
	StartedAt  string                               `json:"startedAt"`
	FinishedAt string                               `json:"finishedAt"`
	Nodes      map[string]workflowDetailNodeAPI     `json:"nodes"`
}

type workflowDetailNodeAPI struct {
	DisplayName string                    `json:"displayName"`
	Type        string                    `json:"type"`
	Phase       string                    `json:"phase"`
	StartedAt   string                    `json:"startedAt"`
	FinishedAt  string                    `json:"finishedAt"`
	Message     string                    `json:"message"`
	Inputs      *workflowDetailIOAPI      `json:"inputs"`
	Outputs     *workflowDetailIOAPI      `json:"outputs"`
}

type workflowDetailIOAPI struct {
	Parameters []workflowDetailParamAPI    `json:"parameters"`
	Artifacts  []workflowDetailArtifactAPI `json:"artifacts"`
}

type workflowDetailParamAPI struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type workflowDetailArtifactAPI struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

// WorkflowDetailNode is a richly-typed workflow step node for the detail view.
type WorkflowDetailNode struct {
	Name       string
	Type       string
	Phase      string
	StartedAt  string
	FinishedAt string
	Message    string
	Inputs     *WorkflowDetailIO
	Outputs    *WorkflowDetailIO
}

// WorkflowDetailIO holds parameters and artifacts for a workflow step.
type WorkflowDetailIO struct {
	Parameters []WorkflowDetailParam
	Artifacts  []WorkflowDetailArtifact
}

// WorkflowDetailParam is a single input/output parameter.
type WorkflowDetailParam struct {
	Name  string
	Value string
}

// WorkflowDetailArtifact is a single input/output artifact.
type WorkflowDetailArtifact struct {
	Name string
	Path string
}

// WorkflowDetail represents a full Argo Workflow with step-level IO details.
type WorkflowDetail struct {
	Name         string
	Namespace    string
	TemplateName string
	Phase        string
	StartedAt    string
	FinishedAt   string
	Nodes        []WorkflowDetailNode
}

// WorkflowInterface defines the operations on Workflows.
type WorkflowInterface interface {
	Create(ctx context.Context, templateName string, parameters []map[string]string) (*Workflow, error)
	List(ctx context.Context, opts metav1.ListOptions) (*WorkflowList, error)
	Get(ctx context.Context, name string) (*WorkflowDetail, error)
}

// workflowClient implements WorkflowInterface using a REST client.
type workflowClient struct {
	restClient rest.Interface
	namespace  string
}

// workflowCreateBody represents the JSON body for creating a Workflow from a WorkflowTemplate.
type workflowCreateBody struct {
	APIVersion string       `json:"apiVersion"`
	Kind       string       `json:"kind"`
	Metadata   wfMetadata   `json:"metadata"`
	Spec       wfCreateSpec `json:"spec"`
}

type wfMetadata struct {
	GenerateName string `json:"generateName"`
	Namespace    string `json:"namespace"`
}

type wfCreateSpec struct {
	WorkflowTemplateRef wfTemplateRef `json:"workflowTemplateRef"`
	Arguments           wfArguments   `json:"arguments,omitempty"`
}

type wfTemplateRef struct {
	Name string `json:"name"`
}

type wfArguments struct {
	Parameters []wfParameter `json:"parameters,omitempty"`
}

type wfParameter struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

// List retrieves Workflows from the Kubernetes API.
func (c *workflowClient) List(ctx context.Context, _ metav1.ListOptions) (*WorkflowList, error) {
	var path string
	if c.namespace != "" {
		path = fmt.Sprintf("/apis/argoproj.io/v1alpha1/namespaces/%s/workflows", c.namespace)
	} else {
		path = "/apis/argoproj.io/v1alpha1/workflows"
	}

	result := c.restClient.Get().AbsPath(path).Do(ctx)
	raw, err := result.Raw()
	if err != nil {
		return nil, fmt.Errorf("failed to list Workflows: %w", err)
	}

	var apiResponse workflowListAPIResponse
	if err := json.Unmarshal(raw, &apiResponse); err != nil {
		return nil, fmt.Errorf("failed to parse Workflows response: %w", err)
	}

	items := make([]WorkflowFull, 0, len(apiResponse.Items))
	for _, item := range apiResponse.Items {
		nodes := make([]WorkflowNode, 0, len(item.Status.Nodes))
		for _, node := range item.Status.Nodes {
			nodes = append(nodes, WorkflowNode{
				Name:  node.DisplayName,
				Phase: node.Phase,
			})
		}

		items = append(items, WorkflowFull{
			Name:         item.Metadata.Name,
			Namespace:    item.Metadata.Namespace,
			TemplateName: item.Spec.WorkflowTemplateRef.Name,
			Phase:        item.Status.Phase,
			StartedAt:    item.Status.StartedAt,
			FinishedAt:   item.Status.FinishedAt,
			Nodes:        nodes,
		})
	}

	return &WorkflowList{Items: items}, nil
}

// Get retrieves a single Workflow by name from the Kubernetes API.
func (c *workflowClient) Get(ctx context.Context, name string) (*WorkflowDetail, error) {
	var path string
	if c.namespace != "" {
		path = fmt.Sprintf("/apis/argoproj.io/v1alpha1/namespaces/%s/workflows/%s", c.namespace, name)
	} else {
		path = fmt.Sprintf("/apis/argoproj.io/v1alpha1/workflows/%s", name)
	}

	result := c.restClient.Get().AbsPath(path).Do(ctx)
	raw, err := result.Raw()
	if err != nil {
		return nil, fmt.Errorf("failed to get Workflow %q: %w", name, err)
	}

	var apiResponse workflowDetailGetAPIResponse
	if err := json.Unmarshal(raw, &apiResponse); err != nil {
		return nil, fmt.Errorf("failed to parse Workflow response: %w", err)
	}

	nodes := make([]WorkflowDetailNode, 0)
	for _, node := range apiResponse.Status.Nodes {
		// Only include Pod-type nodes in the detail view
		if node.Type != "Pod" {
			continue
		}

		var inputs *WorkflowDetailIO
		if node.Inputs != nil {
			params := make([]WorkflowDetailParam, 0, len(node.Inputs.Parameters))
			for _, p := range node.Inputs.Parameters {
				params = append(params, WorkflowDetailParam{Name: p.Name, Value: p.Value})
			}
			artifacts := make([]WorkflowDetailArtifact, 0, len(node.Inputs.Artifacts))
			for _, a := range node.Inputs.Artifacts {
				artifacts = append(artifacts, WorkflowDetailArtifact{Name: a.Name, Path: a.Path})
			}
			inputs = &WorkflowDetailIO{Parameters: params, Artifacts: artifacts}
		}

		var outputs *WorkflowDetailIO
		if node.Outputs != nil {
			params := make([]WorkflowDetailParam, 0, len(node.Outputs.Parameters))
			for _, p := range node.Outputs.Parameters {
				params = append(params, WorkflowDetailParam{Name: p.Name, Value: p.Value})
			}
			artifacts := make([]WorkflowDetailArtifact, 0, len(node.Outputs.Artifacts))
			for _, a := range node.Outputs.Artifacts {
				artifacts = append(artifacts, WorkflowDetailArtifact{Name: a.Name, Path: a.Path})
			}
			outputs = &WorkflowDetailIO{Parameters: params, Artifacts: artifacts}
		}

		nodes = append(nodes, WorkflowDetailNode{
			Name:       node.DisplayName,
			Type:       node.Type,
			Phase:      node.Phase,
			StartedAt:  node.StartedAt,
			FinishedAt: node.FinishedAt,
			Message:    node.Message,
			Inputs:     inputs,
			Outputs:    outputs,
		})
	}

	return &WorkflowDetail{
		Name:         apiResponse.Metadata.Name,
		Namespace:    apiResponse.Metadata.Namespace,
		TemplateName: apiResponse.Spec.WorkflowTemplateRef.Name,
		Phase:        apiResponse.Status.Phase,
		StartedAt:    apiResponse.Status.StartedAt,
		FinishedAt:   apiResponse.Status.FinishedAt,
		Nodes:        nodes,
	}, nil
}

// Create creates a new Workflow from a WorkflowTemplate.
func (c *workflowClient) Create(ctx context.Context, templateName string, parameters []map[string]string) (*Workflow, error) {
	path := fmt.Sprintf("/apis/argoproj.io/v1alpha1/namespaces/%s/workflows", c.namespace)

	params := make([]wfParameter, 0, len(parameters))
	for _, p := range parameters {
		params = append(params, wfParameter{
			Name:  p["name"],
			Value: p["value"],
		})
	}

	body := workflowCreateBody{
		APIVersion: "argoproj.io/v1alpha1",
		Kind:       "Workflow",
		Metadata: wfMetadata{
			GenerateName: templateName + "-",
			Namespace:    c.namespace,
		},
		Spec: wfCreateSpec{
			WorkflowTemplateRef: wfTemplateRef{
				Name: templateName,
			},
			Arguments: wfArguments{
				Parameters: params,
			},
		},
	}

	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal workflow create request: %w", err)
	}

	result := c.restClient.Post().AbsPath(path).Body(bodyBytes).Do(ctx)
	raw, err := result.Raw()
	if err != nil {
		return nil, fmt.Errorf("failed to create Workflow: %w", err)
	}

	var apiResponse workflowAPIResponse
	if err := json.Unmarshal(raw, &apiResponse); err != nil {
		return nil, fmt.Errorf("failed to parse Workflow create response: %w", err)
	}

	return &Workflow{
		Name:      apiResponse.Metadata.Name,
		Namespace: apiResponse.Metadata.Namespace,
	}, nil
}

// ArgoprojV1alpha1Interface defines the Argo Proj V1alpha1 API group.
type ArgoprojV1alpha1Interface interface {
	WorkflowTemplates(namespace string) WorkflowTemplateInterface
	Workflows(namespace string) WorkflowInterface
}

// argoprojV1alpha1Client implements ArgoprojV1alpha1Interface.
type argoprojV1alpha1Client struct {
	restClient rest.Interface
}

// WorkflowTemplates returns a WorkflowTemplateInterface for the given namespace.
func (c *argoprojV1alpha1Client) WorkflowTemplates(namespace string) WorkflowTemplateInterface {
	return &workflowTemplateClient{restClient: c.restClient, namespace: namespace}
}

// Workflows returns a WorkflowInterface for the given namespace.
func (c *argoprojV1alpha1Client) Workflows(namespace string) WorkflowInterface {
	return &workflowClient{restClient: c.restClient, namespace: namespace}
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
