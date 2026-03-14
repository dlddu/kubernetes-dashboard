// Package versioned provides a stub FluxCD Kustomize Controller versioned clientset
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

// Kustomization represents a FluxCD Kustomization CRD object.
type Kustomization struct {
	Name      string
	Namespace string
	Spec      KustomizationSpec
	Status    KustomizationStatus
	Suspended bool
}

// DependsOnRef represents a dependency reference in a Kustomization spec.
type DependsOnRef struct {
	Name      string
	Namespace string
}

// KustomizationSpec holds the spec of a Kustomization.
type KustomizationSpec struct {
	Interval        string
	Path            string
	Prune           bool
	SourceRef       SourceRef
	TargetNamespace string
	DependsOn       []DependsOnRef
}

// SourceRef holds the source reference for a Kustomization.
type SourceRef struct {
	Kind      string
	Name      string
	Namespace string
}

// KustomizationStatus holds the status of a Kustomization.
type KustomizationStatus struct {
	Conditions          []KustomizationCondition
	LastAppliedRevision string
}

// KustomizationCondition represents a single condition of a Kustomization.
type KustomizationCondition struct {
	Type               string
	Status             string
	LastTransitionTime string
	Reason             string
	Message            string
}

// KustomizationList represents a list of Kustomizations.
type KustomizationList struct {
	Items []Kustomization
}

// KustomizationDetail represents a full Kustomization with additional detail fields.
type KustomizationDetail struct {
	Name                string
	Namespace           string
	Spec                KustomizationSpec
	Status              KustomizationStatus
	Suspended           bool
	LastAppliedRevision string
	Interval            string
}

// kustomizationAPIResponse is used to parse the raw Kubernetes API JSON response for a list.
type kustomizationAPIResponse struct {
	Items []kustomizationAPIItem `json:"items"`
}

type kustomizationAPIItem struct {
	Metadata kustomizationMetadata `json:"metadata"`
	Spec     kustomizationSpecAPI  `json:"spec"`
	Status   kustomizationStatusAPI `json:"status"`
}

type kustomizationMetadata struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
}

type kustomizationSpecAPI struct {
	Interval        string             `json:"interval"`
	Path            string             `json:"path"`
	Prune           bool               `json:"prune"`
	SourceRef       sourceRefAPI       `json:"sourceRef"`
	TargetNamespace string             `json:"targetNamespace,omitempty"`
	Suspend         bool               `json:"suspend,omitempty"`
	DependsOn       []dependsOnRefAPI  `json:"dependsOn,omitempty"`
}

type dependsOnRefAPI struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace,omitempty"`
}

type sourceRefAPI struct {
	Kind      string `json:"kind"`
	Name      string `json:"name"`
	Namespace string `json:"namespace,omitempty"`
}

type kustomizationStatusAPI struct {
	Conditions          []kustomizationConditionAPI `json:"conditions,omitempty"`
	LastAppliedRevision string                     `json:"lastAppliedRevision,omitempty"`
}

type kustomizationConditionAPI struct {
	Type               string `json:"type"`
	Status             string `json:"status"`
	LastTransitionTime string `json:"lastTransitionTime,omitempty"`
	Reason             string `json:"reason,omitempty"`
	Message            string `json:"message,omitempty"`
}

// kustomizationDetailAPIResponse is used to parse the raw Kubernetes API JSON response for a single Kustomization.
type kustomizationDetailAPIResponse struct {
	Metadata kustomizationMetadata `json:"metadata"`
	Spec     kustomizationSpecAPI  `json:"spec"`
	Status   kustomizationStatusAPI `json:"status"`
}

// KustomizationInterface defines the operations on Kustomizations.
type KustomizationInterface interface {
	List(ctx context.Context, opts metav1.ListOptions) (*KustomizationList, error)
	Get(ctx context.Context, name string) (*KustomizationDetail, error)
	Patch(ctx context.Context, name string, data []byte) error
}

