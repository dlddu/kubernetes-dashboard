package handlers

import (
	"context"
	"log/slog"
	"net/http"
	"strings"

	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	versioned "github.com/dlddu/kubernetes-dashboard/internal/fluxcdversioned/pkg/client/clientset/versioned"
)

// GitRepositoryDetailInfo represents the full detail view of a FluxCD GitRepository.
type GitRepositoryDetailInfo struct {
	Name      string                    `json:"name"`
	Namespace string                    `json:"namespace"`
	Suspended bool                      `json:"suspended"`
	Spec      GitRepositorySpecInfo     `json:"spec"`
	Status    GitRepositoryStatusInfo   `json:"status"`
}

// GitRepositorySpecInfo represents the spec fields of a GitRepository.
type GitRepositorySpecInfo struct {
	URL       string                       `json:"url"`
	Interval  string                       `json:"interval"`
	Ref       GitRepositoryRefInfo         `json:"ref"`
	SecretRef *GitRepositorySecretRefInfo  `json:"secretRef,omitempty"`
}

// GitRepositoryRefInfo represents a git reference in a GitRepository spec.
type GitRepositoryRefInfo struct {
	Branch string `json:"branch,omitempty"`
	Tag    string `json:"tag,omitempty"`
	Semver string `json:"semver,omitempty"`
	Commit string `json:"commit,omitempty"`
}

// GitRepositorySecretRefInfo represents a secret reference in a GitRepository spec.
type GitRepositorySecretRefInfo struct {
	Name string `json:"name"`
}

// GitRepositoryStatusInfo represents the status fields of a GitRepository.
type GitRepositoryStatusInfo struct {
	Conditions []ConditionInfo             `json:"conditions"`
	Artifact   *GitRepositoryArtifactInfo  `json:"artifact,omitempty"`
}

// GitRepositoryArtifactInfo represents artifact information of a GitRepository.
type GitRepositoryArtifactInfo struct {
	Revision       string `json:"revision"`
	LastUpdateTime string `json:"lastUpdateTime"`
}

// GitRepositoryDetailHandler handles GET /api/fluxcd/gitrepositories/{namespace}/{name}
// and dispatches POST .../reconcile requests to GitRepositoryReconcileHandler.
func GitRepositoryDetailHandler(w http.ResponseWriter, r *http.Request) {
	if strings.HasSuffix(r.URL.Path, reconcilePathSuffix) {
		GitRepositoryReconcileHandler(w, r)
		return
	}
	if strings.HasSuffix(r.URL.Path, updateBranchPathSuffix) {
		GitRepositoryUpdateBranchHandler(w, r)
		return
	}
	if strings.HasSuffix(r.URL.Path, branchesPathSuffix) {
		GitRepositoryBranchesHandler(w, r)
		return
	}

	r = withTimeout(r)

	if !requireMethod(w, r, http.MethodGet) {
		return
	}

	namespace, name, err := parseResourcePath(r.URL.Path, fluxcdGitRepositoriesPathPrefix, "")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid path format. Expected /api/fluxcd/gitrepositories/{namespace}/{name}")
		return
	}

	clientset, err := getFluxCDClient()
	if err != nil {
		slog.Error("Failed to create FluxCD client", "error", err)
		writeError(w, http.StatusInternalServerError, errMsgFluxCDClientCreate)
		return
	}

	detail, err := getGitRepositoryDetail(r.Context(), clientset, namespace, name)
	if err != nil {
		if k8serrors.IsNotFound(err) {
			writeError(w, http.StatusNotFound, errMsgGitRepositoryNotFound)
			return
		}
		slog.Error("Failed to fetch GitRepository detail", "error", err, "namespace", namespace, "name", name)
		writeError(w, http.StatusInternalServerError, errMsgGitRepositoryFetch)
		return
	}

	writeJSON(w, http.StatusOK, detail)
}

// getGitRepositoryDetail fetches a single GitRepository detail from the FluxCD clientset.
func getGitRepositoryDetail(ctx context.Context, clientset *versioned.Clientset, namespace, name string) (*GitRepositoryDetailInfo, error) {
	grd, err := clientset.FluxCDV1().GitRepositories(namespace).Get(ctx, name)
	if err != nil {
		return nil, err
	}

	conditions := make([]ConditionInfo, 0, len(grd.Status.Conditions))
	for _, c := range grd.Status.Conditions {
		conditions = append(conditions, ConditionInfo{
			Type:               c.Type,
			Status:             c.Status,
			Reason:             c.Reason,
			Message:            c.Message,
			LastTransitionTime: c.LastTransitionTime,
		})
	}

	var artifactInfo *GitRepositoryArtifactInfo
	if grd.Status.Artifact != nil {
		artifactInfo = &GitRepositoryArtifactInfo{
			Revision:       grd.Status.Artifact.Revision,
			LastUpdateTime: grd.Status.Artifact.LastUpdateTime,
		}
	}

	var secretRefInfo *GitRepositorySecretRefInfo
	if grd.Spec.SecretRef != nil {
		secretRefInfo = &GitRepositorySecretRefInfo{
			Name: grd.Spec.SecretRef.Name,
		}
	}

	return &GitRepositoryDetailInfo{
		Name:      grd.Name,
		Namespace: grd.Namespace,
		Suspended: grd.Suspended,
		Spec: GitRepositorySpecInfo{
			URL:      grd.Spec.URL,
			Interval: grd.Spec.Interval,
			Ref: GitRepositoryRefInfo{
				Branch: grd.Spec.Ref.Branch,
				Tag:    grd.Spec.Ref.Tag,
				Semver: grd.Spec.Ref.Semver,
				Commit: grd.Spec.Ref.Commit,
			},
			SecretRef: secretRefInfo,
		},
		Status: GitRepositoryStatusInfo{
			Conditions: conditions,
			Artifact:   artifactInfo,
		},
	}, nil
}
