package handlers

import (
	"context"
	"net/http"
	"os"
	"path/filepath"
	"sort"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
	metricsv "k8s.io/metrics/pkg/client/clientset/versioned"
)

// NamespacesHandler handles the /api/namespaces endpoint
func NamespacesHandler(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodGet) {
		return
	}

	clientset, err := getKubernetesClient()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, []string{})
		return
	}

	namespaceList, err := clientset.CoreV1().Namespaces().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, []string{})
		return
	}

	namespaces := make([]string, 0, len(namespaceList.Items))
	for _, ns := range namespaceList.Items {
		if ns.Name != "" {
			namespaces = append(namespaces, ns.Name)
		}
	}

	sort.Strings(namespaces)

	writeJSON(w, http.StatusOK, namespaces)
}

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

// getKubernetesClient creates and returns a Kubernetes client.
func getKubernetesClient() (*kubernetes.Clientset, error) {
	config, err := getRESTConfig()
	if err != nil {
		return nil, err
	}
	return kubernetes.NewForConfig(config)
}

// getMetricsClient creates and returns a Kubernetes metrics client.
func getMetricsClient() (*metricsv.Clientset, error) {
	config, err := getRESTConfig()
	if err != nil {
		return nil, err
	}
	return metricsv.NewForConfig(config)
}
