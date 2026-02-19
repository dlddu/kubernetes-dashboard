package handlers

import (
	"log/slog"
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
	restConfig     *rest.Config
	restConfigErr  error
	restConfigOnce sync.Once

	kubeClient     kubernetes.Interface
	kubeClientErr  error
	kubeClientOnce sync.Once

	metricsClient     *metricsv.Clientset
	metricsClientErr  error
	metricsClientOnce sync.Once
)

// getRESTConfig resolves and caches the Kubernetes REST configuration.
// Tries in-cluster config first, then KUBECONFIG env var, then ~/.kube/config.
func getRESTConfig() (*rest.Config, error) {
	restConfigOnce.Do(func() {
		config, err := rest.InClusterConfig()
		if err != nil {
			kubeconfig := os.Getenv("KUBECONFIG")
			if kubeconfig == "" {
				if home := homedir.HomeDir(); home != "" {
					kubeconfig = filepath.Join(home, ".kube", "config")
				}
			}
			config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
			if err != nil {
				restConfigErr = err
				return
			}
		}
		restConfig = config
	})
	return restConfig, restConfigErr
}

// getKubernetesClient returns a cached Kubernetes client, creating it on first call.
func getKubernetesClient() (kubernetes.Interface, error) {
	if testKubeClient != nil {
		return testKubeClient, nil
	}
	kubeClientOnce.Do(func() {
		config, err := getRESTConfig()
		if err != nil {
			kubeClientErr = err
			return
		}
		kubeClient, kubeClientErr = kubernetes.NewForConfig(config)
	})
	return kubeClient, kubeClientErr
}

// testKubeClient is used only for testing; when non-nil it overrides the real client.
var testKubeClient kubernetes.Interface

// getMetricsClient returns a cached Kubernetes metrics client, creating it on first call.
func getMetricsClient() (*metricsv.Clientset, error) {
	metricsClientOnce.Do(func() {
		config, err := getRESTConfig()
		if err != nil {
			metricsClientErr = err
			return
		}
		metricsClient, metricsClientErr = metricsv.NewForConfig(config)
	})
	return metricsClient, metricsClientErr
}

// getMetricsClientSafe returns the metrics client, logging and returning nil if unavailable.
// This consolidates the repeated pattern of getting the metrics client with fallback logging.
func getMetricsClientSafe() *metricsv.Clientset {
	mc, err := getMetricsClient()
	if err != nil {
		slog.Warn("metrics client unavailable, falling back to capacity-allocatable", "error", err)
		return nil
	}
	return mc
}