// kustomizationClient implements KustomizationInterface using a REST client.
type kustomizationClient struct {
	restClient rest.Interface
	namespace  string
}

// List retrieves Kustomizations from the Kubernetes API.
func (c *kustomizationClient) List(ctx context.Context, _ metav1.ListOptions) (*KustomizationList, error) {
	var path string
	if c.namespace != "" {
		path = fmt.Sprintf("/apis/kustomize.toolkit.fluxcd.io/v1/namespaces/%s/kustomizations", c.namespace)
	} else {
		path = "/apis/kustomize.toolkit.fluxcd.io/v1/kustomizations"
	}

	result := c.restClient.Get().AbsPath(path).Do(ctx)
	raw, err := result.Raw()
	if err != nil {
		return nil, fmt.Errorf("failed to list Kustomizations: %w", err)
	}

	var apiResponse kustomizationAPIResponse
	if err := json.Unmarshal(raw, &apiResponse); err != nil {
		return nil, fmt.Errorf("failed to parse Kustomizations response: %w", err)
	}

	items := make([]Kustomization, 0, len(apiResponse.Items))
	for _, item := range apiResponse.Items {
		conditions := make([]KustomizationCondition, 0, len(item.Status.Conditions))
		for _, c := range item.Status.Conditions {
			conditions = append(conditions, KustomizationCondition{
				Type:               c.Type,
				Status:             c.Status,
				LastTransitionTime: c.LastTransitionTime,
				Reason:             c.Reason,
				Message:            c.Message,
			})
		}
		items = append(items, Kustomization{
			Name:      item.Metadata.Name,
			Namespace: item.Metadata.Namespace,
			Spec: KustomizationSpec{
				Interval: item.Spec.Interval,
				Path:     item.Spec.Path,
				Prune:    item.Spec.Prune,
				SourceRef: SourceRef{
					Kind:      item.Spec.SourceRef.Kind,
					Name:      item.Spec.SourceRef.Name,
					Namespace: item.Spec.SourceRef.Namespace,
				},
				TargetNamespace: item.Spec.TargetNamespace,
			},
			Status: KustomizationStatus{
				Conditions:          conditions,
				LastAppliedRevision: item.Status.LastAppliedRevision,
			},
			Suspended: item.Spec.Suspend,
		})
	}

	return &KustomizationList{Items: items}, nil
}

// Get retrieves a single Kustomization by name from the Kubernetes API.
func (c *kustomizationClient) Get(ctx context.Context, name string) (*KustomizationDetail, error) {
	var path string
	if c.namespace != "" {
		path = fmt.Sprintf("/apis/kustomize.toolkit.fluxcd.io/v1/namespaces/%s/kustomizations/%s", c.namespace, name)
	} else {
		path = fmt.Sprintf("/apis/kustomize.toolkit.fluxcd.io/v1/kustomizations/%s", name)
	}

	result := c.restClient.Get().AbsPath(path).Do(ctx)
	raw, err := result.Raw()
	if err != nil {
		return nil, fmt.Errorf("failed to get Kustomization %q: %w", name, err)
	}

	var apiResponse kustomizationDetailAPIResponse
	if err := json.Unmarshal(raw, &apiResponse); err != nil {
		return nil, fmt.Errorf("failed to parse Kustomization response: %w", err)
	}

	conditions := make([]KustomizationCondition, 0, len(apiResponse.Status.Conditions))
	for _, c := range apiResponse.Status.Conditions {
		conditions = append(conditions, KustomizationCondition{
			Type:               c.Type,
			Status:             c.Status,
			LastTransitionTime: c.LastTransitionTime,
			Reason:             c.Reason,
			Message:            c.Message,
		})
	}

	dependsOn := make([]DependsOnRef, 0, len(apiResponse.Spec.DependsOn))
	for _, d := range apiResponse.Spec.DependsOn {
		dependsOn = append(dependsOn, DependsOnRef{
			Name:      d.Name,
			Namespace: d.Namespace,
		})
	}

	return &KustomizationDetail{
		Name:      apiResponse.Metadata.Name,
		Namespace: apiResponse.Metadata.Namespace,
		Spec: KustomizationSpec{
			Interval: apiResponse.Spec.Interval,
			Path:     apiResponse.Spec.Path,
			Prune:    apiResponse.Spec.Prune,
			SourceRef: SourceRef{
				Kind:      apiResponse.Spec.SourceRef.Kind,
				Name:      apiResponse.Spec.SourceRef.Name,
				Namespace: apiResponse.Spec.SourceRef.Namespace,
			},
			TargetNamespace: apiResponse.Spec.TargetNamespace,
			DependsOn:       dependsOn,
		},
		Status: KustomizationStatus{
			Conditions:          conditions,
			LastAppliedRevision: apiResponse.Status.LastAppliedRevision,
		},
		Suspended:           apiResponse.Spec.Suspend,
		LastAppliedRevision: apiResponse.Status.LastAppliedRevision,
		Interval:            apiResponse.Spec.Interval,
	}, nil
}

