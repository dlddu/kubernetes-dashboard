package versioned

import (
	"context"
	"encoding/json"
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/rest"
)

// GitRepository represents a FluxCD GitRepository CRD object.
type GitRepository struct {
	Name      string
	Namespace string
	Spec      GitRepositorySpec
	Status    GitRepositoryStatus
	Suspended bool
}

// GitRepositorySpec holds the spec of a GitRepository.
type GitRepositorySpec struct {
	URL      string
	Interval string
	Ref      GitRepositoryRef
	SecretRef *GitRepositorySecretRef
}

// GitRepositoryRef holds the git reference for a GitRepository.
type GitRepositoryRef struct {
	Branch string
	Tag    string
	Semver string
	Commit string
}

// GitRepositorySecretRef holds the secret reference for a GitRepository.
type GitRepositorySecretRef struct {
	Name string
}

// GitRepositoryStatus holds the status of a GitRepository.
type GitRepositoryStatus struct {
	Conditions []GitRepositoryCondition
	Artifact   *GitRepositoryArtifact
}

// GitRepositoryCondition represents a single condition of a GitRepository.
type GitRepositoryCondition struct {
	Type               string
	Status             string
	LastTransitionTime string
	Reason             string
	Message            string
}

// GitRepositoryArtifact holds the artifact information of a GitRepository.
type GitRepositoryArtifact struct {
	URL            string
	Revision       string
	LastUpdateTime string
}

// GitRepositoryList represents a list of GitRepositories.
type GitRepositoryList struct {
	Items []GitRepository
}

// GitRepositoryDetail represents a full GitRepository with additional detail fields.
type GitRepositoryDetail struct {
	Name      string
	Namespace string
	Spec      GitRepositorySpec
	Status    GitRepositoryStatus
	Suspended bool
}

// gitRepositoryAPIResponse is used to parse the raw Kubernetes API JSON response for a list.
type gitRepositoryAPIResponse struct {
	Items []gitRepositoryAPIItem `json:"items"`
}

type gitRepositoryAPIItem struct {
	Metadata gitRepositoryMetadata `json:"metadata"`
	Spec     gitRepositorySpecAPI  `json:"spec"`
	Status   gitRepositoryStatusAPI `json:"status"`
}

type gitRepositoryMetadata struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
}

type gitRepositorySpecAPI struct {
	URL       string                     `json:"url"`
	Interval  string                     `json:"interval"`
	Ref       gitRepositoryRefAPI        `json:"ref,omitempty"`
	SecretRef *gitRepositorySecretRefAPI `json:"secretRef,omitempty"`
	Suspend   bool                       `json:"suspend,omitempty"`
}

type gitRepositoryRefAPI struct {
	Branch string `json:"branch,omitempty"`
	Tag    string `json:"tag,omitempty"`
	Semver string `json:"semver,omitempty"`
	Commit string `json:"commit,omitempty"`
}

type gitRepositorySecretRefAPI struct {
	Name string `json:"name"`
}

type gitRepositoryStatusAPI struct {
	Conditions []gitRepositoryConditionAPI `json:"conditions,omitempty"`
	Artifact   *gitRepositoryArtifactAPI   `json:"artifact,omitempty"`
}

type gitRepositoryConditionAPI struct {
	Type               string `json:"type"`
	Status             string `json:"status"`
	LastTransitionTime string `json:"lastTransitionTime,omitempty"`
	Reason             string `json:"reason,omitempty"`
	Message            string `json:"message,omitempty"`
}

type gitRepositoryArtifactAPI struct {
	URL            string `json:"url,omitempty"`
	Revision       string `json:"revision,omitempty"`
	LastUpdateTime string `json:"lastUpdateTime,omitempty"`
}

// gitRepositoryDetailAPIResponse is used to parse the raw Kubernetes API JSON response for a single GitRepository.
type gitRepositoryDetailAPIResponse struct {
	Metadata gitRepositoryMetadata  `json:"metadata"`
	Spec     gitRepositorySpecAPI   `json:"spec"`
	Status   gitRepositoryStatusAPI `json:"status"`
}

// GitRepositoryInterface defines the operations on GitRepositories.
type GitRepositoryInterface interface {
	List(ctx context.Context, opts metav1.ListOptions) (*GitRepositoryList, error)
	Get(ctx context.Context, name string) (*GitRepositoryDetail, error)
	Patch(ctx context.Context, name string, data []byte) error
}

// gitRepositoryClient implements GitRepositoryInterface using a REST client.
type gitRepositoryClient struct {
	restClient rest.Interface
	namespace  string
}

func parseGitRepositoryConditions(apiConditions []gitRepositoryConditionAPI) []GitRepositoryCondition {
	conditions := make([]GitRepositoryCondition, 0, len(apiConditions))
	for _, c := range apiConditions {
		conditions = append(conditions, GitRepositoryCondition{
			Type:               c.Type,
			Status:             c.Status,
			LastTransitionTime: c.LastTransitionTime,
			Reason:             c.Reason,
			Message:            c.Message,
		})
	}
	return conditions
}

