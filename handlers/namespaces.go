package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

// NamespacesResponse represents the namespaces list response structure
type NamespacesResponse struct {
	Namespaces []string `json:"namespaces"`
}

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
	clientset, err := getKubeClient()
	if err != nil {
		log.Printf("Failed to create Kubernetes client: %v", err)
		// Return empty array on error
		response := NamespacesResponse{
			Namespaces: []string{},
		}
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Fetch namespaces
	namespaceList, err := clientset.CoreV1().Namespaces().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		log.Printf("Failed to list namespaces: %v", err)
		// Return empty array on error
		response := NamespacesResponse{
			Namespaces: []string{},
		}
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Extract namespace names
	namespaces := make([]string, 0, len(namespaceList.Items))
	seen := make(map[string]bool)

	for _, ns := range namespaceList.Items {
		if ns.Name != "" && !seen[ns.Name] {
			namespaces = append(namespaces, ns.Name)
			seen[ns.Name] = true
		}
	}

	// Create response
	response := NamespacesResponse{
		Namespaces: namespaces,
	}

	// Send response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// getKubeClient creates a Kubernetes client
func getKubeClient() (*kubernetes.Clientset, error) {
	// Get kubeconfig path
	kubeconfigPath := os.Getenv("KUBECONFIG")
	if kubeconfigPath == "" {
		if home := homedir.HomeDir(); home != "" {
			kubeconfigPath = filepath.Join(home, ".kube", "config")
		}
	}

	// Build config from kubeconfig
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfigPath)
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
