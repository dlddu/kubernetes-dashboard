package handlers

import (
	"context"
	"net/http"
	"strings"

	versioned "github.com/dlddu/kubernetes-dashboard/internal/fluxcdversioned/pkg/client/clientset/versioned"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GitRepositoryInfo represents a summarised view of a FluxCD GitRepository.
type GitRepositoryInfo struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	URL       string `json:"url"`
	Ready     bool   `json:"ready"`
	Suspended bool   `json:"suspended"`
	Revision  string `json:"revision"`
	Interval  string `json:"interval"`
	Branch    string `json:"branch"`
	Tag       string `json:"tag"`
}

// GitRepositoriesHandler handles the GET /api/fluxcd/gitrepositories endpoint.
var GitRepositoriesHandler = handleGet(errMsgGitRepositoryListFetch, func(r *http.Request) (interface{}, error) {
	clientset, err := getFluxCDClient()
	if err != nil {
		return []GitRepositoryInfo{}, nil
	}
	namespace := r.URL.Query().Get("ns")
	return getGitRepositoriesData(r.Context(), clientset, namespace)
})

// getGitRepositoriesData fetches GitRepository data from FluxCD.
func getGitRepositoriesData(ctx context.Context, clientset *versioned.Clientset, namespace string) ([]GitRepositoryInfo, error) {
	gitRepoList, err := clientset.FluxCDV1().GitRepositories(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		if strings.Contains(err.Error(), "the server could not find the requested resource") ||
			strings.Contains(strings.ToLower(err.Error()), "not found") {
			return []GitRepositoryInfo{}, nil
		}
		return nil, err
	}

	result := make([]GitRepositoryInfo, 0, len(gitRepoList.Items))
	for _, gr := range gitRepoList.Items {
		ready := false
		suspended := gr.Suspended

		for _, cond := range gr.Status.Conditions {
			if cond.Type == "Ready" {
				if cond.Status == "True" {
					ready = true
				}
				if cond.Reason == "Suspended" {
					suspended = true
				}
			}
		}

		revision := ""
		if gr.Status.Artifact != nil {
			revision = gr.Status.Artifact.Revision
		}

		result = append(result, GitRepositoryInfo{
			Name:      gr.Name,
			Namespace: gr.Namespace,
			URL:       gr.Spec.URL,
			Ready:     ready,
			Suspended: suspended,
			Revision:  revision,
			Interval:  gr.Spec.Interval,
			Branch:    gr.Spec.Ref.Branch,
			Tag:       gr.Spec.Ref.Tag,
		})
	}

	return result, nil
}
