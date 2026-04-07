package handlers

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"

	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	versioned "github.com/dlddu/kubernetes-dashboard/internal/fluxcdversioned/pkg/client/clientset/versioned"
)

// updateBranchRequest represents the request body for updating a GitRepository branch.
type updateBranchRequest struct {
	Branch string `json:"branch"`
}

// GitRepositoryUpdateBranchHandler handles POST /api/fluxcd/gitrepositories/{namespace}/{name}/update-branch
func GitRepositoryUpdateBranchHandler(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodPost) {
		return
	}

	r = withTimeout(r)

	namespace, name, err := parseResourcePath(r.URL.Path, fluxcdGitRepositoriesPathPrefix, updateBranchPathSuffix)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid path format. Expected /api/fluxcd/gitrepositories/{namespace}/{name}/update-branch")
		return
	}

	var req updateBranchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Branch == "" {
		writeError(w, http.StatusBadRequest, "Branch name is required")
		return
	}

	clientset, err := getFluxCDClient()
	if err != nil {
		slog.Error("Failed to create FluxCD client", "error", err)
		writeError(w, http.StatusInternalServerError, errMsgFluxCDClientCreate)
		return
	}

	err = updateGitRepositoryBranch(r.Context(), clientset, namespace, name, req.Branch)
	if err != nil {
		if k8serrors.IsNotFound(err) {
			writeError(w, http.StatusNotFound, errMsgGitRepositoryNotFound)
			return
		}
		slog.Error("Failed to update GitRepository branch", "error", err, "namespace", namespace, "name", name, "branch", req.Branch)
		writeError(w, http.StatusInternalServerError, errMsgGitRepositoryUpdateBranch)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "Branch updated successfully",
	})
}

// updateGitRepositoryBranch patches the spec.ref.branch of the given GitRepository.
func updateGitRepositoryBranch(ctx context.Context, clientset *versioned.Clientset, namespace, name, branch string) error {
	patchData := map[string]interface{}{
		"spec": map[string]interface{}{
			"ref": map[string]interface{}{
				"branch": branch,
			},
		},
	}
	data, err := json.Marshal(patchData)
	if err != nil {
		return err
	}

	return clientset.FluxCDV1().GitRepositories(namespace).Patch(ctx, name, data)
}
