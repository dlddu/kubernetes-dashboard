// Package versioned provides a stub Argo Workflows versioned clientset
// for use by kubernetes-dashboard.
package versioned

import (
	"context"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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

// WorkflowTemplateInterface defines the operations on WorkflowTemplates.
type WorkflowTemplateInterface interface {
	List(ctx context.Context, opts metav1.ListOptions) (*WorkflowTemplateList, error)
}

// workflowTemplateClient is a stub implementation of WorkflowTemplateInterface.
type workflowTemplateClient struct {
	config    *rest.Config
	namespace string
}

// List returns an empty list of WorkflowTemplates (stub implementation).
func (c *workflowTemplateClient) List(_ context.Context, _ metav1.ListOptions) (*WorkflowTemplateList, error) {
	return &WorkflowTemplateList{Items: []WorkflowTemplate{}}, nil
}

// ArgoprojV1alpha1Interface defines the Argo Proj V1alpha1 API group.
type ArgoprojV1alpha1Interface interface {
	WorkflowTemplates(namespace string) WorkflowTemplateInterface
}

// argoprojV1alpha1Client is a stub implementation of ArgoprojV1alpha1Interface.
type argoprojV1alpha1Client struct {
	config *rest.Config
}

// WorkflowTemplates returns a WorkflowTemplateInterface for the given namespace.
func (c *argoprojV1alpha1Client) WorkflowTemplates(namespace string) WorkflowTemplateInterface {
	return &workflowTemplateClient{config: c.config, namespace: namespace}
}

// Clientset implements a minimal Argo Workflows clientset stub.
type Clientset struct {
	config *rest.Config
}

// NewForConfig creates a new Argo Workflows Clientset from the given REST config.
func NewForConfig(config *rest.Config) (*Clientset, error) {
	return &Clientset{config: config}, nil
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
	return &argoprojV1alpha1Client{config: c.config}
}
