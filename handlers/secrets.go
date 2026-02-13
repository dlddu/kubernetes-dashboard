package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	corev1 "k8s.io/api/core/v1"
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
	// Only allow GET method
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Set content type
	w.Header().Set("Content-Type", "application/json")

	// Get namespace from query parameter
	namespace := r.URL.Query().Get("ns")
	if namespace == "" {
		namespace = "" // Empty string means all namespaces
	}

	// Get Kubernetes client
	clientset, err := getKubernetesClient()
	if err != nil {
		// If client creation fails, return 500
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create Kubernetes client"})
		return
	}

	// Fetch secrets data
	secrets, err := getSecretsData(clientset, namespace)
	if err != nil {
		// If fetching fails, return 500
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch secrets data"})
		return
	}

	// Send response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(secrets)
}

// SecretDetailHandler handles the GET /api/secrets/:ns/:name endpoint
func SecretDetailHandler(w http.ResponseWriter, r *http.Request) {
	// Only allow GET method
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Set content type
	w.Header().Set("Content-Type", "application/json")

	// Parse namespace and name from URL path
	// Expected format: /api/secrets/{namespace}/{name}
	path := strings.TrimPrefix(r.URL.Path, "/api/secrets/")
	parts := strings.SplitN(path, "/", 2)

	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid URL format. Expected /api/secrets/{namespace}/{name}"})
		return
	}

	namespace := parts[0]
	name := parts[1]

	// Get Kubernetes client
	clientset, err := getKubernetesClient()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create Kubernetes client"})
		return
	}

	// Fetch secret detail
	secretDetail, err := getSecretDetail(clientset, namespace, name)
	if err != nil {
		if errors.IsNotFound(err) {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Secret not found"})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch secret detail"})
		return
	}

	// Send response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(secretDetail)
}

// getSecretsData fetches secrets data from Kubernetes (without values)
func getSecretsData(clientset *kubernetes.Clientset, namespace string) ([]SecretInfo, error) {
	ctx := context.Background()

	// Fetch secrets
	secretList, err := clientset.CoreV1().Secrets(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	// Build secrets list
	secrets := make([]SecretInfo, 0)

	for _, secret := range secretList.Items {
		// Extract keys from secret data (without values)
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
func getSecretDetail(clientset *kubernetes.Clientset, namespace, name string) (*SecretDetail, error) {
	ctx := context.Background()

	// Fetch secret
	secret, err := clientset.CoreV1().Secrets(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	// Decode secret data (Kubernetes already stores it as []byte, not base64)
	data := make(map[string]string)
	for key, value := range secret.Data {
		// Secret.Data is already decoded from base64 by the client library
		// We just need to convert []byte to string
		data[key] = string(value)
	}

	return &SecretDetail{
		Name:      secret.Name,
		Namespace: secret.Namespace,
		Type:      string(secret.Type),
		Data:      data,
	}, nil
}