func parseGitRepositoryArtifact(api *gitRepositoryArtifactAPI) *GitRepositoryArtifact {
	if api == nil {
		return nil
	}
	return &GitRepositoryArtifact{
		URL:            api.URL,
		Revision:       api.Revision,
		LastUpdateTime: api.LastUpdateTime,
	}
}

func parseGitRepositorySecretRef(api *gitRepositorySecretRefAPI) *GitRepositorySecretRef {
	if api == nil {
		return nil
	}
	return &GitRepositorySecretRef{Name: api.Name}
}

// List retrieves GitRepositories from the Kubernetes API.
func (c *gitRepositoryClient) List(ctx context.Context, _ metav1.ListOptions) (*GitRepositoryList, error) {
	var path string
	if c.namespace != "" {
		path = fmt.Sprintf("/apis/source.toolkit.fluxcd.io/v1/namespaces/%s/gitrepositories", c.namespace)
	} else {
		path = "/apis/source.toolkit.fluxcd.io/v1/gitrepositories"
	}

	result := c.restClient.Get().AbsPath(path).Do(ctx)
	raw, err := result.Raw()
	if err != nil {
		return nil, fmt.Errorf("failed to list GitRepositories: %w", err)
	}

	var apiResponse gitRepositoryAPIResponse
	if err := json.Unmarshal(raw, &apiResponse); err != nil {
		return nil, fmt.Errorf("failed to parse GitRepositories response: %w", err)
	}

	items := make([]GitRepository, 0, len(apiResponse.Items))
	for _, item := range apiResponse.Items {
		items = append(items, GitRepository{
			Name:      item.Metadata.Name,
			Namespace: item.Metadata.Namespace,
			Spec: GitRepositorySpec{
				URL:       item.Spec.URL,
				Interval:  item.Spec.Interval,
				Ref: GitRepositoryRef{
					Branch: item.Spec.Ref.Branch,
					Tag:    item.Spec.Ref.Tag,
					Semver: item.Spec.Ref.Semver,
					Commit: item.Spec.Ref.Commit,
				},
				SecretRef: parseGitRepositorySecretRef(item.Spec.SecretRef),
			},
			Status: GitRepositoryStatus{
				Conditions: parseGitRepositoryConditions(item.Status.Conditions),
				Artifact:   parseGitRepositoryArtifact(item.Status.Artifact),
			},
			Suspended: item.Spec.Suspend,
		})
	}

	return &GitRepositoryList{Items: items}, nil
}

// Get retrieves a single GitRepository by name from the Kubernetes API.
func (c *gitRepositoryClient) Get(ctx context.Context, name string) (*GitRepositoryDetail, error) {
	var path string
	if c.namespace != "" {
		path = fmt.Sprintf("/apis/source.toolkit.fluxcd.io/v1/namespaces/%s/gitrepositories/%s", c.namespace, name)
	} else {
		path = fmt.Sprintf("/apis/source.toolkit.fluxcd.io/v1/gitrepositories/%s", name)
	}

	result := c.restClient.Get().AbsPath(path).Do(ctx)
	raw, err := result.Raw()
	if err != nil {
		return nil, fmt.Errorf("failed to get GitRepository %q: %w", name, err)
	}

	var apiResponse gitRepositoryDetailAPIResponse
	if err := json.Unmarshal(raw, &apiResponse); err != nil {
		return nil, fmt.Errorf("failed to parse GitRepository response: %w", err)
	}

	return &GitRepositoryDetail{
		Name:      apiResponse.Metadata.Name,
		Namespace: apiResponse.Metadata.Namespace,
		Spec: GitRepositorySpec{
			URL:      apiResponse.Spec.URL,
			Interval: apiResponse.Spec.Interval,
			Ref: GitRepositoryRef{
				Branch: apiResponse.Spec.Ref.Branch,
				Tag:    apiResponse.Spec.Ref.Tag,
				Semver: apiResponse.Spec.Ref.Semver,
				Commit: apiResponse.Spec.Ref.Commit,
			},
			SecretRef: parseGitRepositorySecretRef(apiResponse.Spec.SecretRef),
		},
		Status: GitRepositoryStatus{
			Conditions: parseGitRepositoryConditions(apiResponse.Status.Conditions),
			Artifact:   parseGitRepositoryArtifact(apiResponse.Status.Artifact),
		},
		Suspended: apiResponse.Spec.Suspend,
	}, nil
}

// Patch applies a JSON merge patch to a GitRepository.
func (c *gitRepositoryClient) Patch(ctx context.Context, name string, data []byte) error {
	var path string
	if c.namespace != "" {
		path = fmt.Sprintf("/apis/source.toolkit.fluxcd.io/v1/namespaces/%s/gitrepositories/%s", c.namespace, name)
	} else {
		path = fmt.Sprintf("/apis/source.toolkit.fluxcd.io/v1/gitrepositories/%s", name)
	}

	result := c.restClient.Patch("application/merge-patch+json").AbsPath(path).Body(data).Do(ctx)
	if _, err := result.Raw(); err != nil {
		return fmt.Errorf("failed to patch GitRepository %q: %w", name, err)
	}

	return nil
}
