package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/client-go/kubernetes"
)

// SecretInfo represents secret information without values (for list endpoint)
type SecretInfo struct {
	Name      string   `json:"name"`
	Namespace string   `json:"namespace"`
	Type      string   `json:"type"`
	Keys      []string `json:"keys"`
}

// SecretDetail represents secret information with decoded values (for detail endpoint)
type SecretDetail struct {
	Name      string            `json:"name"`
	Namespace string            `json:"namespace"`
	Type      string            `json:"type"`
	Data      map[string]string `json:"data"`
}

// SecretsHandler handles the GET /api/secrets endpoint
func SecretsHandler(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodGet) {
		return
	}

	namespace := r.URL.Query().Get("ns")

	clientset, err := getKubernetesClient()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create Kubernetes client")
		return
	}

	secrets, err := getSecretsData(r.Context(), clientset, namespace)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch secrets data")
		return
	}

	writeJSON(w, http.StatusOK, secrets)
}

// SecretDetailHandler handles the /api/secrets/:ns/:name endpoint
// Supports GET (detail) and DELETE (deletion)
func SecretDetailHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		handleGetSecretDetail(w, r)
	case http.MethodDelete:
		handleDeleteSecret(w, r)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func parseSecretPath(r *http.Request) (namespace string, name string, err error) {
	path := strings.TrimPrefix(r.URL.Path, "/api/secrets/")
	parts := strings.SplitN(path, "/", 2)

	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return "", "", fmt.Errorf("invalid URL format")
	}

	return parts[0], parts[1], nil
}

func handleGetSecretDetail(w http.ResponseWriter, r *http.Request) {
	namespace, name, err := parseSecretPath(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid URL format. Expected /api/secrets/{namespace}/{name}")
		return
	}

	clientset, err := getKubernetesClient()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create Kubernetes client")
		return
	}

	secretDetail, err := getSecretDetail(r.Context(), clientset, namespace, name)
	if err != nil {
		if errors.IsNotFound(err) {
			writeError(w, http.StatusNotFound, "Secret not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "Failed to fetch secret detail")
		return
	}

	writeJSON(w, http.StatusOK, secretDetail)
}

func handleDeleteSecret(w http.ResponseWriter, r *http.Request) {
	namespace, name, err := parseSecretPath(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid URL format. Expected /api/secrets/{namespace}/{name}")
		return
	}

	clientset, err := getKubernetesClient()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create Kubernetes client")
		return
	}

	err = deleteSecret(r.Context(), clientset, namespace, name)
	if err != nil {
		if errors.IsNotFound(err) {
			writeError(w, http.StatusNotFound, "Secret not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "Failed to delete secret")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "Secret deleted successfully",
	})
}

// getSecretsData fetches secrets data from Kubernetes (without values)
func getSecretsData(ctx context.Context, clientset *kubernetes.Clientset, namespace string) ([]SecretInfo, error) {
	secretList, err := clientset.CoreV1().Secrets(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	secrets := make([]SecretInfo, 0, len(secretList.Items))
	for _, secret := range secretList.Items {
		keys := make([]string, 0, len(secret.Data))
		for key := range secret.Data {
			keys = append(keys, key)
		}

		secrets = append(secrets, SecretInfo{
			Name:      secret.Name,
			Namespace: secret.Namespace,
			Type:      string(secret.Type),
			Keys:      keys,
		})
	}

	return secrets, nil
}

// getSecretDetail fetches a specific secret with decoded values
func getSecretDetail(ctx context.Context, clientset *kubernetes.Clientset, namespace, name string) (*SecretDetail, error) {
	secret, err := clientset.CoreV1().Secrets(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	data := make(map[string]string)
	for key, value := range secret.Data {
		data[key] = string(value)
	}

	return &SecretDetail{
		Name:      secret.Name,
		Namespace: secret.Namespace,
		Type:      string(secret.Type),
		Data:      data,
	}, nil
}

// deleteSecret deletes a specific secret from Kubernetes
func deleteSecret(ctx context.Context, clientset *kubernetes.Clientset, namespace, name string) error {
	return clientset.CoreV1().Secrets(namespace).Delete(ctx, name, metav1.DeleteOptions{})
}