// Patch applies a JSON merge patch to a Kustomization.
func (c *kustomizationClient) Patch(ctx context.Context, name string, data []byte) error {
	var path string
	if c.namespace != "" {
		path = fmt.Sprintf("/apis/kustomize.toolkit.fluxcd.io/v1/namespaces/%s/kustomizations/%s", c.namespace, name)
	} else {
		path = fmt.Sprintf("/apis/kustomize.toolkit.fluxcd.io/v1/kustomizations/%s", name)
	}

	result := c.restClient.Patch("application/merge-patch+json").AbsPath(path).Body(data).Do(ctx)
	if _, err := result.Raw(); err != nil {
		return fmt.Errorf("failed to patch Kustomization %q: %w", name, err)
	}

	return nil
}

// FluxCDV1Interface defines the FluxCD kustomize.toolkit.fluxcd.io/v1 API group.
type FluxCDV1Interface interface {
	Kustomizations(namespace string) KustomizationInterface
}

// fluxCDV1Client implements FluxCDV1Interface.
type fluxCDV1Client struct {
	restClient rest.Interface
}

// Kustomizations returns a KustomizationInterface for the given namespace.
func (c *fluxCDV1Client) Kustomizations(namespace string) KustomizationInterface {
	return &kustomizationClient{restClient: c.restClient, namespace: namespace}
}

// Clientset implements a minimal FluxCD Kustomize Controller clientset.
type Clientset struct {
	config     *rest.Config
	restClient rest.Interface
}

// NewForConfig creates a new FluxCD Clientset from the given REST config.
func NewForConfig(config *rest.Config) (*Clientset, error) {
	configCopy := rest.CopyConfig(config)
	configCopy.APIPath = "/apis"
	gv := schema.GroupVersion{Group: "kustomize.toolkit.fluxcd.io", Version: "v1"}
	configCopy.GroupVersion = &gv
	s := runtime.NewScheme()
	configCopy.NegotiatedSerializer = serializer.NewCodecFactory(s).WithoutConversion()

	restClient, err := rest.RESTClientFor(configCopy)
	if err != nil {
		return nil, fmt.Errorf("failed to create REST client for FluxCD Kustomize Controller: %w", err)
	}

	return &Clientset{config: config, restClient: restClient}, nil
}

// NewForConfigOrDie creates a new FluxCD Clientset from the given REST config
// or panics if an error occurs.
func NewForConfigOrDie(config *rest.Config) *Clientset {
	cs, err := NewForConfig(config)
	if err != nil {
		panic(err)
	}
	return cs
}

// FluxCDV1 returns a FluxCDV1Interface for the given clientset.
func (c *Clientset) FluxCDV1() FluxCDV1Interface {
	return &fluxCDV1Client{restClient: c.restClient}
}
