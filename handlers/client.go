package handlers

import (
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
	kubeClient     *kubernetes.Clientset
	kubeClientErr  error
	kubeClientOnce sync.Once

	metricsClient     *metricsv.Clientset
	metricsClientErr  error
	metricsClientOnce sync.Once
)

// getRESTConfig resolves the Kubernetes REST configuration.
// Tries in-cluster config first, then KUBECONFIG env var, then ~/.kube/config.
func getRESTConfig() (*rest.Config, error) {
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
			return nil, err
		}
	}
	return config, nil
}

// getKubernetesClient returns a cached Kubernetes client, creating it on first call.
func getKubernetesClient() (*kubernetes.Clientset, error) {
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
