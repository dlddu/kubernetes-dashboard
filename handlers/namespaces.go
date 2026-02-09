package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"sort"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

// NamespacesHandler handles the /api/namespaces endpoint
func NamespacesHandler(w http.ResponseWriter, r *http.Request) {
	// Only allow GET method
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Set content type
	w.Header().Set("Content-Type", "application/json")

	// Get Kubernetes client
	clientset, err := getKubernetesClient()
	if err != nil {
		// If client creation fails, return 500 with empty array
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode([]string{})
		return
	}

	// Fetch namespaces from Kubernetes
	namespaceList, err := clientset.CoreV1().Namespaces().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		// If listing fails, return 500 with empty array
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode([]string{})
		return
	}

	// Extract namespace names
	namespaces := make([]string, 0, len(namespaceList.Items))
	for _, ns := range namespaceList.Items {
		if ns.Name != "" {
			namespaces = append(namespaces, ns.Name)
		}
	}

	// Sort namespaces alphabetically
	sort.Strings(namespaces)

	// Send response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(namespaces)
}

// getKubernetesClient creates and returns a Kubernetes client
func getKubernetesClient() (*kubernetes.Clientset, error) {
	config, err := getKubernetesConfig()
	if err != nil {
		return nil, err
	}

	// Create clientset
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, err
	}

	return clientset, nil
}

// getKubernetesConfig creates and returns Kubernetes config
func getKubernetesConfig() (*rest.Config, error) {
	// Create in-cluster config
	config, err := rest.InClusterConfig()
	if err != nil {
		return nil, err
	}

	return config, nil
}
