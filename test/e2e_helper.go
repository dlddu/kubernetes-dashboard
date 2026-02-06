package test

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

// E2ETestHelper provides utilities for e2e testing with kind cluster
type E2ETestHelper struct {
	KubeClient *kubernetes.Clientset
	BaseURL    string
	ServerPort string
}

// NewE2ETestHelper creates a new e2e test helper
func NewE2ETestHelper() (*E2ETestHelper, error) {
	kubeClient, err := createKubeClient()
	if err != nil {
		return nil, fmt.Errorf("failed to create kube client: %w", err)
	}

	serverPort := getEnvOrDefault("SERVER_PORT", "8080")
	baseURL := fmt.Sprintf("http://localhost:%s", serverPort)

	return &E2ETestHelper{
		KubeClient: kubeClient,
		BaseURL:    baseURL,
		ServerPort: serverPort,
	}, nil
}

// createKubeClient creates a Kubernetes client from kubeconfig
func createKubeClient() (*kubernetes.Clientset, error) {
	// Get kubeconfig path
	kubeconfig := os.Getenv("KUBECONFIG")
	if kubeconfig == "" {
		// Default to ~/.kube/config
		home, err := os.UserHomeDir()
		if err != nil {
			return nil, fmt.Errorf("failed to get home directory: %w", err)
		}
		kubeconfig = filepath.Join(home, ".kube", "config")
	}

	// Build config from kubeconfig file
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("failed to build config from kubeconfig: %w", err)
	}

	// Create clientset
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create clientset: %w", err)
	}

	return clientset, nil
}

// WaitForHealthy waits for the server to become healthy
func (h *E2ETestHelper) WaitForHealthy(timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	healthURL := fmt.Sprintf("%s/api/health", h.BaseURL)

	log.Printf("Waiting for server to be healthy at %s...", healthURL)

	for time.Now().Before(deadline) {
		resp, err := http.Get(healthURL)
		if err == nil && resp.StatusCode == http.StatusOK {
			resp.Body.Close()
			log.Printf("Server is healthy")
			return nil
		}

		if resp != nil {
			resp.Body.Close()
		}

		time.Sleep(1 * time.Second)
	}

	return fmt.Errorf("server did not become healthy within %v", timeout)
}

// VerifyKubeConnection verifies connection to Kubernetes cluster
func (h *E2ETestHelper) VerifyKubeConnection() error {
	log.Printf("Verifying Kubernetes connection...")

	// Get server version to verify connection
	version, err := h.KubeClient.Discovery().ServerVersion()
	if err != nil {
		return fmt.Errorf("failed to get server version: %w", err)
	}

	log.Printf("Connected to Kubernetes cluster version: %s", version.String())
	return nil
}

// GetKubeconfigPath returns the kubeconfig path
func GetKubeconfigPath() string {
	kubeconfig := os.Getenv("KUBECONFIG")
	if kubeconfig == "" {
		home, _ := os.UserHomeDir()
		kubeconfig = filepath.Join(home, ".kube", "config")
	}
	return kubeconfig
}

// getEnvOrDefault gets environment variable or returns default value
func getEnvOrDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
