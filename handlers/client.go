package handlers

import (
	"log"
	"os"
	"path/filepath"
	"sync"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
	metricsv "k8s.io/metrics/pkg/client/clientset/versioned"
)

var (
	cachedConfig      *rest.Config
	cachedConfigErr   error
	configOnce        sync.Once

	cachedClientset    *kubernetes.Clientset
	cachedClientsetErr error
	clientsetOnce      sync.Once

	cachedMetricsClient    *metricsv.Clientset
	cachedMetricsClientErr error
	metricsClientOnce      sync.Once
)

// getRESTConfig resolves the Kubernetes REST configuration.
// Tries in-cluster config first, then KUBECONFIG env var, then ~/.kube/config.
// The result is cached after the first call.
func getRESTConfig() (*rest.Config, error) {
	configOnce.Do(func() {
		cachedConfig, cachedConfigErr = rest.InClusterConfig()
		if cachedConfigErr != nil {
			kubeconfig := os.Getenv("KUBECONFIG")
			if kubeconfig == "" {
				if home := homedir.HomeDir(); home != "" {
					kubeconfig = filepath.Join(home, ".kube", "config")
				}
			}
			cachedConfig, cachedConfigErr = clientcmd.BuildConfigFromFlags("", kubeconfig)
		}
	})
	return cachedConfig, cachedConfigErr
}

// getKubernetesClient creates and returns a Kubernetes client.
// The client is cached after the first successful creation.
func getKubernetesClient() (*kubernetes.Clientset, error) {
	clientsetOnce.Do(func() {
		config, err := getRESTConfig()
		if err != nil {
			cachedClientsetErr = err
			return
		}
		cachedClientset, cachedClientsetErr = kubernetes.NewForConfig(config)
	})
	return cachedClientset, cachedClientsetErr
}

// getMetricsClient creates and returns a Kubernetes metrics client.
// The client is cached after the first successful creation.
func getMetricsClient() (*metricsv.Clientset, error) {
	metricsClientOnce.Do(func() {
		config, err := getRESTConfig()
		if err != nil {
			cachedMetricsClientErr = err
			log.Printf("Failed to get REST config for metrics client: %v", err)
			return
		}
		cachedMetricsClient, cachedMetricsClientErr = metricsv.NewForConfig(config)
		if cachedMetricsClientErr != nil {
			log.Printf("Failed to create metrics client: %v", cachedMetricsClientErr)
		}
	})
	return cachedMetricsClient, cachedMetricsClientErr
}
