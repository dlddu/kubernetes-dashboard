package handlers

import (
	"bufio"
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os/exec"
	"sort"
	"strings"

	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// branchListResponse represents the response for the branches endpoint.
type branchListResponse struct {
	Branches []string `json:"branches"`
}

// GitRepositoryBranchesHandler handles GET /api/fluxcd/gitrepositories/{namespace}/{name}/branches
func GitRepositoryBranchesHandler(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodGet) {
		return
	}

	r = withTimeout(r)

	namespace, name, err := parseResourcePath(r.URL.Path, fluxcdGitRepositoriesPathPrefix, branchesPathSuffix)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid path format. Expected /api/fluxcd/gitrepositories/{namespace}/{name}/branches")
		return
	}

	// Get GitRepository detail to find URL and secretRef
	fluxClient, err := getFluxCDClient()
	if err != nil {
		slog.Error("Failed to create FluxCD client", "error", err)
		writeError(w, http.StatusInternalServerError, errMsgFluxCDClientCreate)
		return
	}

	detail, err := fluxClient.FluxCDV1().GitRepositories(namespace).Get(r.Context(), name)
	if err != nil {
		if k8serrors.IsNotFound(err) {
			writeError(w, http.StatusNotFound, errMsgGitRepositoryNotFound)
			return
		}
		slog.Error("Failed to fetch GitRepository", "error", err, "namespace", namespace, "name", name)
		writeError(w, http.StatusInternalServerError, errMsgGitRepositoryFetch)
		return
	}

	repoURL := detail.Spec.URL

	// If secretRef exists, fetch credentials from the secret
	var username, password string
	if detail.Spec.SecretRef != nil {
		k8sClient, err := getKubernetesClient()
		if err != nil {
			slog.Error("Failed to create Kubernetes client", "error", err)
			writeError(w, http.StatusInternalServerError, errMsgClientCreate)
			return
		}

		secret, err := k8sClient.CoreV1().Secrets(namespace).Get(r.Context(), detail.Spec.SecretRef.Name, metav1.GetOptions{})
		if err != nil {
			if k8serrors.IsNotFound(err) {
				slog.Warn("Secret referenced by GitRepository not found", "secret", detail.Spec.SecretRef.Name, "namespace", namespace)
			} else {
				slog.Error("Failed to fetch secret for GitRepository", "error", err, "secret", detail.Spec.SecretRef.Name)
				writeError(w, http.StatusInternalServerError, errMsgGitRepositoryBranches)
				return
			}
		} else {
			username = string(secret.Data["username"])
			password = string(secret.Data["password"])
		}
	}

	// Build the authenticated URL if credentials exist
	authURL := repoURL
	if username != "" && password != "" {
		authURL = buildAuthURL(repoURL, username, password)
	}

	branches, err := listRemoteBranches(r.Context(), authURL)
	if err != nil {
		slog.Error("Failed to list remote branches", "error", err, "url", repoURL)
		writeError(w, http.StatusInternalServerError, errMsgGitRepositoryBranches)
		return
	}

	writeJSON(w, http.StatusOK, branchListResponse{Branches: branches})
}

// buildAuthURL injects username:password into an HTTPS git URL.
func buildAuthURL(repoURL, username, password string) string {
	if strings.HasPrefix(repoURL, "https://") {
		return fmt.Sprintf("https://%s:%s@%s", username, password, strings.TrimPrefix(repoURL, "https://"))
	}
	if strings.HasPrefix(repoURL, "http://") {
		return fmt.Sprintf("http://%s:%s@%s", username, password, strings.TrimPrefix(repoURL, "http://"))
	}
	return repoURL
}

// listRemoteBranches runs git ls-remote --heads to list branches from a remote repository.
func listRemoteBranches(ctx context.Context, repoURL string) ([]string, error) {
	cmd := exec.CommandContext(ctx, "git", "ls-remote", "--heads", repoURL)
	cmd.Env = append(cmd.Environ(), "GIT_TERMINAL_PROMPT=0")

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("git ls-remote failed: %w", err)
	}

	var branches []string
	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		line := scanner.Text()
		// Format: <sha>\trefs/heads/<branch>
		parts := strings.SplitN(line, "\t", 2)
		if len(parts) != 2 {
			continue
		}
		ref := parts[1]
		if strings.HasPrefix(ref, "refs/heads/") {
			branch := strings.TrimPrefix(ref, "refs/heads/")
			branches = append(branches, branch)
		}
	}

	sort.Strings(branches)
	return branches, nil
}
