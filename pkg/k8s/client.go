package k8s

import (
	"context"
	"sync"
	"time"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

var (
	clientInstance *kubernetes.Clientset
	clientOnce     sync.Once
	clientError    error
	kubeconfigPath string
)

// SetKubeconfigPath sets the kubeconfig path for the client
func SetKubeconfigPath(path string) {
	kubeconfigPath = path
}

// GetClient returns a singleton Kubernetes client
func GetClient() (*kubernetes.Clientset, error) {
	clientOnce.Do(func() {
		var config *rest.Config
		var err error

		// Try to load from kubeconfig first
		if kubeconfigPath != "" {
			config, err = clientcmd.BuildConfigFromFlags("", kubeconfigPath)
			if err == nil {
				clientInstance, clientError = kubernetes.NewForConfig(config)
				return
			}
		}

		// Fall back to in-cluster config
		config, err = rest.InClusterConfig()
		if err == nil {
			clientInstance, clientError = kubernetes.NewForConfig(config)
			return
		}

		// Both methods failed
		clientError = err
	})

	return clientInstance, clientError
}

// CheckClusterConnection checks if we can connect to the Kubernetes cluster
func CheckClusterConnection() bool {
	client, err := GetClient()
	if err != nil {
		return false
	}

	// Try to get server version with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = client.Discovery().ServerVersion()
	if err != nil {
		return false
	}

	return true
}
